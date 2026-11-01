// One ordered list of copy fields per format, shared by post rows, repurpose prompts and results.
import { normalizeFormat } from "./postMetrics";
import type { PostCopy } from "./postCopy";
import type { ScriptDoc } from "./scriptChat";
import { parsePublishedSlides } from "./slideFields";

export type FieldKind = "carousel" | "graphic" | "talkingVideo" | "broll";
export type CopySection = { label: string; text?: string; items?: { title: string; text: string }[] };

export function fieldKind(format: string): FieldKind {
  if (/^(talkingVideo|broll|carousel|graphic)$/.test(format)) return format as FieldKind;
  if (format === "story") return "broll";
  const f = normalizeFormat(format);
  return f === "Talking Video" ? "talkingVideo" : f === "Carousel" ? "carousel" : f === "Graphic" ? "graphic" : "broll";
}

/** Field labels in the exact order each format shows them. */
export const FIELD_ORDER: Record<FieldKind, string[]> = {
  graphic: ["Slide copy", "Captions and hashtags"],
  carousel: ["Cover title", "Slides copy", "Captions and hashtags"],
  talkingVideo: ["Visual hook", "Transcript", "Captions and hashtags"],
  broll: ["Text on screen", "Captions and hashtags"],
};

/** The visual hook is short on-screen text, shown on one line. */
export const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

const captionText = (caption: string, hashtags: string) => [caption, hashtags && !caption.includes(hashtags) ? hashtags : ""].filter(Boolean).join("\n\n");

function slideItems(slideCopy: string) {
  return parsePublishedSlides(slideCopy).map((s, i) => ({ title: `Slide ${i + 1}`, text: [s.title, s.subtitle, s.body].filter(Boolean).join("\n") }));
}

export function sectionsFromPostCopy(format: string, c: PostCopy): CopySection[] {
  const kind = fieldKind(format);
  const caption = { label: "Captions and hashtags", text: captionText(c.caption, c.hashtags) };
  if (kind === "graphic") return [{ label: "Slide copy", text: c.textOnScreen || slideItems(c.slideCopy).map((s) => s.text).join("\n\n") || c.coverCopy }, caption];
  if (kind === "carousel") {
    const items = slideItems(c.slideCopy);
    return [{ label: "Cover title", text: oneLine(c.coverTitle || items[0]?.text.split("\n")[0] || "") }, { label: "Slides copy", items }, caption];
  }
  if (kind === "talkingVideo") return [{ label: "Visual hook", text: (c.visualHook || c.hook).trim() }, { label: "Transcript", text: c.transcript }, caption];
  return [{ label: "Text on screen", text: c.textOnScreen }, caption];
}

export function sectionsFromScript(target: string, s: ScriptDoc): CopySection[] {
  const kind = fieldKind(target);
  const cap = s.captions ? Object.values(s.captions).find(Boolean) || "" : "";
  const caption = { label: "Captions and hashtags", text: cap };
  if (s.kind === "carousel") {
    const items = s.slides.map((sl, i) => ({ title: `Slide ${i + 1}`, text: [sl.headline, sl.subtitle, sl.body, sl.actionLabel].filter(Boolean).join("\n") }));
    if (kind === "graphic") return [{ label: "Slide copy", text: items.map((i) => i.text).join("\n\n") }, caption];
    return [{ label: "Cover title", text: oneLine(s.slides[0]?.headline || "") }, { label: "Slides copy", items }, caption];
  }
  if (kind === "talkingVideo") return [{ label: "Visual hook", text: (s.visualHook || "").trim() }, { label: "Transcript", text: s.script }, caption];
  return [{ label: "Text on screen", text: s.script }, caption];
}

/** Prompt block listing only the source format's fields. */
export function sourceFieldsPrompt(format: string, c: PostCopy): string {
  return sectionsFromPostCopy(format, c).map((sec) => `${sec.label}:\n${sec.items ? sec.items.map((i) => `${i.title}\n${i.text}`).join("\n\n") : sec.text || ""}`).join("\n\n");
}
