import { sourceSegments } from './podcastClipping';

type SourceRecord = { status: string; pendingCounts?: string; transcriptDetails?: { source?: string; coverage?: { verified?: boolean } }; shortFormIds?: string[] };
export function transcriptionComplete(record: SourceRecord) {
  return record.status !== 'Transcribing' && (record.transcriptDetails?.source === 'uploaded' || record.transcriptDetails?.coverage?.verified === true);
}
export function longFormTab(record: SourceRecord): 'transcribing' | 'transcribed' {
  return transcriptionComplete(record) ? 'transcribed' : 'transcribing';
}
export function shortFormTab(record: { status: string; contentIds: string[] }): 'new' | 'board' {
  return record.status === 'In production' || record.contentIds.length > 0 ? 'board' : 'new';
}
export function shortFormCount(record: SourceRecord) { return new Set(record.shortFormIds || []).size; }
export function longFormDisplayName(raw: unknown) {
  const name = typeof raw === 'string' ? raw : '';
  return name.trim() && !/^https?:\/\//i.test(name.trim()) ? name.trim() : 'Untitled long form';
}
export function transcriptExport(text: string, names: Record<string, string> = {}) {
  // Replace only speaker labels in existing timed lines; never reparse or shorten source text.
  const speakers = new Set(sourceSegments(text).map(s => s.speaker));
  return text.split('\n').map(line => {
    const match = line.match(/^(\[[^\]]+\]\s*)([^:]+)(:\s*.*)$/);
    if (!match || !speakers.has(match[2]) || !names[match[2]]) return line;
    return `${match[1]}${names[match[2]]}${match[3]}`;
  }).join('\n');
}
export function transcriptFilename(name: string) {
  return `${longFormDisplayName(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').slice(0, 120)}.txt`;
}
export type TranscriptionProgress = { phase: 'downloading' | 'transcribing' | 'speakers' | 'saving'; percent: number; label: string };
/** Reads the transcription service's status line into a visible percentage. */
export function transcriptionProgress(message: string | undefined | null): TranscriptionProgress {
  const m = String(message || '');
  const t = m.match(/transcribed\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*min/i);
  if (t) {
    const done = Number(t[1]), total = Number(t[2]) || 1;
    const percent = Math.min(85, Math.round(5 + (done / total) * 80));
    return { phase: 'transcribing', percent, label: `Transcribing: ${Math.round(done)} of ${Math.round(total)} min (${percent}%)` };
  }
  const dz = m.match(/diarization\s+(\d+)%/i);
  if (dz) { const n = Math.min(100, Number(dz[1])); const percent = Math.round(85 + n * 0.13); return { phase: 'speakers', percent, label: `Labelling speakers: ${n}% (${percent}%)` }; }
  if (/speaker|diariz/i.test(m)) return { phase: 'speakers', percent: 85, label: 'Labelling speakers… (85%)' };
  if (/sav|upload|finish|writ/i.test(m)) return { phase: 'saving', percent: 97, label: 'Saving transcript… (97%)' };
  return { phase: 'downloading', percent: 3, label: 'Downloading the recording… (3%)' };
}

export type ShortFormStage = 'review' | 'edit' | 'ready' | 'posted';
/** Tab for a short form, following its linked board record's Client Status. */
export function shortFormStage(record: { status: string; contentIds: string[] }, contentStatus?: string): ShortFormStage {
  if (shortFormTab(record) === 'new') return 'review';
  const s = (contentStatus || '').trim();
  if (/^(posted|scheduled|posting \| scheduling)$/i.test(s)) return 'posted';
  if (/^(ready to post|to post)$/i.test(s)) return 'ready';
  return 'edit';
}

export type LongFormStatus = 'To Transcribe' | 'Transcribing' | 'Transcribed' | 'To Clip' | 'Clipping' | 'Clipped' | 'Failed';
/** Visible long form status, derived from the stored status, coverage evidence and requested/saved pieces. */
export function longFormStatus(r: SourceRecord): LongFormStatus {
  if (r.status === 'Failed') return 'Failed';
  if (r.status === 'Transcribing') return 'Transcribing';
  if (r.status === 'Generating') return 'Clipping';
  if (!transcriptionComplete(r)) return 'To Transcribe';
  if (r.pendingCounts) return 'To Clip';
  return shortFormCount(r) > 0 ? 'Clipped' : 'Transcribed';
}
export function clipperTab(r: SourceRecord): 'new' | 'toClip' | 'clipped' {
  const s = longFormStatus(r);
  return s === 'To Clip' || s === 'Clipping' ? 'toClip' : s === 'Clipped' ? 'clipped' : 'new';
}
