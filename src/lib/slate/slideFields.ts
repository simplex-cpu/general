// Carousel copy as labeled fields per slide (Title / Subtitle / Body, and for the
// last slide Closing statement / Invitation / CTA button). Roles come from the
// slide position only and are never written into the copy or the artwork.
import type { StructuredDesignSlide } from "./designTemplates";

export type SlideFields = { title: string; subtitle: string; body: string };

export const emptySlideFields = (): SlideFields => ({ title: "", subtitle: "", body: "" });

/** Published source copy retains every visible block, including any body on slide one. */
export function serializePublishedSlides(slides: SlideFields[]): string {
  return slides.map((s, i) => `Slide ${i + 1}\n${[s.title && `Title: ${s.title}`, s.subtitle && `Subtitle: ${s.subtitle}`, s.body && `Body: ${s.body}`].filter(Boolean).join("\n")}`).join("\n\n");
}
export function parsePublishedSlides(text: string): SlideFields[] {
  return splitBlocks(text).map((block) => parseSlideBlock(block, "content"));
}

export type SlideKind = "cover" | "content" | "cta";

export const slideKind = (index: number, total: number): SlideKind =>
  index === 0 ? "cover" : index === total - 1 ? "cta" : "content";

/** Cover copy is title + optional label only; body belongs to later slides. */
export const slideFieldOrder = (kind: SlideKind): (keyof SlideFields)[] =>
  kind === "cover" ? ["title", "subtitle"] : kind === "cta" ? ["title", "body", "subtitle"] : ["title", "subtitle", "body"];

/** Visible field labels for each slide kind. */
export const FIELD_LABELS: Record<SlideKind, Record<keyof SlideFields, string>> = {
  cover: { title: "Cover title", subtitle: "Cover label", body: "Cover body" },
  content: { title: "Title", subtitle: "Subtitle", body: "Body" },
  cta: { title: "Closing statement", subtitle: "CTA button", body: "Invitation" },
};

const ROLE_TAG = /\s*(?:·|\[|\(|-)\s*(?:hook|content|cta|cover)\s*\]?\)?\s*$/i;
const STRUCTURAL_LINE = /^(hook|content|title|subtitle|body|cta|cover)(?:\s*[:\-])?$/i;
const SLIDE_PREFIX = /^\s*slide\s*\d+(?:(?:\s*(?:·|-|:|\[|\()\s*|\s+)(?:hook|content|cta|cover)\s*\]?\)?)?\s*(?:[:\-]\s*)?/i;
const SLIDE_HEADING = /^\s*(?:slide\s*\d+|cover)(?:(?:\s*(?:·|-|:|\[|\()\s*|\s+)(?:hook|content|cta|cover)\s*\]?\)?)?\s*(?::\s*(.*))?$/i;
const LABELED = /^(cover title|cover label|cover body|closing statement|invitation|cta button|title|subtitle|body)\s*:\s*(.*)$/i;

const KEY_FOR_LABEL: Record<string, keyof SlideFields> = {
  "cover title": "title",
  title: "title",
  "closing statement": "title",
  "cover label": "subtitle",
  subtitle: "subtitle",
  "cta button": "subtitle",
  "cover body": "body",
  body: "body",
  invitation: "body",
};

/** Read one slide's text (labeled or old free-text) into fields. */
export function parseSlideBlock(text: string, kind: SlideKind): SlideFields {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.replace(SLIDE_PREFIX, "").replace(ROLE_TAG, "").trim())
    .filter((l) => l && !STRUCTURAL_LINE.test(l));
  const out = emptySlideFields();
  const loose: string[] = [];
  let lastKey: keyof SlideFields | null = null;
  for (const line of lines) {
    const m = LABELED.exec(line);
    if (m) {
      lastKey = KEY_FOR_LABEL[m[1].toLowerCase()];
      out[lastKey] = [out[lastKey], m[2].trim()].filter(Boolean).join("\n");
    } else if (lastKey) {
      out[lastKey] = [out[lastKey], line].filter(Boolean).join("\n");
    } else {
      loose.push(line);
    }
  }
  if (loose.length && !out.title) {
    out.title = loose[0] || "";
    const rest = loose.slice(1);
    if (kind === "cta" && !out.subtitle && rest.length) {
      out.subtitle = rest[rest.length - 1];
      if (!out.body) out.body = rest.slice(0, -1).join("\n");
    } else if (!out.body) {
      out.body = rest.join("\n");
    }
  }
  if (kind === "cover") out.body = "";
  return out;
}

/** Remove slide numbers and internal role words before copy reaches a field or artwork. */
export function sanitizeSlideCopy(value: string): string {
  return String(value || "")
    .split("\n")
    .map((line) => line.replace(SLIDE_PREFIX, "").replace(ROLE_TAG, "").trim())
    .filter((line) => line && !STRUCTURAL_LINE.test(line))
    .join("\n")
    .trim();
}

/** Split a "Slide N" text into blocks, dropping headings and role tags. */
function splitBlocks(text: string): string[] {
  const src = String(text || "").trim();
  if (!src) return [];
  const lines = src.split("\n");
  const hasHeadings = lines.some((line) => SLIDE_HEADING.test(line));
  if (hasHeadings) {
    const blocks: string[] = [];
    let current: string[] = [];
    for (const line of lines) {
      const marker = SLIDE_HEADING.exec(line);
      if (marker) {
        if (current.some((part) => part.trim())) blocks.push(current.join("\n").trim());
        current = marker[1]?.trim() ? [marker[1].trim()] : [];
      } else {
        current.push(line);
      }
    }
    if (current.some((part) => part.trim())) blocks.push(current.join("\n").trim());
    return blocks;
  }
  return src.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
}

/** Load a post's saved carousel copy into a fixed number of slides. */
export function parseCarouselCopy(
  parts: { coverCopy?: string; slidesCopy?: string; ctaCopy?: string },
  count: number,
): SlideFields[] {
  const middle = splitBlocks(parts.slidesCopy || "");
  const blocks = [parts.coverCopy || "", ...middle, parts.ctaCopy || ""];
  // When only one combined field is filled, fall back to its blocks.
  const usable = (parts.coverCopy || parts.ctaCopy) ? blocks : middle;
  const out: SlideFields[] = [];
  for (let i = 0; i < count; i++) {
    const kind = slideKind(i, count);
    const src = kind === "cta" ? (usable === blocks ? blocks[blocks.length - 1] : usable[i]) : usable[i];
    out.push(parseSlideBlock((src || "").replace(ROLE_TAG, ""), kind));
  }
  return out;
}

/** Labeled text for one slide, stored in Airtable. */
export function serializeSlide(fields: SlideFields, kind: SlideKind): string {
  const labels = FIELD_LABELS[kind];
  const order = slideFieldOrder(kind);
  return order
    .filter((k) => fields[k].trim())
    .map((k) => `${labels[k]}: ${fields[k].trim()}`)
    .join("\n");
}

/** Cover / middle slides / CTA as the three copy fields on the post. */
export function serializeCarouselCopy(slides: SlideFields[]): { coverCopy: string; slidesCopy: string; ctaCopy: string } {
  const total = slides.length;
  return {
    coverCopy: total ? serializeSlide(slides[0], "cover") : "",
    ctaCopy: total > 1 ? serializeSlide(slides[total - 1], "cta") : "",
    slidesCopy: slides
      .slice(1, -1)
      .map((s, i) => {
        const text = serializeSlide(s, "content");
        return text ? `Slide ${i + 2}\n${text}` : "";
      })
      .filter(Boolean)
      .join("\n\n"),
  };
}

/** One editable document containing every slide while preserving field labels. */
export function serializeCarouselDocument(slides: SlideFields[]): string {
  return slides
    .map((slide, index) => {
      const kind = slideKind(index, slides.length);
      const copy = serializeSlide(slide, kind);
      return copy ? `${kind === "cover" ? "Cover" : `Slide ${index + 1}`}\n${copy}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Parse a complete editable slide document using one fixed slide count. */
export function parseCarouselDocument(text: string, count: number): SlideFields[] {
  return parseCarouselCopy({ slidesCopy: text }, count);
}

/** Fields → the structured slide model the renderer draws. */
export function fieldsToStructured(slides: SlideFields[]): StructuredDesignSlide[] {
  const total = slides.length;
  return slides.map((s, i) => {
    const kind = slideKind(i, total);
    if (kind === "cta") {
      return { position: i + 1, role: "cta", headline: s.title, body: s.body || undefined, actionLabel: s.subtitle || undefined };
    }
    return {
      position: i + 1,
      role: kind === "cover" ? "hook" : "content",
      headline: s.title,
      subtitle: s.subtitle || undefined,
      ...(kind !== "cover" ? { body: s.body || undefined } : {}),
    };
  });
}

export const slideHasCopy = (s: SlideFields) => !!(s.title.trim() || s.subtitle.trim() || s.body.trim());

/** Every slide of a saved carousel, sized from what was actually saved (at least cover + closing). */
export function carouselSlidesFromPost(parts: { coverCopy?: string; slidesCopy?: string; ctaCopy?: string }): SlideFields[] {
  const middle = splitBlocks(parts.slidesCopy || "");
  const hasEnds = Boolean(parts.coverCopy || parts.ctaCopy);
  const count = Math.max(2, hasEnds ? middle.length + 2 : middle.length);
  return parseCarouselCopy(parts, count);
}
