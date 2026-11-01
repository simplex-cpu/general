// Shared Long form Clipper rules: request counts, per-format post copy layout and board handoff.
import { z } from "zod";
import { MAX_PODCAST_TRANSCRIPT_CHARS } from "./podcastTranscript";

export const SHORT_FORMATS = ["BROLL", "Talking Video", "Graphic", "Carousel"] as const;
export type ShortFormat = (typeof SHORT_FORMATS)[number];
/** Formats users can create from a long form for now. */
export const CLIP_FORMATS = ["BROLL", "Talking Video"] as const satisfies readonly ShortFormat[];
export const MAX_PER_FORMAT = 10;
export const MAX_CAROUSEL_SLIDES = 6;
export const MAX_TRANSCRIPT_CHARS = MAX_PODCAST_TRANSCRIPT_CHARS;

export const WRITER_FORMAT: Record<ShortFormat, "broll" | "talkingVideo" | "graphic" | "carousel"> = {
  BROLL: "broll",
  "Talking Video": "talkingVideo",
  Graphic: "graphic",
  Carousel: "carousel",
};

const count = z.number().int().min(0).max(MAX_PER_FORMAT);
export const shortFormCounts = z
  .object({ BROLL: count, "Talking Video": count, Graphic: count, Carousel: count })
  .refine((c) => Object.values(c).some((n) => n > 0), "Ask for at least one short form.");
export type ShortFormCounts = z.infer<typeof shortFormCounts>;

export const newLongForm = z.object({
  url: z.string().trim().url().max(2000).refine((u) => /^https?:\/\//i.test(u), "Use an http(s) link"),
  name: z.string().trim().max(200).optional(),
  transcript: z.string().max(MAX_TRANSCRIPT_CHARS).optional(),
  counts: shortFormCounts.optional(),
  audioUrl: z.string().trim().url().max(2000).optional(),
  audioName: z.string().trim().max(300).optional(),
  speakers: z.array(z.object({ name: z.string().trim().min(1).max(80), bio: z.string().trim().max(400).default("") })).max(10).optional(),
  cta: z.string().trim().max(300).optional(),
});

/** A generated short-form piece before it is written as Post copy. */
export type ShortPiece = {
  name: string;
  timestamps: string;
  /** Editor-facing direction kept outside the script. */
  creativeDirection?: string;
  sourceNotes?: string;
  textOverlay?: string;
  visualHook?: string;
  script?: string;
  cta?: string;
  coverTitle?: string;
  coverSubtitle?: string;
  coverBody?: string;
  slides?: string[];
  /** Optional per-slide subtitle/body, aligned with `slides` (manual pieces fill these like the planner). */
  slideDetails?: { subtitle?: string; body?: string }[];
  /** Finished per-platform captions (TikTok and YouTube share one text). */
  captions?: Partial<Record<CaptionKey, string>>;
  /** Reviewer-only flags from the generator; never part of on-screen copy or Creative Direction. */
  reviewFlags?: string[];
};

export const CAPTION_LABELS = { instagram: "Instagram caption", facebook: "Facebook caption", tiktok: "TikTok caption", youtube: "YouTube caption" } as const;
export type CaptionKey = keyof typeof CAPTION_LABELS;

function extras(p: ShortPiece): string {
  const parts: string[] = [];
  for (const [k, label] of Object.entries(CAPTION_LABELS) as [CaptionKey, string][]) {
    const t = p.captions?.[k]?.trim();
    if (t) parts.push(`${label}:\n${t}`);
  }
  const flags = (p.reviewFlags || []).map((f) => f.trim()).filter(Boolean);
  if (flags.length) parts.push(`Review flags:\n${flags.join("\n")}`);
  return parts.length ? `\n\n${parts.join("\n\n")}` : "";
}

/** Pads one clock value to HH:MM:SS (drops fractions); "" when unreadable. */
export function padClock(t?: string | null): string {
  const m = String(t || "").trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,]\d+)?$/);
  if (!m) return "";
  return [m[1] || "0", m[2], m[3]].map((n) => String(Number(n)).padStart(2, "0")).join(":");
}

/** One range as HH:MM:SS-HH:MM:SS. */
export function formatRange(start?: string | null, end?: string | null): string {
  const a = padClock(start), b = padClock(end);
  return a && b ? `${a}-${b}` : a || b;
}

/** Normalizes timestamps to one HH:MM:SS-HH:MM:SS range per line (accepts m:ss, h:mm:ss, en dashes, commas). */
export function normalizeTimestamps(text: string): string {
  return String(text || "")
    .split(/[\n;,]+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [a, b] = l.split(/\s*[-–—]\s*|\s+to\s+/i);
      return formatRange(a, b) || l;
    })
    .join("\n");
}

/** Moves a legacy "Source notes:" block out of Post copy: returns clean copy plus timestamps/direction. */
export function splitLegacySourceNotes(copy: string): { copy: string; timestamps: string; direction: string } | null {
  const i = String(copy || "").search(/(^|\n)Source notes:\s*\n/i);
  if (i < 0) return null;
  const clean = copy.slice(0, i).trimEnd();
  const notes = copy.slice(i).replace(/^\n?Source notes:\s*\n/i, "");
  if (notes.trim().startsWith("{")) return null;
  const ranges: string[] = [];
  const keep: string[] = [];
  for (const l of notes.split("\n")) {
    const seg = l.match(/^\d+\.\s*\[([^\]]*)\]\s*(.*)$/);
    if (seg) { const [a, b] = seg[1].split(/\s*[–-]\s*/); const r = formatRange(a, b); if (r) ranges.push(r); continue; }
    const src = l.match(/^Source:\s*(.+)$/i);
    if (src) { const [a, b] = src[1].split(/\s*[–-]\s*/); const r = formatRange(a, b); if (r) ranges.push(r); continue; }
    if (/^(AI studio draft|Caption:|Segments \(keep)/i.test(l.trim())) continue;
    if (l.trim()) keep.push(l.trim());
  }
  return { copy: clean, timestamps: ranges.join("\n"), direction: keep.join("\n") };
}

/** Post copy layout: BROLL text overlay; Talking hook + script; graphics cover + slide titles. Never includes timestamps or direction. */
export function formatPostCopy(format: ShortFormat, p: ShortPiece): string {
  const tail = extras(p);
  if (tail) return formatPostCopy(format, { ...p, captions: undefined, reviewFlags: undefined }) + tail;
  // Only machine-verified podcast provenance (JSON) is kept, for source verification; it is hidden from editors.
  if (p.sourceNotes?.trim().startsWith("{")) {
    const base = formatPostCopy(format, { ...p, sourceNotes: undefined, slides: p.slides?.slice(0, 6) });
    const extra = format === "Carousel" && p.slides?.[6] ? `\nSlide 7 title: ${p.slides[6].trim()}` : "";
    return `${base}${extra}\n\nSource notes:\n${p.sourceNotes}`;
  }
  if (format === "BROLL") return `Text overlay:\n${(p.textOverlay || "").trim()}`;
  if (format === "Talking Video") {
    const parts = [`Visual hook:\n${(p.visualHook || "").trim()}`, `Script:\n${(p.script || "").trim()}`];
    if (p.cta?.trim()) parts.push(`CTA:\n${p.cta.trim()}`);
    return parts.join("\n\n");
  }
  const lines = [`Cover title: ${(p.coverTitle || "").trim()}`, `Cover subtitle: ${(p.coverSubtitle || "").trim()}`];
  if (p.coverBody?.trim()) lines.push(`Cover body: ${p.coverBody.trim()}`);
  if (format === "Carousel")
    (p.slides || []).slice(0, MAX_CAROUSEL_SLIDES).forEach((t, i) => {
      lines.push(`Slide ${i + 1} title: ${t.trim()}`);
      const d = p.slideDetails?.[i];
      if (d?.subtitle?.trim()) lines.push(`Slide ${i + 1} subtitle: ${d.subtitle.trim()}`);
      if (d?.body?.trim()) lines.push(`Slide ${i + 1} body: ${d.body.trim()}`);
    });
  if (p.cta?.trim()) lines.push(`CTA: ${p.cta.trim()}`);
  return lines.join("\n");
}

/** Read labeled sections back out of Post copy (edits keep the same labels). */
export function parsePostCopy(copy: string): Record<string, string> {
  const out: Record<string, string> = {};
  let key = "";
  for (const line of copy.split("\n")) {
    const m = line.match(/^(Text overlay|Visual hook|Script|CTA|Cover title|Cover subtitle|Cover body|Slide \d+ (?:title|subtitle|body)|Source notes|Instagram caption|Facebook caption|TikTok caption|YouTube caption|Review flags):\s*(.*)$/i);
    if (m) {
      key = m[1].toLowerCase();
      out[key] = m[2];
    } else if (key) out[key] = out[key] ? `${out[key]}\n${line}` : line;
  }
  for (const k of Object.keys(out)) out[k] = out[k].trim();
  return out;
}

/** Script payload for the existing planner handoff, built from Post copy. */
export function boardScript(format: ShortFormat, copy: string, speakerNames: Record<string, string> = {}) {
  const f = parsePostCopy(copy);
  const fmt = WRITER_FORMAT[format];
  const caps = Object.fromEntries((Object.entries(CAPTION_LABELS) as [CaptionKey, string][]).map(([k, l]) => [k, f[l.toLowerCase()] || ""]).filter(([, v]) => v));
  const captions = Object.keys(caps).length ? { captions: caps as Partial<Record<CaptionKey, string>> } : {};
  const creativeInstructions = f["source notes"] ? creativeDirection(f["source notes"], speakerNames) || "Use the exact source range. Don't add other speech or a spoken CTA." : "";
  if (format === "BROLL") return { kind: "video", format: fmt, script: f["text overlay"] || copy.trim(), creativeInstructions, ...captions };
  if (format === "Talking Video")
    return { kind: "video", format: fmt, script: f.script || "", visualHook: f["visual hook"] || "", cta: f.cta || "", creativeInstructions, ...captions };
  const slides = [{ position: 1, role: "hook", headline: f["cover title"] || "", subtitle: f["cover subtitle"] || "", body: f["cover body"] || "" }];
  if (format === "Carousel")
    for (let i = 1; i <= (f["source notes"] ? 7 : MAX_CAROUSEL_SLIDES); i++)
      if (f[`slide ${i} title`]) slides.push({ position: i + 1, role: "content", headline: f[`slide ${i} title`], subtitle: f[`slide ${i} subtitle`] || "", body: f[`slide ${i} body`] || "" });
  return { kind: "carousel", format: fmt, slides, ...(f.cta ? { cta: f.cta } : {}), creativeInstructions, ...captions };
}

/** A short form can go to the board once, and only while it is New. */
export function canAddToBoard(s: { status: string; contentIds: string[] }) {
  return s.status !== "In production" && s.contentIds.length === 0;
}

export function totalRequested(c: ShortFormCounts) {
  return SHORT_FORMATS.reduce((n, f) => n + c[f], 0);
}

/** Absolute targets let a resumed request reconcile already-saved pieces. */
export function pendingClipCounts(targets: Record<ShortFormat, number>, saved: { format: string }[]) {
  return Object.fromEntries(SHORT_FORMATS.map(f => [f, Math.max(0, targets[f] - saved.filter(s => s.format === f).length)])) as Record<ShortFormat, number>;
}

export function clipExitBlocked(active: boolean, error: string) { return active && !error; }

/** Direct transcription accepts files up to this size; larger files and share links go to the long-video transcriber. */
export const MAX_DIRECT_TRANSCRIBE_BYTES = 24 * 1024 * 1024;
const LONG_HOSTS = /(^|\.)(drive\.google\.com|dropbox\.com|youtube\.com|youtu\.be|onedrive\.live\.com|sharepoint\.com)$/i;

/** True when the footage link cannot be transcribed directly and must go through the long-video transcriber. */
export function needsLongTranscription(url: string, contentLength?: number | null) {
  if (contentLength != null && contentLength > MAX_DIRECT_TRANSCRIBE_BYTES) return true;
  try {
    return LONG_HOSTS.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Rough wait shown before confirming an Add long form: transcription dominates, short forms add about a minute each. */
export function estimateWait(source: "transcribe" | "upload", shortForms: number): string {
  const base = source === "upload" ? [1, 2] : [10, 30];
  const extra = Math.max(0, shortForms);
  const lo = base[0] + Math.ceil(extra * 0.5), hi = base[1] + extra;
  return `About ${lo}–${hi} min`;
}

const clock = (t: string) => { const m = String(t || "").match(/^(?:(\d+):)?(\d+):(\d+)/); if (!m) return { label: t || "", secs: NaN }; const h = Number(m[1] || 0), mi = Number(m[2]), s = Number(m[3]); return { label: `${h ? `${h}:` : ""}${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}`, secs: h * 3600 + mi * 60 + s }; };

/** Plain-language Creative Direction from the podcast source notes (raw JSON stays in Source notes). */
export function creativeDirection(sourceNotes: string, speakerNames: Record<string, string> = {}): string {
  let meta: any;
  try { meta = JSON.parse(sourceNotes); } catch { return ""; }
  const segs: any[] = Array.isArray(meta?.segments) ? meta.segments : [];
  if (!segs.length) return "";
  const a = clock(segs[0].start), b = clock(segs[segs.length - 1].end);
  const name = (s: string) => (speakerNames[s] || s || "").trim();
  const speakers = [...new Set(segs.map((s) => name(s.speaker)).filter(Boolean))];
  const dur = Number.isFinite(a.secs) && Number.isFinite(b.secs) ? ` (${Math.max(0, Math.round(b.secs - a.secs))} sec)` : "";
  const text = segs.map((s) => String(s.text || "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");
  const first = text.split(/(?<=[.!?])\s+/)[0] || text;
  const last = text.split(/(?<=[.!?])\s+/).filter(Boolean).pop() || "";
  const quote = first === last || !last ? first : `${first} … ${last}`;
  return [
    `Clip: ${a.label} – ${b.label}${dur}${speakers.length ? ` · Speaker${speakers.length > 1 ? "s" : ""}: ${speakers.join(", ")}` : ""}`,
    `What's said: ${text.length > 400 ? `${text.slice(0, 400).replace(/\s\S*$/, "")}…` : text}`,
    `Quote: "${quote}"`,
    `Note: Use this exact range. Don't add other speech or a spoken CTA.`,
  ].join("\n");
}

/** Converts old raw "Podcast source provenance" instructions into Creative Direction; other text is unchanged. */
export function readableCreativeInstructions(text: string): string {
  const m = String(text || "").match(/Podcast source provenance \(not on-screen copy\):\n([\s\S]*?)\nUse the exact source range\.[^\n]*(?:\n+Confirmed speaker names:\n(\{[\s\S]*?\}))?\s*$/);
  if (!m) return text;
  let names: Record<string, string> = {};
  try { names = m[2] ? JSON.parse(m[2]) : {}; } catch { /* keep labels */ }
  const readable = creativeDirection(m[1].trim(), names);
  return readable ? text.slice(0, m.index).trimEnd() + (m.index ? "\n\n" : "") + readable : text;
}
