import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief } from "@/lib/brands.server";
import { sessionsCtx, createSession } from "@/lib/writerSessions.server";
import { generateOwnPostClaude, OwnPostAIError } from "@/lib/ownPostClaude.server";
import { assembleOwnPostPrompt, parseOwnPostOutput } from "@/lib/slate/ownPostRepurpose";
import { mergePostCopy, readPostCopy } from "@/lib/slate/postCopy";
import { minePostCopy } from "@/lib/minePostCopy.server";
import { repurposeTranscript, REPURPOSE_TITLE } from "@/lib/slate/inspoRepurpose";
import { REPURPOSE_TARGETS, TARGET_LABEL, planRepurpose, writerFormatFor } from "@/lib/slate/postRepurpose";
import { readPost, linkIds } from "@/lib/posts.server";
import { ANGLE_KINDS } from "@/lib/slate/brandContext";

const text = (max: number) => z.string().max(max).default("");
const Body = z.object({
  brandId: z.string().regex(/^rec[A-Za-z0-9]{14}$/).optional(),
  target: z.enum(REPURPOSE_TARGETS),
  postId: z.string().regex(/^rec[A-Za-z0-9]{14}$/).optional(),
  angle: z.object({ text: z.string().max(600), kind: z.enum(ANGLE_KINDS) }).optional(),
  url: text(2000),
  title: text(300), postType: text(80), topic: text(300),
  hook: text(20000), caption: text(100000), transcript: text(100000), slideCopy: text(100000), textOnScreen: text(100000), coverTitle: text(20000), coverCopy: text(100000), visualHook: text(20000), hashtags: text(20000),
});

export const Route = createFileRoute("/api/post-repurpose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const parsed = Body.safeParse(await request.json().catch(() => ({})));
          if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
          const d = parsed.data;
          const token = process.env.AIRTABLE_TOKEN || "";
          const brief = await selectedBrief(auth.record, token, d.brandId);
          if (!brief) return Response.json({ error: "Add your brand brief first" }, { status: 404 });
          let original = mergePostCopy(readPostCopy({}), d);
          if (d.postId) {
            const row = await readPost(token, d.postId);
            const brandIds = linkIds(brief.fields?.Brand);
            if (!row || !linkIds(row.fields.Brand).some((id) => brandIds.includes(id))) return Response.json({ error: "This post is unavailable for this brand." }, { status: 404 });
            original = mergePostCopy((await minePostCopy(auth.record, token, row)).copy, original);
            d.postType = String(row.fields.Format || d.postType); d.topic = String(row.fields.Topic || d.topic);
          }
          if (!(original.transcript || original.caption || original.slideCopy || original.textOnScreen).trim()) return Response.json({ error: "This post's source copy is not saved yet. Refresh stats to collect it first." }, { status: 400 });
          const b = brief.fields || {};
          const mode = planRepurpose(d.postType, d.target);
          const fmt = writerFormatFor(d.target);
          if (mode === "visual" && !(fmt === "broll" ? original.textOnScreen : original.transcript)) return Response.json({ error: "The full original script is not saved yet. Refresh stats first." }, { status: 400 });
          if (mode === "cover" && !(original.slideCopy || original.textOnScreen)) return Response.json({ error: "The full original slide or graphic copy is not saved yet. Refresh stats first." }, { status: 400 });
          const topic = d.topic || d.title || "Top post";
           const prompt = assembleOwnPostPrompt({ target: d.target, mode, sourceFormat: d.postType, title: d.title, topic, original, brand: b });
           const generated = await generateOwnPostClaude(prompt.system, prompt.user, prompt.schema, request);
           let script;
           try { script = parseOwnPostOutput(generated.text, d.target, mode, original, topic); }
           catch (error) { return Response.json({ error: error instanceof Error ? error.message : "The AI returned invalid copy. No script was saved." }, { status: 422, headers: generated.headers }); }
          if (/^https?:\/\//.test(d.url)) script.inspoUrl = d.url;
           const briefText = `${prompt.system}\n\n${prompt.user}`;
          const context = { brandId: brief.id, brandName: String(b["Brand Name"] || ""), brief: { text: briefText, name: String(b["Brand Name"] || "Brand"), loading: false }, cta: "" };
          const session = await createSession(await sessionsCtx(auth.record), {
            title: REPURPOSE_TITLE, type: "Single", format: fmt, status: "In progress",
            topics: [{ title: topic, rationale: `Repurposed from your top post as a ${TARGET_LABEL[d.target]}.` }],
            scripts: [script], briefSnapshot: briefText,
             transcript: repurposeTranscript(script, d.title || topic, context).map((message) => message.kind === "script" ? { ...message, captions: script.captions } : message),
          });
           return Response.json({ sessionId: session.id, script, format: fmt, topic }, { headers: generated.headers });
        } catch (e: any) {
           if (e instanceof OwnPostAIError) return Response.json({ error: e.message }, { status: e.status });
          console.error("/api/post-repurpose", e);
          return Response.json({ error: "The repurposed version could not be written right now." }, { status: 502 });
        }
      },
    },
  },
});
