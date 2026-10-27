// Podcast scripting jobs handed to the user's n8n workflow ("Podcast scripting - B-roll + Talking Clip"),
// webhook API v1. The app submits one job per request, n8n answers HTTP 202 with an execution_id, and
// later posts the finished scripts to /api/public/podcast-scripts-callback. Only B-roll and Talking Clip
// are supported; Carousel and Graphic stay on the in-app writer or the manual template.
import { z } from "zod";
import type { ClipperCtx, LongForm } from "./longForm.server";
import { saveShortForms } from "./longForm.server";
import type { ShortPiece } from "./slate/longFormClipper";
import { formatRange } from "./slate/longFormClipper";
import { sourceSegments } from "./slate/podcastClipping";

export const N8N_FORMATS = ["BROLL", "Talking Video"] as const;
export type N8NFormat = (typeof N8N_FORMATS)[number];

export const n8nScriptCounts = z
  .object({ BROLL: z.number().int().min(0).max(20), "Talking Video": z.number().int().min(0).max(20) })
  .refine((c) => c.BROLL + c["Talking Video"] > 0, "Ask for at least one script.")
  .refine((c) => c.BROLL + c["Talking Video"] <= 20, "Ask for at most 20 scripts in total.");
export type N8nScriptCounts = z.infer<typeof n8nScriptCounts>;

// Saved application writing rules, sent on every request as anti_ai_slop_rules.
const ANTI_AI_SLOP_RULES =
  "Write specific, plain language. Avoid generic inspiration, stock transitions, hype, repetitive hook formulas and padded captions. Preserve meaning, uncertainty and distinctive language. Do not add unsupported certainty, diagnoses, fear or shame. Avoid formulaic contrasts such as \"This is not X, it is Y\" and generic \"here is the truth\" openings. Give every hook an honest payoff.";

/** "MM:SS" / "HH:MM:SS(.sss)" → integer milliseconds, or null when the line has no time. */
function toMs(t: string): number | null {
  const m = t.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:\.(\d+))?$/);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const ms = (h * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000 + Number((m[4] || "0").padEnd(3, "0").slice(0, 3));
  return ms <= 86_400_000 ? ms : null;
}

type ContractSpeaker = { id: string; name: string; bio: string; role: string | null; attribution_verified: boolean };

/** Saved "Name: bio" lines → name(lowercase) → { name, bio }. */
export function parseSpeakerBios(text: string) {
  const out = new Map<string, { name: string; bio: string }>();
  for (const line of (text || "").split("\n")) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    const s = m ? { name: m[1].trim(), bio: m[2].trim() } : { name: line.trim(), bio: "" };
    if (s.name) out.set(s.name.toLowerCase(), s);
  }
  return out;
}

/** Speakers the contract needs: transcript speakers (by display name), else saved profiles. Never invents bios. */
export function speakerRoster(long: Pick<LongForm, "transcript" | "speakerNames" | "speakerBios">) {
  const bios = parseSpeakerBios(long.speakerBios);
  const labels = [...new Set(sourceSegments(long.transcript).map((s) => s.speaker).filter((l) => l && l !== "Unidentified speaker"))];
  const names = labels.length
    ? [...new Set(labels.map((l) => String((long.speakerNames || {})[l] ?? "").trim() || String(l)))]
    : [...bios.values()].map((b) => b.name);
  return names.map((name) => ({ name, bio: bios.get(name.toLowerCase())?.bio || "" }));
}

/** Speaker records for the contract. The service requires a non-empty bio per speaker,
 * so when none is saved we send a minimal factual line (never invented facts). */
export function contractSpeakers(long: Pick<LongForm, "transcript" | "speakerNames" | "speakerBios">): ContractSpeaker[] {
  const roster = speakerRoster(long);
  return roster.slice(0, 20).map((s, i) => ({
    id: `spk${i + 1}`,
    name: s.name.slice(0, 160),
    bio: (s.bio.trim() || `${s.name} is a speaker in this recording.`).slice(0, 4000),
    role: null,
    attribution_verified: false,
  }));
}

/** Request body for the n8n webhook (contracts/request.schema.json, schema_version 1.0). */
export function buildJobRequest(long: LongForm, counts: N8nScriptCounts, opts: { jobId: string; audience?: string; cta?: string }) {
  const speakers = contractSpeakers(long);
  if (!speakers.length) throw new Error("Add at least one speaker profile before generating scripts.");
  const idByName = new Map(speakers.map((s) => [s.name.toLowerCase(), s.id]));
  const speakerIdFor = (label: string): string | null => {
    const name = String((long.speakerNames || {})[label] ?? "").trim() || String(label);
    return idByName.get(name.toLowerCase()) || null;
  };
  let segments: { start_ms: number; end_ms: number; speaker_id: string | null; text: string }[] = [];
  let untimed = 0;
  let total = 0;
  for (const s of sourceSegments(long.transcript)) {
    const start = toMs(s.start);
    const end = toMs(s.end);
    const text = s.text.trim().slice(0, 20000);
    if (start == null || end == null || end <= start || !text) { untimed++; continue; }
    total += text.length;
    segments.push({ start_ms: start, end_ms: end, speaker_id: speakerIdFor(s.speaker), text });
  }
  // The contract requires chronological order; stable sort keeps same-start lines in source order.
  segments = segments.map((s, i) => ({ s, i })).sort((a, b) => a.s.start_ms - b.s.start_ms || a.i - b.i).map((x) => x.s);
  if (!segments.length) throw new Error("This transcript has no timestamped lines. Transcribe the recording again before generating scripts.");
  if (untimed > segments.length) throw new Error("Most of this transcript is missing timestamps. Transcribe the recording again before generating scripts.");
  if (segments.length > 10000) throw new Error("This transcript has too many segments for the scripting service.");
  if (total > 500_000) throw new Error("This transcript is too long for the scripting service.");
  const nonEmpty = (v?: string | null) => (v && v.trim() ? v.trim().slice(0, 4000) : null);
  return {
    schema_version: "1.0" as const,
    job_id: opts.jobId,
    source_id: long.id,
    source_url: /^https:\/\/\S+$/.test(long.url) ? long.url.slice(0, 2048) : null,
    transcript: { segments },
    speakers,
    counts: { broll: counts.BROLL, talking_clip: counts["Talking Video"], carousel: 0 as const, graphic: 0 as const },
    anti_ai_slop_rules: ANTI_AI_SLOP_RULES,
    campaign_context: {
      audience: nonEmpty(opts.audience),
      approved_cta: nonEmpty(opts.cta) || nonEmpty(long.clipCta),
      available_footage: long.footageFile ? "Source footage is saved in the app's Drive folder." : null,
      release_status: null,
      previously_used_angles: [] as string[],
    },
  };
}

/** Contract cross-field checks the JSON schema can't express (mirrors code/normalize-request.mjs). */
export function requestProblems(body: ReturnType<typeof buildJobRequest>): string[] {
  const p: string[] = [];
  let prior = -1;
  for (const s of body.transcript.segments) {
    if (!Number.isInteger(s.start_ms) || !Number.isInteger(s.end_ms) || s.start_ms < 0 || s.end_ms <= s.start_ms || s.end_ms > 86_400_000) p.push("Transcript timestamps are invalid.");
    if (s.start_ms < prior) p.push("Transcript lines are out of order.");
    prior = s.start_ms;
  }
  const ids = new Set(body.speakers.map((s) => s.id));
  const names = new Set(body.speakers.map((s) => s.name.toLowerCase()));
  if (ids.size !== body.speakers.length || names.size !== body.speakers.length) p.push("Speaker names must be unique.");
  if (body.transcript.segments.some((s) => s.speaker_id !== null && !ids.has(s.speaker_id))) p.push("Transcript names an unknown speaker.");
  const n = body.counts.broll + body.counts.talking_clip;
  if (n < 1 || n > 20) p.push("Ask for 1–20 scripts.");
  return [...new Set(p)];
}

/** Callback ↔ job consistency: delivered counts match scripts and requested counts match the job. */
export function callbackProblems(body: FinishedEvent, jobCounts: { BROLL?: number; "Talking Video"?: number }): string[] {
  const p: string[] = [];
  const pairs: [string, z.infer<typeof formatResult>, number][] = [
    ["B-roll", body.results.broll, Number(jobCounts.BROLL || 0)],
    ["Talking Clip", body.results.talking_clip, Number(jobCounts["Talking Video"] || 0)],
  ];
  for (const [label, r, asked] of pairs) {
    if (r.delivered_count !== r.scripts.length) p.push(`${label}: delivered count does not match the scripts.`);
    if (r.requested_count !== asked) p.push(`${label}: requested count does not match the job.`);
  }
  return p;
}

/** n8n's 202 acknowledgment. */
export const ackBody = z.object({
  job_id: z.string(),
  execution_id: z.string().min(1).max(100),
  status: z.string().optional(),
});

const attribution = z.object({
  speaker: z.string().nullish(),
  proposed_speaker: z.string().nullish(),
  attribution_status: z.string().nullish(),
  start_time: z.string().nullish(),
  end_time: z.string().nullish(),
});
const brollScript = z.object({
  id: z.string().default(""),
  topic: z.string().default(""),
  visual_hook: z.string().default(""),
  text_overlay: z.string().nullish(),
  timestamps: z.string().nullish(),
  creative_direction: z.string().nullish(),
  captions: z.object({ instagram: z.string().nullish(), facebook: z.string().nullish(), tiktok: z.string().nullish(), youtube: z.string().nullish() }).partial().nullish(),
  caption: z.string().nullish(),
  cta: z.string().nullish(),
  duration_seconds: z.number().nullish(),
  visual_direction: z.string().nullish(),
  source: attribution.extend({ excerpt: z.string().nullish() }).nullish(),
  review_flags: z.array(z.string()).nullish(),
});
const talkingSegment = attribution.extend({ verbatim_text: z.string().default(""), start_line_id: z.string().nullish(), end_line_id: z.string().nullish() });
const talkingScript = z.object({
  id: z.string().default(""),
  topic: z.string().default(""),
  visual_hook: z.string().default(""),
  spoken_hook: z.string().default(""),
  text_overlay: z.string().nullish(),
  timestamps: z.string().nullish(),
  creative_direction: z.string().nullish(),
  captions: z.object({ instagram: z.string().nullish(), facebook: z.string().nullish(), tiktok: z.string().nullish(), youtube: z.string().nullish() }).partial().nullish(),
  speech_only_text: z.string().default(""),
  segments: z.array(talkingSegment).default([]),
  estimated_duration_seconds: z.number().nullish(),
  visual_plan: z.string().nullish(),
  caption: z.string().nullish(),
  cta: z.string().nullish(),
  review_flags: z.array(z.string()).nullish(),
});
const formatResult = z.object({
  status: z.enum(["generated", "needs_correction", "not_requested", "failed"]),
  requested_count: z.number().int().min(0),
  delivered_count: z.number().int().min(0),
  review_status: z.string().default(""),
  scripts: z.array(z.record(z.string(), z.unknown())).default([]),
  shortfall_reason: z.string().nullish(),
  error: z.object({ message: z.string().default("") }).nullish(),
  automated_qa: z.object({ passed: z.boolean(), issues: z.array(z.unknown()).default([]) }).nullish(),
});
export const finishedEvent = z.object({
  schema_version: z.literal("1.0"),
  event: z.literal("scripts.finished"),
  job_id: z.string().uuid(),
  source_id: z.string().min(1).max(200),
  execution_id: z.string().min(1).max(100),
  status: z.enum(["completed", "partial", "needs_review", "failed"]),
  completed_at: z.string(),
  results: z.object({ broll: formatResult, talking_clip: formatResult }),
  unsupported_formats: z.array(z.string()).default([]),
  review_required: z.literal(true),
});
export const failedEvent = z.object({
  schema_version: z.literal("1.0"),
  event: z.literal("execution.failed"),
  execution_id: z.string().min(1).max(100),
  status: z.literal("failed"),
  failed_node: z.string().nullish(),
  error: z.object({ code: z.literal("WORKFLOW_FAILED"), message: z.string().min(1).max(1000) }),
});
export const callbackBody = z.union([finishedEvent, failedEvent]);
export type FinishedEvent = z.infer<typeof finishedEvent>;
export type CallbackBody = z.infer<typeof callbackBody>;

const ts = (t?: string | null) => (t || "").replace(/(\.\d+)?$/, "").slice(0, 8).replace(/^00:/, "");

/** Marker on the first source-notes line; also used to dedupe repeated callbacks. */
export const studioMarker = (jobId: string) => `AI studio draft, needs review (job ${jobId})`;

const line = (label: string, v?: string | number | null) => (v === null || v === undefined || v === "" ? "" : `${label}: ${v}`);
const join = (parts: string[]) => parts.filter(Boolean).join("\n");

type V33 = { text_overlay?: string | null; timestamps?: string | null; creative_direction?: string | null; captions?: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube", string | null>> | null };
/** v3.3 scripts carry their own fields; older results fall back to the legacy mapping. */
const isV33 = (s: V33) => Boolean(s.creative_direction != null || s.captions || s.text_overlay != null || s.timestamps != null);
function captionsOf(s: V33) {
  const c = s.captions || {};
  const out: Record<string, string> = {};
  for (const k of ["instagram", "facebook", "tiktok", "youtube"] as const) if (c[k]?.trim()) out[k] = c[k]!.trim();
  // YouTube always mirrors the shared TikTok caption.
  if (out.tiktok && !out.youtube) out.youtube = out.tiktok;
  return out;
}

/** Maps one format result to ShortPieces. Studio fields are kept as readable plain-text notes. */
export function piecesFromResult(format: N8NFormat, result: z.infer<typeof formatResult>, jobId: string): ShortPiece[] {
  if (result.status === "not_requested" || result.status === "failed") return [];
  const review = line("Review status", result.review_status || (result.status === "needs_correction" ? "needs_correction" : ""));
  return result.scripts.map((raw) => {
    if (format === "BROLL") {
      const s = brollScript.parse(raw);
      const creativeDirection = join([
        review,
        line("Duration (s)", s.duration_seconds ?? null),
        line("Visual direction", s.visual_direction),
        line("Speaker", s.source?.speaker || (s.source?.proposed_speaker ? `${s.source.proposed_speaker} (inferred)` : "")),
        line("Source excerpt", s.source?.excerpt),
        line("Review flags", (s.review_flags || []).join("; ")),
      ]);
      if (isV33(s)) return {
        name: (s.topic || "B-roll").slice(0, 200),
        timestamps: s.timestamps || formatRange(s.source?.start_time, s.source?.end_time),
        textOverlay: s.text_overlay || s.visual_hook,
        cta: s.cta || undefined,
        creativeDirection: (s.creative_direction || "").trim(),
        captions: captionsOf(s),
        reviewFlags: s.review_flags || [],
      };
      return {
        name: (s.topic || "B-roll").slice(0, 200),
        timestamps: formatRange(s.source?.start_time, s.source?.end_time),
        textOverlay: s.visual_hook,
        cta: s.cta || undefined,
        creativeDirection: creativeDirection ? `${creativeDirection}\nUse the exact source range. Don't add other speech.` : "",
      };
    }
    const s = talkingScript.parse(raw);
    if (isV33(s)) return {
      name: (s.topic || "Talking Clip").slice(0, 200),
      timestamps: s.timestamps || s.segments.map((g) => formatRange(g.start_time, g.end_time)).filter(Boolean).join("\n"),
      visualHook: s.visual_hook || s.spoken_hook,
      script: s.speech_only_text || s.segments.map((g) => g.verbatim_text).join("\n\n"),
      cta: s.cta || undefined,
      creativeDirection: (s.creative_direction || "").trim(),
      captions: captionsOf(s),
      reviewFlags: s.review_flags || [],
    };
    const speakers = [...new Set(s.segments.map((g) => g.speaker || (g.proposed_speaker ? `${g.proposed_speaker} (inferred)` : "")).filter(Boolean))];
    const creativeDirection = join([
      review,
      line("Spoken hook", s.spoken_hook),
      line("Estimated duration (s)", s.estimated_duration_seconds ?? null),
      line("Visual plan", s.visual_plan),
      line("Speakers", speakers.join(", ")),
      line("Review flags", (s.review_flags || []).join("; ")),
      "Use the timestamp ranges in order. Don't add other speech.",
    ]);
    return {
      name: (s.topic || "Talking Clip").slice(0, 200),
      timestamps: s.segments.map((g) => formatRange(g.start_time, g.end_time)).filter(Boolean).join("\n"),
      visualHook: s.visual_hook || s.spoken_hook,
      script: s.speech_only_text || s.segments.map((g) => g.verbatim_text).join("\n\n"),
      cta: s.cta || undefined,
      creativeDirection,
    };
  });
}

/** Saves callback pieces once per job+format; returns how many were saved. */
export async function saveCallbackPieces(ctx: ClipperCtx, longId: string, jobId: string, body: FinishedEvent) {
  const { listShortForms } = await import("./longForm.server");
  const existing = await listShortForms(ctx, longId);
  let saved = 0;
  const jobs: [N8NFormat, z.infer<typeof formatResult>][] = [
    ["BROLL", body.results.broll],
    ["Talking Video", body.results.talking_clip],
  ];
  for (const [format, result] of jobs) {
    if (!result.scripts.length) continue;
    const key = `n8njob:${jobId}:${format}`;
    // Pieces saved by an earlier delivery of this callback carry the marker in their source notes.
    if (existing.some((s) => s.format === format && (s.operationKey === key || s.copy.includes(studioMarker(jobId))))) continue;
    const pieces = piecesFromResult(format, result, jobId);
    if (!pieces.length) continue;
    await saveShortForms(ctx, longId, format, pieces, key);
    saved += pieces.length;
  }
  return saved;
}

export class N8nSubmitError extends Error {
  constructor(message: string, public status: number | null, public uncertain = false) { super(message); }
}

/** Submits the job to the n8n webhook; returns the parsed 202 acknowledgment. */
export async function submitToN8n(webhookUrl: string, scriptingKey: string, payload: { job_id: string }) {
  let r: Response;
  try {
    r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Scripting-Callback-Key": scriptingKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e: any) {
    // Timeout/network: n8n may already be running. Never auto-replay the POST.
    throw new N8nSubmitError("The scripting service did not answer. The job may still be running; it is kept for reconciliation instead of being sent twice.", null, true);
  }
  const text = await r.text().catch(() => "");
  if (r.status === 202) {
    let ack: z.infer<typeof ackBody>;
    try {
      ack = ackBody.parse(JSON.parse(text));
    } catch {
      throw new N8nSubmitError("The scripting service acknowledged the job without an execution id. It is kept for reconciliation.", null, true);
    }
    if (ack.job_id !== payload.job_id)
      throw new N8nSubmitError("The scripting service acknowledged a different job. It is kept for reconciliation.", null, true);
    return ack;
  }
  let message = text.slice(0, 300);
  try {
    const d = JSON.parse(text);
    const details = Array.isArray(d.details) ? d.details.map((x: any) => x.message).join(" ") : "";
    message = [d.message || d.error, details].filter(Boolean).join(": ").slice(0, 300) || message;
  } catch { /* native platform error page */ }
  if (r.status === 422 || r.status === 401 || r.status === 403 || r.status === 503)
    throw new N8nSubmitError(message || `The scripting service rejected the job (${r.status}).`, r.status);
  // Other statuses: outcome uncertain, keep for reconciliation.
  throw new N8nSubmitError(message || `The scripting service answered ${r.status}. The job is kept for reconciliation.`, r.status, true);
}
