import { readContentScript } from "./contentScriptFields";
import { normalizeFormat } from "./postMetrics";
import { carouselSlidesFromPost, serializePublishedSlides } from "./slideFields";

export type PostCopy = { caption: string; hashtags: string; transcript: string; textOnScreen: string; coverTitle: string; coverCopy: string; visualHook: string; slideCopy: string; hook: string };
export const copyText = (value: unknown): string => typeof value === "string" && value.trim() !== "—" ? value.trim() : "";
export const hashtagsFromCaption = (caption: string) => [...new Set(caption.match(/#[\p{L}\p{N}_]+/gu) || [])].join(" ");
export function readPostCopy(fields: Record<string, unknown>): PostCopy {
  const g = (key: string) => copyText(fields[key]);
  return { caption: g("Caption"), hashtags: g("Hashtags") || hashtagsFromCaption(g("Caption")), transcript: g("Transcript"), textOnScreen: g("Text on Screen"), coverTitle: g("Cover Title"), coverCopy: g("Cover Copy"), visualHook: looksLikeSceneDescription(g("Visual Hook")) ? "" : g("Visual Hook"), slideCopy: g("Slide Copy"), hook: g("Hook") };
}
export function plannerPostCopy(fields: Record<string, unknown>, platform: string, format: string): Partial<PostCopy> {
  const g = (key: string) => copyText(fields[key]);
  const caption = g(platform === "TikTok" ? "Tiktok Captions" : "IG Captions");
  const f = normalizeFormat(format);
  const parts = readContentScript(fields, format);
  const sections = { script: parts.script, visualHook: parts.visualHook };
  const coverCopy = g("Cover Copy");
  const slides = f === "Carousel" && (coverCopy || g("Slides Copy") || g("CTA Copy")) ? carouselSlidesFromPost({ coverCopy, slidesCopy: g("Slides Copy"), ctaCopy: g("CTA Copy") }) : [];
  return { caption, hashtags: hashtagsFromCaption(caption), transcript: f === "Talking Video" ? sections.script || g("Script Text") : "", textOnScreen: f === "Broll" || f === "Graphic" ? parts.textOverlay || sections.script || coverCopy : "", visualHook: g("Visual Hook") || sections.visualHook, coverCopy, coverTitle: slides[0]?.title || coverCopy.split("\n")[0]?.replace(/^Cover title:\s*/i, "") || "", slideCopy: slides.length ? serializePublishedSlides(slides) : "" };
}
/** Saved source copy wins over mined values; empty values never erase real copy. */
export function mergePostCopy(saved: PostCopy, ...sources: Partial<PostCopy>[]): PostCopy {
  const out = { ...saved };
  for (const source of sources) for (const key of Object.keys(out) as (keyof PostCopy)[]) if (!out[key] && source[key]) out[key] = copyText(source[key]);
  return out;
}
export function postCopyFields(copy: PostCopy): Record<string, string> {
  const names: Record<keyof PostCopy, string> = { caption: "Caption", hashtags: "Hashtags", transcript: "Transcript", textOnScreen: "Text on Screen", coverTitle: "Cover Title", coverCopy: "Cover Copy", visualHook: "Visual Hook", slideCopy: "Slide Copy", hook: "Hook" };
  return Object.fromEntries((Object.keys(names) as (keyof PostCopy)[]).filter((k) => copy[k]).map((k) => [names[k], copy[k]]));
}
/** True when a "visual hook" describes the scene instead of quoting on-screen text. */
export function looksLikeSceneDescription(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^visuals?:/i.test(t)) return true;
  return /\b(a|the) (woman|man|person|creator|speaker|girl|guy)\b|\b(is|are) (standing|sitting|talking|speaking|holding|walking|looking|smiling|wearing)\b|\b(camera|close-up|shot of|in front of|background)\b/i.test(t);
}

/** On-screen hook = the first text line shown in the video, never a scene description. */
export function hookFromVideoText(raw: string): { textOnScreen: string; visualHook: string } {
  const marker = raw.lastIndexOf("Visuals:");
  const text = (marker >= 0 ? raw.slice(0, marker) : raw).trim();
  const hookLine = text.match(/^\s*hook\s*:\s*(.+)$/im)?.[1]?.trim() || "";
  const body = text.replace(/^\s*hook\s*:.*$/im, "").trim();
  const lines = body.split("\n").map((l) => l.replace(/^(text on screen|on-screen text)\s*:\s*/i, "").trim()).filter((l) => l && !looksLikeSceneDescription(l));
  return { textOnScreen: body, visualHook: hookLine && !looksLikeSceneDescription(hookLine) ? hookLine : lines.join("\n") };
}
