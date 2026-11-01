// Editorial AI slide designs: Claude writes one SVG per slide; these rules
// decide whether a design is safe and on-brand enough to show and export.
import { FRAME_HEIGHT, FRAME_WIDTH, SAFE_INSET, type DesignFrame } from "./designFrames";

export type AiDesignSlide = { svg: string | null; error?: string };

const NEUTRALS = ["#ffffff", "#000000", "#fff", "#000", "none", "transparent", "currentcolor"];

/** Every colour a frame is allowed to use: its background(s), its text colours and any pill. */
export function framePalette(frames: DesignFrame[], accents: string[] = []) {
  const set = new Set<string>(NEUTRALS);
  const add = (c?: string) => { if (c && /^#[0-9a-f]{3,8}$/i.test(c.trim())) set.add(expand(c.trim().toLowerCase())); };
  for (const f of frames) {
    add(f.background); add(f.backgroundEnd);
    for (const b of f.blocks) { add(b.color); add(b.pillBackground); }
  }
  accents.forEach(add);
  return [...set];
}

const expand = (hex: string) =>
  /^#[0-9a-f]{3}$/i.test(hex) ? `#${hex.slice(1).split("").map((c) => c + c).join("")}` : hex.slice(0, 7);

/**
 * Strip anything active or external and check palette and canvas. Returns the
 * cleaned SVG or the reasons it was rejected (used for the one redesign).
 */
const words = (t: string) => (t.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []);
/** Most extra words tiny editorial labels (counter, brand name, section label) may add per slide. */
export const MICRO_COPY_WORDS = 4;

export function validateDesignSvg(raw: string, palette: string[], copy?: string, photoCount = 0): { ok: boolean; svg: string; problems: string[] } {
  const problems: string[] = [];
  const match = /<svg[\s\S]*<\/svg>/i.exec(raw || "");
  if (!match) return { ok: false, svg: "", problems: ["No <svg> element was returned."] };
  let svg = match[0];
  if (/<(script|foreignObject|iframe|use|a)\b/i.test(svg)) problems.push("Uses a disallowed element (script, foreignObject, use or link).");
  // Images are allowed only as provided photo slots (photo:1..N); anything else is rejected.
  for (const m of svg.matchAll(/<image\b[^>]*>/gi)) {
    const href = /(?:xlink:)?href\s*=\s*["']([^"']*)["']/i.exec(m[0])?.[1] || "";
    const n = /^photo:(\d+)$/.exec(href)?.[1];
    if (!n || Number(n) < 1 || Number(n) > photoCount) problems.push(photoCount ? "Images may only use the provided photo slots." : "Uses an image, but no photo was provided.");
  }
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi, (m, _a, v) => (/^["']photo:\d+["']$/.test(v) ? `href=${v.replace(/'/g, '"')}` : ""))
    .replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, "none")
    .replace(/@import[^;]*;/gi, "");
  if (!/viewBox\s*=\s*["']0 0 1080 1350["']/i.test(svg)) problems.push('The canvas must be viewBox="0 0 1080 1350".');
  const allowed = new Set(palette.map((c) => c.toLowerCase()));
  const used = new Set<string>();
  for (const m of svg.matchAll(/#[0-9a-f]{3,8}\b/gi)) used.add(expand(m[0].toLowerCase()));
  const off = [...used].filter((c) => !allowed.has(c));
  if (off.length) problems.push(`Uses colours outside the brand palette: ${off.slice(0, 5).join(", ")}.`);
  if (copy !== undefined) {
    // Charts may repeat numbers; tiny editorial labels (≤22px) may add up to MICRO_COPY_WORDS words.
    const allowedWords = new Set(words(copy));
    const decode = (t: string) => t.replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
    const extra: string[] = [];
    let micro = 0;
    for (const m of svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi)) {
      const size = Number(/font-size\s*[=:]\s*["']?\s*(\d+(?:\.\d+)?)/i.exec(m[1])?.[1] || 99);
      const novel = words(decode(m[2])).filter((w) => !allowedWords.has(w) && !/^\d+$/.test(w));
      if (size <= 22 && micro + novel.length <= MICRO_COPY_WORDS) micro += novel.length;
      else extra.push(...novel);
    }
    const unique = [...new Set(extra)];
    if (unique.length) problems.push(`Adds words that aren't in the slide copy: ${unique.slice(0, 8).join(", ")}. Use the copy exactly (only tiny labels may add up to ${MICRO_COPY_WORDS} words).`);
  }
  if (/rgb\(|hsl\(/i.test(svg)) problems.push("Colours must be written as hex values from the palette.");
  return { ok: problems.length === 0, svg, problems };
}

/**
 * Removes text elements that add words outside the slide copy (beyond tiny labels).
 * Closing slides often gain an invented "Follow"/"Save this" line; dropping it keeps the
 * designed slide instead of falling back to the plain template.
 */
export function dropInventedText(svg: string, copy: string): string {
  const allowedWords = new Set(words(copy));
  let micro = 0;
  return svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (all, attrs: string, inner: string) => {
    const size = Number(/font-size\s*[=:]\s*["']?\s*(\d+(?:\.\d+)?)/i.exec(attrs)?.[1] || 99);
    const novel = words(inner.replace(/<[^>]+>/g, " ")).filter((w) => !allowedWords.has(w) && !/^\d+$/.test(w));
    if (!novel.length) return all;
    if (size <= 22 && micro + novel.length <= MICRO_COPY_WORDS) { micro += novel.length; return all; }
    return "";
  });
}

/**
 * Premium-design checks: the brand accent must appear, at least three text
 * sizes, and at least one graphic element beyond plain lines.
 */
export function checkDesignQuality(svg: string, accents: string[], gradient?: string[]): string[] {
  const problems: string[] = [];
  const acc = accents.map((a) => expand(a.trim().toLowerCase())).filter((a) => /^#[0-9a-f]{6}$/.test(a));
  const used = new Set([...svg.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => expand(m[0].toLowerCase())));
  const grad = (gradient || []).map((g) => expand(g.trim().toLowerCase())).filter((g) => /^#[0-9a-f]{6}$/.test(g));
  const stops = new Set([...svg.matchAll(/<stop\b[^>]*stop-color\s*=\s*["'](#[0-9a-f]{3,8})["']/gi)].map((m) => expand(m[1].toLowerCase())));
  const gradientUsed = grad.length === 2 && grad.every((g) => stops.has(g));
  const accentUsed = acc.some((a) => used.has(a) && !(grad.includes(a) && gradientUsed && !svg.replace(/<linearGradient[\s\S]*?<\/linearGradient>/gi, "").toLowerCase().includes(a)));
  if (acc.length && !accentUsed && !gradientUsed) problems.push(`The brand highlight is never used. Highlight one key word with the accent (${acc[0]})${grad.length === 2 ? " or the brand gradient" : ""}.`);
  if (accentUsed && gradientUsed && !grad.some((g) => acc.includes(g))) problems.push("Uses both the accent and the gradient. Pick one highlight for this slide.");
  const sizes = new Set([...svg.matchAll(/font-size\s*[=:]\s*["']?\s*(\d+(?:\.\d+)?)/gi)].map((m) => Math.round(Number(m[1]))));
  if (sizes.size < 3) problems.push("Use at least three clearly different text sizes, with one oversized key phrase.");
  const body = svg.replace(/<rect\b[^>]*width\s*=\s*["']1080["'][^>]*height\s*=\s*["']1350["'][^>]*>/gi, "");
  if (!/<(rect|circle|ellipse|polygon|path)\b/i.test(body)) problems.push("Only text and lines: add a graphic element (accent block, card, icon, numbered marker or chart).");
  return problems;
}

/** Puts the brand background (solid or gradient) underneath an AI design. */
export function withBrandBackground(svg: string, frame: Pick<DesignFrame, "background" | "backgroundEnd" | "gradientAngle">): string {
  const end = (frame.backgroundEnd || "").trim();
  const id = "brandbg";
  const angle = ((frame.gradientAngle ?? 160) - 90) * (Math.PI / 180);
  const x = Math.cos(angle) / 2, y = Math.sin(angle) / 2;
  const defs = end
    ? `<defs><linearGradient id="${id}" x1="${0.5 - x}" y1="${0.5 - y}" x2="${0.5 + x}" y2="${0.5 + y}"><stop offset="0" stop-color="${frame.background}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs>`
    : "";
  const rect = `<rect x="0" y="0" width="1080" height="1350" fill="${end ? `url(#${id})` : frame.background}"/>`;
  return svg.replace(/<svg\b[^>]*>/i, (open) => `${open}${defs}${rect}`);
}

/** The safe area every text box must stay inside. */
export const SAFE_BOX = {
  left: FRAME_WIDTH * SAFE_INSET * 0.6,
  top: FRAME_HEIGHT * SAFE_INSET * 0.5,
  right: FRAME_WIDTH - FRAME_WIDTH * SAFE_INSET * 0.6,
  bottom: FRAME_HEIGHT - FRAME_HEIGHT * SAFE_INSET * 0.5,
};

export function boxesInsideSafeArea(boxes: { x: number; y: number; width: number; height: number }[]) {
  return boxes.every((b) => b.x >= SAFE_BOX.left - 1 && b.y >= SAFE_BOX.top - 1 && b.x + b.width <= SAFE_BOX.right + 1 && b.y + b.height <= SAFE_BOX.bottom + 1);
}
