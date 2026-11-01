import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireAccessCode } from "@/lib/accessCode.server";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const MODEL = AI_MODELS.parseScript;

export const Route = createFileRoute("/api/parse-script")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const key = process.env.ANTHROPIC_API_KEY;
          if (!key) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
          const { base64, filename, accessCode } = (await request.json()) as {
            base64: string;
            filename?: string;
            accessCode?: string;
          };
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          if (!base64) return json({ error: "Missing PDF data" }, 400);

          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 1500,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
                    {
                      type: "text",
                      text: `This PDF is a short-form content script. Extract the on-screen elements and return ONLY a JSON object (no markdown fences, no preamble):

{
  "visualHook": "<the visual hook / opening visual direction, verbatim from the script if present, otherwise an empty string>",
  "textOverlay": "<the on-screen text overlay copy, verbatim from the script if present (look for headings like TEXT OVERLAY, ON-SCREEN TEXT, ON SCREEN CTA, or the hook line meant to be displayed on screen), otherwise an empty string>",
  "script": "<the spoken script body as plain text, or an empty string if there is none>",
  "coverCopy": "<the cover / first-slide headline for a graphic or carousel, verbatim if present, otherwise an empty string>",
  "slides": ["<copy for slide 1 (the cover)>", "<copy for slide 2>", "..."]
}

Rules for "slides": if the PDF is slide-based (headings like SLIDE 1, COVER, SLIDE 2, or a numbered list of slides), return the slides in order, one array entry per slide, each entry being that slide's copy as plain text with a line break between its headline and its body. If the PDF is not slide-based, return an empty array.
Rules: plain text only, no markdown asterisks or bullets. Never invent content that is not in the PDF — return "" or [] instead. Return ONLY the JSON object.`,
                    },
                  ],
                },
              ],
            }),
          });
          const data: any = await res.json();
          if (!res.ok) return json({ error: data?.error?.message || `Anthropic ${res.status}` }, 500);
          const raw = (data.content || [])
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n")
            .trim();

          let out = {
            visualHook: "",
            textOverlay: "",
            script: "",
            coverCopy: "",
            slides: [] as string[],
          };
          const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
          const tryParse = (s: string) => {
            try {
              const p = JSON.parse(s);
              out = {
                visualHook: String(p.visualHook || ""),
                textOverlay: String(p.textOverlay || ""),
                script: String(p.script || ""),
                coverCopy: String(p.coverCopy || ""),
                slides: Array.isArray(p.slides)
                  ? p.slides.map((s: any) => String(s || "")).filter((s: string) => s.trim())
                  : [],
              };
              return true;
            } catch {
              return false;
            }
          };
          if (!tryParse(cleaned)) {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) tryParse(m[0]);
          }
          return json({ ...out, filename });
        } catch (e: any) {
          console.error("/api/parse-script", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
