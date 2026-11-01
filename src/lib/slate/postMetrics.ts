export const METRIC_PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube"] as const;
export type MetricPlatform = typeof METRIC_PLATFORMS[number];
export const METRIC_KEYS = ["views", "likes", "comments", "saves", "shares"] as const;
export type MetricKey = typeof METRIC_KEYS[number];
export type PlatformMetrics = Record<MetricKey, number | null> & {
  url: string; publishedAt: string; updatedAt: string; status: string;
};
export type MetricsPost = {
  id: string; postName: string; postType: string; clientStatus: string; postingDate: string; createdAt?: string;
  platforms: string[]; previewUrl: string; media?: { url: string; type: "video" | "image" }[]; topic?: string; brandIds?: string[]; posted?: { caption: string; transcript: string; hook: string; coverUrl: string; slideCopy: string; hashtags?: string; textOnScreen?: string; coverTitle?: string; coverCopy?: string; visualHook?: string; copyStatus?: string }; metrics: Record<MetricPlatform, PlatformMetrics>;
  /** Planner piece's own saved live links, used only to link Posts rows. */
  legacyUrls?: Partial<Record<MetricPlatform, string>>;
  /** "post" = a row of the Posts table; planner pieces have no source. */
  source?: "post";
};

export function metricFields(platform: MetricPlatform) {
  return {
    url: `${platform} Posted link`, publishedAt: `${platform} Published At`,
    updatedAt: `${platform} Stats Updated At`, status: `${platform} Stats Status`,
    error: `${platform} Stats Error`,
    views: `${platform} Views`, likes: `${platform} Likes`, comments: `${platform} Comments`,
    saves: `${platform} Saves`, shares: `${platform} Shares`,
  };
}

export function metricNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
export function safePublishedUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch { return ""; }
}
export function readPostMetrics(fields: Record<string, unknown>): Record<MetricPlatform, PlatformMetrics> {
  return Object.fromEntries(METRIC_PLATFORMS.map((platform) => {
    const map = metricFields(platform);
    const text = (key: keyof typeof map) => typeof fields[map[key]] === "string" ? String(fields[map[key]]) : "";
    return [platform, {
      ...Object.fromEntries(METRIC_KEYS.map((key) => [key, metricNumber(fields[map[key]])])),
      url: safePublishedUrl(fields[map.url]), publishedAt: text("publishedAt"),
      updatedAt: text("updatedAt"), status: text("status"),
    }];
  })) as Record<MetricPlatform, PlatformMetrics>;
}

export function analyzePostMetrics(posts: MetricsPost[], platform: MetricPlatform, days: number, now = new Date()) {
  const cutoff = now.getTime() - days * 86400000;
  const unique = [...new Map(posts.map((post) => [post.id, post])).values()];
  const publications = unique.map((post) => ({ post, metrics: post.metrics[platform] })).filter(({ metrics }) => {
    const published = Date.parse(metrics.publishedAt);
    return !!metrics.url && Number.isFinite(published) && published >= cutoff && published <= now.getTime();
  });
  const measured = publications.filter(({ metrics }) => METRIC_KEYS.some((key) => metrics[key] !== null));
  const totals = Object.fromEntries(METRIC_KEYS.map((key) => {
    const values = measured.map(({ metrics }) => metrics[key]).filter((value): value is number => value !== null);
    return [key, { value: values.length ? values.reduce((sum, value) => sum + value, 0) : null, count: values.length }];
  })) as Record<MetricKey, { value: number | null; count: number }>;
  const updatedTimes = measured.map(({ metrics }) => Date.parse(metrics.updatedAt)).filter(Number.isFinite);
  const formats = new Map<string, { sum: number; count: number }>();
  for (const { post, metrics } of measured) {
    if (metrics.views === null) continue;
    const format = post.postType.replace(/[^\p{L}\p{N}\s]/gu, "").trim() || "Post";
    const current = formats.get(format) || { sum: 0, count: 0 };
    formats.set(format, { sum: current.sum + metrics.views, count: current.count + 1 });
  }
  const formatResults = [...formats].map(([format, value]) => ({ format, averageViews: Math.round(value.sum / value.count), count: value.count }))
    .sort((a, b) => b.averageViews - a.averageViews);
  return {
    totals, publications, publishedCount: publications.length, measuredCount: measured.length,
    updatedAt: updatedTimes.length ? new Date(Math.min(...updatedTimes)).toISOString() : "",
    top: measured.filter(({ metrics }) => metrics.views !== null).sort((a, b) => (b.metrics.views ?? 0) - (a.metrics.views ?? 0)).slice(0, 3),
    formats: formatResults,
    topFormats: topFormats(measured.map(({ post, metrics }) => ({ postType: post.postType, views: metrics.views }))),
    topTopics: topTopics(measured.map(({ post, metrics }) => ({ topic: post.topic || "", views: metrics.views }))),
  };
}
/** Topics ranked by average views; posts without a topic or views are ignored, ties go to more posts. */
export function topTopics(rows: { topic: string; views: number | null }[]) {
  const map = new Map<string, { label: string; sum: number; count: number }>();
  for (const { topic, views } of rows) {
    const label = topic.trim();
    if (!label || views === null) continue;
    const key = label.toLowerCase();
    const cur = map.get(key) || { label, sum: 0, count: 0 };
    map.set(key, { label: cur.label, sum: cur.sum + views, count: cur.count + 1 });
  }
  return [...map.values()].map((v) => ({ topic: v.label, averageViews: Math.round(v.sum / v.count), count: v.count }))
    .sort((a, b) => b.averageViews - a.averageViews || b.count - a.count);
}

/** Normalizes Post Type to one of the four production formats; unknown types return "". */
export function normalizeFormat(postType: string): "Broll" | "Talking Video" | "Carousel" | "Graphic" | "" {
  const t = postType.toLowerCase().replace(/[^a-z]/g, "");
  if (t.includes("broll")) return "Broll";
  if (t.includes("talking")) return "Talking Video";
  if (t.includes("carousel")) return "Carousel";
  if (t.includes("graphic") || t.includes("static") || t.includes("image")) return "Graphic";
  return "";
}
/** Formats ranked by average views; ties go to more posts. */
export function topFormats(rows: { postType: string; views: number | null }[]) {
  const map = new Map<string, { sum: number; count: number }>();
  for (const { postType, views } of rows) {
    const format = normalizeFormat(postType);
    if (!format || views === null) continue;
    const cur = map.get(format) || { sum: 0, count: 0 };
    map.set(format, { sum: cur.sum + views, count: cur.count + 1 });
  }
  return [...map].map(([format, v]) => ({ format, averageViews: Math.round(v.sum / v.count), count: v.count }))
    .sort((a, b) => b.averageViews - a.averageViews || b.count - a.count);
}

/** Plain-language result of a stats refresh. */
export function refreshSummary(platform: string, found: number, updated: number, created: number) {
  if (!found) return `Couldn't find any posts on this ${platform} profile. Check the handle.`;
  const parts = [updated ? `Updated ${updated} post${updated === 1 ? "" : "s"}` : "", created ? `added ${created} new post${created === 1 ? "" : "s"}` : ""].filter(Boolean);
  const text = parts.join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Strips bracketed tags, dates and brand names from planner names; falls back to hook/caption. */
export function readableTitle(name: string, brandNames: string[] = [], fallbacks: string[] = []) {
  let t = String(name || "").replace(/[\[(\{][^\])}]*[\])}]/g, " ")
    .replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g, " ");
  for (const b of brandNames) if (b.trim()) t = t.replace(new RegExp(b.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  t = t.replace(/\s+/g, " ").replace(/^[\s\-–—|:·,_]+|[\s\-–—|:·,_]+$/g, "").trim();
  if (/[a-z]{2}/i.test(t)) return t;
  for (const f of fallbacks) { const line = String(f || "").trim().split(/\n/)[0].trim(); if (line) return line.length > 90 ? line.slice(0, 87) + "…" : line; }
  return "Untitled post";
}
