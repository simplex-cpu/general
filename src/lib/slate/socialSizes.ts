/** Social post dimensions shared by previews, design exports and production requests. */
export const SOCIAL_SIZES = {
  /** Reels, TikToks, Shorts and every video post. */
  reel: { width: 1080, height: 1920, label: "9:16" },
  /** Carousel slides and single graphics. */
  feed: { width: 1080, height: 1350, label: "4:5" },
} as const;
export type SocialShape = keyof typeof SOCIAL_SIZES;

export function shapeForFormat(postType: string): SocialShape {
  return /carousel|graphic|static|image/i.test(postType || "") ? "feed" : "reel";
}

/** True when a video's frame is within 2% of 9:16. */
export function isReelRatio(width: number, height: number) {
  if (!width || !height) return true;
  return Math.abs(width / height - 9 / 16) <= 0.02 * (9 / 16) * 1.5;
}
