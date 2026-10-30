import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { inspoCtx, getOwnedInspo, linkRepurpose } from "@/lib/inspoBank.server";
import { selectedBrief } from "@/lib/brands.server";
import { sessionsCtx, createSession } from "@/lib/writerSessions.server";
import { DEFAULT_PROMPTS } from "@/lib/simplex/prompts";
import { ANTI_SLOP_RULES, AUDIENCE_RULE } from "@/lib/slate/envelope";
import { prepareViralSource, viralAudienceContext, viralRepurposeInstructions, labeledViralSource, viralFormatRule } from "@/lib/slate/viralRepurposePrompt";
import { repurposeCaptions } from "@/lib/slate/postRepurpose";
import type { PostCopy } from "@/lib/slate/postCopy";
import { designStructurePrompt } from "@/lib/slate/designTemplates";
import {
  parseRepurposeScript,
  repurposeTranscript,
  REPURPOSE_TITLE,
} from "@/lib/slate/inspoRepurpose";
import { INSPO_FORMATS } from "@/lib/slate/inspoBank";
import { ANGLE_KINDS, angleInstruction, brandRealityBlock } from "@/lib/slate/brandContext";
import { postAge, writerFormat } from "@/lib/slate/inspoBank";
import { StoryPlanSchema, validateStoryPlan, storyPlanInstruction } from "@/lib/slate/repurposeAngles";

const MODEL = AI_MODELS.inspoRepurpose;
const Body = z.object({
  id: z.string().regex(/^rec[A-Za-z0-9]{14}$/),
  brandId: z
    .string()
    .regex(/^rec[A-Za-z0-9]{14}$/)
    .optional(),
  format: z.enum(INSPO_FORMATS).optional(),
  angle: z.object({ text: z.string().max(600), kind: z.enum(ANGLE_KINDS), storyPlan: StoryPlanSchema.optional() }).optional(),
});

export const FORMAT_PROMPT = {
  talkingVideo: DEFAULT_PROMPTS.talkingScriptFleshed,
  broll: DEFAULT_PROMPTS.brollScript,
  carousel: DEFAULT_PROMPTS.carouselSlides,
  graphic: DEFAULT_PROMPTS.graphicCopy,
} as const;

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function streamFable(system: string, user: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new GatewayError(500, "AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      stream: true,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    console.error(`Fable request failed [${res.status}]: ${detail}`);
    let msg = "The script could not be written right now.";
    try {
      msg = JSON.parse(detail)?.error?.message || JSON.parse(detail)?.message || msg;
    } catch {}
    if (res.status === 402) msg = "AI credits have run out for this workspace.";
    if (res.status === 429) msg = "Too many requests right now. Please try again in a minute.";
    throw new GatewayError(res.status, msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "",
    out = "",
    stop = "";
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
        const d = JSON.parse(raw);
        if (d.type === "content_block_delta" && d.delta?.type === "text_delta")
          out += d.delta.text || "";
        if (d.type === "message_delta" && d.delta?.stop_reason) stop = d.delta.stop_reason;
        if (d.type === "error")
          throw new GatewayError(
            d.error?.type === "permission_error" ? 403 : 502,
            d.error?.message || "AI generation failed",
          );
      }
    if (done) break;
  }
  if (stop === "refusal") throw new GatewayError(422, "The AI declined to write this script.");
  if (!out.trim()) throw new GatewayError(502, "The AI returned an empty script.");
  return out.trim();
}

export const Route = createFileRoute("/api/inspo-repurpose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const parsed = Body.safeParse(await request.json().catch(() => ({})));
          if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
          if (parsed.data.angle?.storyPlan && !validateStoryPlan(parsed.data.angle.storyPlan))
            return Response.json({ error: "This angle no longer matches its story plan. Choose another angle." }, { status: 400 });
          const ctx = await inspoCtx(auth.record);
          const post = await getOwnedInspo(ctx, parsed.data.id);
          if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
          const brief = await selectedBrief(auth.record, ctx.token, parsed.data.brandId);
          if (!brief)
            return Response.json({ error: "Add your brand brief first" }, { status: 404 });
          const b = brief.fields || {};
          const format = parsed.data.format || post.format;
          if (!INSPO_FORMATS.includes(format as (typeof INSPO_FORMATS)[number]))
            return Response.json({ error: "Choose a format before repurposing." }, { status: 400 });
          if (!post.copy.trim())
            return Response.json(
              {
                error:
                  "This post's copy is unavailable. Add it using Edit post copy in the table before repurposing.",
              },
              { status: 400 },
            );
          const fmt = writerFormat(format);
          const source = prepareViralSource(post);
          if (!source.copy) return Response.json({ error: "This post contains only promotional copy. Choose a post with an insight to repurpose." }, { status: 400 });
          const audience = viralAudienceContext(b);
          if (post.format === "Talking Video" && format === "Talking Video" && source.wordCount < 25)
            return Response.json({ error: "This talking video's transcript wasn't saved, so it can't be repurposed faithfully yet." }, { status: 400 });
          const changed = !!post.format && format !== post.format;
          const labeled = labeledViralSource(source);
          const system = `${viralRepurposeInstructions(source.wordCount)}\n\n${viralFormatRule(post.format, format)}\n\n${ANTI_SLOP_RULES}\n\n${AUDIENCE_RULE}${fmt === "carousel" || fmt === "graphic" ? `\n\n${designStructurePrompt(fmt, "insightful")}` : ""}${changed ? `\n\n${format.toUpperCase()} GUIDELINES:\n${FORMAT_PROMPT[fmt]}` : ""}`;
          const user = `TASK: Surgically repurpose a proven viral post for this brand as a ${format}.

SOURCE (original fields labeled by format, with binding hook template and framework):
${JSON.stringify(labeled, null, 2)}

AUDIENCE PERSPECTIVE (never an offer):
${JSON.stringify(audience, null, 2)}

${brandRealityBlock(b)}

${angleInstruction(parsed.data.angle, "viral") || "Choose the new topic and stance from the brand reality above."}
${storyPlanInstruction(parsed.data.angle?.storyPlan)}

OUTPUT: Return ONLY a valid JSON object, without fences or commentary. Always include "caption" (variation of the original caption, ending with hashtags) and "visualHook" (the full on-screen text, variation of the original's).
${fmt === "carousel" || fmt === "graphic" ? 'Also include {"designSubtype":"insightful","slides":[{"position":1,"role":"hook|content|cta","headline":"...","subtitle":"...","body":"...","actionLabel":"..."}]} following the original slide by slide within the shared word limits.' : fmt === "talkingVideo" ? 'Also include {"spokenHook":"the opening sentence","script":"the full spoken script, including that opening exactly once"}.' : 'Also include {"script":"one complete text overlay"}.'}`;

          const raw = await streamFable(system, user);
          const topic = parsed.data.angle?.text.trim() ? parsed.data.angle.text.trim().slice(0, 140) : post.title;
          const script = parseRepurposeScript(raw, fmt, topic);
          try {
            const wire = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
            if (script.kind === "video" && typeof wire.visualHook === "string") script.visualHook = wire.visualHook.trim();
            const cap = repurposeCaptions(wire.caption, { caption: "" } as PostCopy);
            if (cap) script.captions = cap;
          } catch {}
          if (/^https?:\/\//.test(post.url)) script.inspoUrl = post.url;
          const briefText = `${angleInstruction(parsed.data.angle, "viral")}\n\n${storyPlanInstruction(parsed.data.angle?.storyPlan)}\n\n${brandRealityBlock(b)}\n\n${viralRepurposeInstructions(source.wordCount)}\n\nSOURCE:\n${JSON.stringify(labeled, null, 2)}\n\nAUDIENCE PERSPECTIVE:\n${JSON.stringify(audience, null, 2)}`;
          const context = {
            brandId: brief.id,
            brandName: String(b["Brand Name"] || ""),
            brief: { text: briefText, name: String(b["Brand Name"] || "Brand"), loading: false },
            cta: "",
          };

          const sctx = await sessionsCtx(auth.record);
          const session = await createSession(sctx, {
            title: REPURPOSE_TITLE,
            type: "Single",
            format: fmt,
            status: "In progress",
            topics: [{ title: topic, rationale: post.whyItWorks }],
            scripts: [script],
            briefSnapshot: briefText,
            transcript: repurposeTranscript(script, post.title, context),
          });
          await linkRepurpose(ctx, post, session.id).catch((e) =>
            console.error("inspo link failed", e),
          );
          return Response.json({ sessionId: session.id, script });
        } catch (e: any) {
          if (e instanceof GatewayError)
            return Response.json({ error: e.message }, { status: e.status });
          console.error("/api/inspo-repurpose", e);
          return Response.json(
            { error: "The script could not be written right now." },
            { status: 502 },
          );
        }
      },
    },
  },
});
