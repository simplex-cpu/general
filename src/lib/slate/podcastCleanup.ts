import { parsePostCopy } from './longFormClipper';
import type { PodcastWord } from './podcastTranscript';
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
const filler = new Set(['um', 'uh', 'erm', 'er', 'ah']);
const hesitationRepeats = new Set(['i', 'we', 'he', 'she', 'they', 'it', 'and', 'but']);
export type SourceCut = { start: number; end: number; speaker: string };

/** Deterministic cleanup: standalone hesitation tokens and immediately repeated words only. */
export function cleanPodcastSpeech(copy: string, sourceWords: PodcastWord[]) {
  const fields = parsePostCopy(copy);
  const meta = JSON.parse(fields['source notes'] || '{}');
  if (meta.template !== 'podcast' || !Array.isArray(meta.segments)) throw new Error('Verified podcast source is required.');
  const original = meta.segments.map((s: any) => s.text).join('\n\n');
  const seconds = (t: string) => t.split(':').reduce((n, part) => n * 60 + Number(part), 0);
  const selected = sourceWords.filter(w => meta.segments.some((s: any) => w.start >= seconds(s.start) && w.end <= seconds(s.end) && w.speaker === s.speaker));
  const expected = original.split(/\s+/).map(normalize).filter(Boolean);
  const actual = selected.map(w => normalize(w.text)).filter(Boolean);
  if (!selected.length || expected.length !== actual.length || expected.some((w: string, i: number) => w !== actual[i])) throw new Error('Reliable word timing is not available for this passage. Keep verbatim speech or trim a continuous excerpt.');
  const kept: PodcastWord[] = [];
  const cuts: SourceCut[] = [];
  let skipped = false;
  for (const word of selected) {
    const previous = kept.at(-1);
    const repeated = previous && previous.speaker === word.speaker && normalize(previous.text) === normalize(word.text) && hesitationRepeats.has(normalize(word.text));
    if (filler.has(normalize(word.text)) || repeated) { skipped = true; continue; }
    const last = cuts.at(-1);
    if (last && !skipped && last.speaker === word.speaker) last.end = word.end;
    else cuts.push({ start: word.start, end: word.end, speaker: word.speaker });
    skipped = false; kept.push(word);
  }
  if (!kept.length) throw new Error('Cleanup would remove the entire passage.');
  const cleaned = kept.map(w => w.text.trim()).join(' ');
  return { original, cleaned, cuts, words: kept };
}

export function applyPodcastCleanup(copy: string, sourceWords: PodcastWord[]) {
  const result = cleanPodcastSpeech(copy, sourceWords);
  const f = parsePostCopy(copy);
  const meta = JSON.parse(f['source notes']);
  meta.cleanup = result;
  return `Visual hook:\n${f['visual hook'] || ''}\n\nScript:\n${result.cleaned}\n\nSource notes:\n${JSON.stringify(meta)}`;
}