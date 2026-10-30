import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief, brandRequest, ensureBriefBrand, BriefOwnerMissing } from "@/lib/brands.server";
import { readHomeContent } from "@/lib/home.server";
import { scrapedStats, scrapedMedia, profileBlockReason, scrapeFailureKind, BLOCKED_MESSAGE, MISSING_MESSAGE, deriveHook, PLANNER_POST_TYPE, type RefreshPlatform } from "@/lib/slate/statsRefresh";
import { buildPostUpserts, scrapedPostMeta } from "@/lib/slate/postsTable";
import { readBrandPosts, writePosts, linkIds, type PostRow } from "@/lib/posts.server";
import { classifyPostType } from "@/lib/slate/postType";
import { transcribe, classifyVideo, assignTopic } from "@/lib/postTagging.server";
import { minePostCopy } from "@/lib/minePostCopy.server";
import { postCopyFields } from "@/lib/slate/postCopy";
const TAG_BATCH = 2;
const needsTag = (r: PostRow) => !String(r.fields.Topic || "").trim() || !String(r.fields.Format || "").trim() || r.fields["Copy Status"] !== "Complete";

const BRIEFS = "tblkV5xOB2D1N5dNH";
const CONTENT = "tblucGgVsDiDGdyyK";
const MAX_POSTS = 100;
const MAX_PARALLEL = 3;
const body = z.union([
  z.object({ action: z.literal("start"), brandId: z.string().regex(/^rec[A-Za-z0-9]{14}$/), platform: z.enum(["Instagram", "TikTok"]), handle: z.string().max(200).optional(), attempt: z.number().int().min(0).max(2).default(0) }),
  z.object({ action: z.enum(["finish", "tag"]), brandId: z.string().regex(/^rec[A-Za-z0-9]{14}$/), platform: z.enum(["Instagram", "TikTok"]), runId: z.string().regex(/^[A-Za-z0-9]{8,40}$/), processedIds: z.array(z.string().regex(/^rec[A-Za-z0-9]{14}$/)).max(1000).default([]) }),
]);
const briefField = (p: RefreshPlatform) => (p === "TikTok" ? "Tiktok User" : "Instagram User");
const clean = (raw: string) => String(raw || "").trim().replace(/^(https?:)?\/\//i, "").replace(/^(www\.|m\.)/i, "").replace(/^(instagram|tiktok)\.com\//i, "").replace(/^@+/, "").replace(/[/?#].*$/, "").replace(/\s+/g, "").toLowerCase();

export const Route = createFileRoute("/api/home-refresh-stats")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const parsed = body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
        const token = process.env.AIRTABLE_TOKEN, apify = process.env.APIFY_API_TOKEN;
        if (!token || !apify) return Response.json({ error: "Statistics refresh is not configured." }, { status: 500 });
        const { platform, brandId } = parsed.data;
        try {
          const brief = await selectedBrief(auth.record, token, brandId);
          if (!brief) return Response.json({ error: "This brand is unavailable." }, { status: 404 });
          if (parsed.data.action === "start") {
            let handle = clean(String(brief.fields?.[briefField(platform)] || ""));
            const given = clean(parsed.data.handle || "");
            if (given) {
              handle = given;
              await brandRequest(token, `${BRIEFS}/${brief.id}`, { method: "PATCH", body: JSON.stringify({ fields: { [briefField(platform)]: `@${given}` } }) });
            }
            if (!/^[a-z0-9._]{1,40}$/.test(handle)) return Response.json({ needsHandle: true });
            const attempt = parsed.data.attempt;
            // Attempts 0-1 use the main reader on fresh residential sessions; the last attempt switches reader.
            const actor = platform === "TikTok" ? "clockworks~tiktok-scraper" : attempt >= 2 ? "apify~instagram-post-scraper" : "apify~instagram-scraper";
            const proxy = { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] };
            const input = platform === "TikTok"
              ? { profiles: [handle], resultsPerPage: MAX_POSTS, shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false, proxyConfiguration: proxy }
              : attempt >= 2 ? { username: [handle], resultsLimit: MAX_POSTS, proxy }
              : { directUrls: [`https://www.instagram.com/${handle}/`], resultsType: "posts", resultsLimit: MAX_POSTS, addParentData: false, proxy };
            const apifyAuth = { Authorization: `Bearer ${apify}` };
            // One read per profile at a time, and at most MAX_PARALLEL reads per platform.
            const active: any = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?status=RUNNING&desc=1&limit=20`, { headers: apifyAuth }).then((x) => x.json()).catch(() => ({}));
            const running: any[] = active?.data?.items || [];
            for (const run of running.slice(0, 10)) {
              const prev: any = await fetch(`https://api.apify.com/v2/key-value-stores/${run.defaultKeyValueStoreId}/records/INPUT`, { headers: apifyAuth }).then((x) => x.json()).catch(() => null);
              const target = JSON.stringify(prev?.profiles || prev?.username || prev?.directUrls || "").toLowerCase();
              if (target.includes(`"${handle}"`) || target.includes(`/${handle}/`)) return Response.json({ runId: run.id, handle, joined: true });
            }
            if (running.length >= MAX_PARALLEL) return Response.json({ queued: true });
            const r = await fetch(`https://api.apify.com/v2/acts/${actor}/runs`, { method: "POST", headers: { ...apifyAuth, "Content-Type": "application/json" }, body: JSON.stringify(input) });
            const data: any = await r.json().catch(() => ({}));
            if (!r.ok || !data?.data?.id) { console.error("[refresh-stats] apify start", r.status, JSON.stringify(data).slice(0, 300)); return Response.json({ error: "Couldn't start reading your profile. Please try again later." }, { status: 502 }); }
            return Response.json({ runId: data.data.id, handle });
          }
          const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${parsed.data.runId}`, { headers: { Authorization: `Bearer ${apify}` } });
          const run: any = await runRes.json().catch(() => ({}));
          const status = run?.data?.status;
          if (status === "READY" || status === "RUNNING") return Response.json({ status: "running" });
          if (status !== "SUCCEEDED") return Response.json({ error: "Reading your profile didn't finish. Please try again." }, { status: 502 });
          const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?clean=true&limit=${MAX_POSTS}`, { headers: { Authorization: `Bearer ${apify}` } });
          const items: any[] = await itemsRes.json().catch(() => []);
          const list = Array.isArray(items) ? items : [];
          const blocked = profileBlockReason(platform, list);
          if (blocked) return Response.json({ error: blocked }, { status: 422 });
          const failure = scrapeFailureKind(platform, list);
          if (failure === "blocked") { console.warn("[refresh-stats] blocked", parsed.data.runId); return Response.json({ status: "blocked", message: BLOCKED_MESSAGE(platform) }); }
          if (failure === "missing") return Response.json({ error: MISSING_MESSAGE(platform) }, { status: 422 });
          const scraped = list.map((it) => { const s = scrapedStats(platform, it); return s ? { ...s, ...scrapedPostMeta(platform, it) } : null; }).filter((s): s is NonNullable<typeof s> => !!s);
          const brandIds: string[] = Array.isArray(brief.fields?.Brand) ? brief.fields.Brand : [];
          const brandRec = brandIds[0] || await ensureBriefBrand(auth.record, token, brief);
          if (!brandRec) return Response.json({ error: "This brand isn't set up yet." }, { status: 404 });
          const rows = await readBrandPosts(token, [brandRec], platform);
          if (parsed.data.action === "finish") {
            const planner = (await readHomeContent(auth.record)).filter((p) => p.brandIds?.includes(brandRec)).map((p) => ({ id: p.id, url: p.legacyUrls?.[platform] || "" })).filter((p) => p.url);
            const existing = rows.map((r) => ({ id: r.id, key: String(r.fields["Post Key"] || ""), contentIds: linkIds(r.fields.Content), brandIds: linkIds(r.fields.Brand), caption: String(r.fields.Caption || "").replace(/^—$/, "") }));
            const { updates, creates } = buildPostUpserts(platform, brandRec, existing, scraped, planner, new Date().toISOString());
            if (!(await writePosts(token, "PATCH", updates)) || !(await writePosts(token, "POST", creates))) return Response.json({ error: "Some statistics couldn't be saved. Please try again." }, { status: 502 });
            const after = await readBrandPosts(token, [brandRec], platform);
            return Response.json({ status: "done", updated: updates.length, created: creates.length, notOnPlanner: 0, scraped: scraped.length, toTag: after.filter(needsTag).length });
          }
          // "tag": transcribe -> categorise format -> assign topic, a couple of posts per call.
          const media = new Map(list.map((it) => scrapedMedia(platform, it)).filter((m): m is NonNullable<typeof m> => !!m).map((m) => [m.key, m]));
          const processedIds = parsed.data.processedIds;
          const pending = rows.filter((r) => needsTag(r) && !processedIds.includes(r.id) && media.has(String(r.fields["Post Key"] || "")));
          const existingTopics = [...new Set(rows.map((r) => String(r.fields.Topic || "").trim()).filter(Boolean))];
          const records: { id: string; fields: Record<string, unknown> }[] = [];
          const skipped: string[] = [];
          const warnings: string[] = [];
          for (const row of pending.slice(0, TAG_BATCH)) {
            const m = media.get(String(row.fields["Post Key"] || ""));
            if (!m) { skipped.push(row.id); continue; }
            let transcript = String(row.fields.Transcript || ""), available = !!transcript;
            if (!row.fields.Format && !transcript && m.mediaType === "video" && m.videoUrl) { try { transcript = await transcribe(m.videoUrl); available = true; } catch (e) { console.warn("[refresh-stats] transcribe", e); } }
            let type = classifyPostType({ mediaKind: m.mediaType, transcript, duration: m.duration, usesOriginalAudio: m.originalAudio }).type;
            if (!row.fields.Format && m.mediaType === "video") { const v = await classifyVideo({ transcript, caption: m.caption, duration: m.duration, coverUrl: m.coverUrl, transcriptAvailable: available }); if (v) type = v.type; }
            const mined = await minePostCopy(auth.record, token, { ...row, fields: { ...row.fields, Format: row.fields.Format || (type ? PLANNER_POST_TYPE[type] : ""), Transcript: transcript } }, m);
            warnings.push(...mined.errors);
            const has = (f: string) => String(row.fields[f] || "").trim();
            const topic = has("Topic") ? "" : await assignTopic({ transcript: [mined.copy.transcript, mined.copy.slideCopy, mined.copy.textOnScreen].filter(Boolean).join("\n"), caption: mined.copy.caption, existing: existingTopics });
            if (topic && !existingTopics.includes(topic)) existingTopics.push(topic);
            const fields: Record<string, unknown> = { ...postCopyFields(mined.copy), "Copy Status": mined.status };
            const fill = (f: string, v: string) => { if (!has(f) && v.trim()) fields[f] = v.trim(); };
            fill("Topic", topic); fill("Format", type ? PLANNER_POST_TYPE[type] : "");
            fill("Cover", m.coverUrl);
            if (Object.keys(fields).length) records.push({ id: row.id, fields }); else skipped.push(row.id);
          }
          if (!(await writePosts(token, "PATCH", records))) return Response.json({ error: "Some topics couldn't be saved. Please try again." }, { status: 502 });
          // Posts that can't be tagged would loop forever, so the client stops when nothing progressed.
          return Response.json({ status: "tagging", tagged: records.length, processedIds: pending.slice(0, TAG_BATCH).map((r) => r.id), warnings: [...new Set(warnings)], remaining: Math.max(0, pending.length - TAG_BATCH), stalled: records.length === 0 });
        } catch (e) {
          if (e instanceof BriefOwnerMissing) return Response.json({ error: e.message }, { status: 409 });
          console.error("[refresh-stats]", e);
          return Response.json({ error: "Statistics refresh failed. Please try again." }, { status: 500 });
        }
      },
    },
  },
});
