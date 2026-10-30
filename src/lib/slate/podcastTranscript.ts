export const PODCAST_TRANSCRIPTION_OPTIONS = {
  speakerLabels: true,
  wordTimestamps: true,
  translateToEnglish: false,
  maxMinutesPerItem: 600,
};
export const TRANSCRIPT_CHUNK_SIZE = 90_000;
export const TRANSCRIPT_CHUNKS = 10;
export const MAX_PODCAST_TRANSCRIPT_CHARS = TRANSCRIPT_CHUNK_SIZE * TRANSCRIPT_CHUNKS;
export function transcriptFields(text: string): Record<string, string> {
  if (text.length > MAX_PODCAST_TRANSCRIPT_CHARS) throw new Error("This transcript is too large to save safely. Split it into separate recordings; no text was truncated.");
  return Object.fromEntries(Array.from({ length: TRANSCRIPT_CHUNKS }, (_, i) => [i === 0 ? "Transcript" : `Transcript ${i + 1}`, text.slice(i * TRANSCRIPT_CHUNK_SIZE, (i + 1) * TRANSCRIPT_CHUNK_SIZE)]));
}
export function readTranscriptFields(fields: Record<string, unknown>): string {
  return Array.from({ length: TRANSCRIPT_CHUNKS }, (_, i) => String(fields[i === 0 ? "Transcript" : `Transcript ${i + 1}`] || "")).join("");
}
export function transcriptTime(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const whole = Math.floor(ms / 1000);
  return `${String(Math.floor(whole / 3600)).padStart(2, "0")}:${String(Math.floor(whole / 60) % 60).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}
/** Preserve all supplied timed segments and speaker labels, without guessing names. */
export function timedPodcastTranscript(row: any): string {
  if (row?.error || (row?.status && ["error", "failed", "no_speech"].includes(row.status)))
    throw new Error(String(row.error || "No speech was found in this video"));
  const segments: any[] = Array.isArray(row?.segments) ? row.segments : [];
  if (!segments.length) throw new Error("The service did not return timed segments. Add a timestamped transcript or start a new transcription.");
  let prev = -1;
  const lines = segments.map(s => {
    const start = Number(s?.start), end = Number(s?.end);
    const text = String(s?.text || "").trim();
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start < prev || !text)
      throw new Error("The service returned an incomplete or invalid timed transcript.");
    prev = start;
    const speaker = String(s.speaker || s.speakerLabel || "Unidentified speaker").replace(/[\n\r:]/g, " ").trim();
    return `[${transcriptTime(start)}-${transcriptTime(end)}] ${speaker}: ${text.replace(/\s+/g, " ")}`;
  });
  const result = lines.join("\n");
  if (result.length > MAX_PODCAST_TRANSCRIPT_CHARS) throw new Error("This transcript is too large to save safely. Split it into separate long-form records; no text was truncated.");
  if (row?.truncated === true || row?.isTruncated === true) throw new Error("The transcription service reported a truncated recording. Nothing was marked complete.");
  transcriptCoverage(row);
  return result;
}

export type PodcastWord = { start: number; end: number; text: string; speaker: string };
export type PackedWords = { v: 2; speakers: string[]; w: [number, number, string, number][] };
/** Compact, lossless word-timing storage: [start, end, text, speakerIndex] rows with one speaker list. */
export function packWords(words: PodcastWord[]): PackedWords {
  const speakers: string[] = [];
  const index = new Map<string, number>();
  const w = words.map((x): [number, number, string, number] => {
    let i = index.get(x.speaker);
    if (i === undefined) { i = speakers.length; speakers.push(x.speaker); index.set(x.speaker, i); }
    return [x.start, x.end, x.text, i];
  });
  return { v: 2, speakers, w };
}
/** Reads packed (v2) or legacy object-array word timing into PodcastWord[]. */
export function unpackWords(value: unknown): PodcastWord[] {
  if (Array.isArray(value)) return value as PodcastWord[];
  const p = value as PackedWords | null;
  if (p && p.v === 2 && Array.isArray(p.w) && Array.isArray(p.speakers)) return p.w.map(([start, end, text, i]) => ({ start, end, text, speaker: p.speakers[i] ?? 'Unidentified speaker' }));
  return [];
}
/** Serializes transcript details with packed words; the stored form is what gets size-checked. */
export function serializeTranscriptDetails(value: string): string {
  let parsed: any;
  try { parsed = JSON.parse(value); } catch { return value; }
  if (parsed && Array.isArray(parsed.words)) parsed = { ...parsed, words: packWords(parsed.words) };
  return JSON.stringify(parsed);
}
export function parseTranscriptDetails(value: string): any {
  const parsed = JSON.parse(value || '{}');
  if (parsed && parsed.words !== undefined) parsed.words = unpackWords(parsed.words);
  return parsed;
}
export function transcriptCoverage(row: any) {
  const duration = Number(row?.durationSeconds), processed = Number(row?.transcribedSeconds);
  const verified = Number.isFinite(duration) && duration > 0 && Number.isFinite(processed) && processed > 0;
  if (verified && processed + 1 < duration) throw new Error(`The service transcribed only ${Math.round(processed / 60)} of ${Math.round(duration / 60)} minutes.${Math.round(processed) === 1200 ? ' Your Apify account is on the free plan, which stops every run at 20 minutes — upgrade the Apify plan, then retry.' : ''} It cannot be marked complete.`);
  return { verified, durationSeconds: verified ? duration : null, transcribedSeconds: verified ? processed : null };
}
export function requireCompleteTranscript(coverage: { verified?: boolean }) {
  if (coverage.verified !== true) throw new Error('Full recording coverage could not be verified. It cannot be marked complete.');
}
export function assertTranscriptReadback(expected: string, actual: string, coverage: { verified?: boolean }) {
  if (actual !== expected) throw new Error('The full transcript could not be read back from storage. Nothing was marked complete.');
  requireCompleteTranscript(coverage);
}
/** Accept only returned, validated word timestamps; never infer word timing from segment length. */
export function podcastWords(row: any): PodcastWord[] {
  const segments = Array.isArray(row?.segments) ? row.segments : [];
  const supplied = Array.isArray(row?.words) ? row.words : segments.flatMap((s: any) => Array.isArray(s.words) ? s.words.map((w: any) => ({ ...w, speaker: s.speaker || s.speakerLabel })) : []);
  let previous = -1;
  return supplied.map((w: any) => {
    const start = Number(w.start), end = Number(w.end), text = String(w.word || w.text || '').trim();
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start < previous || !text) throw new Error('Invalid word timing returned. No cut times were invented.');
    previous = start;
    const segment = segments.find((s: any) => Number(s.start) <= start && Number(s.end) >= end);
    return { start, end, text, speaker: String(w.speaker || segment?.speaker || segment?.speakerLabel || 'Unidentified speaker') };
  });
}