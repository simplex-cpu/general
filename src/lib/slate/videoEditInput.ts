// Saved input contract (video_edit v1) the Airtable "To Edit" dispatcher hands to the n8n video editors.
export const VIDEO_EDIT_FORMATS = ["BROLL", "Talking Video", "B-roll from long form", "Talking video from long form"] as const;
export type VideoEditFormat = (typeof VIDEO_EDIT_FORMATS)[number];

const LEGACY: Record<string, VideoEditFormat> = {
  "broll from long form": "B-roll from long form",
  "b-roll from long form": "B-roll from long form",
  "talking from long form": "Talking video from long form",
  "talking video from long form": "Talking video from long form",
  "long form clip": "Talking video from long form",
  broll: "BROLL",
  "talking video": "Talking Video",
};
/** Exact editing-style tag for a requested style (old long-form labels map to the new ones). */
export function videoEditFormat(style: string): VideoEditFormat | null {
  return LEGACY[String(style || "").trim().toLowerCase()] || null;
}

/** Seconds from s, MM:SS or HH:MM:SS (decimals allowed); NaN when unreadable. */
export function toSeconds(t: string): number {
  const v = String(t || "").trim();
  if (!/^\d+(?:\.\d+)?$|^\d{1,2}:\d{1,2}(?:\.\d+)?$|^\d+:\d{1,2}:\d{1,2}(?:\.\d+)?$/.test(v)) return NaN;
  return v.split(":").reduce((acc, p) => acc * 60 + Number(p), 0);
}

export type Range = { start_time: string; end_time: string };
/** Reads "00:02:14-00:02:28" lines (also ; or , separated). */
export function parseRanges(text: string): Range[] {
  return String(text || "")
    .split(/[\n;,]+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [a = "", b = ""] = l.split(/\s*[-–—]\s*|\s+to\s+/i);
      return { start_time: a.trim(), end_time: b.trim() };
    });
}

export type VideoEditDraft = {
  format: VideoEditFormat;
  clips: { url: string; duration_seconds?: number }[];
  visualHook?: string;
  visualCta?: string;
  timestamps?: string;
  textPosition?: string;
  musicUrl?: string;
  outputDurationSeconds?: number;
  brollStart?: number;
};

const MAX_TEXT = 240;

/** Builds the full video_edit object; throws a plain-language error when an input breaks a rule. */
export function buildVideoEdit(d: VideoEditDraft): Record<string, unknown> {
  const hook = (d.visualHook || "").trim(), cta = (d.visualCta || "").trim();
  if (hook.length > MAX_TEXT || cta.length > MAX_TEXT) throw new Error("Keep the on-screen text and CTA to 240 characters or fewer.");
  const clips = d.clips.filter((c) => /^https:\/\//i.test(c.url));
  if (!clips.length) throw new Error("Add the video as a direct https link.");
  const pos = d.textPosition?.trim().toLowerCase();
  if (pos && !["top", "center", "bottom"].includes(pos)) throw new Error("Text position must be top, center or bottom.");
  const source = clips[0];
  const sourceDur = source.duration_seconds;
  const media = sourceDur ? { clips: [{ url: source.url, duration_seconds: sourceDur }] } : { source_url: source.url };
  const music = d.musicUrl?.trim() ? { music_url: d.musicUrl.trim() } : {};
  const within = (s: number) => !sourceDur || s <= sourceDur;

  if (d.format === "B-roll from long form") {
    if (!hook) throw new Error("Add the on-screen text.");
    const ranges = parseRanges(d.timestamps || "");
    if (ranges.length < 1 || ranges.length > 12) throw new Error("Add between 1 and 12 timestamp ranges.");
    for (const r of ranges) {
      const a = toSeconds(r.start_time), b = toSeconds(r.end_time);
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`Check the timestamp range "${r.start_time}-${r.end_time}".`);
      if (b <= a) throw new Error(`The range ${r.start_time}-${r.end_time} must end after it starts.`);
      if (b - a < 3) throw new Error(`The range ${r.start_time}-${r.end_time} must be at least 3 seconds.`);
      if (!within(b)) throw new Error(`The range ${r.start_time}-${r.end_time} is past the end of the video.`);
    }
    const dur = d.outputDurationSeconds ?? 10;
    if (!(dur >= 5 && dur <= 15)) throw new Error("The final video must be 5 to 15 seconds.");
    return { version: 1, format: d.format, ...media, timestamp_ranges: ranges, visual_hook: hook, ...(cta ? { visual_cta: cta } : {}), output_duration_seconds: dur, text_position: pos || "top", ...music };
  }
  if (d.format === "Talking video from long form") {
    if (!hook || !cta) throw new Error("Talking videos need a visual hook and a CTA.");
    const [r] = parseRanges(d.timestamps || "");
    const a = toSeconds(r?.start_time || ""), b = toSeconds(r?.end_time || "");
    if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("Add one start and end time for the clip.");
    if (b <= a) throw new Error("The clip must end after it starts.");
    if (b - a > 600) throw new Error("Keep the clip to 10 minutes or less.");
    if (!within(b)) throw new Error("The clip ends past the end of the video.");
    return { version: 1, format: d.format, ...media, start_time: r.start_time, end_time: r.end_time, visual_hook: hook, visual_cta: cta, ...music };
  }
  const max = d.format === "BROLL" ? 3 : 10;
  if (clips.length > max) throw new Error(`${d.format} accepts up to ${max} clips.`);
  if (d.format === "Talking Video" && (!hook || !cta)) throw new Error("Talking videos need a visual hook and a CTA.");
  if (d.format === "BROLL" && !hook) throw new Error("Add the text overlay.");
  return {
    version: 1,
    format: d.format,
    clips: clips.map((c) => (c.duration_seconds ? { url: c.url, duration_seconds: c.duration_seconds } : { url: c.url })),
    visual_hook: hook,
    ...(cta ? { visual_cta: cta } : {}),
    ...(pos ? { text_position: pos } : {}),
    ...(d.brollStart !== undefined ? { broll_start: d.brollStart } : {}),
    ...music,
  };
}

/** Replaces only video_edit inside the Editing preferences JSON; non-JSON text is kept as legacy_text. */
export function mergeEditingPreferences(existing: unknown, videoEdit: Record<string, unknown>): string {
  let base: Record<string, unknown> = {};
  const raw = typeof existing === "string" ? existing.trim() : "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      base = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : { legacy_text: raw };
    } catch {
      base = { legacy_text: raw };
    }
  }
  return JSON.stringify({ ...base, video_edit: videoEdit });
}
