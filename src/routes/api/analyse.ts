import { AI_MODELS } from "@/lib/aiModels";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireAccessCode } from "@/lib/accessCode.server";
import { classifyPostType, POST_TYPE_LABEL } from "@/lib/slate/postType";


const AIRTABLE_BASE = "appf1QABtQbAENYDz";
const AIRTABLE_TABLE = "tbl1Sc1qn5MhXc0Ta";

const F_CODE = "Code";
const F_BUDGET = "Reports Budget";
const F_REPORTS_LEFT = "Reports left";
const F_REPORTS_USED = "Reports generated (This month)";
const F_LAST_USED = "Last used";
const F_CLIENT_NAME = "Client Name";

type AirtableRecord = { id: string; fields: Record<string, any> };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function findUserByCode(code: string, token: string): Promise<AirtableRecord | null> {
  const safe = code.replace(/'/g, "\\'");
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(`{${F_CODE}}='${safe}'`)}&maxRecords=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Airtable lookup failed: ${res.status}`);
  const data = await res.json();
  return data.records?.[0] || null;
}

async function patchRecord(recordId: string, fields: Record<string, any>, token: string) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable patch ${res.status}: ${text.slice(0, 200)}`);
  }
}

// "Reports left" is a computed field — we must increment the writable counter.
// Tries field name first; if the column hasn't been added yet, logs and continues
// so the user is never blocked from running a report.
async function incrementReportsUsed(record: AirtableRecord, token: string) {
  const current = Number(record.fields[F_REPORTS_USED] ?? 0);
  try {
    await patchRecord(record.id, { [F_REPORTS_USED]: current + 1 }, token);
  } catch (err) {
    console.warn("[analyse] Could not increment 'Reports generated (This month)' — add this number field in Airtable to enable report-credit tracking.", err);
  }
}

async function resetCreditsIfNewMonth(record: AirtableRecord, token: string) {
  const lastUsedTimestamp = record.fields[F_LAST_USED];
  if (!lastUsedTimestamp) return;
  const lastUsed = new Date(lastUsedTimestamp);
  const now = new Date();
  if (lastUsed.getMonth() !== now.getMonth() || lastUsed.getFullYear() !== now.getFullYear()) {
    try {
      await patchRecord(record.id, {
        "Scripts generated (This month)": 0,
        [F_REPORTS_USED]: 0,
      }, token);
    } catch (err) {
      console.warn("[analyse] Monthly reset failed:", err);
    }
  }
}

async function fetchCaptionsFromApify(postUrls: string[]): Promise<{
  captionMap: Record<string, string>;
  audioMap: Record<string, boolean>;
  durationMap: Record<string, number>;
}> {
  const empty = { captionMap: {}, audioMap: {}, durationMap: {} };
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
  if (!APIFY_TOKEN) {
    console.warn("[Apify] APIFY_API_TOKEN missing — skipping caption fetch");
    return empty;
  }
  const urls = postUrls
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter((u) => u.startsWith("http"))
    .map((u) => u.replace(/(?<!https?:)\/\/{2,}/g, "/"))
    .filter((u) => /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+(\/.*)?$/i.test(u))
    .slice(0, 50);
  if (urls.length !== postUrls.length) {
    console.warn(`[Apify] Skipping ${postUrls.length - urls.length} invalid URL(s) before starting task`);
  }
  if (!urls.length) {
    console.warn("[Apify] No valid URLs provided");
    return empty;
  }
  console.log(`[Apify] Starting run for ${urls.length} URLs`);

  try {
    const TASK_ID = "KzWhyprUFiK1AzF2c";
    const runRes = await fetch(`https://api.apify.com/v2/actor-tasks/${TASK_ID}/runs?token=${APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addParentData: false,
        directUrls: urls,
        resultsLimit: 1,
        resultsType: "reels",
      }),
    });
    if (!runRes.ok) {
      console.error("[Apify] Start-run failed:", runRes.status, await runRes.text());
      return empty;
    }
    const runData = await runRes.json();
    const runId = runData.data?.id;
    if (!runId) {
      console.error("[Apify] No run id in response:", JSON.stringify(runData).slice(0, 300));
      return empty;
    }
    console.log(`[Apify] Run started: ${runId}`);

    const MAX_ATTEMPTS = 15;
    const POLL_MS = 3000;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_MS));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      if (!statusRes.ok) {
        console.error("[Apify] Poll failed:", statusRes.status, await statusRes.text());
        return empty;
      }
      const statusData = await statusRes.json();
      const status = statusData.data?.status;
      if (!status) {
        console.error("[Apify] Poll response missing status:", JSON.stringify(statusData).slice(0, 300));
        return empty;
      }
      if (i % 5 === 0) console.log(`[Apify] Poll ${i + 1}/${MAX_ATTEMPTS} status=${status}`);
      if (status === "SUCCEEDED") {
        const datasetId = statusData.data?.defaultDatasetId;
        if (!datasetId) {
          console.error("[Apify] Run succeeded but defaultDatasetId missing:", JSON.stringify(statusData).slice(0, 300));
          return empty;
        }
        const resultsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
        const items = await resultsRes.json();
        console.log(`[Apify] Run succeeded. Items: ${Array.isArray(items) ? items.length : 0}`);
        const captionMap: Record<string, string> = {};
        const audioMap: Record<string, boolean> = {};
        const durationMap: Record<string, number> = {};
        let loggedMissingDuration = false;
        for (const item of items) {
          if (item.shortCode) {
            if (item.caption) captionMap[item.shortCode] = item.caption;
            audioMap[item.shortCode] = item.musicInfo?.uses_original_audio ?? true;
            const duration = item.videoDuration ?? item.duration ?? null;
            if (typeof duration === "number") {
              durationMap[item.shortCode] = duration;
            } else if (!loggedMissingDuration) {
              console.warn("[Apify] videoDuration not found on item", JSON.stringify(item).slice(0, 200));
              loggedMissingDuration = true;
            }
          }
        }
        console.log(`[Apify] Mapped captions=${Object.keys(captionMap).length} audio=${Object.keys(audioMap).length} duration=${Object.keys(durationMap).length}`);
        return { captionMap, audioMap, durationMap };
      }
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
        console.error(`[Apify] Run ended with status=${status}`);
        return empty;
      }
    }
    console.error("[Apify] Polling exhausted before run completed");
    return empty;
  } catch (e) {
    console.error("[Apify] Exception:", e);
    return empty;
  }
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}


type SamplePost = {
  url: string;
  shortCode: string;
  transcript: string;
  views: number;
  likes: number;
  comments: number;
  saves?: number;
  shares?: number;
  reactionPct: string;
  caption?: string;
  mediaType?: "video" | "carousel" | "graphic";
  postType?: string;
  typeReason?: string;
  viewsAvailable?: boolean;
};


export const Route = createFileRoute("/api/analyse")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return json({ error: "Server misconfigured" }, 500);
        const code = request.headers.get("x-access-code") || "";
        if (!code) return json({ error: "Code required" }, 400);
        try {
          // Validate access code (rejects deactivated codes).
          const auth = await requireAccessCode(code);
          if (!auth.ok) return auth.response;
          const record = { id: auth.record.id, fields: auth.record.fields } as AirtableRecord;
          await resetCreditsIfNewMonth(record, token);
          const fresh = await findUserByCode(code, token);
          const fields = fresh?.fields || record.fields;
          const budget = fields[F_BUDGET] ?? 0;
          const left = fields[F_REPORTS_LEFT] ?? 0;
          return json({
            valid: true,
            clientName: fields[F_CLIENT_NAME] || "",
            credits: { budget, used: Math.max(0, budget - left), left },
          });
        } catch (e) {
          console.error("GET /api/analyse error:", e);
          return json({ error: String(e) }, 500);
        }
      },

      POST: async ({ request }: { request: Request }) => {
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        const airtableToken = process.env.AIRTABLE_TOKEN;
        if (!anthropicKey) return json({ error: "Anthropic API key not configured" }, 500);
        if (!airtableToken) return json({ error: "Airtable not configured" }, 500);

        try {
          const body = await request.json();
          const { platform, samplePosts, top5, bottom5, total, fmtAvgViews, fmtMaxViews,
                  fmtMedianViews, avgSaves, accessCode, postUrls,
                  topPostsWithUrls, bottomPostsWithUrls } = body as {
            platform: string;
            samplePosts: SamplePost[];
            top5: string;
            bottom5: string;
            total: number;
            fmtAvgViews: string;
            fmtMaxViews: string;
            fmtMedianViews: string;
            avgSaves: number | null;
            accessCode: string;
            postUrls: string[];
            topPostsWithUrls?: { views: string; reactions: string; url: string; postType: string }[];
            bottomPostsWithUrls?: { views: string; reactions: string; url: string; postType: string }[];
          };


          if (!accessCode) return json({ error: "Access code required" }, 401);

          // Validate access code (rejects deactivated codes before any AI spend).
          const auth = await requireAccessCode(accessCode);
          if (!auth.ok) return auth.response;
          const userRecord = { id: auth.record.id, fields: auth.record.fields } as AirtableRecord;

          await resetCreditsIfNewMonth(userRecord, airtableToken);
          const freshRecord = await findUserByCode(accessCode, airtableToken);
          if (!freshRecord) return json({ error: "Lookup failed" }, 500);
          const creditsBudget = freshRecord.fields[F_BUDGET] ?? 0;
          const creditsLeft = freshRecord.fields[F_REPORTS_LEFT] ?? 0;
          const creditsUsed = Math.max(0, creditsBudget - creditsLeft);

          if (creditsLeft <= 0) {
            return json({
              error: "no_credits",
              message: "Running out of credits. Contact admin",
              credits: { left: 0, budget: creditsBudget, used: creditsUsed },
            }, 402);
          }

          let captionMap: Record<string, string> = {};
          let audioMap: Record<string, boolean> = {};
          let durationMap: Record<string, number> = {};
          if (Array.isArray(postUrls) && postUrls.length > 0) {
            const r = await fetchCaptionsFromApify(postUrls);
            captionMap = r.captionMap;
            audioMap = r.audioMap;
            durationMap = r.durationMap;
          }

          await incrementReportsUsed(freshRecord, airtableToken);

          const platformLabel = platform === "tiktok" ? "TikTok" : "Instagram Reels";
          const savesLine = avgSaves !== null && avgSaves !== undefined ? `Average saves per post: ${avgSaves}` : "";

          const safeSamplePosts: SamplePost[] = Array.isArray(samplePosts) ? samplePosts : [];

          const postSummaries = safeSamplePosts.map((p, i) => {
            const duration = durationMap[p.shortCode];
            const caption = captionMap[p.shortCode] || p.caption || "";
            // Prefer the category decided at collection time. Only fall back to
            // classifying here for CSV uploads, which carry no PostType column.
            const preLabel = (p.postType || "").trim();
            const fallback = classifyPostType({
              mediaKind: p.mediaType || "video",
              transcript: p.transcript || "",
              duration,
              usesOriginalAudio: audioMap[p.shortCode],
            });
            const formatLabel = preLabel || POST_TYPE_LABEL[fallback.type];
            const reason = p.typeReason || fallback.reason;
            const isStatic = formatLabel === "Carousel" || formatLabel === "Still graphic";
            const isTalking = formatLabel === "Talking video";

            const viewsLabel = p.viewsAvailable === false ? "not reported" : fmtNum(p.views);
            let line = `Post ${i + 1}: Views=${viewsLabel}, Likes=${fmtNum(p.likes)}, Comments=${p.comments}, Reaction%=${p.reactionPct}%, Type=${formatLabel}, ClassificationReason=${reason}`;
            if (typeof duration === "number") line += `, Duration=${duration}s`;
            if (platform === "tiktok") line += `, Saves=${fmtNum(p.saves || 0)}, Shares=${p.shares || 0}`;
            if (p.url) line += `\n  URL: ${p.url}`;
            if (isStatic) {
              if (caption) line += `\n  Caption (primary input for this static post): ${caption.slice(0, 400)}`;
              line += `\n  [Static post: Instagram reports no view count for these, judge it on likes, comments and saves only]`;
            } else if (!isTalking) {
              if (caption) line += `\n  Caption (B-roll primary input): ${caption.slice(0, 400)}`;
              else line += `\n  [B-roll, no caption available — analyze cautiously]`;
            } else {
              if (p.transcript) line += `\n  Transcript (Talking primary input): ${p.transcript.slice(0, 400)}`;
              if (caption) line += `\n  Caption (secondary context): ${caption.slice(0, 200)}`;
            }
            return line;
          }).join("\n\n");



          const prompt = `You are a straight-talking content strategist. Analyze this ${platformLabel} data and write a report for the creator. Write everything in plain English for a smart person who has never studied marketing.

CLASSIFICATION is already done. Each post below carries a pre-computed Type label, and there are exactly four possible types: Talking video, B-roll, Carousel, Still graphic. Videos are split into Talking video vs B-roll using duration, audio metadata and transcript analysis. Non-video posts are Carousel (multi-image) or Still graphic (single image). Trust these labels exactly as given. Do NOT reclassify, and NEVER label a Carousel or a Still graphic as B-roll.

PRIMARY INPUT ROUTING per post:
- For B-roll posts: the CAPTION is the primary input. The transcript is likely song lyrics and should be ignored unless explicitly relevant.
- For Carousel and Still graphic posts: the CAPTION is the only input. There is no transcript and no view count.
- For Talking video posts: the TRANSCRIPT is the primary input. The caption is secondary context.

STRICT LANGUAGE RULES:
- Use exactly these format names: "Talking video", "B-roll", "Carousel", "Still graphic".

- Never say "engagement rate" or "ER". Say "percentage of viewers who reacted".
- Never say "hook". Say "opening line" or "what stops the scroll".
- No marketing buzzwords. Write for a CEO with no marketing background.
- Every insight must use real numbers from the data.
- Avoid jargon, confusing phrasing, or overly abstract / philosophical analysis. Say things plainly. If an idea needs to be read twice to be understood, rewrite it.
- Do NOT use em-dashes, en-dashes, or double hyphens in any sentence. Use commas or separate sentences instead. Never break a word with a dash across lines or within a word.

Platform: ${platformLabel}
Total posts: ${total} | Avg views: ${fmtAvgViews} | Median: ${fmtMedianViews} | Top: ${fmtMaxViews}
${savesLine}

ALL POSTS:
${postSummaries}

TOP POSTS BY ENGAGEMENT (ranked by reaction rate, not raw views):
${top5}

BOTTOM POSTS BY ENGAGEMENT (ranked by reaction rate, not raw views):
${bottom5}

RANKING RULE: Posts are ranked by how strongly the audience reacted (likes, comments, saves and shares relative to reach), NOT by view count. Carousels and still graphics do not report views on Instagram, so NEVER call a post a weak performer because its view count is zero. Judge static posts on reactions only, and say so plainly when you mention one.

For whatToAvoid and whatToDoubleDownOn, each item must be specific enough that an AI scripting bot can act on it directly. Reference concrete patterns from THIS account's data with real numbers. No vague advice like "be more authentic" or "post more often". Examples of good items:
- TOPIC · "Avoid diet content. Averaged 4K views vs 22K for hormone-balance content."
- HOOK · "Double down on contrarian openers. 3.2× more reactions than question-based hooks."
- LANGUAGE · "Avoid corporate phrasing. Every post using 'optimize' or 'leverage' underperformed by 60%."
- FORMAT · "Double down on Talking. 21.4K avg views vs 6.7K for B-roll."

CRITICAL FORMAT-AVOIDANCE RULE: Do NOT recommend avoiding an entire format (Talking video or B-roll) UNLESS that format makes up at least 50% of the total posts analyzed (i.e. at least half of ${total} posts are that format). If a format represents fewer than 50% of posts, there is not enough data to tell the creator to stop posting it. Instead, either omit the FORMAT avoidance item entirely or frame it as a topic/hook/language insight. This rule applies ONLY to FORMAT category "avoid" items. You can still recommend doubling down on a high-performing format at any sample size.

CRITICAL LINKING RULE. Applies to EVERY string inside whatToAvoid and whatToDoubleDownOn (and any other free-text insights): when you reference a specific post, NEVER write "Post 19" or "post 20" as a bare number. ALWAYS write it as a markdown link in the form [Post 19](https://...) using the exact URL from the Post's "URL:" line in the ALL POSTS data above. The number after "Post" must match the post's index in the ALL POSTS list. If you cannot find a matching URL, omit the post reference entirely rather than naming a number. Bare "Post N" references without a hyperlink are not allowed under any circumstance.

Respond ONLY with a JSON object. No markdown formatting around the JSON itself. No backticks. Just raw JSON. (Markdown links INSIDE string values are required where specified above.)

{
  "scorecard": {
    "avgViewsPerPost": "${fmtAvgViews}",
    "topPostViews": "${fmtMaxViews}",
    "topPerformingTopic": "Must be a SHORT topic pillar name (3-5 words). Must match one of the topicPillars exactly. No description, no em-dash, no qualifiers. Just the pillar name. Example: 'Social justice & cultural hypocrisy'.",
    "bestContentCategory": "The style of content that performs best. For example, Controversial take, Surprising fact, Personal confession, Myth-busting."
  },
  "formatComparison": {
    "speaksToCamera": { "posts": 0, "avgViews": "0K", "avgLikes": "0", "avgComments": "0", "reactionRate": "0%", "note": "optional note" },
    "musicOrMovement": { "posts": 0, "avgViews": "0K", "avgLikes": "0", "avgComments": "0", "reactionRate": "0%", "note": "optional note" },
    "winner": "Talking video OR B-roll",
    "winnerReason": "One plain-English sentence with a specific number"
  },
  "topPosts": [
    { "format": "Talking video OR B-roll OR Carousel OR Still graphic (copy the pre-computed Type exactly)", "url": "Copy the exact URL from that post's URL line", "views": "Copy the exact view count for that post from the data, e.g. 12,345. Never add leading zeros. If the post is a Carousel or Still graphic write: No views (still post)", "reactions": "e.g. 1,204 likes · 38 comments", "description": "ONE-TWO sentences. Should be a summary of the CORE MESSAGE and TOPIC covered in the post AND why it may have attracted the audience. For B-roll posts, derive from the CAPTION (don't describe the visuals or format). For Talking video posts, derive from the TRANSCRIPT (don't describe how it opens or how viewers reacted). Do not describe performance metrics, format, or production style. The 'why it attracted' part should reference audience pain points or universal truths the topic taps into." }
  ],
  "bottomPosts": [
    { "format": "Talking video OR B-roll OR Carousel OR Still graphic (copy the pre-computed Type exactly)", "url": "Copy the exact URL from that post's URL line", "views": "Copy the exact view count for that post from the data, e.g. 12,345. Never add leading zeros. If the post is a Carousel or Still graphic write: No views (still post)", "reactions": "e.g. 1,204 likes · 38 comments", "description": "ONE-TWO sentences. Same rules as topPosts.description but focused on the LOWEST-performing posts. Explain the core message/topic and a likely reason the audience did NOT engage (topic mismatch, weak angle, oversaturated take, etc.). Do not describe visuals, format, or metrics." }
  ],
  "openingLines": [
    { "pattern": "A FORMULA, not a topic. Write it as a reusable template with placeholders, in plain English. Example: 'State a number that sounds impossible, then say what it is about'. Never name the specific subject, place or statistic from the post.", "example": "Exact opening quote from the data that shows the formula in action", "result": "The result in numbers and one sentence on why the FORMULA works, not why that topic worked" }
  ],
  "topicPillars": [
    { "topicPillar": "Broad, transferable theme category that groups multiple posts. 3-5 word name capturing an ANGLE or THEME. For B-roll posts, derive from the caption. For Talking posts, derive from the transcript. Examples: 'Cortisol & hormonal balance', 'Sleep optimization for women 35+', 'Anti-diet contrarian takes'. Return 3-5 pillars ordered by performance.", "bestResult": "STRICT: a single short KPI string only. Either a view count like '120,000 views' OR a reaction rate like '4.2% reactions'. Optionally ONE extra KPI joined with ' · ' (example: '120,000 views · 4.2% reactions'). NEVER include post references, URLs, the words 'related to post', descriptions, sentences, or any explanation. Max 40 characters. Keep every row in this column to the same shape so the table stays aligned.", "whyItConnects": "One plain-English sentence" }
  ],

  "languagePatterns": {
    "phrases": ["4-6 REUSABLE PHRASES. Each must be a short phrase of 3 to 8 words lifted or lightly adapted from this account's best-performing posts, carrying clear emotional charge (tension, relief, defiance, recognition, urgency). It must be reusable in a completely different script: no names, places, numbers, dates, product names or topic-specific nouns. Not single words. Not full sentences and not anything that only makes sense with the original post's context. Good: 'nobody warns you about this', 'you are not imagining it', 'this is the part they skip'. Bad: 'Amsterdam has 880,000 bikes', 'authentic', 'the third mistake founders make when hiring'."],
    "explanation": "Two plain-English sentences on the emotional register these phrases share and how to reuse them in new scripts."
  },
  "whatToAvoid": [
    { "category": "Topics OR Language OR Hooks OR Format", "advice": "Specific actionable string referencing real numbers from this data. When referencing specific posts, use markdown links [Post N](url). Never use bare 'Post N'." }
  ],
  "whatToDoubleDownOn": [
    { "category": "Topics OR Language OR Hooks OR Format", "advice": "Specific actionable string referencing real numbers from this data. When referencing specific posts, use markdown links [Post N](url). Never use bare 'Post N'." }
  ]
}

OPENING LINES RULE: every "pattern" must be topic-agnostic and copyable onto any subject this account covers. If a pattern only makes sense for one topic, generalise it until it does not. The specific post is only allowed inside "example".

Requirements: topPosts=10 (use exactly the 10 posts listed under TOP POSTS BY ENGAGEMENT, in that order), bottomPosts=10 (use exactly the 10 posts listed under BOTTOM POSTS BY ENGAGEMENT, worst-first), openingLines=4-5, topicPillars=3-5 ordered by performance, whatToAvoid=3-5 items, whatToDoubleDownOn=3-5 items, spread across at least 2 categories each. Zero jargon. Respect the FORMAT-AVOIDANCE RULE and the LINKING RULE above.

VIEWS AND REACTIONS RULE: copy view and reaction figures verbatim from the data. Never pad numbers with leading zeros and never invent placeholder digits.`;


          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: AI_MODELS.analysis,
              max_tokens: 16000,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (!response.ok) {
            const err = await response.text();
            return json({ error: `Anthropic error: ${err}` }, 500);
          }

          const data = await response.json();
          const text = data.content.find((b: { type: string }) => b.type === "text")?.text || "";
          const stopReason = data.stop_reason;

          // Robust JSON extraction: strip code fences, find first balanced { ... } block.
          let clean = text.replace(/```json|```/g, "").trim();
          const firstBrace = clean.indexOf("{");
          if (firstBrace > 0) clean = clean.slice(firstBrace);
          // Walk the string respecting strings/escapes to find the matching closing brace.
          let depth = 0, end = -1, inStr = false, esc = false;
          for (let i = 0; i < clean.length; i++) {
            const ch = clean[i];
            if (inStr) {
              if (esc) { esc = false; continue; }
              if (ch === "\\") { esc = true; continue; }
              if (ch === '"') inStr = false;
              continue;
            }
            if (ch === '"') { inStr = true; continue; }
            if (ch === "{") depth++;
            else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
          }
          if (end !== -1) clean = clean.slice(0, end + 1);
          // Repair common issues
          clean = clean
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .replace(/[\x00-\x1F\x7F]/g, (c: string) => (c === "\n" || c === "\t" ? " " : ""));

          let report: any;
          try {
            report = JSON.parse(clean);
          } catch (parseErr) {
            console.error("[analyse] JSON parse failed", {
              stopReason,
              parseErr: String(parseErr),
              textLength: text.length,
              cleanLength: clean.length,
              head: text.slice(0, 400),
              tail: text.slice(-800),
            });
            return json({
              error: stopReason === "max_tokens"
                ? "AI response was truncated (hit token limit). Please try again."
                : "AI returned invalid JSON. Please try again.",
              detail: String(parseErr),
              stopReason,
              raw: text.slice(-1500),
              head: text.slice(0, 400),
            }, 500);
          }


          // Normalize: accept legacy keys + ensure required arrays/objects exist
          const sanitizeBestResult = (raw: string): string => {
            if (!raw) return "";
            // Strip markdown links and URLs first
            let s = String(raw)
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "")
              .replace(/https?:\/\/\S+/g, "");

            // Extract KPIs only — ignore any surrounding prose / post references
            const kpis: string[] = [];
            // Views (e.g. "1,848 views", "12K views")
            const viewsM = s.match(/([\d.,]+\s*[KMkm]?)\s*views?/i);
            if (viewsM) kpis.push(`${viewsM[1].trim()} views`);
            // Reaction rate / reactions (e.g. "2.9% reaction rate", "4.2% reactions")
            const rateM = s.match(/([\d.,]+\s*%)\s*reaction(?:s| rate)?/i);
            if (rateM) kpis.push(`${rateM[1].replace(/\s+/g, "")} reactions`);
            // Likes / comments / saves / shares as fallback KPIs
            ["likes", "comments", "saves", "shares"].forEach(k => {
              if (kpis.length >= 2) return;
              const m = s.match(new RegExp(`([\\d.,]+\\s*[KMkm]?)\\s*${k}`, "i"));
              if (m) kpis.push(`${m[1].trim()} ${k}`);
            });

            if (kpis.length) return kpis.slice(0, 2).join(" · ");

            // Fallback: keep first short clause, strip dashes and post refs
            s = s.split(/\s[—–-]\s|[.,;]?\s*(?:related|post\s*\d|see post|from post|on the)/i)[0];
            s = s.replace(/\s+/g, " ").trim().replace(/[·•,;\-\s]+$/, "");
            if (s.length > 40) s = s.slice(0, 40).trim().replace(/[·•,;\-\s]+$/, "");
            return s;
          };

          const rawPillars = report.topicPillars ?? report.topicCategoriesTable ?? report.topicCategories ?? [];
          report.topicPillars = (Array.isArray(rawPillars) ? rawPillars : []).map((t: any) => ({
            topicPillar: t.topicPillar ?? t.topicCategory ?? t.topic ?? t.name ?? "",
            bestResult: sanitizeBestResult(t.bestResult ?? t.result ?? ""),
            whyItConnects: t.whyItConnects ?? t.why ?? t.reason ?? "",
          }));

          report.topPosts = Array.isArray(report.topPosts) ? report.topPosts : [];
          report.bottomPosts = Array.isArray(report.bottomPosts) ? report.bottomPosts : [];
          const norm = (u: unknown) => String(u || "").replace(/\/$/, "");
          const categoryByUrl = new Map(
            safeSamplePosts
              .filter((p) => Boolean(p.url && p.postType))
              .map((p) => [norm(p.url), p.postType] as const),
          );
          /**
           * The ranked list is decided here, not by the model. We only borrow the
           * model's prose, then force the order, format, views and reactions back
           * to the collected numbers so nothing can be reworded or padded.
           */
          const rebuild = (
            authoritative: { views: string; reactions: string; url: string; postType: string }[] | undefined,
            aiPosts: any[],
          ) => {
            if (!Array.isArray(authoritative) || !authoritative.length) {
              return aiPosts.map((post) => {
                const category = categoryByUrl.get(norm(post?.url));
                return category ? { ...post, format: category } : post;
              });
            }
            const byUrl = new Map(aiPosts.map((p: any) => [norm(p?.url), p]));
            return authoritative.map((a, i) => {
              const ai = byUrl.get(norm(a.url)) || aiPosts[i] || {};
              return {
                ...ai,
                url: a.url,
                format: categoryByUrl.get(norm(a.url)) || a.postType || ai.format || "",
                views: a.views,
                reactions: a.reactions,
                description: ai.description || "",
              };
            });
          };
          report.topPosts = rebuild(topPostsWithUrls, report.topPosts);
          report.bottomPosts = rebuild(bottomPostsWithUrls, report.bottomPosts);

          report.openingLines = Array.isArray(report.openingLines) ? report.openingLines : [];
          report.whatToAvoid = Array.isArray(report.whatToAvoid) ? report.whatToAvoid : [];
          report.whatToDoubleDownOn = Array.isArray(report.whatToDoubleDownOn) ? report.whatToDoubleDownOn : [];
          report.languagePatterns = report.languagePatterns ?? { phrases: [], explanation: "" };
          if (!Array.isArray(report.languagePatterns.phrases)) report.languagePatterns.phrases = [];
          report.scorecard = report.scorecard ?? { avgViewsPerPost: fmtAvgViews, topPostViews: fmtMaxViews, topPerformingTopic: "", bestContentCategory: "" };
          report.formatComparison = report.formatComparison ?? {
            speaksToCamera: { posts: 0, avgViews: "0", avgLikes: "0", avgComments: "0", reactionRate: "0%" },
            musicOrMovement: { posts: 0, avgViews: "0", avgLikes: "0", avgComments: "0", reactionRate: "0%" },
            winner: "Talking video",
            winnerReason: "",
          };

          return json({
            report,
            credits: {
              used: creditsUsed + 1,
              budget: creditsBudget,
              left: creditsLeft - 1,
            },
          });
        } catch (err) {
          console.error("POST /api/analyse error:", err);
          return json({ error: String(err) }, 500);
        }
      },
    },
  },
});
