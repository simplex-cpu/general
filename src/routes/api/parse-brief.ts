import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireAccessCode } from "@/lib/accessCode.server";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const MODEL = "claude-opus-4-8";

export const Route = createFileRoute("/api/parse-brief")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const key = process.env.ANTHROPIC_API_KEY;
          if (!key) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
          const { base64, filename, accessCode } = (await request.json()) as { base64: string; filename: string; accessCode?: string };
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
              max_tokens: 2500,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "document",
                      source: { type: "base64", media_type: "application/pdf", data: base64 },
                    },
                    {
                      type: "text",
                      text: `Read this brand brief and return ONLY a JSON object (no markdown fences, no preamble) with exactly these five fields:

{
  "brief": "<full extracted reference notes under these exact headers, plain text, no markdown asterisks. Each section 2-5 lines max:\\n\\nBRAND & OFFER\\n...\\n\\nTARGET AUDIENCE\\n...\\n\\nTONE OF VOICE\\n...\\n\\nPAIN POINTS\\n...\\n\\nTOPICS OF EXPERTISE\\n...\\n\\nAESTHETIC / LOOK & FEEL\\n...\\n\\nCTAs / LEAD MAGNETS\\n...>",
  "summary": "<2-3 sentence plain-English summary that MUST start with the exact phrase 'Your brand in a nutshell:' followed by a description of the brand's audience, offer, voice, and top 1-2 expertise areas. No markdown.>",
  "topicsToPrioritize": "<1-2 sentences naming the topic territories this brand should lead with — drawn from their expertise areas and audience pain points. Plain text, no markdown.>",
  "languageToIncorporate": "<1-2 sentences describing the specific words, phrases, and tonal cues this brand uses (or should use) — pull from the brief's voice section and audience language. Plain text, no markdown.>",
  "languageToAvoid": "<1-2 sentences naming words, phrases, or tonal moves this brand should NEVER use — pull from voice restrictions, brand no-gos, or things that would alienate the audience. Plain text, no markdown.>"
}

Return ONLY the JSON object.`,
                    },
                  ],
                },
              ],
            }),
          });
          const data = await res.json();
          if (!res.ok) return json({ error: data?.error?.message || `Anthropic ${res.status}` }, 500);
          const raw = (data.content || [])
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n")
            .trim();

          let brief = raw;
          let summary = "";
          let topicsToPrioritize = "";
          let languageToIncorporate = "";
          let languageToAvoid = "";
          const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
          const tryParse = (s: string) => {
            try {
              const parsed = JSON.parse(s);
              brief = parsed.brief || raw;
              summary = parsed.summary || "";
              topicsToPrioritize = parsed.topicsToPrioritize || "";
              languageToIncorporate = parsed.languageToIncorporate || "";
              languageToAvoid = parsed.languageToAvoid || "";
              return true;
            } catch { return false; }
          };
          if (!tryParse(cleaned)) {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) tryParse(m[0]);
          }
          if (!summary) summary = "Your brand in a nutshell: brief parsed — I'll use it for voice, audience, and angle as we go.";
          return json({
            text: brief,
            summary,
            topicsToPrioritize,
            languageToIncorporate,
            languageToAvoid,
            filename,
          });
        } catch (e: any) {
          console.error("/api/parse-brief", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
