/** Pure helpers for refreshing stored post statistics from a scraped profile. */
export type RefreshPlatform = "Instagram" | "TikTok";
export type ScrapedStats = { key: string; views: number | null; likes: number | null; comments: number | null; saves: number | null; shares: number | null };

const count = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

/** Stable identity of a post URL: Instagram shortcode or TikTok video id. */
export function postKey(platform: RefreshPlatform, url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (platform === "Instagram") {
    const m = raw.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
    return m ? `ig:${m[1]}` : "";
  }
  const m = raw.match(/tiktok\.com\/.*?\/(?:video|photo)\/(\d+)/i) || raw.match(/^(\d{8,})$/);
  return m ? `tt:${m[1]}` : "";
}

export function scrapedStats(platform: RefreshPlatform, it: any): ScrapedStats | null {
  if (platform === "Instagram") {
    const key = it?.shortCode ? `ig:${it.shortCode}` : postKey(platform, it?.url || "");
    if (!key) return null;
    const views = count(it?.videoPlayCount ?? it?.igPlayCount ?? it?.playCount ?? it?.videoViewCount);
    return { key, views, likes: count(it?.likesCount), comments: count(it?.commentsCount), saves: null, shares: null };
  }
  const key = it?.id ? `tt:${it.id}` : postKey(platform, it?.webVideoUrl || "");
  if (!key) return null;
  return { key, views: count(it?.playCount), likes: count(it?.diggCount), comments: count(it?.commentCount), saves: count(it?.collectCount), shares: count(it?.shareCount) };
}

export type PlannerPost = { id: string; url: string };
/** Builds Airtable patches only for posts already on the planner; blanks never overwrite stored values. */
export function buildStatPatches(platform: RefreshPlatform, posts: PlannerPost[], scraped: ScrapedStats[], now: string) {
  const byKey = new Map(scraped.map((s) => [s.key, s]));
  const planned = new Set<string>();
  const patches: { id: string; fields: Record<string, unknown> }[] = [];
  for (const post of posts) {
    const key = postKey(platform, post.url);
    if (!key) continue;
    planned.add(key);
    const s = byKey.get(key);
    if (!s) continue;
    const fields: Record<string, unknown> = {};
    const all = { Views: s.views, Likes: s.likes, Comments: s.comments, Saves: s.saves, Shares: s.shares };
    for (const [name, value] of Object.entries(all)) if (value !== null) fields[`${platform} ${name}`] = value;
    if (!Object.keys(fields).length) continue;
    const complete = Object.values(all).every((v) => v !== null);
    fields[`${platform} Stats Updated At`] = now;
    fields[`${platform} Stats Status`] = complete ? "Collected" : "Partial";
    fields[`${platform} Stats Error`] = complete ? "" : platform === "Instagram" ? "Saves and shares are not publicly available." : "Some statistics were not returned.";
    patches.push({ id: post.id, fields });
  }
  const notOnPlanner = scraped.filter((s) => !planned.has(s.key)).length;
  return { patches, notOnPlanner };
}

export type ScrapedMedia = { key: string; mediaType: "video" | "carousel" | "graphic"; videoUrl: string; coverUrl: string; imageUrls: string[]; caption: string; duration: number; originalAudio?: boolean };
export function scrapedMedia(platform: RefreshPlatform, it: any): ScrapedMedia | null {
  const stats = scrapedStats(platform, it);
  if (!stats) return null;
  if (platform === "TikTok") {
    const photo = /\/photo\//i.test(String(it?.webVideoUrl || "")) || Array.isArray(it?.imagePost?.images);
    const imageUrls = (it?.imagePost?.images || []).map((im: any) => im?.imageURL?.urlList?.[0] || im?.displayImage?.urlList?.[0] || im?.imageUrl || im?.url || "").filter((url: unknown): url is string => typeof url === "string" && /^https:\/\//.test(url));
    return { key: stats.key, mediaType: photo ? "carousel" : "video", videoUrl: photo ? "" : String(it?.videoUrl || it?.videoMeta?.downloadAddr || it?.mediaUrls?.[0] || ""), coverUrl: String(it?.videoMeta?.coverUrl || it?.covers?.[0] || imageUrls[0] || ""), imageUrls, caption: String(it?.text || ""), duration: Number(it?.videoMeta?.duration) || 0, originalAudio: it?.musicMeta?.musicOriginal };
  }
  const type = String(it?.type || "").toLowerCase();
  const children = Array.isArray(it?.childPosts) ? it.childPosts.length : 0;
  const mediaType = type === "sidecar" || children > 1 ? "carousel" : type === "video" || it?.videoUrl ? "video" : "graphic";
  const images = Array.isArray(it?.childPosts) && it.childPosts.length ? it.childPosts.map((child: any) => child?.displayUrl || child?.images?.[0] || "") : Array.isArray(it?.images) && it.images.length ? it.images : [it?.displayUrl];
  const imageUrls = images.filter((url: unknown): url is string => typeof url === "string" && /^https:\/\//.test(url));
  return { key: stats.key, mediaType, videoUrl: String(it?.videoUrl || ""), coverUrl: String(it?.displayUrl || imageUrls[0] || ""), imageUrls, caption: String(it?.caption || ""), duration: Number(it?.videoDuration) || 0, originalAudio: it?.musicInfo?.uses_original_audio };
}

export type TaggablePost = { id: string; url: string; topic: string; postType: string; caption?: string };
/** Post content saved from the published post; new fields are only filled while blank. */
export const POSTED_FIELDS = { caption: "Posted Caption", transcript: "Posted Transcript", hook: "Posted Hook", coverUrl: "Posted Cover", slideCopy: "Posted Slide Copy" } as const;
export type PostedContent = { caption: string; transcript: string; hook: string; coverUrl: string; slideCopy: string };
/** First spoken sentence for videos, otherwise the first caption line. */
export function deriveHook(transcript: string, caption: string) {
  const spoken = transcript.trim().split(/(?<=[.!?])\s+/)[0] || "";
  return (spoken || caption.trim().split(/\n/)[0] || "").trim().slice(0, 200);
}
/** Planner posts matched to the profile that still lack a topic or a format; only these cost a transcription. */
export function postsNeedingTags(platform: RefreshPlatform, posts: TaggablePost[], scrapedKeys: Set<string>) {
  return posts.filter((p) => scrapedKeys.has(postKey(platform, p.url)) && (!p.topic.trim() || !p.postType.trim() || !(p.caption || "").trim()));
}

export const PLANNER_POST_TYPE = { talking: "\u{1F4F9} Talking Video", broll: "\u{1F4F9} BROLL Video", carousel: "\u{1F5BC}\u{FE0F} Carousel", graphic: "\u{1F5BC}\u{FE0F} Graphic" } as const;
/** Only fills empty fields: saved topics and formats are never overwritten, blanks are never written. */
export function tagFields(post: TaggablePost, result: { topic: string; type: keyof typeof PLANNER_POST_TYPE | null; content?: Partial<PostedContent> }) {
  const fields: Record<string, string> = {};
  if (!(post.caption || "").trim() && result.content) for (const [key, field] of Object.entries(POSTED_FIELDS)) { const v = String(result.content[key as keyof PostedContent] || "").trim(); if (v) fields[field] = v.slice(0, 20000); }
  if (!post.topic.trim() && result.topic.trim()) fields.Topic = result.topic.trim();
  if (!post.postType.trim() && result.type) fields["Post Type"] = PLANNER_POST_TYPE[result.type];
  return fields;
}

/** Why a scrape returned a profile instead of posts (private/age-restricted), or "" when posts came back. */
export function profileBlockReason(platform: RefreshPlatform, items: any[]): string {
  const list = Array.isArray(items) ? items : [];
  const hasPosts = list.some((it) => platform === "Instagram" ? !!(it?.shortCode || it?.type) && !it?.biography : !!it?.webVideoUrl);
  if (hasPosts) return "";
  const blocked = list.some((it) => it?.isRestrictedProfile || it?.private || /restricted|private/i.test(String(it?.error || "")) || it?.authorMeta?.privateAccount);
  if (!blocked) return "";
  return platform === "Instagram"
    ? `Instagram is hiding ${handleOf(list) ? `@${handleOf(list)}'s` : "this profile's"} posts because the account is age-restricted (18+) or private. Turn it off in Instagram → Settings → Account → Age restriction (choose "No restriction"), or make the account public, then press Refresh stats again.`
    : "TikTok is hiding this profile's videos (private or unavailable). Make the account public, then refresh.";
}

const handleOf = (list: any[]) => String(list.find((it) => it?.username)?.username || list.find((it) => it?.ownerUsername)?.ownerUsername || "").replace(/^@/, "");

/** "blocked" when the platform refused the anonymous reader, "missing" when the profile doesn't exist, "" otherwise. */
export function scrapeFailureKind(platform: RefreshPlatform, items: any[]): "" | "blocked" | "missing" {
  const list = Array.isArray(items) ? items : [];
  if (list.some((it) => platform === "Instagram" ? !!(it?.shortCode || it?.type) && !it?.biography : !!it?.webVideoUrl)) return "";
  const text = list.map((it) => `${it?.error || ""} ${it?.errorDescription || ""} ${(it?.requestErrorMessages || []).join(" ")}`).join(" ");
  if (/blocked|rate.?limit|429|login required|challenge/i.test(text)) return "blocked";
  if (/not found|doesn'?t exist|does not exist|no such|404/i.test(text)) return "missing";
  return list.length === 0 || list.every((it) => it?.requestErrorMessages || it?.error) ? "blocked" : "";
}
export const BLOCKED_MESSAGE = (platform: RefreshPlatform) => `${platform} temporarily blocked reading this profile. Please try again in a few minutes.`;
export const MISSING_MESSAGE = (platform: RefreshPlatform) => `Couldn't find this ${platform} profile. Check the handle.`;
