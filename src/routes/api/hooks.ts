import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildBriefExtras, type BriefPayload } from "@/lib/slate/promptBuilder";
import { buildEnvelope, hookDeliverable } from "@/lib/slate/envelope";
import { extractJSON, type Hook, type Topic } from "@/lib/slate/scriptChat";
import type { Prompts, Format } from "@/lib/simplex/types";
import { requireAccessCode } from "@/lib/accessCode.server";
import { designStructurePrompt, limitWords, type DesignSubtype } from "@/lib/slate/designTemplates";



const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const MODEL = AI_MODELS.hooks;

async function callClaude(userText: string, maxTokens = 3000) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
  const messages: any[] = [{ role: "user", content: userText }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[hooks] anthropic error", res.status, JSON.stringify(data).slice(0, 500));
    throw new Error(data?.error?.message || `Anthropic ${res.status}`);
  }
  const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
  if (data.stop_reason === "max_tokens") console.warn("[hooks] output truncated at max_tokens");
  return text;
}


export const Route = createFileRoute("/api/hooks")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { topics, brief, prompts, reprompt, format, accessCode, perTopic, designSubtype } = body as {
            topics: Topic[];
            brief: BriefPayload;
            prompts: Prompts;
            reprompt?: string;
            format?: Format;
            accessCode?: string;
            perTopic?: number;
            designSubtype?: DesignSubtype;
          };
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          const hasBrief = !!((brief?.text && brief.text.trim()) || (brief?.adminSummary && brief.adminSummary.trim()));
          if (!hasBrief) {

            return json({ error: "Missing brand brief — cannot generate audience-specific hooks." }, 400);
          }
          const fmt: Format = format ?? "talkingVideo";
          const subtype: DesignSubtype = designSubtype === "insightful" ? "insightful" : "quote";
          const brandDetails = buildBriefExtras(brief, { slice: "scripting", includeRecentPosts: false });
          const topicSubtype = (topic: Topic): DesignSubtype =>
            topic.designSubtype === "insightful" ? "insightful" : topic.designSubtype === "quote" ? "quote" : subtype;
          const list = topics.map((t, i) => `${i + 1}. ${t.title}${fmt === "carousel" ? ` [${topicSubtype(t)}]` : ""}`).join("\n");
          const per = Math.max(1, Math.min(4, Number(perTopic) || 1));
          const isCover = fmt === "carousel" || fmt === "graphic";
          // Only three angle types exist, and they stay internal to the system.
          const ANGLES = [
            'A Callout (name exactly who this is for and what they keep getting wrong)',
            'Numbered List or Tips (a counted promise, e.g. "3 things I check before...")',
            'A Reframe (correct how the audience currently sees this, give them the better frame)',
          ].join("\n- ");
          const multi =
            per > 1
              ? `\n\nHOW MANY: write EXACTLY ${per} separate options for EVERY topic listed above, so ${topics.length * per} objects in total, in topic order. Set "topicIndex" to the topic's number for each one.\n\nANGLES: you choose the angle for each option, but only from these three types:\n- ${ANGLES}\nThe ${per} options for the same topic must use ${per} DIFFERENT types from that list. The topic itself never changes between the options: same subject, same claim, different angle and a genuinely different way of delivering the value.\n\nDELIVERABLE PROMISE: each option makes a promise, and the script written afterwards has to pay it off in the exact shape promised. If the line promises "5 tips", the script must give five tips. If it calls someone out, the script resolves that callout. If it reframes something, the script explains the new frame. Never promise something the script cannot deliver in one short-form video.\n\nAdd an "angle" field on each object with the type name only ("A Callout", "Numbered List or Tips" or "A Reframe"). This field is internal and is never shown to anyone, so never write the type name inside the copy itself.`
              : "";
          const spokenOnly = isCover
            ? ""
            : `\n\nWHAT TO WRITE: write ONLY the spoken opening line, the first thing said on camera. Put it in the "spoken" field of each object. Do NOT write on-screen text, a visual hook, a caption, a script or any second line: the on-screen text is derived from the chosen opening line in a later step. Leave "visual" out entirely.`;
          const task =
            `Write the ${isCover ? "cover hook(s)" : "spoken opening line(s)"} for EACH of these topics.\n\nTopics:\n${list}` +
            (isCover && fmt === "carousel"
              ? `\n\nEach topic has its required type in brackets. Follow the matching rule for that topic:\n${designStructurePrompt("carousel", "quote")}\n${designStructurePrompt("carousel", "insightful")}`
              : isCover ? `\n\n${designStructurePrompt(fmt as "carousel" | "graphic", subtype)}` : "") +
            multi +
            spokenOnly +
            (reprompt ? `\n\nUSER FEEDBACK ON PREVIOUS ATTEMPT: ${reprompt}. Address this.` : "");
          const userMsg = buildEnvelope(hookDeliverable(fmt), prompts, { brandDetails, task });
          const budget = Math.min(32000, 6000 + topics.length * per * 900);
          const text = await callClaude(userMsg, budget);
          let parsed = extractJSON<{ hooks: Hook[] }>(text);
          if (!parsed?.hooks?.length) {
            console.error("[hooks] first parse failed. raw head:", String(text).slice(0, 800));
            const retry = await callClaude(
              `${userMsg}\n\nCRITICAL OUTPUT RULE: respond with the raw JSON object only, starting with { and ending with }. Keep every hook short so the JSON is complete. No preamble, no explanation, no markdown fences, nothing after the closing brace.`,
              budget,
            );
            parsed = extractJSON<{ hooks: Hook[] }>(retry);
            if (!parsed?.hooks?.length && Array.isArray(parsed)) {
              parsed = { hooks: parsed as unknown as Hook[] };
            }
            if (!parsed?.hooks?.length) {
              console.error("[hooks] retry parse failed. raw head:", String(retry).slice(0, 800));
              return json({ error: "Could not parse hooks", raw: String(retry).slice(0, 2000) }, 502);
            }
          }

          // Normalise so the UI can group by topic and map a pick back to its topic.
          const hooks: Hook[] = parsed.hooks.map((h: any, i: number) => {
            const raw = Number(h?.topicIndex);
            const ti =
              Number.isFinite(raw) && raw >= 1 && raw <= topics.length
                ? raw
                : Math.min(topics.length, Math.floor(i / per) + 1);
            // Non-cover formats carry the spoken opening line only; the visual
            // hook is derived from it later, at script time.
             const spoken = String(h?.spoken ?? h?.visual ?? "").trim();
             const assignedSubtype = topicSubtype(topics[ti - 1]);
            return {
              ...h,
              topicIndex: ti,
              topicTitle: topics[ti - 1]?.title || h?.topicTitle || "",
                 visual: isCover
                  ? limitWords(String(h?.visual ?? h?.spoken ?? ""), assignedSubtype === "quote" && fmt === "carousel" ? 9 : assignedSubtype === "insightful" ? (fmt === "carousel" ? 8 : 6) : 20)
                 : "",
              ...(isCover ? {} : { spoken }),
            } as Hook;
          });
          // Keep topic order stable so "Variation 1/2" sit under the right header.
          hooks.sort((a, b) => (a.topicIndex ?? 0) - (b.topicIndex ?? 0));
          return json({ hooks });

        } catch (e: any) {
          console.error("/api/hooks", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
