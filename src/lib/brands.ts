export const BRAND_BRIEF_FIELDS = [
  "Brand Name", "My Brand in Nutshell", "My Niche/Industry", "My Target Audience",
  "Pain Points", "Topics", "My Competitive Edge", "My Tone of Voice", "My Funnel for Monetization",
] as const;

export const BRAND_PLATFORMS = ["Instagram", "Facebook", "Youtube", "Tiktok", "Linkedin"] as const;
export type BrandSummary = { id: string; name: string; logo: string; completion: number; connected: string[]; brandIds?: string[]; handles?: Record<string, string>; stats?: { views: number; likes: number; comments: number; posts: number; status?: "on-track" | "attention" | "" } };
/** Traffic-light tone for brief completion: red <40, amber 40-79, green 80+. */
export function completionTone(pct: number): "low" | "mid" | "high" { return pct >= 80 ? "high" : pct >= 40 ? "mid" : "low"; }
/** Average stats over posts that have a views value. */
export function averageStats(rows: { views?: number; likes?: number; comments?: number }[]) {
  const n = rows.length; if (!n) return { views: 0, likes: 0, comments: 0, posts: 0 };
  const avg = (k: "views" | "likes" | "comments") => Math.round(rows.reduce((t, r) => t + (Number(r[k]) || 0), 0) / n);
  return { views: avg("views"), likes: avg("likes"), comments: avg("comments"), posts: n };
}
export function briefCompletion(fields: Record<string, unknown>) {
  return Math.round(BRAND_BRIEF_FIELDS.filter((key) => typeof fields[key] === "string" && String(fields[key]).trim().length > 0).length / BRAND_BRIEF_FIELDS.length * 100);
}
export function brandLinkOwned(briefBrands: unknown, ownedBrands: string[]) {
  return Array.isArray(briefBrands) && briefBrands.some((id) => typeof id === "string" && ownedBrands.includes(id));
}

export function createSingleFlight() {
  let active = false;
  return {
    acquire: () => { if (active) return false; active = true; return true; },
    release: () => { active = false; },
  };
}
/** Same brand when names match ignoring case, spacing and punctuation. */
export function sameBrandName(a: unknown, b: unknown) {
  const n = (v: unknown) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return !!n(a) && n(a) === n(b);
}

/** On track when the latest 5 posts average at least 80% of the brand's overall average views. */
export function performanceStatus(rows: { views?: number; date?: string }[]): "on-track" | "attention" | "" {
  if (!rows.length) return "";
  const all = rows.reduce((t, r) => t + (Number(r.views) || 0), 0) / rows.length;
  const recent = [...rows].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5);
  const avg = recent.reduce((t, r) => t + (Number(r.views) || 0), 0) / recent.length;
  return avg >= all * 0.8 ? "on-track" : "attention";
}
