// @ts-nocheck -- Bun test runner.
import { expect, test } from 'bun:test';
import { transcriptCoverage, requireCompleteTranscript, assertTranscriptReadback, timedPodcastTranscript } from './podcastTranscript';
test('two-hour recording with partial processing cannot complete', () => {
  expect(() => transcriptCoverage({ durationSeconds: 7200, transcribedSeconds: 1200 })).toThrow('only 20 of 120 minutes');
});
test('missing duration evidence cannot complete', () => {
  expect(() => requireCompleteTranscript(transcriptCoverage({}))).toThrow('verified');
});
test('two-hour full processing completes even with silence at the end', () => {
  const row = { durationSeconds: 7200, transcribedSeconds: 7200, segments: [{ start: 0, end: 7100, speaker: 'Speaker 1', text: 'Last speech before silence.' }] };
  const text = timedPodcastTranscript(row);
  expect(() => assertTranscriptReadback(text, text, transcriptCoverage(row))).not.toThrow();
});
test('explicit provider truncation cannot complete', () => {
  expect(() => timedPodcastTranscript({ truncated: true, durationSeconds: 7200, transcribedSeconds: 7200, segments: [{ start: 0, end: 1, text: 'Speech' }] })).toThrow('truncated');
});
test('storage truncation cannot complete', () => {
  expect(() => assertTranscriptReadback('all words', 'all', { verified: true })).toThrow('storage');
});