export interface ParsedFile { name: string; rows: Record<string, string>[]; }
export interface Credits { budget: number; used: number; left: number; }

export interface FormatStats {
  posts: number; avgViews: string; avgLikes: string;
  avgComments: string; reactionRate: string; note?: string;
}

export type AdviceCategory = "Topics" | "Language" | "Hooks" | "Format";

export interface SamplePost {
  url: string;
  shortCode: string;
  transcript: string;
  caption?: string;
  views: number;
  viewsAvailable?: boolean;
  likes: number;
  comments: number;
  saves?: number;
  shares?: number;
  reactionPct: string;
  /** talking/broll is decided server-side; this is the raw media kind. */
  mediaType?: "video" | "carousel" | "graphic";
  /** Final category label decided at scrape time, e.g. "Talking video". */
  postType?: string;
  /** Why that category was chosen. */
  typeReason?: string;
}


export interface Report {
  scorecard: { avgViewsPerPost: string; topPostViews: string; topPerformingTopic: string; bestContentCategory: string; };
  formatComparison: { speaksToCamera: FormatStats; musicOrMovement: FormatStats; winner: string; winnerReason: string; };
  topPosts: { format: string; views: string; reactions: string; description: string; url?: string }[];
  bottomPosts: { format: string; views: string; reactions: string; description: string; url?: string }[];
  openingLines: { pattern: string; example: string; result: string }[];
  topicPillars: { topicPillar: string; bestResult: string; whyItConnects: string }[];
  languagePatterns: { phrases: string[]; explanation: string };
  whatToAvoid: { category: AdviceCategory; advice: string }[];
  whatToDoubleDownOn: { category: AdviceCategory; advice: string }[];
}

export function extractShortcode(url: string): string {
  if (!url) return "";
  return url.replace(/\/$/, "").split("/").filter(Boolean).pop() || "";
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += c; }
    }
    vals.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || "").replace(/^"|"$/g, ""); });
    return row;
  });
}

export function detectPlatform(rows: Record<string, string>[]): string {
  if (!rows.length) return "instagram";
  const keys = Object.keys(rows[0]).map(k => k.toLowerCase());
  return keys.some(k => k.includes("tiktok") || k.includes("shares") || k.includes("saves")) ? "tiktok" : "instagram";
}

export function fmt(n: number): string {
  return n.toLocaleString();
}

export function summarize(allRows: Record<string, string>[], platform: string) {
  const total = allRows.length;
  const rawViews = (r: Record<string, string>) => r.Views ?? r.views ?? "";
  const hasViews = (r: Record<string, string>) => String(rawViews(r)).trim() !== "";
  const views = allRows.filter(hasViews).map(r => parseInt(rawViews(r), 10) || 0);
  const saves = allRows.map(r => parseInt(r.Saves || r.saves || "0") || 0);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const median = (arr: number[]) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] || 0; };

  const avgReactions = avg(allRows.map(r =>
    (parseInt(r.Likes || r.likes || "0") || 0) +
    (parseInt(r.Comments || r.comments || "0") || 0) +
    (parseInt(r.Saves || r.saves || "0") || 0) +
    (parseInt(r.Shares || r.shares || "0") || 0),
  ));

  const ss = Math.min(allRows.length, 30);
  const st = Math.max(1, Math.floor(allRows.length / ss));
  const sample = allRows.filter((_, i) => i % st === 0).slice(0, ss);

  const samplePosts: SamplePost[] = sample.map((r) => {
    const v = parseInt(r.Views || r.views || "0") || 0;
    const l = parseInt(r.Likes || r.likes || "0") || 0;
    const c = parseInt(r.Comments || r.comments || "0") || 0;
    const sv = parseInt(r.Saves || r.saves || "0") || 0;
    const sh = parseInt(r.Shares || r.shares || "0") || 0;
    const tr = (r.Transcript || r.transcript || "").trim();
    const url = r.Reel || r.reel || r.TikTok || r.tiktok || "";
    const reactionPct = v > 0 ? ((l + c + sv + sh) / v * 100).toFixed(1) : "0";
    const post: SamplePost = {
      url,
      shortCode: extractShortcode(url),
      transcript: tr,
      caption: (r.Caption || r.caption || "").trim(),
      views: v,
      viewsAvailable: hasViews(r),
      likes: l,
      comments: c,
      reactionPct,
      mediaType: (r.MediaType || r.mediaType || "video") as SamplePost["mediaType"],
      postType: (r.PostType || r.postType || "").trim(),
      typeReason: (r.TypeReason || r.typeReason || "").trim(),
    };

    if (platform === "tiktok") { post.saves = sv; post.shares = sh; }
    return post;
  });

  // Ranking. Reaction rate alone punishes big-reach videos (a 29k-view reel with
  // solid reactions scores worse than a 1k-view one), and raw views ignore
  // graphics entirely because Instagram reports none for still posts. So we
  // score on percentile ranks: every post gets a reaction-rate percentile, and
  // videos additionally get a views percentile, blended 50/50.
  const reactionsOf = (r: Record<string, string>) =>
    (parseInt(r.Likes || r.likes || "0") || 0) +
    (parseInt(r.Comments || r.comments || "0") || 0) +
    (parseInt(r.Saves || r.saves || "0") || 0) +
    (parseInt(r.Shares || r.shares || "0") || 0);
  const viewsOf = (r: Record<string, string>) => parseInt(rawViews(r), 10) || 0;
  const isVideoRow = (r: Record<string, string>) => {
    const pre = (r.PostType || r.postType || "").toLowerCase();
    if (pre) return pre.includes("video") || pre.includes("roll");
    return (r.MediaType || r.mediaType || "video").toLowerCase() === "video";
  };

  const rateOf = (r: Record<string, string>) => {
    const v = viewsOf(r);
    const reactions = reactionsOf(r);
    return v > 0 ? reactions / v : reactions / Math.max(1, avgReactions);
  };

  const asc = (a: number, b: number) => a - b;
  const allRates = allRows.map(rateOf).sort(asc);
  const videoViews = allRows.filter(isVideoRow).map(viewsOf).filter((v) => v > 0).sort(asc);
  const pct = (value: number, sortedArr: number[]) => {
    if (!sortedArr.length) return 0.5;
    let below = 0;
    for (const x of sortedArr) { if (x < value) below++; else break; }
    return below / sortedArr.length;
  };

  const score = (r: Record<string, string>) => {
    const pRate = pct(rateOf(r), allRates);
    const v = viewsOf(r);
    if (isVideoRow(r) && v > 0 && videoViews.length) {
      return 0.5 * pRate + 0.5 * pct(v, videoViews);
    }
    return pRate;
  };

  const sorted = [...allRows].sort((a, b) => {
    const d = score(b) - score(a);
    if (Math.abs(d) > 1e-9) return d;
    if (isVideoRow(a) && isVideoRow(b)) return viewsOf(b) - viewsOf(a);
    return reactionsOf(b) - reactionsOf(a);
  });
  const typeLabel = (r: Record<string, string>) => {
    const pre = (r.PostType || r.postType || "").trim();
    if (pre) return pre;
    const m = (r.MediaType || r.mediaType || "video").toLowerCase();
    if (m === "carousel") return "Carousel";
    if (m === "graphic") return "Still graphic";
    return "Video (see ALL POSTS for Talking video vs B-roll)";
  };

  const line = (r: Record<string, string>) => {
    const v = viewsOf(r);
    const tr = (r.Transcript || r.transcript || "").slice(0, 200);
    const url = r.Reel || r.reel || r.TikTok || r.tiktok || "";
    return `Views=${hasViews(r) ? fmt(v) : "not reported"} Reactions=${fmt(reactionsOf(r))} Type=${typeLabel(r)}: ${url || tr}`;
  };
  const TOP_N = 10;
  const top5 = sorted.slice(0, TOP_N).map(line).join("\n");
  const bottomSorted = [...sorted].reverse();
  const bottom5 = bottomSorted.slice(0, TOP_N).map(line).join("\n");


  const postUrls = allRows.map(r => r.Reel || r.reel || r.TikTok || r.tiktok || "").filter(u => u.startsWith("http"));

  const shape = (r: Record<string, string>) => {
    const v = viewsOf(r);
    const label = typeLabel(r);
    const isStatic = label === "Carousel" || label === "Still graphic";
    return {
      views: isStatic ? "No views (still post)" : hasViews(r) ? fmt(v) : "Views not reported",
      reactions: `${fmt(parseInt(r.Likes || r.likes || "0") || 0)} likes · ${fmt(parseInt(r.Comments || r.comments || "0") || 0)} comments`,
      url: r.Reel || r.reel || r.TikTok || r.tiktok || "",
      transcript: (r.Transcript || r.transcript || "").trim(),
      mediaType: r.MediaType || "video",
      postType: label,
      typeReason: (r.TypeReason || r.typeReason || "").trim(),
      typeConfidence: (r.TypeConfidence || r.typeConfidence || "").trim(),
    };
  };
  const topPostsWithUrls = sorted.slice(0, TOP_N).map(shape);
  const bottomPostsWithUrls = bottomSorted.slice(0, TOP_N).map(shape);



  const profileName = allRows[0]?.Profile || allRows[0]?.profile || "";

  return {
    total, fmtAvgViews: fmt(avg(views)), fmtMaxViews: fmt(views.length ? Math.max(...views) : 0),
    fmtMedianViews: fmt(median(views)), avgSaves: platform === "tiktok" ? avg(saves) : null,
    samplePosts, top5, bottom5, postUrls, topPostsWithUrls, bottomPostsWithUrls, profileName, platform,
  };
}

export const STEPS = [
  "Reading your posts",
  "Fetching captions from Instagram",
  "Working out what type each post is",
  "Analysing what stops people scrolling",
  "Finding your strongest topics",
  "Writing your recommendations",
  "Finishing your report",
];

export const PLATFORM_NOTES: Record<string, string> = {
  instagram: "Columns needed: Profile, Reel, Views, Likes, Comments, Transcript",
  tiktok: "Columns needed: Profile, TikTok, Views, Likes, Shares, Comments, Saves, Transcript",
};
