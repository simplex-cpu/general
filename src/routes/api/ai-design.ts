import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { checkDesignQuality, dropInventedText, validateDesignSvg } from "@/lib/slate/aiDesign";

const MODEL = "anthropic/claude-opus-5-5";

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

const SYSTEM = `You are a senior editorial art director designing premium Instagram carousels (think The Economist, Bloomberg Businessweek, Apple keynote slides, high-end agency decks). You design ONE slide at a time as a single SVG, following the series ART DIRECTION when given.

Hard rules:
- Output only the SVG, starting with <svg and ending with </svg>. No prose, no markdown fences.
- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">.
- Allowed elements only: svg, g, defs, linearGradient, stop, rect, circle, ellipse, line, polyline, polygon, path, text, tspan, clipPath. image (only href="photo:N" when a PHOTO is provided), no foreignObject, no use, no links, no scripts, no filters, no external fonts.
- Colours: only the hex values in the PALETTE (plus #FFFFFF / #000000). Write colours as hex.
- Fonts: font-family exactly as given for each text role.
- Use every word of the slide copy exactly as given, nothing reworded; the only extra words allowed are the tiny editorial micro-copy labels described below. Break lines yourself with <tspan x=".." dy="..">.
- Safe area: all text inside x 90–990 and y 100–1250.

Craft rules — modern, premium, BRANDED social design (think Apple / Stripe / Linear marketing: calm, confident, minimal). Plain text with thin lines is a FAILURE — but a busy, crowded slide is an equally big FAILURE.
- CREATIVE FREEDOM WITHIN THE BRAND: compose freely (asymmetry, bleed, scale contrast, split panels) as long as only brand colours and fonts are used. Stay calm: ONE idea per slide, ONE focal point, at most 3 main visual elements. Never a collage.
- BACKGROUND: a default brand background is painted underneath by the app (given as BACKGROUND). You MAY instead choose another brand background for this slide by drawing ONE full-canvas rect (x 0, y 0, 1080×1350) as the first element, filled with one of BRAND BACKGROUNDS (or the brand gradient when given). Keep the series coherent and text contrast strong.
- EDITORIAL MICRO-COPY is allowed: up to 2 tiny labels (font-size 16–22, muted, uppercase, letter-spacing 4–6) such as a slide counter "01 / 06", the brand name, or a 1–2 word section label. Never more than 4 extra words per slide; never repeat or paraphrase the copy.
- ONE HIGHLIGHT MOMENT IS MANDATORY ON EVERY SLIDE, used exactly ONCE: either the brand accent (hex exactly as given in BRAND ACCENTS) OR, when BRAND GRADIENT is given, a linearGradient made of those gradient stops — never both on the same slide. Use it as a highlighter bar behind the key word, one coloured key phrase, one numeral, one thin rule or one hand-drawn mark.
- ONE GRAPHIC ELEMENT per slide, chosen to fit the copy: a single rounded card (rx 24–40), one large accent block, one oversized circle or arc bleeding off the edge, one numbered badge, one icon tile, or one simple chart. Never two of these at once.
- Typography is REFINED and on the small side, like a luxury magazine: at least three clearly different sizes. Cover headline 92–124px weight 600–700, leading 1.05, letter-spacing -1 to -3. Slide headlines 54–76px weight 600. Body 28–34px weight 400, leading 1.45, ~34 chars per line. Labels 18–22px uppercase letter-spacing 4–6 weight 500. Prefer generous margins and air over size.
- TREATMENT FOLLOWS THE COPY — never treat every slide as a listicle. Read each slide and pick what tells it best: a QUOTE (large quotation mark shape, italic-feel statement, attribution label), a VISUAL EXPLAINER (a simple diagram: two to four connected nodes, a before→after, a flow or a scale), a STATEMENT (one centred sentence with lots of air), a BIG NUMBER (only when the copy has a number), a short LIST (only when the copy is actually enumerated), a PHOTO FEATURE (only when a PHOTO is provided), or the CLOSING slide (use only its own copy — never add "Follow", "Save", a handle or any other call to action that is not in the copy).
- HAND-DRAWN TOUCH is allowed, at most ONE per slide and only when it adds meaning (never decorative doodles, no illustrations): a single loose path (scribbled circle around a word, an underline swash, a curved arrow) stroke 4–6px, round caps, in the accent or gradient. It counts as the slide's highlight.
- PHOTOS: if PHOTO is listed for this slide, place it with <image href="photo:N" ...> exactly as given (never another href), preserveAspectRatio="xMidYMid slice", inside a clipPath (rounded frame, arch or full-bleed). Text must sit on a clean area or on a solid panel so it stays readable. Without a PHOTO, use no image.
- Vary layouts between slides (split panel, big-number, quote with oversized quotation mark drawn as a shape, centered statement) while keeping one consistent system: same margins (90), same accent treatment, same corner radius.
- ICONS: at most ONE icon per slide, and only when it genuinely clarifies the point (check, arrow, lightbulb, chart, clock, target, star, play, calendar, megaphone) 90–130px, clean geometric strokes 6–8px with round caps. Many slides need no icon at all. No icon bullets on every list item, no illustrations, emoji or clip-art.
- Negative space is the luxury: at least 40% of the slide empty. One focal point, strong contrast — text always clearly legible on what is directly behind it.
- Charts only when the copy has numbers: a giant number (240–340px) or a few chunky rounded bars with values from the copy — never both.
- Closing slide: CTA as a rounded accent pill (height ~100, radius 50) with contrasting text. Nothing else decorative.`;

const PLAN_SYSTEM = `You are a senior editorial art director. Plan the visual system for a whole Instagram carousel before any slide is drawn, so every slide looks like part of one premium series. You have creative freedom inside the brand: you may choose each slide's background from the brand backgrounds listed in SLIDES (or the gradient), and allow up to 2 tiny muted editorial labels (slide counter, brand name, 1–2 word section label). Choose for each slide exactly one layout from: "cover-headline", "quote", "visual-explainer", "statement", "big-number", "list", "photo-feature", "cta-closing". Pick per slide from what its copy is: a quote, an idea to explain visually, a statement, a number, an enumerated list. Never make every slide a list. "big-number" only with numbers, "list" only with enumerated copy, "photo-feature" only when a photo is provided. Highlight per slide is the accent OR the brand gradient, never both; at most one hand-drawn mark per slide. Be concise and concrete (px sizes, hex colours from the palette, alignment). For every slide, name in notes the ONE word or phrase that gets the single accent highlight, the ONE phrase that is enlarged, and the ONE graphic element (card, accent block, badge, icon or chart) to draw — nothing more. Minimal slides: one idea, one callout, one graphic element each. Every slide must use the accent once and at most one real shape, never just text and lines, never a collage of elements. Never add copy. Output only JSON.`;

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
          const copy = data.slides[data.index].blocks.map((b) => b.text).join(" ");
          if (data.mode === "plan") {
            const series = data.slides.map((x, i) => `${i + 1}. ${x.label} (background ${x.background}${x.backgroundEnd ? "→" + x.backgroundEnd : ""}): ${x.blocks.map((b) => `${b.role || "text"} [${b.font.split(",")[0]}, ${b.color}]: ${b.text}`).join(" | ")}`).join("\n");
            const raw = await streamClaude(PLAN_SYSTEM, `PALETTE: ${data.palette.join(", ")}\nBRAND ACCENTS: ${(data.brand?.accents || []).join(", ")}${data.brand?.gradient?.length === 2 ? `\nBRAND GRADIENT: ${data.brand.gradient.join(" → ")}` : ""}\nPHOTOS PROVIDED: ${data.brand?.photoCount || 0}\n\nSLIDES:\n${series}`, PLAN_SCHEMA);
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
          let result = check(await streamClaude(SYSTEM, userPrompt(data)));
          // One redesign with the reasons, then the browser falls back to the standard layout.
          if (!result.ok) {
            result = check(await streamClaude(SYSTEM, userPrompt({ ...data, problems: [...(data.problems || []), ...result.problems] })));
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
