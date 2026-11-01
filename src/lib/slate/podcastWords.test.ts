// @ts-nocheck -- Bun test runner.
import { describe, expect, it } from 'bun:test';
import { packWords, parseTranscriptDetails, serializeTranscriptDetails, unpackWords, type PodcastWord } from './podcastTranscript';

const words: PodcastWord[] = [
  { start: 0, end: 0.36, text: 'She', speaker: 'Speaker 8' },
  { start: 0.36, end: 0.66, text: 'went', speaker: 'Speaker 8' },
  { start: 1.234, end: 1.5, text: '"quoted"', speaker: 'Speaker 7' },
];

describe('word timing storage', () => {
  it('round-trips packed words exactly', () => {
    expect(unpackWords(packWords(words))).toEqual(words);
    const stored = serializeTranscriptDetails(JSON.stringify({ coverage: { verified: true }, words }));
    expect(JSON.stringify(parseTranscriptDetails(stored).words)).toBe(JSON.stringify(words));
  });
  it('still reads legacy object-array word timing', () => {
    expect(parseTranscriptDetails(JSON.stringify({ words })).words).toEqual(words);
  });
  it('keeps a 14,000-word recording under the 900,000-character storage limit', () => {
    const many = Array.from({ length: 14_000 }, (_, i) => ({ start: i * 0.381, end: i * 0.381 + 0.36, text: 'conversation', speaker: `Speaker ${i % 24}` }));
    expect(serializeTranscriptDetails(JSON.stringify({ words: many })).length).toBeLessThan(900_000);
  });
});
