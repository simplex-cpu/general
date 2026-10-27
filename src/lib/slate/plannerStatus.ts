import { baseStyle } from "./longFormTypes";

export const matchFilm = (s: string) => /^(film|to film|prepare footage)$/i.test((s || "").trim());
export const matchToApprove = (s: string) => /^(approve|to approve|internal approval|re-?do|ai re-?do|risevoice re-?do)$/i.test((s || "").trim());
export const matchApproved = (s: string) => /^approved$/i.test((s || "").trim());
export const matchPosted = (s: string) => /^(posted|posting|to post)$/i.test((s || "").trim());

export function attentionReason(status: string): { label: string; action: string; priority: number } | null {
  const s = status.trim();
  if (/^(deleted|do not post|posted|posting|re-?do|ai re-?do|risevoice re-?do)$/i.test(s)) return null;
  if (matchToApprove(s)) return { label: "Awaiting your approval", action: "Review", priority: 0 };
  if (matchFilm(s)) return { label: "Raw footage needed", action: "Add footage", priority: 1 };
  if (/^(approved|to post)$/i.test(s)) return { label: "Ready to publish", action: "Open post", priority: 2 };
  return null;
}
export type BoardStage = "footage" | "edit" | "design" | "approve" | "post";
export const BOARD_STAGES: { key: BoardStage; label: string }[] = [
  { key: "footage", label: "Prepare Footage" },
  { key: "edit", label: "To Edit" },
  { key: "design", label: "To Design" },
  { key: "approve", label: "Approve" },
  { key: "post", label: "Ready to Post" },
];
const isDesignFormat = (postType: string) => ["Graphic", "Carousel"].includes(baseStyle(postType || ""));

/** Priority board column. Airtable has one "To Edit | Design" status, so the card's format picks To Edit (videos) or To Design (graphics). */
export function boardStage(status: string, postType = ""): BoardStage | null {
  const s = (status || "").trim();
  if (matchFilm(s)) return "footage";
  if (/^(to edit|to design|to edit\s*\|\s*(to )?design)$/i.test(s)) {
    if (/^to edit$/i.test(s)) return "edit";
    if (/^to design$/i.test(s)) return "design";
    return isDesignFormat(postType) ? "design" : "edit";
  }
  if (/^(approve|to approve|internal approval)$/i.test(s)) return "approve";
  if (/^(approved|to post)$/i.test(s)) return "post";
  return null;
}
/** Planner status written when a board card is dropped into a column. */
export function stageDropStatus(stage: BoardStage): string {
  return ({ footage: "Film", edit: "To Edit | Design", design: "To Edit | Design", approve: "Approve", post: "To Post" } as const)[stage];
}
