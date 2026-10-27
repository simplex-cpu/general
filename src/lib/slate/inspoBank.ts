export const INSPO_FORMATS = ["Talking Video", "B-roll", "Carousel", "Graphic"] as const;
export const INSPO_PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Other"] as const;
export type InspoFormat = (typeof INSPO_FORMATS)[number];

export type InspoPost = {
  id: string;
  title: string;
  copy: string;
  url: string;
  platform: string;
  format: string;
  handle: string;
  topic: string;
  whyItWorks: string;
  postedDate: string;
  thumbnail?: string;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  createdDate: string;
  repurposedSessions: string[];
  status?: "New" | "Repurposed";
};

/** Human post age from the posted date, e.g. "Today", "3 days", "2 months". */
export function postAge(postedDate: string, now = new Date()): string {
  if (!postedDate) return "";
  const t = Date.parse(postedDate);
  if (Number.isNaN(t)) return "";
  const days = Math.max(0, Math.floor((now.getTime() - t) / 86_400_000));
  if (days === 0) return "Today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) { const m = Math.floor(days / 30); return `${m} month${m === 1 ? "" : "s"}`; }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? "" : "s"}`;
}

/** Brief title from the post copy when the user leaves it empty. */
export function derivePostTitle(title: string, copy: string): string {
  const clean = title.trim();
  if (clean) return clean.slice(0, 120);
  const first = copy.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0] || "";
  const words = first.split(" ").slice(0, 10).join(" ");
  return words ? (first.split(" ").length > 10 ? `${words}…` : words) : "Untitled inspo";
}

/** Scriptwriter format key for an inspo format label. */
export function writerFormat(format: string): "talkingVideo" | "broll" | "carousel" | "graphic" {
  if (format === "B-roll") return "broll";
  if (format === "Carousel") return "carousel";
  if (format === "Graphic") return "graphic";
  return "talkingVideo";
}

/** Posts found by search carry scraped stats or pictures; only manually added posts are editable. */
export const isMinedInspo = (p: Pick<InspoPost, "views" | "likes" | "comments" | "thumbnail">) => p.views != null || p.likes != null || p.comments != null || !!p.thumbnail;

/** Splits a saved "Why it works" analysis into its Hook template and Framework parts. */
export function splitWhyItWorks(text: string): { hook: string; framework: string } {
  const t = (text || "").trim();
  const m = t.match(/^[\s\S]*?(?:hook(?:\s*template)?)\s*[:\-–]\s*([\s\S]*?)(?:\n\s*(?:framework|structure|why it works)\s*[:\-–]\s*([\s\S]*))?$/i);
  if (m && /hook/i.test(t.slice(0, (m.index || 0) + 40))) return { hook: m[1].trim(), framework: (m[2] || "").trim() };
  const f = t.match(/^(?:framework|structure)\s*[:\-–]\s*([\s\S]*)$/i);
  return { hook: "", framework: (f ? f[1] : t).trim() };
}

/** Official in-page player for an Instagram or TikTok post, or "" when the link isn't recognised. */
export function inspoEmbedUrl(url: string): string {
  const ig = url.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (ig) return `https://www.instagram.com/${ig[1] === "p" ? "p" : "reel"}/${ig[2]}/embed`;
  const tt = url.match(/tiktok\.com\/.*\/(?:video|photo)\/(\d+)/);
  if (tt) return `https://www.tiktok.com/embed/v2/${tt[1]}`;
  return "";
}
