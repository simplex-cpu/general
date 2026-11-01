import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildBriefExtras, type BriefPayload } from "@/lib/slate/promptBuilder";
import { buildEnvelope, scriptDeliverable, pickBrollAngles } from "@/lib/slate/envelope";
import {
  parseVideoScriptOutput,
  extractJSON,
  type Hook,
  type Topic,
  type ScriptDoc,
} from "@/lib/slate/scriptChat";
import type { Prompts, Format, CarouselSlide } from "@/lib/simplex/types";
import { requireAccessCode } from "@/lib/accessCode.server";
import {
  designStructurePrompt,
  normalizeDesignSlides,
  type DesignSubtype,
} from "@/lib/slate/designTemplates";
import { generateLovableText } from "@/lib/lovableResponses.server";
import {
  applySelectedCta,
  completeVideoScript,
  formatTalkingVideoParagraphs,
  selectedCtaInstruction,
} from "@/lib/slate/scriptCta";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const MODEL = AI_MODELS.script;

// The scripting model always thinks before answering, and thinking shares
// max_tokens with the answer. Low budgets cut scripts off right after the hook.
const MIN_SCRIPT_TOKENS = 16000;

async function callClaude(userText: string, maxTokens = 3500) {
  maxTokens = Math.max(maxTokens, MIN_SCRIPT_TOKENS);
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
      messages: [{ role: "user", content: userText }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Anthropic ${res.status}`);
  if (data.stop_reason === "max_tokens") console.warn("[script] output truncated at max_tokens");
  return (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}

/**
 * Production notes are short, structural and never user-facing prose, so they
 * run on a fast model instead of the scripting model. This is the single
 * biggest chunk of waiting time per script, B-roll especially.
 */
async function callFast(userText: string, maxTokens = 900): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return callClaude(userText, maxTokens);
  return generateLovableText(`${userText}\n\nKeep the answer under ${maxTokens} tokens.`, "low");
}

type ProductionMeta = {
  inspo?: string;
  filmingInstructions?: string;
  creativeInstructions?: string;
};

function summarizeForProductionMeta(script: ScriptDoc): string {
  if (script.kind === "video") {
    return [
      script.visualHook && `Visual hook: ${script.visualHook}`,
      completeVideoScript(script) && `Script / text overlay:\n${completeVideoScript(script)}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  return script.slides
    .map(
      (slide) =>
        `Slide ${slide.position} [${slide.role}]\n${slide.headline}${slide.body ? `\n${slide.body}` : ""}`,
    )
    .join("\n\n");
}

async function generateProductionMeta({
  fmt,
  topic,
  brandDetails,
  script,
  prompts,
}: {
  fmt: Format;
  topic: Topic;
  brandDetails: string;
  script: ScriptDoc;
  prompts: Prompts;
}): Promise<ProductionMeta> {
  const isDesign = fmt === "graphic" || fmt === "carousel";
  const productionPrompt = buildEnvelope("productionMeta", prompts, {
    brandDetails,
    task: `Create production notes for this ${fmt} piece.

Topic:
${topic.title}${topic.rationale ? `\nTopic description: ${topic.rationale}` : ""}

Finished script:
${summarizeForProductionMeta(script)}

${isDesign ? "This is a design format: do not include Filming Guidelines." : "This is a video format: include Filming Guidelines and Creative Instructions."}`,
  });
  const text = await callFast(productionPrompt, 1200);
  const parsed = extractJSON<ProductionMeta>(text);
  const fallbackInspo =
    fmt === "graphic" || fmt === "carousel"
      ? "Use the brand's visual style and choose references that match the topic, audience and finished copy."
      : "Use simple, brand-aligned raw footage that makes the text easy to read and does not distract from the core idea.";
  const fallbackFilming =
    fmt === "broll"
      ? "Film clean, steady B-roll with enough empty space for the text overlay. Keep the movement slow and avoid busy backgrounds."
      : fmt === "talkingVideo"
        ? "Film face-to-camera in a quiet, well-lit setting. Leave a clean first three seconds for the visual hook and a clean ending for the CTA."
        : "";
  const fallbackCreative =
    fmt === "graphic"
      ? "Design as one single image with the hook as the main focal point. Keep hierarchy clear and leave room for brand styling."
      : fmt === "carousel"
        ? "Design as a multi-slide sequence with a clear cover, readable body slides and a final CTA slide. Keep each slide visually distinct but cohesive."
        : "Edit with clean pacing, readable overlays, brand-aligned captions and enough contrast for mobile viewing.";
  return {
    inspo: String(parsed?.inspo || fallbackInspo).trim(),
    filmingInstructions: isDesign
      ? ""
      : String(parsed?.filmingInstructions || fallbackFilming).trim(),
    creativeInstructions: String(parsed?.creativeInstructions || fallbackCreative).trim(),
  };
}

/**
 * B-roll overlays come back as JSON. Long overlays sometimes get truncated
 * mid-object, so salvage whatever complete overlay strings exist rather than
 * letting raw JSON land in the script card.
 */
function parseBrollOverlays(raw: string): string[] {
  const clean = (s: string) =>
    s
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();
  const parsed = extractJSON<{ versions?: { overlay?: string }[] }>(raw);
  const fromJson = (parsed?.versions || [])
    .map((v) => String(v?.overlay || "").trim())
    .filter(Boolean);
  if (fromJson.length >= 2) return fromJson.slice(0, 3);
  const out: string[] = [];
  const re = /"overlay"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const v = clean(m[1]);
    if (v) out.push(v);
  }
  if (out.length) return out.slice(0, 3);
  return fromJson.slice(0, 3);
}

export const Route = createFileRoute("/api/script")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const {
            topic,
            hook,
            scriptType,
            brief,
            prompts,
            reprompt,
            format,
            cta,
            accessCode,
            singleOverlay,
            slidesPerCarousel,
            designSubtype,
          } = body as {
            topic: Topic;
            hook: Hook;
            scriptType: "fleshed" | "framework";
            brief: BriefPayload;
            prompts: Prompts;
            reprompt?: string;
            format?: Format;
            cta?: string;
            accessCode?: string;
            singleOverlay?: boolean;
            slidesPerCarousel?: number;
            designSubtype?: DesignSubtype;
          };
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          const fmt: Format = format ?? "talkingVideo";
          const subtype: DesignSubtype = fmt === "carousel"
            ? topic.designSubtype === "insightful" ? "insightful" : "quote"
            : designSubtype === "insightful" ? "insightful" : "quote";

          const useVideoFormat = fmt === "talkingVideo" || fmt === "broll";

          let brandDetails = buildBriefExtras(brief, {
            slice: "scripting",
            includeRecentPosts: false,
          });
          if (fmt === "carousel" || fmt === "graphic") {
            brandDetails += `\n\nFIXED DESIGN STRUCTURE: ${designStructurePrompt(fmt, subtype)}\nEvery object must use the labels headline, body when required, and actionLabel on a CTA. If a CTA was supplied, make the final slide flow naturally from the preceding idea while preserving its action, keyword and reward. If no CTA was supplied, write a relevant generic engagement CTA asking the reader to share, follow, or comment.`;
          }

          const isBroll = fmt === "broll";
          const hookLines = isBroll
            ? ""
            : hook?.spoken
              ? `Approved spoken opening line: ${hook.spoken}`
              : `Approved hook: ${hook?.visual || ""}`;
          // B-roll: the three angles are chosen here, in code, before the AI call.
          const brollAngles = isBroll ? pickBrollAngles(singleOverlay ? 1 : 3) : [];
          const task = isBroll
            ? singleOverlay ? `Write ONE complete B-roll text overlay for this topic: ${topic.title}.${topic.rationale ? ` Topic description: ${topic.rationale}.` : ""} Follow this assigned angle: ${brollAngles[0]?.guide || "a direct value-led opening"}. Follow all brand and overlay guidelines. No footage cues, spoken dialogue or option lists. ${reprompt || ""}
Return ONLY JSON: {"versions":[{"overlay":"..."}]}` : `Write THREE versions of the B-roll text overlay for this topic, one per assigned angle.
Topic: ${topic.title}${topic.rationale ? `\nTopic description: ${topic.rationale}` : ""}

ASSIGNED ANGLES (use exactly these, in this order, one overlay each):
${brollAngles.map((a, i) => `${i + 1}. ${a.guide}`).join("\n")}

Rules:
- Every version follows the B-roll text overlay guidelines and output rules above, including their length rules. It is a text overlay, not a script: no footage cues, no beats, no spoken dialogue, no numbering, no angle labels, no quotation marks.
- Respect the length note on each assigned angle (short, medium or long) within the length rules set by the guidelines above.
- All three versions carry the same core message for this topic, but each one DELIVERS that value in a genuinely different way: different opening move, different sentence structure, different rhythm and a different length band (one short, one medium, one long where the guidelines allow it).
- Do not reword one overlay three times. If two versions could be swapped without the viewer noticing, rewrite them.
- Never name or label the angle inside the overlay text.
- Line breaks inside a version are fine when the assigned angle is stacked.${reprompt ? `\n\nUSER FEEDBACK ON PREVIOUS ATTEMPT: ${reprompt}. Address this.` : ""}

Return ONLY JSON: {"versions": [{"angle": "...", "overlay": "..."}, {"angle": "...", "overlay": "..."}, {"angle": "...", "overlay": "..."}]}`
            : `Write the ${useVideoFormat ? "script" : "slide copy"} for this topic and hook:\nTopic: ${topic.title}\n${topic.rationale ? `Topic description: ${topic.rationale}\n` : ""}${hookLines}` +
              `\n\nLENGTH: follow the length rules in the guidelines and output structure above. Do not apply any other length target.` +
              (fmt === "talkingVideo"
                ? `\n\nOPENING LINE: the approved spoken opening line above is locked. Open the script with it word for word, then keep going. Never rewrite it, never repeat it later in the script.
VISUAL HOOK: leave the visual hook section empty. The on-screen text overlay is written later, once the script is approved, so it can match the captions. Do not invent one here.
PAY OFF THE PROMISE: whatever the opening line promised, the body delivers it in the exact shape promised. A counted promise ("5 tips") gets that many, clearly separated. A callout gets resolved for the person called out. A reframe gets the new frame explained. Never open with a promise the body then ignores.
BODY: take the idea deeper with specifics from the brand details and land a single takeaway. It must sound like this person speaking out loud, not like written prose, and it must follow the length and structure rules in the script guidelines above.
PARAGRAPHS: use short, easy-to-read paragraphs. No paragraph may contain more than three sentences.
ENDING: when a CTA was selected, bake its intent into the final thought as a friendly, natural continuation of the script's main idea. Do not add a CTA heading or separate CTA section, and do not merely paste the selected wording. When no CTA was selected, do not invent one. Output the script section only, exactly as the output structure above defines it.`
                : "") +
              (reprompt ? `\n\nUSER FEEDBACK ON PREVIOUS ATTEMPT: ${reprompt}. Address this.` : "");


          const userMsg = buildEnvelope(scriptDeliverable(fmt, scriptType), prompts, {
            brandDetails,
            task,
          }) + `\n\n${selectedCtaInstruction(fmt, cta)}`;
          let text = await callClaude(userMsg, isBroll ? 4000 : 3500);
          if (isBroll) {
            // Only regenerate when the output is genuinely unusable. Rewriting a
            // full batch of overlays just to gain a third version doubled the
            // wait on every B-roll script.
            if (parseBrollOverlays(text).length < (singleOverlay ? 1 : 2)) {
              text = await callClaude(
                `${userMsg}\n\nCRITICAL OUTPUT RULE: return the raw JSON object only, with EXACTLY ${singleOverlay ? 1 : 3} objects in "versions" (one per assigned angle, in order). Keep every overlay short enough that the whole JSON object is complete. No preamble, no markdown fences, nothing after the closing brace.`,
                4000,
              );
            }
          }


          // Talking video: never ship a body that only restates the hook.
          if (fmt === "talkingVideo") {
            const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
            const bodyWords = (t: string) =>
              Math.max(0, words(parseVideoScriptOutput(t).script || t) - words(hook?.spoken || ""));
            if (bodyWords(text) < 40) {
              console.warn("[script] talking video body too short, retrying");
              const retry = await callClaude(
                `${userMsg}\n\nCRITICAL: your previous answer stopped after the opening line. Write the FULL script: the opening line, then the complete body that delivers every item the opening line promises (for example, all three fixes, each explained), then the takeaway. Follow the output structure above.`,
              );
              if (bodyWords(retry) > bodyWords(text)) text = retry;
            }
          }

          let script: ScriptDoc;
          if (useVideoFormat) {
            if (isBroll) {
              // B-roll: three overlay versions, one per pre-selected angle.
              const versions = parseBrollOverlays(text);
              if (!versions.length) {
                return json({ error: "Could not read the B-roll overlays. Try again." }, 502);
              }
              script = {
                format: fmt,
                kind: "video",
                topic: topic.title,
                visualHook: "",
                script: versions[0],
                onScreenCta: "",
                ...(!singleOverlay && versions.length ? { hookVariants: versions } : {}),
              };
            } else {
              const parsed = parseVideoScriptOutput(text);
              const spoken = (hook.spoken || "").trim();
              // Talking video: the visual hook (on-screen text overlay) is written
              // later, at the captions step, from the approved script, so it sells
              // the same promise the captions make.
              const visualHook = "";
              // Fallback: if the model skipped the section headers, keep the whole
              // body instead of shipping an empty script card.
              let bodyText = parsed.script;
              if (!bodyText.trim()) {
                bodyText = text
                  .replace(/─{2,}\s*[^─\n]+?\s*─{2,}/g, "")
                  .replace(/^\s*(visual hook|spoken hook|hook|cta|on-screen cta)\s*:.*$/gim, "")
                  .trim();
              }
              // Keep a natural CTA inside the spoken script, but remove any
              // structural label the model added against the instructions.
              bodyText = bodyText.replace(/\n+\s*(on-?screen\s+)?cta\s*:\s*/gi, "\n\n").trim();
              // Guarantee the approved hook opens the script.
              if (spoken) {
                const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
                const head = norm(bodyText.slice(0, spoken.length + 40));
                if (!head.startsWith(norm(spoken).slice(0, Math.min(24, norm(spoken).length)))) {
                  bodyText = `${spoken}\n\n${bodyText}`;
                }
              }
              bodyText = formatTalkingVideoParagraphs(bodyText);
              script = {
                format: fmt,
                kind: "video",
                topic: topic.title,
                visualHook,
                spokenHook: spoken || visualHook,
                script: bodyText,
                onScreenCta: "",
              };
            }

          } else {
            const readSlides = (raw: string): CarouselSlide[] | null => {
              const p = extractJSON<any>(raw);
              if (Array.isArray(p)) return p;
              if (Array.isArray(p?.slides)) return p.slides;
              if (p && typeof p === "object") {
                const arr = Object.values(p).find((v) => Array.isArray(v) && v.length && typeof v[0] === "object");
                if (arr) return arr as CarouselSlide[];
              }
              return null;
            };
            let slidesRaw = readSlides(text);
            if (!slidesRaw?.length) {
              console.error("[script] slide parse failed. raw head:", String(text).slice(0, 600));
              const retry = await callClaude(
                `${userMsg}\n\nCRITICAL OUTPUT RULE: return ONLY a raw JSON object of the form {"slides":[{"role":"cover|body|cta","headline":"...","body":"...","actionLabel":"..."}]} following the slide count and word limits above. No preamble, no markdown fences, nothing after the closing brace.`,
                3500,
              );
              slidesRaw = readSlides(retry);
            }
            if (!slidesRaw?.length) {
              return json({ error: "Couldn't write the slides this time. Please try again." }, 502);
            }
            const parsed = { slides: slidesRaw };
            const slides = normalizeDesignSlides(
              fmt,
              subtype,
              parsed.slides,
              topic.title,
              cta || "",
            );
            script = {
              format: fmt,
              kind: "carousel",
              designSubtype: subtype,
              topic: topic.title,
              slides,
            };
          }
          try {
            const meta = await generateProductionMeta({
              fmt,
              topic,
              brandDetails,
              script,
              prompts,
            });
            script = { ...script, ...meta } as ScriptDoc;
          } catch (metaError) {
            console.error("/api/script production meta", metaError);
          }




          return json({ script: applySelectedCta(script, cta), raw: text });

        } catch (e: any) {
          console.error("/api/script", e);
          const message = String(e?.message || e || "Script generation failed").slice(0, 300);
          return json({ error: message }, 502);
        }
      },
    },
  },
} as any);
