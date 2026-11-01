import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireAccessCode } from "@/lib/accessCode.server";
import { classifyPostType, POST_TYPE_LABEL, type PostType } from "@/lib/slate/postType";
import { transcribe, classifyVideo } from "@/lib/postTagging.server";


/**
 * Handle-based post collection for the Analyze tab.
 *
 * POST  /api/scrape-posts        -> start an Apify run for a public profile, returns { jobId }
 * GET   /api/scrape-posts?jobId= -> advances the job a little and returns progress
 *
 * The GET endpoint is intentionally "stepwise": each poll does a bounded slice
 * of work (check the scraper, or transcribe a couple of videos) so no single
 * request comes close to the edge runtime's execution budget. The client polls
 * until status === "ready" and then feeds the rows into /api/analyse exactly
 * like a CSV upload would.
 */

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

/** Default analysis window (days). Users can override between MIN/MAX_WINDOW_DAYS. */
const WINDOW_DAYS = 21;
export const MIN_WINDOW_DAYS = 7;
export const MAX_WINDOW_DAYS = 31;
/** Generous fetch ceiling; the exact rolling window boundary is enforced locally. */
const MAX_POSTS = 200;
/** Default ceiling on posts that go through transcription + analysis. */
const ANALYSIS_CAP = 44;
export const MIN_ANALYSIS_CAP = 15;
export const MAX_ANALYSIS_CAP = 45;
/** Videos transcribed per poll. Keeps each request short. */
const TRANSCRIBE_BATCH = 2;

function clampDays(v: unknown) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return WINDOW_DAYS;
  return Math.max(MIN_WINDOW_DAYS, Math.min(MAX_WINDOW_DAYS, n));
}

function clampCap(v: unknown) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return ANALYSIS_CAP;
  return Math.max(MIN_ANALYSIS_CAP, Math.min(MAX_ANALYSIS_CAP, n));
}

/**
 * The audit scope is either a date range OR a post count — never both.
 * - "days": every post published in the last N days (hard-capped at
 *   MAX_ANALYSIS_CAP by engagement so a high-volume account can't blow up
 *   transcription).
 * - "posts": the most recent N posts, whenever they were published.
 */
export type ScopeMode = "days" | "posts";

function clampMode(v: unknown): ScopeMode {
  return String(v ?? "").toLowerCase() === "posts" ? "posts" : "days";
}

/** How far back "last N posts" is allowed to reach when asking the scraper. */
const POSTS_MODE_LOOKBACK_DAYS = 365;

function windowCutoff(days = WINDOW_DAYS) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}



type ScrapedPost = {
  shortCode: string;
  url: string;
  caption: string;
  views: number;
  /** Distinguishes a true zero from a metric Instagram did not expose. */
  viewsAvailable: boolean;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  duration: number;
  originalAudio: boolean;
  videoUrl: string;
  /** first frame / cover image, the only visual signal we get from the scraper */
  coverUrl: string;
  profile: string;
  transcript: string;
  /** ISO timestamp of publication, used for the 21-day window */
  postedAt: string;
  /** raw media kind, used to rank graphics/carousels fairly */
  mediaType: "video" | "carousel" | "graphic";

  /** final category: talking | broll | carousel | graphic */
  postType?: PostType;
  /** why the category was chosen (debugging / transparency) */
  typeReason?: string;
  /** 0-1 confidence from the vision+audio classifier */
  typeConfidence?: number;
  /** null = not attempted yet */
  transcribed: boolean;
};


async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function apifyToken() {
  const t = process.env.APIFY_API_TOKEN;
  if (!t) throw new Error("APIFY_API_TOKEN not configured");
  return t;
}

function cleanHandle(raw: string) {
  return String(raw || "")
    // strip invisible/zero-width chars and non-breaking spaces people paste in
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060]/g, " ")
    .trim()
    // full or partial profile URLs, with or without protocol
    .replace(/^(https?:)?\/\//i, "")
    .replace(/^(www\.|m\.)/i, "")
    .replace(/^(instagram|tiktok)\.com\//i, "")
    // leading @ (possibly repeated or after the URL strip)
    .replace(/^@+/, "")
    // anything after a slash, query string or hash
    .replace(/[/?#].*$/, "")
    // any remaining whitespace inside the handle
    .replace(/\s+/g, "")
    .toLowerCase()
    .trim();
}

/* ------------------------- Apify ------------------------- */

async function startApifyRun(
  platform: string,
  handle: string,
  days = WINDOW_DAYS,
  mode: ScopeMode = "days",
  cap = ANALYSIS_CAP,
): Promise<string> {
  const token = apifyToken();
  const actor =
    platform === "tiktok" ? "clockworks~tiktok-scraper" : "apify~instagram-scraper";
  // "posts" mode has no date boundary: fetch a little extra so filtering out
  // non-eligible items still leaves `cap` usable posts.
  const lookbackDays = mode === "posts" ? POSTS_MODE_LOOKBACK_DAYS : days;
  const limit = mode === "posts" ? Math.min(MAX_POSTS, Math.max(cap * 2, cap + 10)) : MAX_POSTS;
  const cutoffIso = new Date(windowCutoff(lookbackDays)).toISOString().slice(0, 10);
  const input =
    platform === "tiktok"
      ? {
          profiles: [handle],
          resultsPerPage: limit,
          oldestPostDate: cutoffIso,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSubtitles: false,
        }
      : {
          directUrls: [`https://www.instagram.com/${handle}/`],
          resultsType: "posts",
          resultsLimit: limit,
          addParentData: false,
        };



  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.id) {
    throw new Error(data?.error?.message || `Apify start failed (${res.status})`);
  }
  return data.data.id as string;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Instagram exposes two different numbers: `videoPlayCount` (plays, the big
// number the app shows) and `videoViewCount` (a much smaller, differently
// defined metric — e.g. plays 1536 vs views 284 on the same reel). Mixing them
// in one ranked list is what made real reels look like flops, so plays always
// win and a view-only value is used only as a clearly-marked fallback.
function igViewCount(it: any): number | null {
  const child = Array.isArray(it?.childPosts) && it.childPosts.length === 1 ? it.childPosts[0] : null;
  const candidates = [
    it?.videoPlayCount,
    it?.igPlayCount,
    it?.playCount,
    it?.playsCount,
    it?.reelsVideoViewCount,
    it?.videoPlaysCount,
    child?.videoPlayCount,
    child?.playCount,
    // last resort: the smaller "views" metric
    it?.videoViewCount,
    it?.viewsCount,
    it?.videoViewsCount,
    child?.videoViewCount,
    child?.viewsCount,
  ];
  for (const value of candidates) {
    if (value == null || value === "") continue;
    const count = Number(value);
    if (Number.isFinite(count) && count >= 0) return count;
  }
  return null;
}

// Instagram returns -1 for likes when the owner hides the like count (common on
// collab posts owned by another account). -1 must never enter engagement maths.
function metricCount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}


function instagramItemBelongsToHandle(it: any, handle: string): boolean {
  const wanted = cleanHandle(handle).toLowerCase();
  if (!wanted) return false;
  if (String(it?.ownerUsername || "").toLowerCase() === wanted) return true;
  const collaborators = Array.isArray(it?.coauthorProducers) ? it.coauthorProducers : [];
  return collaborators.some((person: any) => String(person?.username || "").toLowerCase() === wanted);
}

async function startInstagramDetailRun(urls: string[]): Promise<string> {
  const token = apifyToken();
  const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directUrls: urls,
      resultsType: "posts",
      resultsLimit: urls.length,
      addParentData: false,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.id) {
    throw new Error(data?.error?.message || `Instagram detail scrape failed (${res.status})`);
  }
  return String(data.data.id);
}

/* --- Fallback Instagram scraper ---------------------------------------
 * The default actor cannot read profiles Instagram flags as age-restricted
 * ("You must be 18 years old or over to see this profile"): it returns a
 * single profile record with no posts. This second actor reads those
 * profiles, so it runs whenever the first pass comes back empty. Its run id
 * is stored with an "fb:" prefix so polling knows which shape to expect.
 */
const FALLBACK_PREFIX = "fb:";
const FALLBACK_PAGE_SIZE = 12;

export function isFallbackRun(runId: unknown) {
  return String(runId || "").startsWith(FALLBACK_PREFIX);
}

function bareRunId(runId: unknown) {
  return String(runId || "").replace(FALLBACK_PREFIX, "");
}

async function startInstagramFallbackRun(handle: string, wanted: number): Promise<string> {
  const token = apifyToken();
  const maxPages = Math.min(8, Math.max(2, Math.ceil((wanted + 6) / FALLBACK_PAGE_SIZE)));
  const res = await fetch(`https://api.apify.com/v2/acts/data-slayer~instagram-posts/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: handle, maxPages }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.id) {
    throw new Error(data?.error?.message || `Instagram fallback scrape failed (${res.status})`);
  }
  return `${FALLBACK_PREFIX}${data.data.id}`;
}

// Reshape fallback actor items into the field names mapItems() expects.
function normalizeFallbackItems(items: any[]): any[] {
  const list = Array.isArray(items) ? items : [];
  const typeOf = (mediaType: unknown) =>
    String(mediaType) === "2" ? "Video" : String(mediaType) === "8" ? "Sidecar" : "Image";
  const bestVideo = (it: any) =>
    String(
      it?.video_url ||
        (Array.isArray(it?.video_versions) ? it.video_versions[0]?.url : "") ||
        "",
    );
  const cover = (it: any) =>
    String(
      it?.thumbnail_url ||
        it?.image_versions?.items?.[0]?.url ||
        it?.image_versions?.additional_items?.first_frame?.url ||
        "",
    );
  return list
    .filter((it) => it?.code)
    .map((it) => {
      const children = Array.isArray(it?.carousel_media) ? it.carousel_media : [];
      return {
        shortCode: String(it.code),
        url: `https://www.instagram.com/p/${it.code}/`,
        caption: String(it?.caption?.text || ""),
        timestamp: it?.taken_at_date || it?.taken_at || it?.taken_at_ts,
        likesCount: it?.like_count,
        commentsCount: it?.comment_count,
        videoPlayCount: it?.play_count ?? it?.ig_play_count ?? null,
        videoDuration: it?.video_duration,
        videoUrl: bestVideo(it),
        displayUrl: cover(it),
        type: typeOf(it?.media_type),
        productType: String(it?.product_type || ""),
        isVideo: it?.is_video === true,
        ownerUsername: String(it?.user?.username || ""),
        coauthorProducers: Array.isArray(it?.coauthor_producers) ? it.coauthor_producers : [],
        childPosts: children.map((child: any) => ({
          type: typeOf(child?.media_type),
          videoUrl: bestVideo(child),
          displayUrl: cover(child),
        })),
      };
    });
}

// The default actor's "this profile is restricted / no posts visible" signal.
function looksBlockedByInstagram(items: any[]): boolean {
  const first = Array.isArray(items) ? items[0] : null;
  if (!first) return false;
  return Boolean(first.isRestrictedProfile || first.error || first.restrictionReason);
}


function igMediaType(it: any): "video" | "carousel" | "graphic" {
  const type = String(it?.type || "").toLowerCase();
  const product = String(it?.productType || "").toLowerCase();
  const children = Array.isArray(it?.childPosts) ? it.childPosts : [];
  // 1. Carousels: explicit sidecar type, or more than one child media.
  if (type === "sidecar" || type === "carousel" || children.length > 1) return "carousel";
  // 2. Explicit still-image metadata always wins. Image records can carry a
  //    video-shaped preview URL, which must never turn a graphic into B-roll.
  if (type === "image" || type === "photo" || type === "graphic") return "graphic";
  // 3. Explicit video metadata.
  if (type === "video" || product === "clips" || product === "igtv" || product === "reels") return "video";
  if (it?.isVideo === true) return "video";
  // 4. Last resort: a single-child sidecar inherits the child's kind.
  if (children.length === 1) return igMediaType(children[0]);
  // 5. A real playable video URL (not a thumbnail) implies video.
  if (typeof it?.videoUrl === "string" && it.videoUrl.startsWith("http")) return "video";
  return "graphic";
}

function isoDate(v: unknown): string {
  const s = String(v || "");
  if (!s) return "";
  const t = Date.parse(s);
  if (Number.isFinite(t)) return new Date(t).toISOString();
  const n = Number(v);
  // Some actors return unix seconds.
  if (Number.isFinite(n) && n > 1e9) return new Date(n * 1000).toISOString();
  return "";
}

function mapItems(
  platform: string,
  items: any[],
  handle: string,
  days = WINDOW_DAYS,
  cap = ANALYSIS_CAP,
  mode: ScopeMode = "days",
): ScrapedPost[] {
  const list = Array.isArray(items) ? items : [];
  const mapped: ScrapedPost[] = [];
  for (const it of list) {
    if (platform === "tiktok") {
      if (!it?.id && !it?.webVideoUrl) continue;
      mapped.push({
        shortCode: String(it.id || ""),
        url: String(it.webVideoUrl || ""),
        caption: String(it.text || ""),
        views: num(it.playCount),
        viewsAvailable: it.playCount != null,
        likes: num(it.diggCount),
        comments: num(it.commentCount),
        saves: num(it.collectCount),
        shares: num(it.shareCount),
        duration: num(it.videoMeta?.duration),
        originalAudio: it.musicMeta?.musicOriginal !== false,
        videoUrl: String(it.mediaUrls?.[0] || it.videoMeta?.downloadAddr || ""),
        coverUrl: String(it.videoMeta?.coverUrl || it.videoMeta?.originalCoverUrl || it.covers?.[0] || ""),
        profile: String(it.authorMeta?.name || handle),
        postedAt: isoDate(it.createTimeISO || it.createTime),
        mediaType: "video",
        transcript: "",
        transcribed: false,
      });
    } else {
      if (!it?.shortCode) continue;
      // Instagram collaboration posts can be authored by another account while
      // still appearing in the requested profile's feed. Keep those posts when
      // the actor marks the requested profile as the input/coauthor.
      if (!instagramItemBelongsToHandle(it, handle)) continue;
      // Only video posts can be transcribed; still keep images for the metrics.
      const viewCount = igViewCount(it);
      mapped.push({
        shortCode: String(it.shortCode),
        url: String(it.url || `https://www.instagram.com/reel/${it.shortCode}/`),
        caption: String(it.caption || ""),
        views: viewCount ?? 0,
        viewsAvailable: viewCount != null,
        likes: metricCount(it.likesCount),
        comments: metricCount(it.commentsCount),
        saves: 0,
        shares: 0,
        duration: num(it.videoDuration),
        originalAudio: it.musicInfo?.uses_original_audio ?? true,
        videoUrl: String(it.videoUrl || ""),
        coverUrl: String(it.displayUrl || it.images?.[0] || it.childPosts?.[0]?.displayUrl || ""),
        profile: handle,
        postedAt: isoDate(it.timestamp),
        mediaType: igMediaType(it),
        transcript: "",
        transcribed: false,
      });
    }
  }

  const byNewest = (a: ScrapedPost, b: ScrapedPost) =>
    Date.parse(b.postedAt || "0") - Date.parse(a.postedAt || "0");

  // "posts" mode: the most recent N posts, no date boundary at all.
  if (mode === "posts") {
    const dated = [...mapped].sort(byNewest);
    return dated.slice(0, cap);
  }

  // "days" mode: enforce the rolling window here too — actor date filters are
  // best-effort only.
  const cutoff = windowCutoff(days);
  const inWindow = mapped.filter((p) => {
    if (!p.postedAt) return false; // undated posts can't be placed in the window
    return Date.parse(p.postedAt) >= cutoff;
  });

  // Safety ceiling: an account posting hundreds of times in the window would
  // blow up transcription, so keep the strongest MAX_ANALYSIS_CAP performers.
  if (inWindow.length > MAX_ANALYSIS_CAP) {
    const engagement = (p: ScrapedPost) => p.likes + p.comments + p.saves + p.shares;
    const rate = (p: ScrapedPost) =>
      p.viewsAvailable && p.views > 0 ? engagement(p) / p.views : 0;
    const capped = [...inWindow].sort((a, b) => {
      const d = engagement(b) - engagement(a);
      if (d !== 0) return d;
      return rate(b) - rate(a);
    }).slice(0, MAX_ANALYSIS_CAP);
    capped.sort(byNewest);
    return capped;
  }

  inWindow.sort(byNewest);
  return inWindow;


}


/* ------------------------- Route ------------------------- */

export const Route = createFileRoute("/api/scrape-posts")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as {
            handle?: string;
            platform?: string;
            accessCode?: string;
            scopeMode?: string;
            windowDays?: number;
            maxPosts?: number;
          };
          const scopeMode = clampMode(body.scopeMode);
          const windowDays = clampDays(body.windowDays);
          const analysisCap = clampCap(body.maxPosts);
          const auth = await requireAccessCode(body.accessCode);
          if (!auth.ok) return auth.response;

          const handle = cleanHandle(body.handle || "");
          const platform = body.platform === "tiktok" ? "tiktok" : "instagram";
          if (!handle || !/^[A-Za-z0-9._-]{1,60}$/.test(handle)) {
            return json({ error: "Enter a valid public profile handle." }, 400);
          }

          const runId = await startApifyRun(platform, handle, windowDays, scopeMode, analysisCap);
          const supabase = await db();
          const { data, error } = await supabase
            .from("content_scrape_jobs")
            .insert({
              access_code: String(body.accessCode || "").slice(0, 200),
              platform,
              handle,
              status: "scraping",
              run_id: runId,
            })
            .select("id")
            .single();
          if (error) throw new Error(error.message);

          return json({ jobId: data.id, handle, platform });
        } catch (e: any) {
          console.error("/api/scrape-posts POST", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },

      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const jobId = url.searchParams.get("jobId") || "";
          const scopeMode = clampMode(url.searchParams.get("scopeMode"));
          const windowDays = clampDays(url.searchParams.get("windowDays"));
          const analysisCap = clampCap(url.searchParams.get("maxPosts"));
          const accessCode = url.searchParams.get("accessCode") || request.headers.get("x-access-code");
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          if (!jobId) return json({ error: "jobId required" }, 400);

          const supabase = await db();
          const { data: job, error } = await supabase
            .from("content_scrape_jobs")
            .select("*")
            .eq("id", jobId)
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!job) return json({ error: "Job not found" }, 404);
          if (job.access_code !== String(accessCode || "")) {
            return json({ error: "Not allowed" }, 403);
          }

          const fail = async (msg: string) => {
            await supabase
              .from("content_scrape_jobs")
              .update({ status: "error", error: msg, updated_at: new Date().toISOString() })
              .eq("id", jobId);
            return json({ status: "error", error: msg });
          };

          /* ---- phase 1: waiting on the scraper ---- */
          if (job.status === "scraping") {
            const token = apifyToken();
            const usingFallback = isFallbackRun(job.run_id);
            const st = await fetch(
              `https://api.apify.com/v2/actor-runs/${bareRunId(job.run_id)}?token=${token}`,
            );
            const stData = await st.json();
            const runStatus = stData?.data?.status;
            if (runStatus === "FAILED" || runStatus === "ABORTED" || runStatus === "TIMED-OUT") {
              return await fail("The scraper could not read that profile. Check the handle is correct and public.");
            }
            if (runStatus !== "SUCCEEDED") {
              return json({
                status: "scraping",
                phase: scopeMode === "posts"
                  ? `Collecting the last ${analysisCap} posts`
                  : `Auditing the last ${windowDays} days of posts`,
                done: 0,
                total: analysisCap,
              });
            }
            const datasetId = stData?.data?.defaultDatasetId;
            const itemsRes = await fetch(
              `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=${MAX_POSTS}`,
            );
            const rawItems = await itemsRes.json();
            const items =
              job.platform === "instagram" && usingFallback ? normalizeFallbackItems(rawItems) : rawItems;
            const posts = mapItems(job.platform, items, job.handle, windowDays, analysisCap, scopeMode);
            if (!posts.length) {
              const list = Array.isArray(items) ? items : [];
              // Count real post records: a restricted profile comes back as one
              // profile-shaped record carrying an error, not as posts.
              const rawCount =
                job.platform === "instagram" ? list.filter((it: any) => it?.shortCode).length : list.length;
              // Age-restricted or otherwise gated profiles return no posts from
              // the default actor: retry once with the fallback one.
              if (job.platform === "instagram" && !usingFallback && rawCount === 0) {
                const fallbackRunId = await startInstagramFallbackRun(job.handle, analysisCap);
                await supabase
                  .from("content_scrape_jobs")
                  .update({ run_id: fallbackRunId, updated_at: new Date().toISOString() })
                  .eq("id", jobId);
                return json({
                  status: "scraping",
                  phase: `Reading @${job.handle}'s posts`,
                  done: 0,
                  total: analysisCap,
                });
              }
              if (rawCount > 0 && scopeMode === "days") {
                return await fail(
                  `@${job.handle} hasn't posted in the last ${windowDays} days. Widen the date range, or audit by post count instead.`,
                );
              }
              if (looksBlockedByInstagram(rawItems)) {
                return await fail(
                  `Instagram is not showing @${job.handle}'s posts publicly (the profile is private or age restricted), so it can't be audited.`,
                );
              }
              return await fail(`We couldn't find a public profile called @${job.handle}. Check the username is exactly right and the account is public.`);
            }
            // Feed scrapes occasionally omit plays for an otherwise complete
            // video record. Re-scraping those post URLs directly returns the
            // detail metric reliably, so enrich before ranking or transcribing.
            const missingViewUrls = job.platform === "instagram"
              ? posts.filter((p) => p.mediaType === "video" && !p.viewsAvailable && p.url).map((p) => p.url)
              : [];
            if (missingViewUrls.length) {
              const detailRunId = await startInstagramDetailRun(missingViewUrls);
              await supabase
                .from("content_scrape_jobs")
                .update({
                  status: "enriching",
                  run_id: detailRunId,
                  posts,
                  cursor: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", jobId);
              return json({
                status: "enriching",
                phase: "Confirming video play counts",
                done: posts.length - missingViewUrls.length,
                total: posts.length,
              });
            }

            await supabase
              .from("content_scrape_jobs")
              .update({
                status: "transcribing",
                posts,
                cursor: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", jobId);
            return json({
              status: "transcribing",
              phase: "Transcribing the audio",
              done: 0,
              total: posts.length,
            });
          }

          /* ---- phase 1b: enrich missing Instagram video play counts ---- */
          if (job.status === "enriching") {
            const token = apifyToken();
            const st = await fetch(`https://api.apify.com/v2/actor-runs/${job.run_id}?token=${token}`);
            const stData = await st.json();
            const runStatus = stData?.data?.status;
            if (runStatus === "FAILED" || runStatus === "ABORTED" || runStatus === "TIMED-OUT") {
              return await fail("Instagram did not return the missing video play counts. Please retry the analysis.");
            }
            const posts = (job.posts as ScrapedPost[]) || [];
            const missingBefore = posts.filter((p) => p.mediaType === "video" && !p.viewsAvailable).length;
            if (runStatus !== "SUCCEEDED") {
              return json({
                status: "enriching",
                phase: "Confirming video play counts",
                done: posts.length - missingBefore,
                total: posts.length,
              });
            }
            const datasetId = stData?.data?.defaultDatasetId;
            const detailRes = await fetch(
              `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=${MAX_POSTS}`,
            );
            const detailItems = await detailRes.json();
            const viewsByShortcode = new Map<string, number>();
            for (const item of Array.isArray(detailItems) ? detailItems : []) {
              const count = igViewCount(item);
              if (item?.shortCode && count != null) viewsByShortcode.set(String(item.shortCode), count);
            }
            for (const post of posts) {
              const count = viewsByShortcode.get(post.shortCode);
              if (count != null) {
                post.views = count;
                post.viewsAvailable = true;
              }
            }
            // Collaboration reels can still have no public play metric even in
            // a direct-post response. Keep them in the 21-day analysis, with
            // views left unknown (never fabricated as zero); the ranker then
            // evaluates those rows on their available reaction signals only.
            await supabase
              .from("content_scrape_jobs")
              .update({
                status: "transcribing",
                posts,
                cursor: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", jobId);
            return json({
              status: "transcribing",
              phase: "Transcribing the audio",
              done: 0,
              total: posts.length,
            });
          }

          /* ---- phase 2: transcribe a small batch ---- */
          if (job.status === "transcribing") {
            const posts = (job.posts as ScrapedPost[]) || [];
            let cursor = Number(job.cursor || 0);
            let videosDone = 0;
            // Non-video posts cost nothing, so consume them freely and only
            // budget the expensive transcriptions per poll.
            while (cursor < posts.length && videosDone < TRANSCRIBE_BATCH) {
              const p = posts[cursor];
              const isVideo = p.mediaType === "video";
              let transcriptAvailable = false;
              if (isVideo && p.videoUrl) {
                videosDone++;
                try {
                  p.transcript = await transcribe(p.videoUrl);
                  transcriptAvailable = true;
                } catch (e) {
                  console.warn("[scrape-posts] transcription retrying", p.shortCode, e);
                  try {
                    p.transcript = await transcribe(p.videoUrl);
                    transcriptAvailable = true;
                  } catch (e2) {
                    // Audio unavailable (expired CDN link, oversized file). This is
                    // NOT evidence of B-roll, so the vision check decides instead.
                    console.warn("[scrape-posts] transcription skipped", p.shortCode, e2);
                    p.transcript = "";
                  }
                }
              }
              // Categorise here, once, so the analyser never has to re-decide.
              // Carousels and still graphics are settled by media kind alone and
              // never touch the transcriber or the classifier model.
              const cls = classifyPostType({
                mediaKind: p.mediaType,
                transcript: p.transcript,
                duration: p.duration,
                usesOriginalAudio: p.originalAudio,
              });
              p.postType = cls.type;
              p.typeReason = cls.reason;

              if (isVideo) {
                // A video with no downloadable audio still costs a vision call,
                // so it must count against the per-poll budget.
                if (!p.videoUrl) videosDone++;
                // Vision + audio together are the authority for videos. The regex
                // heuristics above are only the fallback when the model can't answer.
                const verdict = await classifyVideo({
                  transcript: p.transcript,
                  caption: p.caption,
                  duration: p.duration,
                  coverUrl: p.coverUrl,
                  transcriptAvailable,
                });
                if (verdict) {
                  p.postType = verdict.type;
                  p.typeConfidence = verdict.confidence;
                  p.typeReason =
                    verdict.type === cls.type
                      ? `${verdict.reason} (heuristic agreed: ${cls.reason})`
                      : `${verdict.reason} (overrode heuristic: ${cls.reason})`;
                } else if (!transcriptAvailable && p.videoUrl) {
                  p.typeReason = `${cls.reason} (no audio, no vision verdict)`;
                }
              }
              p.transcribed = true;
              cursor++;
            }




            const finished = cursor >= posts.length;
            await supabase
              .from("content_scrape_jobs")
              .update({
                posts,
                cursor,
                status: finished ? "ready" : "transcribing",
                updated_at: new Date().toISOString(),
              })
              .eq("id", jobId);

            if (!finished) {
              return json({
                status: "transcribing",
                phase: "Transcribing the audio",
                done: cursor,
                total: posts.length,
              });
            }
            return json({
              status: "ready",
              phase: "Ready",
              done: posts.length,
              total: posts.length,
              platform: job.platform,
              handle: job.handle,
              rows: toRows(job.platform, posts),
            });
          }

          if (job.status === "ready") {
            const posts = (job.posts as ScrapedPost[]) || [];
            return json({
              status: "ready",
              phase: "Ready",
              done: posts.length,
              total: posts.length,
              platform: job.platform,
              handle: job.handle,
              rows: toRows(job.platform, posts),
            });
          }

          return json({ status: "error", error: job.error || "Job failed." });
        } catch (e: any) {
          console.error("/api/scrape-posts GET", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);

/** Shape the scraped posts exactly like the CSV rows the analyser already expects. */
function toRows(platform: string, posts: ScrapedPost[]): Record<string, string>[] {
  return posts.map((p) => {
    const row: Record<string, string> = {
      Profile: p.profile,
      Views: p.viewsAvailable ? String(p.views) : "",
      Likes: String(p.likes),
      Comments: String(p.comments),
      Transcript: p.transcript || p.caption || "",
      Caption: p.caption || "",
      PostedAt: p.postedAt || "",
      MediaType: p.mediaType || "video",
      PostType: p.postType ? POST_TYPE_LABEL[p.postType] : "",
      TypeReason: p.typeReason || "",
      TypeConfidence: p.typeConfidence != null ? String(Math.round(p.typeConfidence * 100)) : "",
    };

    if (platform === "tiktok") {
      row.TikTok = p.url;
      row.Saves = String(p.saves);
      row.Shares = String(p.shares);
    } else {
      row.Reel = p.url;
    }
    return row;
  });
}
