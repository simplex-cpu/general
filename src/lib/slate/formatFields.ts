// Single source of truth for per-format field structure.
// Used by Divide Scripts cards, Airtable payload, Google Doc, and PDF exports.
import { serializeCarouselDocument } from "./slideFields";

export type FormatKey =
  | "talkingVideo"
  | "broll"
  | "carousel"
  | "graphic"
  | "reactionRepurpose"
  | "trend"
  | "podcastClips";

export type FieldKey =
  | "visualHook"
  | "script" // also used for "Text Overlay" (broll) and "Slides copy" (carousel)
  | "onScreenCta"
  | "inspo" // also used for "Video to react to" (reactionRepurpose)
  | "filmingInstructions"
  | "creativeInstructions"; // also "Design brief" (graphic) / "Editing brief" (carousel)

export type FormatSpec = {
  chip: "📹 Video" | "🏞️ Graphic";
  category: string;
  clientStatus: "To Film" | "Production";
  productionStatus: "To Film" | "To Edit | Design" | "Prepare for Prod";
  autoAssignRole: "editor" | "designer" | null;
  fields: FieldKey[];
};

/** Human label printed in exported documents ("Format: <label>"). */
export const FORMAT_DOC_LABEL: Record<FormatKey, string> = {
  broll: "B-roll",
  talkingVideo: "Talking Video",
  carousel: "Carousel",
  graphic: "Graphic",
  reactionRepurpose: "Reaction & Repurpose",
  trend: "Trend",
  podcastClips: "Podcast Clips",
};

export const FORMAT_SPEC: Record<FormatKey, FormatSpec> = {
  broll: {
    chip: "📹 Video",
    category: "BROLL",
    clientStatus: "Production",
    productionStatus: "Prepare for Prod",
    autoAssignRole: "editor",
    fields: ["inspo", "script", "filmingInstructions", "creativeInstructions"],
  },
  talkingVideo: {
    chip: "📹 Video",
    category: "Talking Point",
    clientStatus: "To Film",
    productionStatus: "To Film",
    autoAssignRole: null,
    fields: ["visualHook", "script", "filmingInstructions", "creativeInstructions"],
  },
  reactionRepurpose: {
    chip: "📹 Video",
    category: "Reaction & Repurpose",
    clientStatus: "To Film",
    productionStatus: "To Film",
    autoAssignRole: null,
    fields: ["visualHook", "inspo", "filmingInstructions", "creativeInstructions"],
  },
  trend: {
    chip: "📹 Video",
    category: "Trend",
    clientStatus: "To Film",
    productionStatus: "To Film",
    autoAssignRole: null,
    fields: ["visualHook", "inspo", "script", "filmingInstructions", "creativeInstructions"],
  },
  podcastClips: {
    chip: "📹 Video",
    category: "Podcast Clips",
    clientStatus: "Production",
    productionStatus: "To Edit | Design",
    autoAssignRole: "editor",
    fields: ["visualHook", "script", "filmingInstructions", "creativeInstructions"],
  },
  graphic: {
    chip: "🏞️ Graphic",
    category: "Graphic",
    clientStatus: "Production",
    productionStatus: "Prepare for Prod",
    autoAssignRole: "designer",
    fields: ["visualHook", "inspo", "creativeInstructions"],
  },
  carousel: {
    chip: "🏞️ Graphic",
    category: "Carousel",
    clientStatus: "Production",
    productionStatus: "Prepare for Prod",
    autoAssignRole: "designer",
    // "script" here is rendered as a single "Slides copy" textarea.
    fields: ["inspo", "script", "creativeInstructions"],
  },
};

/**
 * Stage a new script lands on in the client's Posts Planner:
 * video formats need filming first, graphics/carousels go straight to
 * Production.
 */
export function clientBoardStatus(format: string): "Film" | "In Progress" {
  const spec = FORMAT_SPEC[format as FormatKey];
  return spec?.chip === "📹 Video" ? "Film" : "In Progress";
}


/** Friendly label used in the Divide Scripts UI for a given field+format combo. */
export function getFieldLabel(field: FieldKey, format: FormatKey): string {
  if (field === "script") {
    if (format === "broll") return "Text Overlay";
    if (format === "carousel") return "Slides copy";
    return "Script";
  }
  if (field === "inspo") {
    if (format === "reactionRepurpose") return "Video to react to";
    return "Inspo";
  }
  if (field === "creativeInstructions") {
    if (format === "graphic") return "Design brief";
    if (format === "carousel") return "Editing brief";
    return "Creative Instructions";
  }
  if (field === "visualHook") return "Visual Hook";
  if (field === "onScreenCta") return "On-screen CTA";
  if (field === "filmingInstructions") return "Filming Guidelines";
  return field;
}

/** Heading text used in the exported Google Doc / PDF for a given field+format combo. */
export function getDocHeading(field: FieldKey, format: FormatKey): string {
  if (field === "visualHook") {
    return format === "talkingVideo" ? "Visual hook · 0–3s" : "Visual hook";
  }
  if (field === "script") {
    if (format === "broll") return "Text overlay";
    if (format === "carousel") return "Slides copy";
    return "Script";
  }
  if (field === "inspo") {
    if (format === "reactionRepurpose") return "Video to react to";
    return "Inspo";
  }
  if (field === "creativeInstructions") {
    if (format === "graphic") return "Design brief";
    if (format === "carousel") return "Editing brief";
    return "Creative Instructions";
  }
  if (field === "onScreenCta") return "On-screen CTA";
  if (field === "filmingInstructions") return "Filming Guidelines";
  return field;
}

/** Read a field's value out of a script-card-like object. */
export function readFieldValue(field: FieldKey, src: Record<string, any>): string {
  switch (field) {
    case "visualHook":
      return String(src.visualHook ?? "");
    case "script":
      return String(src.script ?? "");
    case "onScreenCta":
      return String(src.onScreenCta ?? "");
    case "inspo":
      return String(src.inspo ?? "");
    case "filmingInstructions":
      return String(src.filmingInstructions ?? "");
    case "creativeInstructions":
      return String(src.creativeInstructions ?? "");
  }
}

/** Read a field for document exports, including slide-based graphic copy. */
export function readExportFieldValue(
  field: FieldKey,
  format: FormatKey,
  src: Record<string, any>,
): string {
  const isSlideCopy = src.kind === "carousel"
    && (field === "script" || (format === "graphic" && field === "visualHook"));
  if (isSlideCopy) return slidesToCopyText(src.slides || []);
  return readFieldValue(field, src);
}

/** True if a given Airtable role can be auto-assigned for this format. */
export function isEligibleAssignee(format: FormatKey | null, role?: string): boolean {
  if (!format) return false;
  const spec = FORMAT_SPEC[format];
  if (!spec.autoAssignRole || !role) return false;
  const r = role.toLowerCase();
  if (spec.autoAssignRole === "designer") return r.includes("designer") || r.includes("graphic");
  return r.includes("editor");
}

/** Carousel helper: flatten a slides[] array into one textarea-friendly string. */
export function slidesToCopyText(
  slides: Array<{ position?: number; role?: string; headline?: string; subtitle?: string; body?: string; actionLabel?: string }>,
): string {
  if (!Array.isArray(slides) || slides.length === 0) return "";
  return serializeCarouselDocument(slides.map((slide) => ({
    title: String(slide.headline || ""),
    subtitle: String(slide.role === "cta" ? slide.actionLabel || "" : slide.subtitle || ""),
    body: String(slide.body || ""),
  })));
}

/** Planner placement chosen in the "add to planner" window of the scriptwriter. */
export type PlannerChoice = {
  action: "produce" | "queue";
  handler?: "risevoice" | "self";
  footageLink?: string;
};

export type ProductionAction = "assign" | "dwy-edit" | "dwy-design" | "comment";

/** Actions shown in Production depend on whether work is waiting or underway. */
export function productionActions(status: string, postType: string): ProductionAction[] {
  const waiting = /^(to\s*edit\s*\|\s*(to\s*)?design(ing)?|to\s*edit|to\s*design|produce|prepare for prod|scripting)$/i.test(
    String(status || "").trim(),
  );
  if (!waiting) return ["comment"];
  const video = !/carousel|graphic/i.test(postType || "");
  return ["assign", video ? "dwy-edit" : "dwy-design"];
}

/**
 * Client Status + Request type for a new planner record.
 * Queue -> Prepare footage ("Film"). Produce now -> To Edit | To Design.
 * Video formats need a footage link to produce now.
 */
export function plannerPlacement(
  format: string,
  c: PlannerChoice,
): { status: "Film" | "To Edit | To Design"; requestType?: "Risevoice Request" | "Do it Myself"; error?: string } {
  if (c.action === "queue") return { status: "Film" };
  const isVideo = FORMAT_SPEC[format as FormatKey]?.chip === "📹 Video";
  if (isVideo && !String(c.footageLink || "").trim()) {
    return { status: "Film", error: "Add a footage link to produce a video now." };
  }
  return {
    status: "To Edit | To Design",
    requestType: c.handler === "self" ? "Do it Myself" : "Risevoice Request",
  };
}
