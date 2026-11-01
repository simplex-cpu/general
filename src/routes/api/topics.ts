import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import { isInstructionTopic } from "@/lib/slate/topicGuard";
import type {} from "@tanstack/react-start";
import { buildBriefExtras, type BriefPayload } from "@/lib/slate/promptBuilder";
import { buildEnvelope } from "@/lib/slate/envelope";
import { extractJSON, type Topic } from "@/lib/slate/scriptChat";
import type { Prompts } from "@/lib/simplex/types";
import { requireAccessCode } from "@/lib/accessCode.server";


const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const MODEL = AI_MODELS.topics;

async function callClaudeWithSearch(userText: string, maxTokens = 5000) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
      messages: [{ role: "user", content: userText }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Anthropic ${res.status}`);
  const content: any[] = data.content || [];
  // Web-search answers are split into many cited text blocks. Join every text
  // block after the last search result so the JSON isn't cut into fragments.
  let lastTool = -1;
  content.forEach((b, i) => { if (b.type !== "text") lastTool = i; });
  const tail = content.slice(lastTool + 1).filter((b) => b.type === "text").map((b) => b.text || "").join("");
  if (tail.trim()) return tail;
  return content.filter((b) => b.type === "text").map((b) => b.text || "").join("");
}

export const Route = createFileRoute("/api/topics")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { brief, analysisReport, seedReport, count, prompts, reprompt, accessCode } = body as {
            brief: BriefPayload;
            analysisReport?: any | null;
            seedReport?: any | null;
            count: number;
            prompts: Prompts;
            reprompt?: string;
            accessCode?: string;
          };
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          // Analysis reports are never fed to scripting AI calls; they only shape
          // the brand's Recommended strategy, which arrives via brief.recommendedStrategy.
          void analysisReport; void seedReport;

          const brandDetails = buildBriefExtras(brief, { slice: "research", includeRecentPosts: true });
          const total = count + 5;
          const halfTrending = Math.ceil(total / 2);
          const halfEvergreen = total - halfTrending;
          const task =
            `Generate exactly ${total} topics for short-form content, split as follows:
- ${halfTrending} TRENDING topics: things being talked about RIGHT NOW in this brand's industry (news articles, viral creator posts, recent studies, cultural moments from the last ~30 days). Use the web_search tool 1-2 times to find real, recent content in this brand's niche.
- ${halfEvergreen} EVERGREEN topics: high-value authoritative angles inside the brand's expertise area that are always relevant to this audience.

For every topic include designSubtype as either "insightful" or "quote":
- insightful means the topic promises an explanation, diagnosis, process, reasons, recommendations, or a deeper answer. "Why is my website not appearing in ChatGPT?" is insightful.
- quote means the topic is genuinely motivational, inspirational, directly challenges a belief, or supports one coherent belief-changing sequence.
- Never label a broad explanation as quote merely because it could be split into short statements.

Return ONLY the JSON after web searches complete.` +
            (reprompt ? `\n\nUSER FEEDBACK ON PREVIOUS ATTEMPT: ${reprompt}. Address this in your next attempt.` : "");
          const userMsg = buildEnvelope("topics", prompts, { brandDetails, task });
          const text = await callClaudeWithSearch(userMsg);

          const readTopics = (t: string): Topic[] => {
            const p = extractJSON<any>(t);
            if (Array.isArray(p)) return p;
            return Array.isArray(p?.topics) ? p.topics : [];
          };
          let found = readTopics(text);
          if (!found.length) {
            console.error("[topics] parse failed, retrying. head:", String(text).slice(0, 600));
            const retry = await callClaudeWithSearch(
              `${userMsg}\n\nCRITICAL OUTPUT RULE: your final answer must be ONLY the raw JSON object {"topics":[{"title":"...","rationale":"...","designSubtype":"insightful|quote"}]}, starting with { and ending with }. No preamble, no citations, no markdown fences.`,
            );
            found = readTopics(retry);
          }
          if (!found.length) return json({ error: "Topic research didn't come back in a readable form. Please try again." }, 502);
          const rejected = found.filter((t) => isInstructionTopic(t.title || ""));
          if (rejected.length) {
            const retry = await callClaudeWithSearch(
              `${userMsg}\n\nThese topics were rejected because they are instructions or content tasks, not subjects: ${rejected.map((t) => `"${t.title}"`).join(", ")}. Write exactly ${rejected.length} replacement topic(s) that are subjects worth discussing. Return ONLY {"topics":[{"title":"...","rationale":"...","designSubtype":"insightful|quote"}]}.`,
            );
            const replacements = readTopics(retry).filter((t) => !isInstructionTopic(t.title || ""));
            found = [...found.filter((t) => !isInstructionTopic(t.title || "")), ...replacements];
          }
          const parsed = { topics: found };
          const topics = parsed.topics.map((t) => ({
            title: (t.title || "").replace(/\*\*/g, "").trim(),
            rationale: (t.rationale || "").replace(/\*\*/g, "").trim(),
            ...(t.designSubtype === "insightful" || t.designSubtype === "quote"
              ? { designSubtype: t.designSubtype }
              : {}),
          }));
          return json({ topics });
        } catch (e: any) {
          console.error("/api/topics", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
