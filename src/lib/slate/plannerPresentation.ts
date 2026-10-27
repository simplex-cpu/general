export type ProductionGroupKey = "to-edit" | "to-design" | "editing" | "designing";

export const PRODUCTION_GROUPS: { key: ProductionGroupKey; label: string }[] = [
  { key: "to-edit", label: "To Edit" },
  { key: "to-design", label: "To Design" },
  { key: "editing", label: "Editing" },
  { key: "designing", label: "Designing" },
];

export function isVideoFormat(postType: string) {
  return !/carousel|graphic/i.test(postType || "");
}

export const APPROVAL_GROUPS = [
  { key: "videos", label: "Videos" },
  { key: "images", label: "Images" },
] as const;

export function approvalGroup(postType: string): "videos" | "images" {
  return isVideoFormat(postType) ? "videos" : "images";
}

export function productionGroup(status: string, postType: string): ProductionGroupKey {
  const active = /^(in progress|editing\s*\|\s*designing|editing|designing)$/i.test((status || "").trim());
  if (isVideoFormat(postType)) return active ? "editing" : "to-edit";
  return active ? "designing" : "to-design";
}

export function displayAssignee(requestType?: string) {
  if (/risevoice/i.test(requestType || "")) return "Risevoice";
  if (/do it myself/i.test(requestType || "")) return "You";
  return "";
}

export function statusTone(status: string) {
  const s = (status || "").trim().toLowerCase();
  if (/posted|approved/.test(s)) return "success" as const;
  if (/approve|to post|posting/.test(s)) return "warning" as const;
  if (/redo|re-do/.test(s)) return "danger" as const;
  if (/editing|designing|in progress/.test(s)) return "active" as const;
  return "pending" as const;
}
/**
 * Starting column widths that show each header and its usual cell text in
 * full. Very long values (post names) are capped; a column never shrinks
 * below its default.
 */
export function fitColumnWidths(
  headers: string[],
  values: string[][],
  measure: (text: string, font: string) => number,
  defaults: number[],
  cap = 380,
) {
  return headers.map((header, i) => {
    const head = measure(header, "500 11px sans-serif");
    const cells = (values[i] || []).map((v) => measure(v, i === 2 ? "600 11px sans-serif" : "500 13px sans-serif"));
    const sorted = cells.sort((a, b) => a - b);
    // Use the 90th percentile so one outlier doesn't blow the column up.
    const typical = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] : 0;
    const extra = i === 0 ? 76 : i === 2 ? 70 : 56;
    return Math.round(Math.min(i === 0 ? Math.min(cap, 260) : cap, Math.max(i === 0 ? 180 : defaults[i] ?? 90, head + 48, typical + extra)));
  });
}

export type PlannerActionId = "teleprompt" | "attach" | "diyDesign" | "diyEdit" | "assign" | "toApproval" | "toReady" | "redo" | "post";

export const PLANNER_ACTIONS: { id: PlannerActionId; label: string }[] = [
  { id: "teleprompt", label: "Teleprompt" },
  { id: "attach", label: "Attach" },
  { id: "diyDesign", label: "DIY Design" },
  { id: "diyEdit", label: "DIY Edit" },
  { id: "assign", label: "Assign to Risevoice" },
  { id: "toApproval", label: "Move to Approval" },
  { id: "toReady", label: "Move to Ready to Post" },
  { id: "redo", label: "Re-do" },
  { id: "post", label: "Post" },
];

/**
 * The three-dots menu: the same nine actions at every stage, minus the ones
 * already shown as main buttons; actions that don't fit the format stay
 * visible but disabled with a reason.
 */
export function plannerMenuActions(postType: string, primary: PlannerActionId[]) {
  const talking = /talking/i.test(postType || "") || (!/carousel|graphic|broll|b-roll/i.test(postType || ""));
  const video = isVideoFormat(postType);
  return PLANNER_ACTIONS.filter((a) => !primary.includes(a.id)).map((a) => {
    let reason = "";
    if (a.id === "teleprompt" && !talking) reason = "Only for Talking Video";
    if (a.id === "diyEdit" && !video) reason = "Only for videos";
    if (a.id === "diyDesign" && video) reason = "Only for carousels and graphics";
    if (a.id === "post") reason = "Coming soon";
    return { ...a, disabled: Boolean(reason), reason };
  });
}

/** Main buttons each planner tab shows on a row, so the menu can skip them. */
export function plannerPrimaryActions(tab: string, status: string, postType: string, toProduce: boolean): PlannerActionId[] {
  if (tab === "toFilm") return /talking/i.test(postType || "") ? ["attach", "teleprompt"] : ["attach"];
  if (tab === "inProgress" && toProduce) return [isVideoFormat(postType) ? "diyEdit" : "diyDesign", "assign"];
  if (tab === "toApprove") return ["redo"];
  if (tab === "approved") return ["post"];
  void status;
  return [];
}

/** Type groups used by every planner tab that has no stage-specific grouping (e.g. Prepare Footage). */
export const FORMAT_GROUPS = [
  { key: "talking", label: "Talking Video" },
  { key: "broll", label: "B-roll" },
  { key: "carousel", label: "Carousel" },
  { key: "graphic", label: "Graphic" },
  { key: "other", label: "Other" },
] as const;
export type FormatGroupKey = (typeof FORMAT_GROUPS)[number]["key"];

export function formatGroup(postType: string): FormatGroupKey {
  const t = (postType || "").toLowerCase().replace(/[^a-z]/g, "");
  if (t.includes("broll")) return "broll";
  if (t.includes("talking")) return "talking";
  if (t.includes("carousel")) return "carousel";
  if (t.includes("graphic") || t.includes("static") || t.includes("image")) return "graphic";
  return "other";
}
