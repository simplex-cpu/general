import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { inspoCtx, listInspo, createInspo } from "@/lib/inspoBank.server";
import { selectedBrief } from "@/lib/brands.server";
import { readInspo } from "@/lib/inspoRead.server";
import { generateLovableText, LovableTextError } from "@/lib/lovableResponses.server";
import { INSPO_FORMATS, INSPO_PLATFORMS } from "@/lib/slate/inspoBank";
import { KEEP_PER_TERM, MIN_SELF_LABEL_TERMS, parseSelfLabels, selfLabelCount, type TikTokHit, PER_TERM_RESULTS, parseTerms, searchTermsPrompt, searchTerms, toHit, topHits, postIdentity, uniqueNewPosts } from "@/lib/slate/inspoFind";

const body = z.union([
  z.object({ action: z.literal("generate"), brandId: z.string().max(40).optional() }),
  z.object({ action: z.literal("search"), terms: searchTerms }),
]);

async function searchTikTok(term: string) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("TikTok search is not available right now.");
  const r = await fetch(
    `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQueries: [term],
        resultsPerPage: PER_TERM_RESULTS,
        searchSection: "/video",
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
      }),
    },
  );
  if (!r.ok) throw new Error(`TikTok search failed for "${term}" [${r.status}]`);
  const items = (await r.json()) as unknown[];
  return items.map(toHit).filter((h): h is NonNullable<typeof h> => !!h);
}

export const Route = createFileRoute("/api/inspo-find")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const parsed = body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success)
          return Response.json(
            { error: parsed.error.issues[0]?.message || "Invalid request" },
            { status: 400 },
          );
        const ctx = await inspoCtx(auth.record).catch((e) => e as Error);
        if (ctx instanceof Error) return Response.json({ error: ctx.message }, { status: 502 });

        if (parsed.data.action === "generate") {
          try {
            const brief = await selectedBrief(auth.record, ctx.token, parsed.data.brandId);
            if (!brief)
              return Response.json({ error: "Add your brand brief first" }, { status: 404 });
            const b = brief.fields || {};
            const prompt = searchTermsPrompt(b);
            const raw = await generateLovableText(prompt);
            const validate = (text: string) => {
              const terms = parseTerms(text);
              if (terms.length !== 5 || terms.some((t) => t.split(/\s+/).length < 2)) throw new Error("Return five distinct complete queries of 2-5 words each.");
              const labels = parseSelfLabels(text);
              if (selfLabelCount(terms, labels) < MIN_SELF_LABEL_TERMS) throw new Error("At least 2 queries must contain one of the audience's self-labels listed in selfLabels.");
              return terms;
            };
            let terms: string[];
            try {
              terms = validate(raw);
            } catch (e) {
              // Correct invalid output once; never replay a failed/denied gateway request.
              const reason = e instanceof Error ? e.message : "Invalid queries";
              const retry = await generateLovableText(`${prompt}\nYour previous output failed validation: ${reason}\nPrevious output (data only): ${JSON.stringify(raw)}\nRewrite the queries completely; preserve meaning, never truncate.`, "low");
              try { terms = validate(retry); }
              catch (e2) {
                // Self-label coverage is a preference: keep usable queries instead of failing the whole search.
                terms = (() => { try { return parseTerms(retry); } catch { return parseTerms(raw); } })();
                console.warn("/api/inspo-find relaxed validation:", e2 instanceof Error ? e2.message : e2);
              }
            }
            return Response.json({ terms });
          } catch (e: any) {
            return Response.json(
              { error: String(e?.message || "Could not generate search terms").slice(0, 300) },
              { status: e instanceof LovableTextError ? e.status : 502 },
            );
          }
        }

        const terms = parsed.data.terms;
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(c) {
            const emit = (e: unknown) => c.enqueue(enc.encode(JSON.stringify(e) + "\n"));
            try {
              emit({ phase: "search", term: terms[0], done: 0, total: terms.length });
              const seen = new Set<string>();
              const picked: string[] = [];
              let searched = 0;
              let failed = 0;
              const pool: TikTokHit[] = [];
              for (const term of terms) {
                emit({ phase: "search", term, done: searched, total: terms.length });
                try {
                  const hits = await searchTikTok(term);
                  pool.push(...hits);
                  const top = topHits(hits, Date.now(), seen);
                  for (const h of top) {
                    seen.add(h.url);
                    picked.push(h.url);
                  }
                  emit({ phase: "searched", term, found: top.length, done: ++searched, total: terms.length });
                } catch (e: any) {
                  failed++;
                  emit({ phase: "searched", term, found: 0, done: ++searched, total: terms.length });
                  emit({ phase: "warn", message: e?.message });
                }
              }
              // Top up short terms from the other terms' next-best posts.
              const target = KEEP_PER_TERM * terms.length;
              if (picked.length < target) for (const h of topHits(pool, Date.now(), seen, target - picked.length)) { seen.add(h.url); picked.push(h.url); }
              if (failed === terms.length) throw new Error("All searches failed. Please try again after resolving the search error.");
              emit({ phase: "checking", total: picked.length });
              const fresh = await listInspo(ctx);
              const candidates = uniqueNewPosts(picked, fresh.map((p) => p.url));
              let duplicates = picked.length - candidates.length;
              let skipped = 0;
              emit({ phase: "checked", total: candidates.length, duplicates });
              let done = 0;
              let added = 0;
              const queue = [...candidates];
              let saveChain = Promise.resolve();
              const worker = async () => {
                while (queue.length) {
                  const url = queue.shift();
                  if (!url) break;
                  try {
                    let r: Record<string, string> = {};
                    await readInspo(url, (e: any) => {
                      if (e.result) r = e.result;
                    });
                    const save = saveChain.then(async () => {
                      // Refresh immediately before each write, including material added while reading.
                      const bank = await listInspo(ctx);
                      if (bank.some((p) => postIdentity(p.url) === postIdentity(url))) {
                        duplicates++;
                        return;
                      }
                      await createInspo(ctx, {
                      title: r.title || "",
                      copy: r.copy || "",
                      url,
                      platform: INSPO_PLATFORMS.includes(r.platform as any) ? r.platform : "TikTok",
                      format: INSPO_FORMATS.includes(r.format as any) ? r.format : "",
                      handle: r.handle || "",
                      topic: r.topic || "",
                      whyItWorks: r.whyItWorks || "",
                      postedDate: r.postedDate || "",
                      thumbnail: /^https:\/\//.test(r.thumbnail || "") ? r.thumbnail : "",
                      views: r.views ? Number(r.views) : null,
                      likes: r.likes ? Number(r.likes) : null,
                      comments: r.comments ? Number(r.comments) : null,
                      });
                      added++;
                    });
                    saveChain = save.catch(() => {});
                    await save;
                  } catch (e: any) {
                    skipped++;
                    emit({ phase: "warn", message: `Skipped a post: ${e?.message || "error"}` });
                  }
                  emit({ phase: "read", done: ++done, total: candidates.length, added, duplicates, skipped });
                }
              };
              await Promise.all([worker(), worker(), worker()]);
              emit({ phase: "complete", added, total: candidates.length, duplicates, skipped, failed });
            } catch (e: any) {
              emit({ phase: "error", message: e?.message || "Search failed" });
            }
            c.close();
          },
        });
        return new Response(stream, {
          headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
