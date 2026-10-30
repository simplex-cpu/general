/** Pure helpers for the DWY "Posts" table: one row per published post, linked to a Brand and optionally a planner Content piece. */
import { postKey, type RefreshPlatform, type ScrapedStats } from "./statsRefresh";

export const POSTS_TABLE = "tblfllSMXhJxmVGBa";
export const STAT_FIELDS = { views: "Views", likes: "Likes", comments: "Comments", saves: "Saves", shares: "Shares" } as const;

export type ExistingPost = { id: string; key: string; contentIds: string[]; brandIds: string[]; caption?: string };
export type ScrapedPost = ScrapedStats & { url: string; publishedAt: string; caption?: string; coverUrl?: string };

/** Live URL and publish time of a scraped item. */
export function scrapedPostMeta(platform: RefreshPlatform, it: any): { url: string; publishedAt: string; caption: string; coverUrl: string } {
  if (platform === "Instagram") {
    const url = String(it?.url || (it?.shortCode ? `https://www.instagram.com/p/${it.shortCode}/` : ""));
    return { url, publishedAt: String(it?.timestamp || ""), caption: String(it?.caption || "").trim(), coverUrl: String(it?.displayUrl || it?.images?.[0] || "") };
  }
  const secs = Number(it?.createTime);
  return { url: String(it?.webVideoUrl || ""), publishedAt: String(it?.createTimeISO || (Number.isFinite(secs) && secs > 0 ? new Date(secs * 1000).toISOString() : "")), caption: String(it?.text || "").trim(), coverUrl: String(it?.videoMeta?.coverUrl || it?.covers?.[0] || "") };
}

/**
 * Matches scraped posts to Posts rows by platform key. Found rows get stats (blanks never overwrite);
 * missing ones are created linked to the brand. A planner piece with the same live link is linked as Content.
 */
export function buildPostUpserts(platform: RefreshPlatform, brandId: string, existing: ExistingPost[], scraped: ScrapedPost[], planner: { id: string; url: string }[], now: string) {
  const byKey = new Map(existing.map((p) => [p.key, p]));
  const contentByKey = new Map<string, string>();
  for (const p of planner) { const k = postKey(platform, p.url); if (k && !contentByKey.has(k)) contentByKey.set(k, p.id); }
  const updates: { id: string; fields: Record<string, unknown> }[] = [];
  const creates: { fields: Record<string, unknown> }[] = [];
  for (const s of scraped) {
    const fields: Record<string, unknown> = {};
    const all = { views: s.views, likes: s.likes, comments: s.comments, saves: s.saves, shares: s.shares };
    for (const [k, v] of Object.entries(all)) if (v !== null) fields[STAT_FIELDS[k as keyof typeof STAT_FIELDS]] = v;
    const complete = Object.values(all).every((v) => v !== null);
    fields["Stats Updated At"] = now;
    fields["Stats Status"] = complete ? "Collected" : "Partial";
    fields["Stats Error"] = complete ? "" : platform === "Instagram" ? "Saves and shares are not publicly available." : "Some statistics were not returned.";
    if (s.url) fields["Post URL"] = s.url;
    if (s.publishedAt) fields["Posted At"] = s.publishedAt;
    if (s.caption && !byKey.get(s.key)?.caption) fields.Caption = s.caption;
    if (s.coverUrl) fields.Cover = s.coverUrl;
    const content = contentByKey.get(s.key);
    const row = byKey.get(s.key);
    if (row) {
      if (content && !row.contentIds.includes(content)) fields.Content = [...row.contentIds, content];
      if (!row.brandIds.includes(brandId)) fields.Brand = [...row.brandIds, brandId];
      updates.push({ id: row.id, fields });
    } else {
      creates.push({ fields: { ...fields, "Post Key": s.key, Platform: platform, Brand: [brandId], ...(content ? { Content: [content] } : {}) } });
    }
  }
  return { updates, creates };
}
