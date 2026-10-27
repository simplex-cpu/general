// Copies long-form footage into the shared Drive folder: Apify downloader -> chunked resumable Drive upload.
// Each call moves at most one chunk so no request stays open for long; state lives in "Footage job".
import { createResumableSession, finalizeDriveFile } from "./googleDrive.server";
import { isFolderLink, COPY_LIMIT_BYTES } from "./slate/footageSource";
import { patchLongForm, type ClipperCtx, type LongForm } from "./longForm.server";

const ACTOR = "streamers~youtube-video-downloader";
const CHUNK = 64 * 1024 * 1024; // multiple of 256 KiB, as Drive requires
type Job = { run: string; kv: string; key?: string; fileUrl?: string; fails?: number; size?: number; session?: string; offset?: number; error?: string };

const apify = () => { const t = process.env.APIFY_API_TOKEN; if (!t) throw new Error("APIFY_API_TOKEN not configured"); return { Authorization: `Bearer ${t}` }; };
const readJob = (l: LongForm): Job | null => { try { return l.footageJob ? JSON.parse(l.footageJob) : null; } catch { return null; } };
const save = (ctx: ClipperCtx, id: string, job: Job | null, extra: Record<string, unknown> = {}) => patchLongForm(ctx, id, { "Footage job": job ? JSON.stringify(job) : "", ...extra });

export async function startFootageCopy(ctx: ClipperCtx, long: LongForm) {
  // Multi-file folders are stored as the original shared link; editors work from it directly.
  if (isFolderLink(long.url)) return long.footageFile ? long : patchLongForm(ctx, long.id, { "Footage file": long.url, "Footage job": "" });
  if (long.footageFile || readJob(long)?.run && !readJob(long)?.error) return long;
  const r = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs`, {
    method: "POST", headers: { ...apify(), "Content-Type": "application/json" },
    body: JSON.stringify({ videos: [{ url: long.url }], storeInKVStore: true, preferredQuality: "1080p", preferredFormat: "mp4" }),
  });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok || !d.data?.id) return save(ctx, long.id, { run: "", kv: "", error: `The footage copy could not start (${r.status}).` });
  return save(ctx, long.id, { run: d.data.id, kv: d.data.defaultKeyValueStoreId });
}

export type FootageState = { state: "none" | "saving" | "saved" | "failed"; url?: string; percent?: number; message?: string };
export function footageState(long: LongForm): FootageState {
  if (long.footageFile) return { state: "saved", url: long.footageFile };
  const job = readJob(long);
  if (!job) return { state: "none" };
  if (job.error) return { state: "failed", message: job.error };
  return { state: "saving", percent: job.size ? Math.round(((job.offset || 0) / job.size) * 100) : 0 };
}

/** Advances an in-flight copy by one step. Safe to call on every detail read. */
export async function advanceFootage(ctx: ClipperCtx, long: LongForm): Promise<LongForm> {
  const job = readJob(long);
  if (long.footageFile || !job || job.error || !job.run) return long;
  try {
    if (!job.key) {
      const run: any = await (await fetch(`https://api.apify.com/v2/actor-runs/${job.run}`, { headers: apify() })).json();
      const status = run?.data?.status;
      if (status === "RUNNING" || status === "READY") return long;
      if (status !== "SUCCEEDED") return save(ctx, long.id, { ...job, error: "The footage could not be downloaded from the source." });
      // The downloader stores the video in its own store and reports it as downloadedFileUrl on the dataset item.
      let fileUrl = "", size = 0;
      const items: any[] = await (await fetch(`https://api.apify.com/v2/actor-runs/${job.run}/dataset/items`, { headers: apify() })).json().catch(() => []);
      const reported = (Array.isArray(items) ? items : []).map((i) => i?.downloadedFileUrl).find((u) => typeof u === "string" && u.startsWith("https://api.apify.com/"));
      if (reported) {
        const head = await fetch(reported, { method: "HEAD", headers: apify() });
        if (head.ok) { fileUrl = reported; size = Number(head.headers.get("content-length")) || 0; }
      }
      if (!fileUrl) {
        const keys: any = await (await fetch(`https://api.apify.com/v2/key-value-stores/${job.kv}/keys`, { headers: apify() })).json();
        const k = (keys?.data?.items || []).filter((i: any) => /\.(mp4|mov|mkv|webm)$/i.test(i.key) || i.size > 5_000_000).sort((a: any, b: any) => b.size - a.size)[0];
        if (k) { fileUrl = `https://api.apify.com/v2/key-value-stores/${job.kv}/records/${encodeURIComponent(k.key)}`; size = k.size; }
      }
      if (!fileUrl || !size) return save(ctx, long.id, { ...job, error: "The downloader returned no video file. Check the link is public, then retry." });
      const item = { key: fileUrl, size };
      if (item.size > COPY_LIMIT_BYTES) return save(ctx, long.id, null, { "Footage file": long.url });
      const folderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID;
      if (!folderId) throw new Error("GOOGLE_DRIVE_SHARED_FOLDER_ID not configured");
      const filename = `${(long.name && !/^https?:/i.test(long.name) ? long.name : "Long form footage").replace(/[\\/:*?"<>|]/g, "").slice(0, 120)}.mp4`;
      const session = await createResumableSession({ filename, contentType: "video/mp4", folderId });
      return save(ctx, long.id, { ...job, key: item.key, fileUrl, size: item.size, session, offset: 0 });
    }
    const offset = job.offset || 0, size = job.size || 0;
    const end = Math.min(offset + CHUNK, size) - 1;
    const src = await fetch(job.fileUrl || `https://api.apify.com/v2/key-value-stores/${job.kv}/records/${encodeURIComponent(job.key)}`, { headers: { ...apify(), Range: `bytes=${offset}-${end}` } });
    if (!src.ok) throw new Error(`Source read failed (${src.status})`);
    const bytes = await src.arrayBuffer();
    const put = await fetch(job.session!, { method: "PUT", headers: { "Content-Range": `bytes ${offset}-${offset + bytes.byteLength - 1}/${size}` }, body: bytes });
    if (put.status === 308) return save(ctx, long.id, { ...job, fails: 0, offset: offset + bytes.byteLength });
    if (!put.ok) throw new Error(`Drive upload failed (${put.status})`);
    const file: any = await put.json();
    const drive = await finalizeDriveFile(file.id);
    return save(ctx, long.id, null, { "Footage file": `https://drive.google.com/file/d/${drive.id}/view` });
  } catch (e) {
    console.error("footage copy", e);
    // Transient errors retry on the next read; after 3 in a row the real reason is shown instead of an endless retry.
    const fails = (job.fails || 0) + 1;
    const reason = e instanceof Error ? e.message : "unknown error";
    return save(ctx, long.id, fails >= 3 ? { ...job, fails, error: `Saving to Drive failed (${reason}). Retry, or paste a Drive link to the footage instead.` } : { ...job, fails }).catch(() => long);
  }
}
