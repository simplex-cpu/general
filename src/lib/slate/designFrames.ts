// Shared description of a design frame (a single graphic, or one carousel slide).
// The same frame objects drive the on-screen preview and the exported PNG, so
// what the client sees is what the design team receives.
import type { DesignSubtype, StructuredDesignSlide } from "./designTemplates";
import { sanitizeSlideCopy } from "./slideFields";

export type FrameBlock = {
  text: string;
  color: string;
  /** Font value as stored in the brand brief, e.g. "Poppins, weight 700". */
  font: string;
  /** Font size relative to the frame width (0-1). */
  size: number;
  lineHeight: number;
  uppercase?: boolean;
  /** Space above this block, relative to the frame width. */
  gap?: number;
  /** Letter spacing relative to the frame width. */
  tracking?: number;
  /** Maximum share of the full canvas height allocated to this text box. */
  maxHeightRatio?: number;
  maxLines?: number;
  /** Draw this short action as a compact rounded CTA pill. */
  pill?: boolean;
  /** Smallest font size relative to frame width while fitting copy. */
  minSize?: number;
  pillBackground?: string;
  /** Visual hierarchy also controls the fallback font weight. */
  role?: "title" | "subtitle" | "body";
};

export type VerticalAlign = "top" | "center" | "bottom";
export type HorizontalAlign = "left" | "center" | "right";

export type DesignFrame = {
  id: string;
  label: string;
  background: string;
  /** Second colour: when set, the background is a gradient from background to this. */
  backgroundEnd?: string;
  gradientAngle?: number;
  photoUrl?: string;
  align: HorizontalAlign;
  /** Where the copy sits vertically inside the frame. */
  verticalAlign?: VerticalAlign;
  blocks: FrameBlock[];
};

export type FrameStyle = {
  titleFont: string;
  bodyFont: string;
  subtitleFont?: string;
  coverBackground: string;
  coverBackgroundEnd?: string;
  coverGradientAngle?: number;
  slidesBackground: string;
  slidesBackgroundEnd?: string;
  slidesGradientAngle?: number;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  coverAlign?: VerticalAlign;
  slidesAlign?: VerticalAlign;
  /** Per-design override of the text alignment on every frame. */
  horizontalAlign?: HorizontalAlign;
  coverHorizontalAlign?: HorizontalAlign;
  slidesHorizontalAlign?: HorizontalAlign;
  /** Simplified brand style: closing slide reuses the cover treatment, text centered by default. */
  closingLikeCover?: boolean;
  coverInk?: string;
  /** Optional separate closing-slide surface; falls back to the cover. */
  closingBackground?: string;
  closingBackgroundEnd?: string;
  closingGradientAngle?: number;
  closingInk?: string;
};

const pickAlign = (style: FrameStyle, fallback: HorizontalAlign): HorizontalAlign =>
  style.horizontalAlign || fallback;

export function normalizeVerticalAlign(v: string | undefined, fallback: VerticalAlign): VerticalAlign {
  const t = (v || "").trim().toLowerCase();
  return t === "top" || t === "center" || t === "bottom" ? t : fallback;
}

/** CSS background value for a frame (solid colour or gradient). */
export function frameBackgroundCss(frame: DesignFrame): string {
  const end = (frame.backgroundEnd || "").trim();
  return end ? `linear-gradient(${frame.gradientAngle ?? 160}deg, ${frame.background} 0%, ${end} 100%)` : frame.background;
}

export const DEFAULT_COVER_BACKGROUND = "#1A1A1D";
export const DEFAULT_SLIDES_BACKGROUND = "#F6F6F7";
export const DEFAULT_TITLE_COLOR_ON_COVER = "#FFFFFF";
export const DEFAULT_TITLE_COLOR_ON_SLIDE = "#1A1A1D";
export const DEFAULT_SUBTITLE_COLOR = "#4F6BFF";
export const DEFAULT_TEXT_COLOR = "#1A1A1D";

export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1350;
export const SAFE_INSET = 0.1;
export const PHOTO_VEIL_OPACITY = 0.48;

export const familyOf = (v: string) => (v || "").split(",")[0].trim() || "Poppins";
export const weightOf = (v: string, fallback: number) => {
  const m = (v || "").match(/weight\s*(\d{3})/i);
  return m ? Number(m[1]) : fallback;
};

export const blockWeight = (block: FrameBlock) =>
  weightOf(block.font, block.role === "body" ? 400 : block.role === "subtitle" ? 500 : 700);

/** Conservative browser-preview fit; export repeats the fit with exact canvas metrics. */
export function fittedBlockSize(block: FrameBlock, frameWidth: number): number {
  const initial = frameWidth * block.size;
  if (!block.maxHeightRatio || !block.text.trim()) return initial;
  const availableWidth = frameWidth * (1 - SAFE_INSET * 2);
  const frameHeight = (frameWidth * FRAME_HEIGHT) / FRAME_WIDTH;
  const maxHeight = frameHeight * block.maxHeightRatio;
  const charactersPerLine = Math.max(8, Math.floor(availableWidth / (initial * 0.56)));
  const estimatedLines = block.text
    .split("\n")
    .reduce((sum, paragraph) => sum + Math.max(1, Math.ceil(paragraph.length / charactersPerLine)), 0);
  const heightScale = maxHeight / Math.max(initial * block.lineHeight * estimatedLines, 1);
  const lineScale = block.maxLines ? block.maxLines / Math.max(estimatedLines, 1) : 1;
  const minimum = frameWidth * (block.minSize ?? 0.022);
  return Math.max(minimum, Math.min(initial, initial * Math.min(1, heightScale, lineScale)));
}

/** Internal slide roles are editing metadata and must never become artwork. */
export function sanitizeArtworkText(value: string): string {
  return sanitizeSlideCopy(value);
}

/** Accepts #rgb, #rrggbb, bare hex and CSS colour names; anything else falls back. */
export function normalizeColor(value: string | undefined, fallback: string) {
  const t = (value || "").trim();
  if (!t) return fallback;
  const hex = t.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex.toUpperCase()}`;
  if (/^[0-9a-f]{3}$/i.test(hex)) return `#${hex.split("").map((c) => c + c).join("").toUpperCase()}`;
  if (/^(rgb|hsl|oklch)a?\(/i.test(t) || /^[a-z]+$/i.test(t)) return t;
  return fallback;
}

function luminance(hex: string): number | null {
  const match = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const channels = [0, 2, 4]
    .map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function readableColor(preferred: string, background: string): string {
  const fg = luminance(preferred);
  const bg = luminance(background);
  if (fg === null || bg === null) return preferred;
  const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  if (ratio >= 4.5) return preferred;
  return bg > 0.45 ? DEFAULT_TEXT_COLOR : DEFAULT_TITLE_COLOR_ON_COVER;
}

/** A single graphic: cover colours, optional photo, one block of copy. */
export function buildGraphicFrame(
  copy: string,
  style: FrameStyle,
  photoUrl?: string,
  subtype: DesignSubtype = "quote",
): DesignFrame {
  const lines = sanitizeArtworkText(copy).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const insightful = subtype === "insightful";
  const background = normalizeColor(style.coverBackground, DEFAULT_COVER_BACKGROUND);
  const photoColor = photoUrl ? DEFAULT_TITLE_COLOR_ON_COVER : undefined;
  const titleColor = readableColor(normalizeColor(style.coverInk || style.titleColor, DEFAULT_TITLE_COLOR_ON_COVER), background);
  const subtitleColor = readableColor(normalizeColor(style.coverInk || style.subtitleColor, DEFAULT_SUBTITLE_COLOR), background);
  const textColor = readableColor(normalizeColor(style.coverInk || style.textColor, DEFAULT_TEXT_COLOR), background);
  return {
    id: "graphic",
    label: "Graphic",
    background,
    backgroundEnd: (style.coverBackgroundEnd || "").trim() || undefined,
    gradientAngle: style.coverGradientAngle,
    photoUrl,
    align: pickAlign(style, style.coverHorizontalAlign || "center"),
    verticalAlign: normalizeVerticalAlign(style.coverAlign, "center"),
    blocks: insightful
      ? [
          {
            text: lines[0] || "",
            color: photoColor || titleColor,
            font: style.titleFont,
            role: "title",
            size: 0.064,
            lineHeight: 1.16,
            uppercase: true,
            maxHeightRatio: 0.2,
            maxLines: 3,
          },
          {
            text: lines[1] || "",
            color: photoColor || subtitleColor,
            font: style.subtitleFont || style.bodyFont,
            role: "subtitle",
            size: 0.038,
            lineHeight: 1.45,
            gap: 0.035,
            maxHeightRatio: 0.25,
          },
          ...(lines.length > 2 ? [{ text: lines.slice(2).join("\n"), color: photoColor || textColor, font: style.bodyFont, role: "body" as const, size: 0.038, lineHeight: 1.45, gap: 0.035, maxHeightRatio: 0.25 }] : []),
        ]
      : [{
          text: lines[0] || "",
          color: photoColor || textColor,
          font: style.bodyFont,
          role: "body",
          size: 0.052,
          lineHeight: 1.35,
          maxHeightRatio: 0.25,
        }, ...(lines.length > 1 ? [{ text: lines.slice(1).join("\n"), color: photoColor || subtitleColor, font: style.subtitleFont || style.bodyFont, role: "subtitle" as const, size: 0.032, lineHeight: 1.4, gap: 0.035, maxHeightRatio: 0.15 }] : [])],
  };
}

/**
 * Carousel frames. Slide 1 uses the cover colours and shows one big title;
 * later slides use the slides colours, with the first line as a headline and
 * the rest as body copy.
 */
export function buildCarouselFrames(
  slides: ({ copy: string; photoUrl?: string } | StructuredDesignSlide)[],
  style: FrameStyle,
  subtype: DesignSubtype = "quote",
  sharedPhotoUrl?: string,
): DesignFrame[] {
  return slides.map((slide, index) => {
    const structured = "headline" in slide;
    const role = structured ? slide.role : index === 0 ? "hook" : index === slides.length - 1 ? "cta" : "content";
    const photoUrl = sharedPhotoUrl || ("photoUrl" in slide ? slide.photoUrl : undefined);
    const isCover = role === "hook";
    const isCta = role === "cta";
    const coverLike = isCover || (isCta && !!style.closingLikeCover);
    const rawCopy = sanitizeArtworkText(structured ? [slide.headline, slide.body].filter(Boolean).join("\n") : slide.copy);
    const subtitle = structured ? sanitizeArtworkText(slide.subtitle || "") : "";
    const structuredBody = structured ? sanitizeArtworkText(slide.body || "") : "";
    const lines = rawCopy.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const white = photoUrl ? DEFAULT_TITLE_COLOR_ON_COVER : undefined;
    const closing = isCta && !!style.closingLikeCover && !!style.closingBackground;
    const surface = closing ? normalizeColor(style.closingBackground, DEFAULT_COVER_BACKGROUND) : coverLike
      ? normalizeColor(style.coverBackground, DEFAULT_COVER_BACKGROUND)
      : normalizeColor(style.slidesBackground, DEFAULT_SLIDES_BACKGROUND);
    const ink = closing && style.closingInk ? style.closingInk : coverLike && style.coverInk ? style.coverInk : "";
    const safeTitle = white || readableColor(normalizeColor(ink || style.titleColor, isCover ? DEFAULT_TITLE_COLOR_ON_COVER : DEFAULT_TITLE_COLOR_ON_SLIDE), surface);
    const safeSubtitle = white || readableColor(normalizeColor(ink || style.subtitleColor, DEFAULT_SUBTITLE_COLOR), surface);
    const safeText = white || readableColor(normalizeColor(ink || style.textColor, DEFAULT_TEXT_COLOR), surface);
    if (isCover) {
      return {
        id: `slide-1`,
        label: "Cover",
        background: normalizeColor(style.coverBackground, DEFAULT_COVER_BACKGROUND),
        backgroundEnd: (style.coverBackgroundEnd || "").trim() || undefined,
        gradientAngle: style.coverGradientAngle,
        photoUrl,
        align: pickAlign(style, style.coverHorizontalAlign || "center"),
        verticalAlign: normalizeVerticalAlign(style.coverAlign, "center"),
        blocks: [
          ...(subtitle
            ? [{ text: subtitle, color: safeSubtitle, font: style.subtitleFont || style.bodyFont, role: "subtitle" as const, size: 0.03, lineHeight: 1.2, uppercase: true, tracking: 0.006, maxHeightRatio: 0.06, maxLines: 1 }]
            : []),
          {
            gap: subtitle ? 0.03 : 0,
            text: structured ? sanitizeArtworkText(slide.headline) : lines[0] || "",
            color: safeTitle,
            font: style.titleFont,
            role: "title",
            size: 0.082,
            lineHeight: 1.14,
            uppercase: true,
            maxHeightRatio: subtype === "quote" ? 0.35 : 0.22,
            maxLines: 3,
          },
        ],
      };
    }
    const headline = lines[0] || "";
    const body = lines.slice(1).join("\n");
    const actionLabel = structured ? slide.actionLabel || "" : "";
    const blocks: FrameBlock[] = isCta ? [
      { text: headline, color: safeTitle, font: style.titleFont, role: "title", size: 0.062, minSize: 0.038, lineHeight: 1.16, maxHeightRatio: 0.2, maxLines: 3 },
      { text: body, color: safeText, font: style.bodyFont, role: "body", size: 0.036, minSize: 0.026, lineHeight: 1.42, gap: 0.035, maxHeightRatio: 0.16, maxLines: 3 },
      { text: actionLabel, color: surface, pillBackground: safeSubtitle, font: style.subtitleFont || style.bodyFont, role: "subtitle", size: 0.026, minSize: 0.022, lineHeight: 1.2, uppercase: true, tracking: 0.004, gap: 0.04, maxHeightRatio: 0.07, maxLines: 1, pill: true },
    ] : subtype === "quote" ? [
      ...(subtitle ? [{ text: subtitle, color: safeSubtitle, font: style.subtitleFont || style.bodyFont, role: "subtitle" as const, size: 0.03, lineHeight: 1.2, tracking: 0.006, maxLines: 1 }] : []),
      { text: headline, color: safeText, font: style.bodyFont, role: "body", size: 0.052, lineHeight: 1.35, gap: subtitle ? 0.03 : 0, maxHeightRatio: 0.25 },
    ] : [
      {
        text: subtitle || String(index + 1).padStart(2, "0"),
        color: safeSubtitle,
        font: style.subtitleFont || style.bodyFont,
        role: "subtitle",
        size: 0.032,
        lineHeight: 1.2,
        tracking: 0.006,
      },
      {
        text: headline,
        color: safeTitle,
        font: style.titleFont,
        role: "title",
        size: 0.064,
        lineHeight: 1.16,
        uppercase: true,
        gap: 0.035,
        maxHeightRatio: 0.2,
      },
    ];
    if (body && !isCta) {
      blocks.push({
        text: body,
        color: safeText,
        font: style.bodyFont,
        role: "body",
        size: 0.038,
        lineHeight: 1.5,
        gap: 0.035,
        maxHeightRatio: 0.25,
      });
    }
    return {
      id: `slide-${index + 1}`,
      label: `Slide ${index + 1}`,
      background: coverLike ? surface : normalizeColor(style.slidesBackground, DEFAULT_SLIDES_BACKGROUND),
      backgroundEnd: closing ? (style.closingBackgroundEnd || "").trim() || undefined : coverLike ? (style.coverBackgroundEnd || "").trim() || undefined : style.slidesBackgroundEnd,
      gradientAngle: closing ? style.closingGradientAngle : coverLike ? style.coverGradientAngle : style.slidesGradientAngle,
      photoUrl,
      align: pickAlign(style, style.slidesHorizontalAlign || (style.closingLikeCover || subtype === "quote" || isCta ? "center" : "left")),
      verticalAlign: normalizeVerticalAlign(style.slidesAlign, "center"),
      blocks,
    };
  });
}

/** Make sure the brand fonts are ready before drawing text into a canvas. */
async function ensureFonts(frames: DesignFrame[]) {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = new Set<string>();
  for (const frame of frames) {
    for (const block of frame.blocks) {
      specs.add(`${blockWeight(block)} 80px "${familyOf(block.font)}"`);
    }
  }
  await Promise.all(
    Array.from(specs).map((spec) => document.fonts.load(spec).catch(() => undefined)),
  );
  await document.fonts.ready.catch(() => undefined);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that photo."));
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const next = `${line} ${words[i]}`;
      if (ctx.measureText(next).width > maxWidth && line) {
        out.push(line);
        line = words[i];
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out;
}

/** Draw one frame at export size and return it as a PNG file. */
export async function renderFrameToFile(
  frame: DesignFrame,
  filename: string,
): Promise<File> {
  await ensureFonts([frame]);
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_WIDTH;
  canvas.height = FRAME_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot render the designs.");

  const gradientEnd = (frame.backgroundEnd || "").trim();
  if (gradientEnd) {
    const radians = (frame.gradientAngle ?? 160) * Math.PI / 180;
    const dx = Math.sin(radians), dy = -Math.cos(radians);
    const length = Math.abs(dx) * FRAME_WIDTH + Math.abs(dy) * FRAME_HEIGHT;
    const grad = ctx.createLinearGradient(FRAME_WIDTH / 2 - dx * length / 2, FRAME_HEIGHT / 2 - dy * length / 2, FRAME_WIDTH / 2 + dx * length / 2, FRAME_HEIGHT / 2 + dy * length / 2);
    grad.addColorStop(0, frame.background);
    grad.addColorStop(1, gradientEnd);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = frame.background;
  }
  ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  if (frame.photoUrl) {
    const img = await loadImage(frame.photoUrl);
    const scale = Math.max(FRAME_WIDTH / img.width, FRAME_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (FRAME_WIDTH - w) / 2, (FRAME_HEIGHT - h) / 2, w, h);
    ctx.fillStyle = `rgba(0,0,0,${PHOTO_VEIL_OPACITY})`;
    ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  }

  const padding = FRAME_WIDTH * SAFE_INSET;
  const maxWidth = FRAME_WIDTH - padding * 2;

  // Measure everything first so the block stack can be vertically centred.
  type Measured = { block: FrameBlock; lines: string[]; size: number; gap: number };
  const measured: Measured[] = [];
  for (const block of frame.blocks) {
    let size = Math.round(FRAME_WIDTH * block.size);
    const minimum = Math.round(FRAME_WIDTH * (block.minSize ?? 0.022));
    ctx.font = `${blockWeight(block)} ${size}px "${familyOf(block.font)}", sans-serif`;
    const text = block.uppercase ? (block.text || "").toUpperCase() : block.text || "";
    let lines = text.trim() ? wrap(ctx, text, maxWidth) : [];
    const maxHeight = block.maxHeightRatio ? FRAME_HEIGHT * block.maxHeightRatio : Infinity;
    while (size > minimum && (lines.length * size * block.lineHeight > maxHeight || (block.maxLines && lines.length > block.maxLines))) {
      size -= 2;
      ctx.font = `${blockWeight(block)} ${size}px "${familyOf(block.font)}", sans-serif`;
      lines = wrap(ctx, text, maxWidth);
    }
    measured.push({
      block,
      lines,
      size,
      gap: Math.round(FRAME_WIDTH * (block.gap ?? 0)),
    });
  }
  const totalHeight = measured.reduce(
    (sum, m) => sum + m.gap + m.lines.length * m.size * m.block.lineHeight,
    0,
  );

  const vAlign = frame.verticalAlign || "center";
  const startY =
    vAlign === "top"
      ? padding
      : vAlign === "bottom"
        ? FRAME_HEIGHT - padding - totalHeight
        : (FRAME_HEIGHT - totalHeight) / 2;
  let y = Math.max(padding, startY);
  ctx.textBaseline = "top";
  for (const m of measured) {
    y += m.gap;
    if (!m.lines.length) continue;
    ctx.font = `${blockWeight(m.block)} ${m.size}px "${familyOf(m.block.font)}", sans-serif`;
    ctx.fillStyle = m.block.color;
    ctx.textAlign = frame.align;
    if (m.block.tracking) ctx.letterSpacing = `${Math.round(FRAME_WIDTH * m.block.tracking)}px`;
    else ctx.letterSpacing = "0px";
    const x = frame.align === "center" ? FRAME_WIDTH / 2 : frame.align === "right" ? FRAME_WIDTH - padding : padding;
    if (m.block.pill) {
      const widest = Math.max(...m.lines.map((line) => ctx.measureText(line).width), 0);
      const pillX = frame.align === "center" ? x - widest / 2 - 28 : frame.align === "right" ? x - widest - 36 : x - 20;
      const pillY = y - 14;
      const pillWidth = widest + 56;
      const pillHeight = m.size * m.block.lineHeight + 28;
      ctx.save();
      ctx.fillStyle = m.block.pillBackground || DEFAULT_SUBTITLE_COLOR;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = m.block.color;
    }
    for (const line of m.lines) {
      ctx.fillText(line, x, y);
      y += m.size * m.block.lineHeight;
    }
  }
  ctx.letterSpacing = "0px";

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Could not export the design.");
  return new File([blob], filename, { type: "image/png" });
}

export async function renderFramesToFiles(
  frames: DesignFrame[],
  prefix: string,
): Promise<File[]> {
  await ensureFonts(frames);
  const out: File[] = [];
  for (let i = 0; i < frames.length; i++) {
    out.push(
      await renderFrameToFile(
        frames[i],
        frames.length === 1 ? `${prefix}.png` : `${prefix}-${String(i + 1).padStart(2, "0")}.png`,
      ),
    );
  }
  return out;
}
