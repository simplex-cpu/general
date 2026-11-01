import type { AccessRecord } from "./accessCode.server";
import { resolveOwnerIdentity, linkContainsName, ownsRecord } from "./owner.server";
import { POSTED_FIELDS, postKey } from "./slate/statsRefresh";
import { METRIC_PLATFORMS, metricFields, readPostMetrics, safePublishedUrl, metricNumber, type MetricsPost, type PlatformMetrics, type MetricPlatform } from "./slate/postMetrics";
import { readBrandPosts, linkIds } from "./posts.server";
import { readPostCopy } from "./slate/postCopy";
import { ownedBrandIds } from "./brands.server";

const emptyMetrics = (): PlatformMetrics => ({ views: null, likes: null, comments: null, saves: null, shares: null, url: "", publishedAt: "", updatedAt: "", status: "" });

export async function readHomeContent(access: AccessRecord): Promise<MetricsPost[]> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("Your content is temporarily unavailable.");
  const owner = await resolveOwnerIdentity(access, token);
  if (!owner) throw new Error("We could not match your account to a client record.");
  const columns = ["Name", "Post Type", "Client Status", "Posting date", "Platform", "User", "Produced Files", "Topic", "Brands", ...METRIC_PLATFORMS.flatMap((platform) => Object.values(metricFields(platform)).filter((field) => !field.endsWith("Stats Error")))];
  let withPosted = true;
  const items: MetricsPost[] = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (owner.name) params.set("filterByFormula", linkContainsName("User", owner.name));
    for (const field of withPosted ? [...columns, ...Object.values(POSTED_FIELDS)] : columns) params.append("fields[]", field);
    if (offset) params.set("offset", offset);
    const response = await fetch(`https://api.airtable.com/v0/appf1QABtQbAENYDz/tblucGgVsDiDGdyyK?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 422 && withPosted && !offset && !items.length) { withPosted = false; continue; }
    if (!response.ok) { console.error("[home/content] Airtable status", response.status); throw new Error("Your content could not be loaded. Please try again."); }
    const result = await response.json() as { records: { id: string; createdTime?: string; fields: Record<string, unknown> }[]; offset?: string };
    for (const record of result.records || []) {
      const fields = record.fields;
      if (!ownsRecord(fields.User, owner.id) || /^deleted$/i.test(String(fields["Client Status"] || ""))) continue;
      const text = (field: string) => typeof fields[field] === "string" ? String(fields[field]) : "";
      const files = Array.isArray(fields["Produced Files"]) ? fields["Produced Files"] as { thumbnails?: { small?: { url?: string }; large?: { url?: string } }; type?: string; url?: string }[] : [];
      const file = files.find((file) => file.type?.startsWith("image/"));
      const media = files.map((f) => ({ url: safePublishedUrl(f.url), type: f.type?.startsWith("video/") ? "video" as const : "image" as const })).filter((m) => m.url);
      const metrics = readPostMetrics(fields);
      items.push({ id: record.id, createdAt: record.createdTime || "", postName: text("Name"), postType: text("Post Type"), clientStatus: text("Client Status"), postingDate: text("Posting date"), platforms: Array.isArray(fields.Platform) ? fields.Platform.filter((value): value is string => typeof value === "string") : [], previewUrl: safePublishedUrl(file?.thumbnails?.large?.url || file?.url), media, topic: text("Topic"), brandIds: Array.isArray(fields.Brands) ? fields.Brands.filter((value): value is string => typeof value === "string") : [], posted: { caption: text(POSTED_FIELDS.caption), transcript: text(POSTED_FIELDS.transcript), hook: text(POSTED_FIELDS.hook), coverUrl: safePublishedUrl(fields[POSTED_FIELDS.coverUrl]), slideCopy: text(POSTED_FIELDS.slideCopy) }, metrics, legacyUrls: Object.fromEntries(METRIC_PLATFORMS.map((p) => [p, metrics[p].url])) });
    }
    offset = result.offset || "";
  } while (offset);

  // Stats live on the Posts table; planner pieces keep old stats only until a Posts row exists for that post.
  let brands: string[] = [];
  try { brands = (await ownedBrandIds(access, token)).ids; } catch (e) { console.warn("[home/content] brands", e); }
  const rows = await readBrandPosts(token, brands).catch((e) => { console.warn("[home/content] posts", e); return []; });
  const byContent = new Map(items.map((i) => [i.id, i]));
  const keys = new Set<string>();
  const posts: MetricsPost[] = rows.map((row) => {
    const f = row.fields;
    const t = (k: string) => typeof f[k] === "string" ? String(f[k]) : "";
    const platform = (t("Platform") || "Instagram") as MetricPlatform;
    keys.add(t("Post Key"));
    const linked = byContent.get(linkIds(f.Content)[0] || "");
    const metrics = Object.fromEntries(METRIC_PLATFORMS.map((p) => [p, emptyMetrics()])) as Record<MetricPlatform, PlatformMetrics>;
    metrics[platform] = { views: metricNumber(f.Views), likes: metricNumber(f.Likes), comments: metricNumber(f.Comments), saves: metricNumber(f.Saves), shares: metricNumber(f.Shares), url: safePublishedUrl(f["Post URL"]), publishedAt: t("Posted At"), updatedAt: t("Stats Updated At"), status: t("Stats Status") };
    return { id: row.id, source: "post", postName: linked?.postName || "", postType: t("Format") || linked?.postType || "", clientStatus: "", postingDate: "", platforms: [platform], previewUrl: linked?.previewUrl || "", media: linked?.media || [], topic: t("Topic") || linked?.topic || "", brandIds: linkIds(f.Brand), posted: { ...readPostCopy(f), coverUrl: safePublishedUrl(f.Cover), copyStatus: t("Copy Status") }, metrics };
  });
  for (const item of items) for (const p of METRIC_PLATFORMS) {
    const url = item.metrics[p].url;
    if (url && (p === "Instagram" || p === "TikTok") && keys.has(postKey(p, url))) item.metrics[p] = emptyMetrics();
  }
  return [...items, ...posts];
}
