// Rules for recreating one of the brand's own published posts in a new format.
import { normalizeFormat } from "./postMetrics";
import type { ScriptDoc } from "./scriptChat";
import type { PostCopy } from "./postCopy";
import { parsePublishedSlides } from "./slideFields";

export const REPURPOSE_TARGETS = ["story", "broll", "carousel", "graphic", "talkingVideo"] as const;
export type RepurposeTarget = (typeof REPURPOSE_TARGETS)[number];
export const TARGET_LABEL: Record<RepurposeTarget, string> = { story: "Story", broll: "B-roll", carousel: "Carousel", graphic: "Single graphic", talkingVideo: "Talking video" };
export type RepurposeMode = "visual" | "cover" | "reformat";

/** visual: same talking video, new visual; cover: same slides, new cover title; reformat: same copy, new format. */
export function planRepurpose(originalPostType: string, target: RepurposeTarget): RepurposeMode {
  const f = normalizeFormat(originalPostType);
  if ((f === "Talking Video" && target === "talkingVideo") || (f === "Broll" && target === "broll")) return "visual";
  if ((f === "Carousel" && target === "carousel") || (f === "Graphic" && target === "graphic")) return "cover";
  return "reformat";
}

/** Story is written as a short vertical text overlay in the writer. */
export function writerFormatFor(target: RepurposeTarget): "talkingVideo" | "broll" | "carousel" | "graphic" {
  return target === "story" || target === "broll" ? "broll" : target;
}

export function modeInstruction(mode: RepurposeMode, target: RepurposeTarget): string {
  if (mode === "visual" && target === "broll") return "Keep ALL original overlay copy word for word. Change ONLY the visual hook: a new short on-screen hook line. Rewrite the caption and hashtags to match the new hook; same main idea and content.";
  if (target === "broll" && mode === "reformat") return "Reformat into ONE B-roll text overlay of at most 20 words. The overlay hooks the original message; move supporting claims, examples and payoff into the caption. No spoken directions, scene descriptions, CTA or hashtags in the overlay.";
  if (mode === "visual") return "Keep the entire spoken script including its spoken opening word for word. Change ONLY the visual hook: write a NEW short on-screen hook text (one line). Return visualHook separately. Rewrite the caption and hashtags to match the new hook; same main idea and content.";
  if (mode === "cover") return "Change ONLY the cover title/copy. Preserve every later slide and all remaining body copy, word for word. Rewrite the caption and hashtags to match the new cover; same main idea and content. Keep original slide count and order. New-format limits do not apply to unchanged published source copy.";
  if (target === "story") return "Reformat the original copy into ONE Instagram Story text overlay: 1–3 short lines per frame, at most 3 frames separated by blank lines, same message and payoff, no hashtags.";
  return "Reshape the original message into the target format. Preserve topic, main idea, claims, examples, payoff and voice across the script/slides and caption together. Condense where the format requires it; do not invent new points.";
}

/** Source bodies are restored after generation so same-format copy cannot drift. */
export function preserveOriginalBody(generated: ScriptDoc, mode: RepurposeMode, original: PostCopy): ScriptDoc {
  let result = generated;
  if (mode === "visual" && generated.kind === "video") result = { ...generated, script: generated.format === "broll" ? original.textOnScreen : original.transcript, spokenHook: undefined };
  if (mode === "cover" && generated.kind === "carousel") {
    const source = parsePublishedSlides(original.slideCopy || `Slide 1\nTitle: ${original.coverTitle}\nBody: ${original.textOnScreen}`);
    const first = generated.slides[0];
    if (!first || !source.length) throw new Error("The original cover or complete slide copy is unavailable.");
    result = { ...generated, slides: source.map((s, i) => i === 0 ? { ...first, position: 1, body: s.body || undefined } : { position: i + 1, role: i === source.length - 1 ? "cta" : "content", headline: s.title, subtitle: s.subtitle || undefined, body: s.body || undefined }) };
  }
  return result;
}

/** The rewritten caption (one text for every platform), or the original when the AI returns none. */
export function repurposeCaptions(wireCaption: unknown, original: PostCopy) {
  const text = typeof wireCaption === "string" && wireCaption.trim() ? wireCaption.trim() : original.caption;
  return text ? { instagram: text, facebook: text, tiktok: text, youtube: text } : undefined;
}

/** Format conversions also get the new format's scripting guidelines so structure truly changes. */
export function ownPostSystemPrompt(mode: RepurposeMode, fmt: string, base: string, formatGuidelines: string): string {
  if (mode !== "reformat") return base;
  return `${base}\n\nNEW FORMAT GUIDELINES (${fmt}) — target structure and length take priority over original wording and length; preserve meaning across on-screen copy and caption together:\n${formatGuidelines}`;
}
