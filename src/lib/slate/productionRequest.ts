import { SOCIAL_SIZES } from "./socialSizes";
import type { PhonePreviewStyle } from "@/components/slate/StylePhonePreview";
import { splitColor } from "./videoProduction";
import type { FrameStyle } from "./designFrames";

export type ProductionStyle = "BROLL" | "Talking Video" | "Graphic" | "Carousel";

export const EDIT_REQUEST_FIELDS = {
  requestId: "Request ID",
  brands: "Brands",
  brandBrief: "Brand brief",
  originalRequest: "Original request",
  instructions: "Production instructions",
  preferences: "Editing preferences",
  styleSample: "Style sample enabled",
  hookFont: "Hook font",
  hookColor: "Hook text color",
  hookBacking: "Hook backing color",
  hookOpacity: "Hook backing opacity",
  captionFont: "Caption font",
  captionColor: "Caption text color",
  captionBacking: "Caption backing color",
  captionOpacity: "Caption backing opacity",
  textPosition: "Text position",
  styleSnapshot: "Style snapshot",
} as const;

export type EditingPreferences =
  | {
      font_family: string;
      font_weight: number;
      font_size: number;
      text_color: string;
      background_color: string;
      background_opacity: number;
    }
  | {
      hook: {
        font_family: string;
        font_weight: number;
        font_size: number;
        text_color: string;
        background_color: string;
        background_opacity: number;
      };
      captions: {
        font_family: string;
        font_weight: number;
        font_size: number;
        text_color: string;
        background_color: string;
        background_opacity: number;
      };
    };

type PreferenceStyle = {
  font_family: string;
  font_weight: number;
  font_size: number;
  text_color: string;
  background_color: string;
  background_opacity: number;
};

function fontParts(value: string, fallbackWeight: number) {
  const raw = String(value || "").trim();
  const weight = Number(raw.match(/weight\s*(\d{3})/i)?.[1] || fallbackWeight);
  return {
    font_family: raw.split(",")[0]?.trim() || "Open Sans",
    font_weight: Math.max(100, Math.min(900, Math.round(weight / 100) * 100)),
  };
}

function preferenceStyle(
  font: string,
  color: string,
  backing: string,
  fontSize: number,
) {
  const bg = splitColor(backing);
  const text = splitColor(color);
  return {
    ...fontParts(font, 700),
    font_size: Math.max(1, Math.min(20, fontSize)),
    text_color: text.hex.toUpperCase(),
    background_color: bg.opacity === 0 ? "none" : bg.hex.toUpperCase(),
    background_opacity: bg.opacity,
  };
}

export function editingPreferences(
  style: PhonePreviewStyle,
  talking: boolean,
): EditingPreferences {
  if (!talking) {
    return preferenceStyle(style.captionFont, style.captionColor, style.captionBacking, 6);
  }
  return {
    hook: preferenceStyle(style.hookFont, style.hookColor, style.hookBacking, 8),
    captions: preferenceStyle(
      style.captionFont,
      style.captionColor,
      style.captionBacking,
      5,
    ),
  };
}

const REQUEST_STYLE_FIELD_NAMES: ReadonlySet<string> = new Set([
  EDIT_REQUEST_FIELDS.preferences,
  EDIT_REQUEST_FIELDS.styleSample,
  EDIT_REQUEST_FIELDS.hookFont,
  EDIT_REQUEST_FIELDS.hookColor,
  EDIT_REQUEST_FIELDS.hookBacking,
  EDIT_REQUEST_FIELDS.hookOpacity,
  EDIT_REQUEST_FIELDS.captionFont,
  EDIT_REQUEST_FIELDS.captionColor,
  EDIT_REQUEST_FIELDS.captionBacking,
  EDIT_REQUEST_FIELDS.captionOpacity,
  EDIT_REQUEST_FIELDS.textPosition,
  EDIT_REQUEST_FIELDS.styleSnapshot,
]);

export function safeRequestStyleFields(
  input: unknown,
  style: ProductionStyle,
): Record<string, string | number | boolean> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!REQUEST_STYLE_FIELD_NAMES.has(key)) continue;
    if (!["string", "number", "boolean"].includes(typeof value)) continue;
    safe[key] = value as string | number | boolean;
  }
  const raw = safe[EDIT_REQUEST_FIELDS.preferences];
  if (typeof raw !== "string") {
    if (style === "BROLL" || style === "Talking Video") {
      throw new Error("Editing preferences are required for video requests.");
    }
    return safe;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Editing preferences must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Editing preferences must be an object.");
  }
  const object = parsed as Record<string, unknown>;
  const talking = style === "Talking Video";
  if (talking && (!object.hook || !object.captions)) {
    throw new Error("Talking Video preferences require separate hook and captions settings.");
  }
  if (!talking && style === "BROLL" && (object.hook || object.captions)) {
    throw new Error("BROLL editing preferences must use the flat format.");
  }
  const validatePreference = (value: unknown, label: string) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`${label} preferences must be an object.`);
    }
    const item = value as Partial<PreferenceStyle>;
    if (!String(item.font_family || "").trim()) throw new Error(`${label} font family is required.`);
    if (!Number.isInteger(item.font_weight) || Number(item.font_weight) < 100 || Number(item.font_weight) > 900 || Number(item.font_weight) % 100 !== 0) {
      throw new Error(`${label} font weight must be 100–900 in steps of 100.`);
    }
    if (typeof item.font_size !== "number" || !Number.isFinite(item.font_size) || item.font_size < 1 || item.font_size > 20) {
      throw new Error(`${label} font size must be between 1 and 20.`);
    }
    if (!/^#[0-9A-F]{6}$/i.test(String(item.text_color || ""))) {
      throw new Error(`${label} text color must use #RRGGBB.`);
    }
    if (item.background_color !== "none" && !/^#[0-9A-F]{6}$/i.test(String(item.background_color || ""))) {
      throw new Error(`${label} background color must use #RRGGBB or none.`);
    }
    if (typeof item.background_opacity !== "number" || !Number.isFinite(item.background_opacity) || item.background_opacity < 0 || item.background_opacity > 100) {
      throw new Error(`${label} background opacity must be between 0 and 100.`);
    }
  };
  if (talking) {
    validatePreference(object.hook, "Hook");
    validatePreference(object.captions, "Captions");
  } else if (style === "BROLL") {
    validatePreference(object, "Text overlay");
  }
  return safe;
}

export function initialRequestStatus(style: ProductionStyle) {
  return style === "Graphic" || style === "Carousel" ? "To Design" : "To Edit";
}

export function workingRequestStatus(style: ProductionStyle) {
  return style === "Graphic" || style === "Carousel" ? "Designing" : "Editing";
}

export function completeRequestStatus(style: ProductionStyle) {
  return style === "Graphic" || style === "Carousel" ? "Designed" : "Edited";
}

export function requestStyleFields(
  style: PhonePreviewStyle,
  options: {
    talking: boolean;
    styleSampleEnabled?: boolean;
    textPosition?: "top" | "center" | "bottom";
  },
): Record<string, string | number | boolean> {
  const hookBacking = splitColor(style.hookBacking);
  const captionBacking = splitColor(style.captionBacking);
  const snapshot = {
    version: 1,
    output: { width: SOCIAL_SIZES.reel.width, height: SOCIAL_SIZES.reel.height, aspect: SOCIAL_SIZES.reel.label },
    styleSampleEnabled: options.styleSampleEnabled ?? true,
    textPosition: options.textPosition || (options.talking ? "top" : "center"),
    hook: {
      font: style.hookFont,
      color: style.hookColor,
      backing: hookBacking.hex,
      opacity: hookBacking.opacity,
    },
    caption: {
      font: style.captionFont,
      color: style.captionColor,
      backing: captionBacking.hex,
      opacity: captionBacking.opacity,
    },
  };
  const fields: Record<string, string | number | boolean> = {
    [EDIT_REQUEST_FIELDS.preferences]: JSON.stringify(editingPreferences(style, options.talking)),
    [EDIT_REQUEST_FIELDS.styleSample]: snapshot.styleSampleEnabled,
    [EDIT_REQUEST_FIELDS.captionFont]: style.captionFont,
    [EDIT_REQUEST_FIELDS.captionColor]: style.captionColor,
    [EDIT_REQUEST_FIELDS.captionBacking]: captionBacking.hex,
    [EDIT_REQUEST_FIELDS.captionOpacity]: captionBacking.opacity,
    [EDIT_REQUEST_FIELDS.textPosition]: snapshot.textPosition,
    [EDIT_REQUEST_FIELDS.styleSnapshot]: JSON.stringify(snapshot),
  };
  if (options.talking) {
    fields[EDIT_REQUEST_FIELDS.hookFont] = style.hookFont;
    fields[EDIT_REQUEST_FIELDS.hookColor] = style.hookColor;
    fields[EDIT_REQUEST_FIELDS.hookBacking] = hookBacking.hex;
    fields[EDIT_REQUEST_FIELDS.hookOpacity] = hookBacking.opacity;
  }
  return fields;
}

export function stablePlannerRequestId(contentId: string) {
  return `planner:${contentId}`;
}

export function graphicRequestStyleFields(style: FrameStyle) {
  return { [EDIT_REQUEST_FIELDS.styleSnapshot]: JSON.stringify({ version: 2, graphic: style }) };
}