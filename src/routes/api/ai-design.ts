import { loadLivePrompts } from "@/lib/promptStore.server";
import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { checkDesignQuality, dropInventedText, validateDesignSvg } from "@/lib/slate/aiDesign";

const MODEL = AI_MODELS.design;

const Block = z.object({
  role: z.string().max(40).optional(),
  text: z.string().max(1200),
  font: z.string().max(120),
  color: z.string().max(20),
  pill: z.boolean().optional(),
  pillBackground: z.string().max(20).optional(),
});
const Slide = z.object({
  label: z.string().max(60),
  background: z.string().max(20),
  backgroundEnd: z.string().max(20).optional(),
  blocks: z.array(Block).max(8),
});
const Body = z.object({
  slides: z.array(Slide).min(1).max(12),
  index: z.number().int().min(0).max(11),
  palette: z.array(z.string().max(20)).max(20),
  /** Problems from the browser's text-fit check on a previous attempt. */
  problems: z.array(z.string().max(300)).max(10).optional(),
  mode: z.enum(["plan", "slide"]).optional(),
  /** Art direction for the whole series, from mode "plan". */
  plan: z.string().max(6000).optional(),
  brand: z.object({ accents: z.array(z.string().max(20)).max(5), lightInk: z.string().max(20).optional(), darkInk: z.string().max(20).optional(), name: z.string().max(120).optional(), gradient: z.array(z.string().max(20)).max(2).optional(), photoCount: z.number().int().min(0).max(10).optional() }).optional(),
});

class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// The slide and series prompts are editable in Settings (designSlide, designPlan).


const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["grid", "typeScale", "accentUse", "slides"],
  properties: {
    grid: { type: "string" },
    typeScale: { type: "string" },
    accentUse: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["layout", "notes"],
        properties: { layout: { type: "string" }, notes: { type: "string" } },
      },
    },
  },
};

function userPrompt(data: z.infer<typeof Body>) {
  const s = data.slides[data.index];
  const series = data.slides.map((x, i) => `${i + 1}. ${x.label}: ${x.blocks.map((b) => b.text).filter(Boolean).join(" / ").slice(0, 160)}`).join("\n");
  const copy = s.blocks
    .filter((b) => b.text.trim())
    .map((b) => `- ${b.role || "text"}${b.pill ? " (CTA pill, fill " + (b.pillBackground || "") + ")" : ""}: font-family "${b.font.split(",")[0].trim()}", colour ${b.color}\n  """${b.text.trim()}"""`)
    .join("\n");
  const b = data.brand;
  return `PALETTE: ${data.palette.join(", ")}
${b ? `BRAND ACCENTS (one highlight per slide: accent or gradient): ${b.accents.join(", ")}${b.lightInk ? `\nLIGHT INK: ${b.lightInk}` : ""}${b.darkInk ? `\nDARK INK: ${b.darkInk}` : ""}${b.name ? `\nBRAND: ${b.name}` : ""}${b.gradient?.length === 2 ? `\nBRAND GRADIENT (may replace the accent as this slide's single highlight): ${b.gradient.join(" → ")}` : ""}${b.photoCount ? `\nPHOTO: ${Array.from({ length: b.photoCount }, (_, i) => `photo:${i + 1}`).join(", ")} available (use at most one on this slide, only where it helps the story)` : ""}` : ""}
BACKGROUND (default, already painted): ${s.backgroundEnd ? `linear gradient ${s.background} → ${s.backgroundEnd}` : s.background}
BRAND BACKGROUNDS (you may pick one instead): ${[...new Set(data.slides.flatMap((x) => [x.background, x.backgroundEnd].filter(Boolean)))].join(", ")}

THE SERIES (for consistency only):
${series}

${data.plan ? `ART DIRECTION (follow it):\n${data.plan}\n\n` : ""}DESIGN SLIDE ${data.index + 1} of ${data.slides.length} (${s.label}). Its copy:
${copy}
${data.problems?.length ? `\nYour previous attempt was rejected. Fix these problems:\n- ${data.problems.join("\n- ")}` : ""}`;
}

async function streamClaude(system: string, user: string | any[], format?: object): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new GatewayError(500, "AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      stream: true,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", ...(format ? { format: { type: "json_schema", schema: format } } : {}) },
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    console.error(`AI design request failed [${res.status}]: ${detail.slice(0, 500)}`);
    let msg = "The design could not be created right now.";
    try { msg = JSON.parse(detail)?.error?.message || JSON.parse(detail)?.message || msg; } catch {}
    if (res.status === 402) msg = "AI credits have run out for this workspace.";
    if (res.status === 429) msg = "Too many requests right now. Please try again in a minute.";
    throw new GatewayError(res.status, msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "", out = "", stop = "";
  while (true) {
    const { value, done } = await reader.read();
    buf += decoder.decode(value, { stream: !done });
    const frames = buf.split("\n\n");
    buf = frames.pop() || "";
    for (const frame of frames)
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        let d: any;
        try { d = JSON.parse(raw); } catch { continue; }
        if (d.type === "content_block_delta" && d.delta?.type === "text_delta") out += d.delta.text || "";
        if (d.type === "message_delta" && d.delta?.stop_reason) stop = d.delta.stop_reason;
        if (d.type === "error") throw new GatewayError(d.error?.type === "permission_error" ? 403 : 502, d.error?.message || "AI design failed");
      }
    if (done) break;
  }
  if (stop === "refusal") throw new GatewayError(422, "The AI declined to design this slide.");
  return out;
}

export const Route = createFileRoute("/api/ai-design")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const parsed = Body.safeParse(await request.json().catch(() => ({})));
          if (!parsed.success || parsed.data.index >= parsed.data.slides.length)
            return Response.json({ error: "Invalid request" }, { status: 400 });
          const data = parsed.data;
          const prompts = await loadLivePrompts();
          const copy = data.slides[data.index].blocks.map((b) => b.text).join(" ");
          if (data.mode === "plan") {
            const series = data.slides.map((x, i) => `${i + 1}. ${x.label} (background ${x.background}${x.backgroundEnd ? "→" + x.backgroundEnd : ""}): ${x.blocks.map((b) => `${b.role || "text"} [${b.font.split(",")[0]}, ${b.color}]: ${b.text}`).join(" | ")}`).join("\n");
            const raw = await streamClaude(prompts.designPlan, `PALETTE: ${data.palette.join(", ")}\nBRAND ACCENTS: ${(data.brand?.accents || []).join(", ")}${data.brand?.gradient?.length === 2 ? `\nBRAND GRADIENT: ${data.brand.gradient.join(" → ")}` : ""}\nPHOTOS PROVIDED: ${data.brand?.photoCount || 0}\n\nSLIDES:\n${series}`, PLAN_SCHEMA);
            const m = /\{[\s\S]*\}/.exec(raw);
            let plan: unknown = null;
            try { plan = m ? JSON.parse(m[0]) : null; } catch { plan = null; }
            return Response.json({ plan: plan ? JSON.stringify(plan) : null });
          }
          const accents = data.brand?.accents || [];
          const check = (raw: string) => {
            const r = validateDesignSvg(raw, data.palette, copy, data.brand?.photoCount || 0);
            const quality = r.svg ? checkDesignQuality(r.svg, accents, data.brand?.gradient) : [];
            return { ...r, ok: r.ok && quality.length === 0, problems: [...r.problems, ...quality], strictOk: r.ok };
          };
          let result = check(await streamClaude(prompts.designSlide, userPrompt(data)));
          // One redesign with the reasons, then the browser falls back to the standard layout.
          if (!result.ok) {
            result = check(await streamClaude(prompts.designSlide, userPrompt({ ...data, problems: [...(data.problems || []), ...result.problems] })));
          }
          // Invented words are the usual reason a slide (often the closing one) fails: drop them and re-check.
          if (!result.strictOk && result.svg && result.problems.some((p) => p.startsWith("Adds words"))) {
            const cleaned = check(dropInventedText(result.svg, copy));
            if (cleaned.strictOk) result = cleaned;
          }
          // Safety failures fall back; a design that is safe but misses a quality rule is still better than the template.
          if (!result.strictOk) return Response.json({ svg: null, problems: result.problems });
          return Response.json({ svg: result.svg });
        } catch (e) {
          const status = e instanceof GatewayError ? e.status : 500;
          return Response.json({ error: e instanceof Error ? e.message : "AI design failed" }, { status });
        }
      },
    },
  },
});
