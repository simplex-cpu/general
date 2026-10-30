import { detectInspoPlatform, postUrl } from "./slate/inspoValidation";
import { classifyPostType } from "./slate/postType";

/** A targeted single-post lookup; no profile analysis, transcription or vision calls. */
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? String(Math.round(v)) : "");
export async function lookupInspoMetadata(value: string) {
  const url = postUrl.parse(value);
  const platform = detectInspoPlatform(url);
  if (platform !== "Instagram" && platform !== "TikTok") return { platform };
  const token = process.env.APIFY_API_TOKEN;
  if (!token)
    throw new Error("Post details cannot be retrieved right now. You can still save this post.");
  const actor = platform === "TikTok" ? "clockworks~tiktok-scraper" : "apify~instagram-scraper";
  const input =
    platform === "TikTok"
      ? {
          postURLs: [url],
          resultsPerPage: 1,
          shouldDownloadVideos: true,
          shouldDownloadCovers: false,
          shouldDownloadSubtitles: false,
        }
      : { directUrls: [url], resultsType: "posts", resultsLimit: 1, addParentData: false };
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=35`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok)
    throw new Error(
      "Post details are unavailable. Save the post and edit its details in the table.",
    );
  const items = (await res.json()) as Record<string, any>[];
  const item = items[0];
  if (!item || item.error)
    throw new Error("This post's details could not be retrieved. You can still save it.");
  const rawDate = item.timestamp || item.createTimeISO || item.createTime;
  const date = rawDate ? new Date(typeof rawDate === "number" ? rawDate * 1000 : rawDate) : null;
  const type = String(item.type || "").toLowerCase();
  const carousel =
    type === "sidecar" || type === "carousel" || item.childPosts?.length > 1 || item.isSlideshow;
  const still = type === "image" || type === "photo";
  const transcript = String(item.transcript || "").trim();
  let format = "";
  if (carousel || still || transcript) {
    const result = classifyPostType({
      mediaKind: carousel ? "carousel" : still ? "graphic" : "video",
      transcript,
      duration: item.videoDuration || item.videoMeta?.duration,
    });
    format = {
      talking: "Talking Video",
      broll: "B-roll",
      carousel: "Carousel",
      graphic: "Graphic",
    }[result.type];
  }
  const firstUrl = (...v: unknown[]) =>
    v.find((x) => typeof x === "string" && /^https:/.test(x)) as string | undefined;
  const videoUrl = firstUrl(item.videoUrl, item.mediaUrls?.[0], item.videoMeta?.downloadAddr);
  const imageUrls: string[] = (
    item.childPosts?.length
      ? item.childPosts.map((c: any) => c.displayUrl)
      : item.images?.length
        ? item.images
        : item.slideshowImageLinks?.length
          ? item.slideshowImageLinks.map((l: any) => l.downloadLink || l.tiktokLink)
          : [item.displayUrl || item.videoMeta?.coverUrl || item.videoMeta?.originalCoverUrl || item.covers?.[0] || item.thumbnailUrl]
  ).filter((x: unknown): x is string => typeof x === "string" && /^https:/.test(x));
  return {
    videoUrl: carousel || still ? undefined : videoUrl,
    imageUrls,
    platform,
    handle: String(item.ownerUsername || item.authorMeta?.name || "").slice(0, 200),
    copy: String(item.caption || item.text || transcript || "").slice(0, 20000),
    postedDate: date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "",
    format,
    views: num(item.videoViewCount ?? item.videoPlayCount ?? item.playCount),
    likes: num(item.likesCount ?? item.diggCount),
    comments: num(item.commentsCount ?? item.commentCount),
  };
}
