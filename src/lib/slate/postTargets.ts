// Where and how a card gets posted: the brand's connected accounts plus
// platform-specific formats. Shared by the card UI and the save endpoint.

export const POSTING_PLATFORMS = ["Instagram", "Tiktok", "Facebook"] as const;
export type PostingPlatform = (typeof POSTING_PLATFORMS)[number];

export const POST_FORMATS: Record<PostingPlatform, string[]> = {
  Instagram: ["Instagram Reel", "Instagram Trial Reel", "Instagram Carousel", "Instagram Post"],
  Tiktok: ["TikTok Video", "TikTok Photo Carousel"],
  Facebook: ["Facebook Reel", "Facebook Post"],
};

/** Status a card must be in before it can be scheduled or posted. */
export const READY_TO_POST_STATUS = "To Post";

export function postingPlatform(raw: unknown): PostingPlatform | null {
  const s = String(raw || "").trim().toLowerCase();
  return POSTING_PLATFORMS.find((p) => p.toLowerCase() === s) || null;
}

export function formatsFor(platforms: string[]): string[] {
  const seen = new Set(platforms.map(postingPlatform).filter(Boolean) as PostingPlatform[]);
  return POSTING_PLATFORMS.filter((p) => seen.has(p)).flatMap((p) => POST_FORMATS[p]);
}

/** Keeps only formats that belong to one of the selected platforms. */
export function validFormats(formats: string[], platforms: string[]): string[] {
  const allowed = new Set(formatsFor(platforms));
  return [...new Set(formats)].filter((f) => allowed.has(f));
}

export function canPost(status: string) {
  return status.trim().toLowerCase() === READY_TO_POST_STATUS.toLowerCase();
}

/** Why the card cannot be posted yet, or "" when it can. */
export function postBlocker(c: { clientStatus: string; postAccountIds: string[]; postFormats: string[] }) {
  if (!canPost(c.clientStatus)) return "Move this card to Ready to Post first";
  if (!c.postAccountIds.length) return "Pick at least one account";
  if (!c.postFormats.length) return "Pick at least one format";
  return "";
}
