import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

/**
 * Turns a TikTok / Instagram post link into a playable media URL, and proxies
 * the bytes so the browser can decode them (the CDNs block cross-origin reads).
 * The actual audio extraction happens in the browser (no ffmpeg in this runtime).
 */

const APIFY = "https://api.apify.com/v2";
const POLL_BUDGET_MS = 100_000;

function apifyToken() {
  const t = process.env.APIFY_API_TOKEN;
  if (!t) throw new Error("APIFY_API_TOKEN not configured");
  return t;
}

function platformOf(url: string): "tiktok" | "instagram" | null {
  const u = url.toLowerCase();
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/instagram\.com/.test(u)) return "instagram";
  return null;
}

function normalizeLink(raw: string) {
  let url = String(raw || "")
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060]/g, "")
    .trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;
  return url;
}

const ALLOWED_MEDIA_HOSTS =
  /(cdninstagram\.com|fbcdn\.net|instagram\.com|tiktokcdn(-us|-eu)?\.com|tiktokcdn\.us|tiktokv\.com|muscdn\.com|byteoversea\.com|akamaized\.net|ttwstatic\.com)$/i;

function hostAllowed(url: string) {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_MEDIA_HOSTS.test(host);
  } catch {
    return false;
  }
}

async function startRun(actor: string, input: unknown): Promise<string> {
  const token = apifyToken();
  const res = await fetch(`${APIFY}/acts/${actor}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.id) {
    throw new Error(data?.error?.message || `Could not read that link (${res.status})`);
  }
  return String(data.data.id);
}

async function runAndReadFirstItem(actor: string, input: unknown): Promise<any | null> {
  const token = apifyToken();
  const runId = await startRun(actor, input);
  const started = Date.now();
  while (Date.now() - started < POLL_BUDGET_MS) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(`${APIFY}/actor-runs/${runId}?token=${token}`);
    const sj: any = await st.json().catch(() => ({}));
    const status = String(sj?.data?.status || "");
    if (status === "SUCCEEDED") {
      const datasetId = sj?.data?.defaultDatasetId;
      if (!datasetId) return null;
      const items = await fetch(`${APIFY}/datasets/${datasetId}/items?token=${token}&limit=3`);
      const list: any = await items.json().catch(() => []);
      return Array.isArray(list) ? list[0] || null : null;
    }
    if (["FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"].includes(status)) {
      throw new Error("That link could not be read. Check it is a public post.");
    }
  }
  throw new Error("Reading that link took too long. Please try again.");
}

function firstUrl(...values: unknown[]): string {
  for (const v of values) {
    const s = String(v || "").trim();
    if (/^https?:\/\//i.test(s)) return s;
  }
  return "";
}

function slugOf(url: string) {
  const m = url.match(/\/(?:reel|reels|p|video)\/([A-Za-z0-9_-]+)/);
  return (m?.[1] || String(Date.now())).slice(0, 24);
}

export const Route = createFileRoute("/api/music-extract")({
  server: {
    handlers: {
      // Byte proxy so the browser can decode the media (CDNs disallow CORS).
      GET: async ({ request }) => {
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const target = new URL(request.url).searchParams.get("media") || "";
        if (!hostAllowed(target)) {
          return Response.json({ error: "That media link is not supported" }, { status: 400 });
        }
        const upstream = await fetch(target, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            Accept: "*/*",
          },
        });
        if (!upstream.ok || !upstream.body) {
          return Response.json(
            { error: `Could not download the audio (${upstream.status})` },
            { status: 502 },
          );
        }
        return new Response(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
            "Cache-Control": "no-store",
          },
        });
      },

      POST: async ({ request }) => {
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const url = normalizeLink(body?.url);
        const platform = url ? platformOf(url) : null;
        if (!platform) {
          return Response.json(
            { error: "Paste a public TikTok or Instagram post link." },
            { status: 400 },
          );
        }

        try {
          if (platform === "tiktok") {
            const item = await runAndReadFirstItem("clockworks~tiktok-scraper", {
              postURLs: [url],
              resultsPerPage: 1,
              shouldDownloadVideos: false,
              shouldDownloadCovers: false,
              shouldDownloadSubtitles: false,
            });
            const audio = firstUrl(item?.musicMeta?.playUrl, item?.musicMeta?.musicUrl);
            const video = firstUrl(
              item?.mediaUrls?.[0],
              item?.videoMeta?.downloadAddr,
              item?.webVideoUrl && "",
            );
            const media = audio || video;
            if (!media) {
              return Response.json(
                { error: "No sound found on that post. Try another link." },
                { status: 404 },
              );
            }
            return Response.json({
              kind: audio ? "audio" : "video",
              mediaUrl: media,
              title: String(item?.musicMeta?.musicName || "").trim(),
              filename: `music-${slugOf(url)}.mp3`,
            });
          }

          const item = await runAndReadFirstItem("apify~instagram-scraper", {
            directUrls: [url],
            resultsType: "posts",
            resultsLimit: 1,
            addParentData: false,
          });
          const media = firstUrl(
            item?.videoUrl,
            item?.videoUrlBackup,
            Array.isArray(item?.childPosts) ? item.childPosts[0]?.videoUrl : "",
          );
          if (!media) {
            return Response.json(
              { error: "That post has no video sound. Try a reel link." },
              { status: 404 },
            );
          }
          return Response.json({
            kind: "video",
            mediaUrl: media,
            title: String(item?.musicInfo?.song_name || "").trim(),
            filename: `music-${slugOf(url)}.mp3`,
          });
        } catch (e: any) {
          return Response.json(
            { error: e?.message || "Could not read that link." },
            { status: 502 },
          );
        }
      },
    },
  },
});
