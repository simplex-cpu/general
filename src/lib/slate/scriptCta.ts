import type { Format } from "@/lib/simplex/types";
import type { ScriptDoc } from "./scriptChat";

export function selectedCtaInstruction(format: Format, cta = ""): string {
  const selected = cta.trim();
  if (!selected)
    return "No CTA selected. Never invent a lead magnet, keyword, offer, discount, freebie or reward.";
  const authority = `SELECTED CTA (AUTHORITATIVE, OVERRIDES BRAND EXAMPLES AND GUIDELINES): ${selected}
Preserve the selected action and, when present, its keyword and viewer reward. Never invent an offer, ebook, guide, discount, consultation, freebie or delivery mechanism. Offers mentioned in examples or brand context are NOT permission to promote them. Do not tease any offer other than the selected reward.`;
  if (format === "talkingVideo") {
    return `${authority}
Make the CTA the natural final thought of the spoken script. Connect it to the script's main idea as one friendly closing statement; do not add a CTA heading, separate section, abrupt command, or a line that merely parrots the selected wording. You may adjust the surrounding grammar, but never change the action, keyword or reward. Check the whole script for conflicting actions or invented offers before returning it.`;
  }
  if (format === "carousel") {
    return `${authority}
Keep the CTA only in the final carousel slide. Connect the conclusion to the action as a friendly, natural invitation rather than pasting a disconnected command. You may adjust the surrounding grammar, but never change the action, keyword or reward.`;
  }
  return `${authority}
Do not put this CTA in the ${format === "broll" ? "B-roll text overlay" : "graphic copy"}. It belongs only in the platform captions.`;
}

export function captionStructureInstruction(cta = ""): string {
  const selected = cta.trim();
  const ctaRule = selected
    ? `Add a final blank line, then close with a natural transition into this SELECTED CTA (AUTHORITATIVE): ${selected}. Preserve its action and, when present, its keyword and reward. Connect the caption's final idea to it as a friendly closing statement rather than pasting or parroting a disconnected command. Never invent another offer or action.`
    : "Do not add a CTA. Never invent a lead magnet, keyword, offer, discount, freebie or reward.";
  return `CAPTION STRUCTURE (REQUIRED): Start with a standalone hook. Add a blank line. Develop the body across 2 to 4 short paragraphs, with one idea per paragraph and a blank line between ideas. Do not use visible labels such as Hook, Body or CTA. Instagram and Facebook must be substantial enough to add context beyond the script; TikTok and YouTube may stay shorter while keeping the same readable paragraph structure. ${ctaRule}`;
}

/** New scripts never persist a second, separately rendered CTA field. */
export function applySelectedCta(script: ScriptDoc, cta = ""): ScriptDoc {
  void cta;
  return script.kind === "video" ? { ...script, onScreenCta: "" } : script;
}

/** Keep spoken scripts scannable without changing their wording or sentence order. */
export function formatTalkingVideoParagraphs(value: string): string {
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .flatMap((paragraph) => {
      const sentences = paragraph
        .replace(/\s*\n\s*/g, " ")
        .split(/(?<=[.!?])\s+(?=[A-Z0-9“”"'])/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
      const groups: string[] = [];
      for (let index = 0; index < sentences.length; index += 3) {
        groups.push(sentences.slice(index, index + 3).join(" "));
      }
      return groups;
    })
    .join("\n\n");
}

/** Complete spoken copy for legacy sessions whose saved body omitted the approved hook. */
export function completeVideoScript(script: ScriptDoc): string {
  if (script.kind !== "video") return "";
  const body = script.script.trim();
  if (script.format !== "talkingVideo") return body;
  const hook = String(script.spokenHook || "").trim();
  if (!hook) return formatTalkingVideoParagraphs(body);
  const comparable = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const bodyStart = comparable(body).slice(0, comparable(hook).length);
  return formatTalkingVideoParagraphs(
    bodyStart === comparable(hook) ? body : `${hook}\n\n${body}`.trim(),
  );
}
