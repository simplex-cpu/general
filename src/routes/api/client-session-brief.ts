import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const MODEL = "google/gemini-3-flash-preview";

const STRUCTURE = `You build ONE editable session brief for a creator who is about to script a batch of social content. You are given their Brand info form. Output MARKDOWN ONLY, using EXACTLY these sections and headers, in this order:

## Brand brief
2-4 tight sentences: what the brand is, what it sells, the promise.

## Audience
Who we speak to, what they want, the pain points that hook them.

## Tone of voice
How the brand sounds. Concrete, not adjectives-only. Include 2-3 phrases/moves that fit the voice.

## Brand expertise
The topics and angles this brand is genuinely credible on.

## Scripting do's
5-7 bullets. Specific, actionable scripting rules for hooks, scripts and captions.

## Scripting don'ts
5-7 bullets. Specific things to never do for this brand.

When a CURRENT CONTENT STRATEGY is given, it is the latest direction and takes priority: fold its topics to double down on into Brand expertise, its hooks to test and words/phrases to use into Scripting do's, and its don'ts into Scripting don'ts.

Rules: no preamble, no closing note, no extra sections, never invent facts that contradict the Brand info. Keep it scannable.`;

export const Route = createFileRoute("/api/client-session-brief")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          let body: any;
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }
          const auth = await requireAccessCode(body?.accessCode);
          if (!auth.ok) return auth.response;

          const brandName = String(body?.brandName || "this brand");
          const briefText = String(body?.briefText || "").trim();
          const strategy = String(body?.strategy || "").trim().slice(0, 12000);
          if (!briefText) return Response.json({ error: "briefText required" }, { status: 400 });

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return Response.json({ error: "Server misconfigured" }, { status: 500 });

          const gateway = createOpenAICompatible({
            name: "lovable-ai",
            baseURL: "https://ai.gateway.lovable.dev/v1",
            headers: { "Lovable-API-Key": key },
          });

          const { text } = await generateText({
            model: gateway(MODEL),
            system: STRUCTURE,
            maxOutputTokens: 3000,
            abortSignal: AbortSignal.timeout(50000),
            prompt: `BRAND: ${brandName}\n\nBRAND INFO FORM:\n${briefText}${strategy ? `\n\nCURRENT CONTENT STRATEGY:\n${strategy}` : ""}\n\nBuild the session brief now. Markdown only.`,
          });

          const summaryMarkdown = text.trim();
          if (!summaryMarkdown) return Response.json({ error: "Empty session brief" }, { status: 502 });
          return Response.json({ summaryMarkdown });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
} as any);
