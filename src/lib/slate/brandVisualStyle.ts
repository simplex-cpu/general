import type { FrameStyle, HorizontalAlign } from "./designFrames";
import { normalizeVerticalAlign } from "./designFrames";

/** New graphic settings live together; legacy colors/vertical positions remain unchanged. */
export const GRAPHIC_STYLE_FIELD = "Graphic style preferences";
export type GraphicPreferences = {
  titleFont?: string; subtitleFont?: string; bodyFont?: string;
  coverHorizontal?: string; slidesHorizontal?: string;
  coverMode?: string; coverDirection?: string;
  slidesMode?: string; slidesEnd?: string; slidesDirection?: string;
  stillBackground?: string; stillEnd?: string; stillMode?: string; stillDirection?: string;
  stillHorizontal?: string; stillVertical?: string;
  accents?: string; backgroundStyle?: string; lightInk?: string;
  lightBg?: string; darkBg?: string; brandBg?: string; gradientOn?: string; gradientStart?: string; gradientEnd?: string; gradientAngle?: string;
  coverSurface?: string; slidesSurface?: string; closingSurface?: string; coverInk?: string; closingBg?: string; closingEnd?: string; closingInk?: string;
};
export function graphicPreferences(fields: Record<string, unknown>): GraphicPreferences {
  try {
    const value = JSON.parse(String(fields[GRAPHIC_STYLE_FIELD] || "{}"));
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "string"));
  } catch { return {}; }
}
export function horizontal(value?: string): HorizontalAlign | undefined {
  return value === "left" || value === "center" || value === "right" ? value : undefined;
}
export function gradientAngle(value?: string): number {
  const angle = Number(value || 160);
  return [0, 90, 160, 180, 270].includes(angle) ? angle : 160;
}
export function graphicFrameStyle(fields: Record<string, unknown>, still = false): FrameStyle {
  const g = graphicPreferences(fields);
  const v = (key: string) => String(fields[key] || "");
  const titleFont = g.titleFont || v("Captions style primary");
  const bodyFont = g.bodyFont || v("Captions style secondary") || titleFont;
  const legacyCoverEnd = v("Carousel Cover Background 2");
  return {
    titleFont, subtitleFont: g.subtitleFont || bodyFont, bodyFont,
    coverBackground: still ? g.stillBackground || v("Carousel Cover Background") : v("Carousel Cover Background"),
    coverBackgroundEnd: still ? (g.stillMode === "solid" ? "" : g.stillEnd || legacyCoverEnd || (g.stillMode === "gradient" ? "#4F6BFF" : "")) : g.coverMode === "solid" ? "" : legacyCoverEnd || (g.coverMode === "gradient" ? "#4F6BFF" : ""),
    coverGradientAngle: gradientAngle(still ? g.stillDirection : g.coverDirection),
    slidesBackground: v("Carousel Slides Background"),
    slidesBackgroundEnd: g.slidesMode === "gradient" ? g.slidesEnd || "#4F6BFF" : "",
    slidesGradientAngle: gradientAngle(g.slidesDirection),
    titleColor: v("Carousel Title Color"), subtitleColor: v("Carousel Slides Subtitle Color"), textColor: v("Carousel Slides Text Color"),
    coverAlign: normalizeVerticalAlign(still ? g.stillVertical || v("Carousel Cover Text Align") : v("Carousel Cover Text Align"), "center"),
    slidesAlign: normalizeVerticalAlign(v("Carousel Slides Text Align"), "center"),
    coverHorizontalAlign: horizontal(still ? g.stillHorizontal : g.coverHorizontal),
    slidesHorizontalAlign: horizontal(g.slidesHorizontal),
    ...(g.backgroundStyle ? { closingLikeCover: true, coverInk: g.coverInk || v("Font color (Primary)") || DEFAULT_FOOTAGE_INK } : {}),
    ...(g.closingBg ? { closingBackground: g.closingBg, closingBackgroundEnd: g.closingEnd || "", closingGradientAngle: gradientAngle(g.gradientAngle), closingInk: g.closingInk || "" } : {}),
  };
}
/** Simplified brand style answers; mapped onto the existing per-element fields. */
export type BackgroundStyle = "dark" | "gradient";
export type SimpleStyle = { titleFont: string; subtitleFont: string; bodyFont: string; footageInk: string; lightInk: string; accents: string[]; backgroundStyle: BackgroundStyle; lightBg: string; darkBg: string; brandBg: string; gradient: { on: boolean; start: string; end: string; angle: number }; cover?: Surface; slides?: Surface; closing?: Surface };
export type Surface = "light" | "dark" | "brand" | "gradient";
export const SURFACES: Surface[] = ["light", "dark", "brand", "gradient"];
const surface = (v: unknown, fb: Surface): Surface => (SURFACES as unknown[]).includes(v) ? v as Surface : fb;
export const DEFAULT_FOOTAGE_INK = "#FFFFFF";
export const DEFAULT_LIGHT_INK = "#000000";
const DARK_BG = "#1A1A1D", LIGHT_BG = "#FFFFFF";
function darken(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return DARK_BG;
  const n = parseInt(m[1], 16);
  const c = (s: number) => Math.round(((n >> s) & 255) * 0.45).toString(16).padStart(2, "0");
  return `#${c(16)}${c(8)}${c(0)}`.toUpperCase();
}
export function readSimpleStyle(fields: Record<string, unknown>): SimpleStyle {
  const g = graphicPreferences(fields);
  const v = (key: string) => String(fields[key] || "");
  let accents: string[] = [];
  try { const a = JSON.parse(g.accents || "[]"); if (Array.isArray(a)) accents = a.filter((x): x is string => typeof x === "string").slice(0, 3); } catch { /* ignore */ }
  const bs = g.backgroundStyle;
  const titleFont = g.titleFont || v("Captions style primary");
  const bodyFont = g.bodyFont || v("Captions style secondary") || titleFont;
  return {
    titleFont, subtitleFont: g.subtitleFont || bodyFont, bodyFont,
    footageInk: v("Font color (Primary)") || DEFAULT_FOOTAGE_INK,
    lightInk: g.lightInk || DEFAULT_LIGHT_INK,
    accents,
    backgroundStyle: bs === "gradient" ? "gradient" : "dark",
    lightBg: g.lightBg || v("Carousel Slides Background") || LIGHT_BG,
    darkBg: g.darkBg || DARK_BG,
    brandBg: g.brandBg || accents[0] || "#4F6BFF",
    gradient: { on: g.gradientOn ? g.gradientOn === "1" : bs === "gradient", start: g.gradientStart || accents[0] || "#4F6BFF", end: g.gradientEnd || accents[1] || darken(accents[0] || "#4F6BFF"), angle: gradientAngle(g.gradientAngle || g.coverDirection) },
    cover: surface(g.coverSurface, bs === "gradient" ? "gradient" : "dark"),
    slides: surface(g.slidesSurface, "light"),
    closing: surface(g.closingSurface, surface(g.coverSurface, bs === "gradient" ? "gradient" : "dark")),
  };
}
export function simpleStyleToFields(fields: Record<string, unknown>, s: SimpleStyle): Record<string, string> {
  const g = graphicPreferences(fields);
  const accents = s.accents.filter(Boolean).slice(0, 3);
  const a1 = accents[0] || "#4F6BFF";
  const gradient = s.gradient ? s.gradient.on : s.backgroundStyle === "gradient";
  const darkBg = s.darkBg || DARK_BG, lightBg = s.lightBg || LIGHT_BG, brandBg = s.brandBg || a1;
  const angle = String(s.gradient?.angle ?? 160);
  const gStart = s.gradient?.start || a1, gEnd = s.gradient?.end || accents[1] || darken(a1);
  const resolve = (k: Surface) => k === "gradient" ? { bg: gStart, end: gEnd, ink: s.footageInk } : k === "light" ? { bg: lightBg, end: "", ink: s.lightInk } : { bg: k === "brand" ? brandBg : darkBg, end: "", ink: s.footageInk };
  const coverK = s.cover || (gradient ? "gradient" : "dark"), slidesK = s.slides || "light", closingK = s.closing || coverK;
  const C = resolve(coverK), S = resolve(slidesK), L = resolve(closingK);
  const cover = C.bg, end = C.end;
  const mode = end ? "gradient" : "solid";
  const prefs: GraphicPreferences = { ...g, titleFont: s.titleFont, subtitleFont: s.subtitleFont, bodyFont: s.bodyFont, accents: JSON.stringify(accents), backgroundStyle: gradient ? "gradient" : "dark", lightInk: s.lightInk, lightBg, darkBg, brandBg, gradientOn: gradient ? "1" : "0", gradientStart: s.gradient?.start || a1, gradientEnd: s.gradient?.end || "", gradientAngle: angle, coverDirection: angle, stillDirection: angle, coverMode: mode, coverHorizontal: "center", coverSurface: coverK, slidesSurface: slidesK, closingSurface: closingK, coverInk: C.ink, closingBg: L.bg, closingEnd: L.end, closingInk: L.ink, slidesMode: S.end ? "gradient" : "solid", slidesEnd: S.end, slidesDirection: angle, slidesHorizontal: "center", stillBackground: cover, stillEnd: end, stillMode: mode, stillHorizontal: "center", stillVertical: "center" };
  return {
    "Captions style primary": s.titleFont, "Captions style secondary": s.bodyFont,
    "Font color (Primary)": s.footageInk, "Font color (Secondary)": s.footageInk,
    "Font background Color (Primary)": "transparent", "Font background Color (Secondary)": "transparent",
    "Carousel Cover Background": cover, "Carousel Cover Background 2": end, "Carousel Slides Background": S.bg,
    "Carousel Title Color": S.ink, "Carousel Slides Subtitle Color": S.ink, "Carousel Slides Text Color": S.ink,
    "Carousel Cover Text Align": "center", "Carousel Slides Text Align": "center",
    [GRAPHIC_STYLE_FIELD]: JSON.stringify(prefs),
  };
}
