import type { ProductionStyle } from "./productionRequest";

/** Exact Airtable option names for pieces that come from the long form clipping flow. */
export const LONG_FORM_POST_TYPES: Record<ProductionStyle, string> = {
  BROLL: "📹 BROLL from long form",
  "Talking Video": "📹 Talking from long form",
  Graphic: "🖼️ Graphic from long form",
  Carousel: "🖼️ Carousel from long form",
};

/** Edit Yourself editing styles that trigger the long-form editing automation (videos only). */
export const LONG_FORM_EDIT_STYLES = {
  BROLL: "B-roll from long form",
  "Talking Video": "Talking video from long form",
} as const;

export const isLongFormType = (value: string) => /from long form/i.test(value || "");

/** Base production style for any post type or editing style, including "from long form" variants. */
export function baseStyle(value: string): ProductionStyle | "" {
  const v = value || "";
  if (/carousel/i.test(v)) return "Carousel";
  if (/graphic/i.test(v)) return "Graphic";
  if (/broll|b-roll|story/i.test(v)) return "BROLL";
  if (/talking/i.test(v)) return "Talking Video";
  return "";
}

/** Editing style to write on the Edit Yourself record. */
export function editingStyleFor(style: ProductionStyle, fromLongForm: boolean): string {
  if (fromLongForm && (style === "BROLL" || style === "Talking Video")) return LONG_FORM_EDIT_STYLES[style];
  return style;
}

/** Timestamps and Creative direction belong only to talking videos clipped from a long form. */
export function showsClipFields(postType: string, linkedToLongForm: boolean): boolean {
  if (baseStyle(postType) !== "Talking Video") return false;
  return linkedToLongForm || isLongFormType(postType);
}
