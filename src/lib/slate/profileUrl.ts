/** Public profile link for a platform handle, so users can confirm which account is read. */
export function profileUrl(platform: string, handle: string): string {
  const h = handle.trim().replace(/^@/, "");
  if (!h) return "";
  const p = platform.toLowerCase();
  if (p === "instagram") return `https://www.instagram.com/${h}/`;
  if (p === "tiktok") return `https://www.tiktok.com/@${h}`;
  if (p === "youtube") return `https://www.youtube.com/@${h}`;
  if (p === "linkedin") return `https://www.linkedin.com/in/${h}/`;
  if (p === "facebook") return `https://www.facebook.com/${h}`;
  return "";
}
