// Refine: rewrite one piece of a post (hook, script, slide copy, CTA or caption)
// from a short instruction, leaving everything else as it is. Shared by
// /api/refine and its tests.
import type { Format, PromptKey, Prompts } from "@/lib/simplex/types";
import { ANTI_SLOP_RULES, AUDIENCE_RULE, PLACEHOLDER_RULE } from "./envelope";

export type RefinePiece = "hook" | "script" | "slides" | "cta" | "caption";
export type CaptionPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

/** One-tap changes shown as chips under a piece. */
export const REFINE_PRESETS = {
  shorter: "Make it shorter. Cut at least a third of the words, keep the point and the voice.",
  punchier: "Make it punchier. Shorter sentences, stronger verbs, the most interesting idea first.",
  moreLikeMe:
    "Make it sound more like the brand owner talking. Use the tone, phrases and examples from the brand details, and drop anything generic.",
  differentAngle:
    "Keep the same topic and promise, but come at it from a different angle: a different opening, example or reason.",
  strongerCta:
    "Make the call to action clearer and more specific: say exactly what to do and what they get.",
} as const;
export type RefinePreset = keyof typeof REFINE_PRESETS;

export const REFINE_LIMITS = { text: 6000, instruction: 500 } as const;

const PIECE_LABEL: Record<RefinePiece, string> = {
  hook: "the hook",
  script: "the script",
  slides: "the slide copy",
  cta: "the call to action",
  caption: "the caption",
};

/** The Settings prompt that holds the writing rules for this piece and format. */
export function guidelineKey(piece: RefinePiece, format: Format, platform?: CaptionPlatform): PromptKey {
  if (piece === "caption") {
    const byPlatform: Record<CaptionPlatform, PromptKey> = {
      instagram: "captionInstagram",
      facebook: "captionFacebook",
      tiktok: "captionTiktok",
      youtube: "captionYoutube",
    };
    return byPlatform[platform ?? "instagram"];
  }
  if (piece === "hook") {
    return format === "carousel" ? "hookCarousel" : format === "graphic" ? "hookGraphic" : format === "broll" ? "hookBroll" : "hookTalking";
  }
  if (piece === "cta") {
    return format === "carousel" ? "carouselCta" : format === "graphic" ? "graphicCta" : "videoOnScreenCta";
  }
  if (piece === "slides") return format === "graphic" ? "graphicCopy" : "carouselSlides";
  return format === "broll" ? "brollScript" : "talkingScriptFleshed";
}

/** A preset id becomes its instruction; anything else is the user's own words. */
export function refineInstruction(input: { preset?: string; instruction?: string }): string {
  const preset = input.preset && Object.hasOwn(REFINE_PRESETS, input.preset) ? REFINE_PRESETS[input.preset as RefinePreset] : "";
  const own = String(input.instruction || "").trim().slice(0, REFINE_LIMITS.instruction);
  return [preset, own].filter(Boolean).join("\n");
}

export function buildRefinePrompt(args: {
  piece: RefinePiece;
  format: Format;
  platform?: CaptionPlatform;
  text: string;
  instruction: string;
  brandDetails: string;
  prompts: Prompts;
}): string {
  const key = guidelineKey(args.piece, args.format, args.platform);
  const label = PIECE_LABEL[args.piece];
  return [
    `You are: a scriptwriter editing one piece of short-form social content for one specific client brand.`,
    `Your objective is: rewrite ${label} below so it follows the change requested, and change nothing the request doesn't ask for.`,
    `CHANGE REQUESTED:\n${args.instruction}`,
    `${label.toUpperCase()} AS IT IS NOW:\n${args.text}`,
    `WRITING RULES FOR THIS PIECE:\n${(args.prompts[key] || "").trim()}`,
    `GLOBAL VOICE & TONE:\n${(args.prompts.framework || "").trim()}`,
    `BRAND DETAILS:\n${args.brandDetails.trim() || "(not provided)"}`,
    AUDIENCE_RULE,
    PLACEHOLDER_RULE,
    ANTI_SLOP_RULES,
    `Return only the rewritten piece as plain text, in the same structure as the original (keep line breaks and slide markers). No preamble, no quotes, no labels, no notes.`,
  ].join("\n\n");
}

/** Strips wrapping quotes or code fences a model sometimes adds around a rewrite. */
export function cleanRefined(text: string): string {
  let t = String(text || "").trim();
  t = t.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
  if (/^".*"$/s.test(t) && !t.slice(1, -1).includes('"')) t = t.slice(1, -1).trim();
  return t;
}
