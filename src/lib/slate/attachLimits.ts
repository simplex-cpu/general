/** File type and count allowed per post type before a production request. */
export type AttachLimit = { kind: "image" | "video"; accept: string; min: number; max: number; label: string };

export const ATTACH_LIMITS: Record<"carousel" | "graphic" | "talkingVideo" | "broll", AttachLimit> = {
  carousel: { kind: "image", accept: "image/*", min: 1, max: 24, label: "Carousels take 1 to 24 images" },
  graphic: { kind: "image", accept: "image/*", min: 1, max: 1, label: "A graphic takes 1 image" },
  talkingVideo: { kind: "video", accept: "video/*", min: 1, max: 5, label: "Talking videos take up to 5 video clips" },
  broll: { kind: "video", accept: "video/*", min: 1, max: 1, label: "B-roll takes 1 video clip" },
};

export function limitFor(postType: string | undefined | null): AttachLimit | null {
  const t = String(postType || "").toLowerCase().replace(/[^a-z]/g, "");
  if (t.includes("carousel")) return ATTACH_LIMITS.carousel;
  if (t.includes("graphic")) return ATTACH_LIMITS.graphic;
  if (t.includes("broll")) return ATTACH_LIMITS.broll;
  if (t.includes("talking")) return ATTACH_LIMITS.talkingVideo;
  return null;
}

/** Returns an error message, or "" when the files fit the post type. */
export function checkAttachments(
  postType: string | undefined | null,
  files: { type?: string; contentType?: string }[],
): string {
  const lim = limitFor(postType);
  if (!lim) return "";
  if (files.some((f) => !String(f.type || f.contentType || "").startsWith(`${lim.kind}/`))) return lim.label;
  if (files.length > lim.max) return lim.label;
  return "";
}
