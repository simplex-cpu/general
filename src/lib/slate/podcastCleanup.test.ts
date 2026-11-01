// @ts-nocheck -- Bun is the existing rule-test runner.
import { test, expect } from 'bun:test';
import { cleanPodcastSpeech, applyPodcastCleanup } from './podcastCleanup';
import { podcastPiece, sourceSegments, validatePodcastEdit } from './podcastClipping';
import { timedPodcastTranscript, transcriptCoverage, podcastWords } from './podcastTranscript';
import { formatPostCopy, parsePostCopy } from './longFormClipper';
const words = ['Um', 'I', 'I', 'do', 'not', 'not', 'agree.'].map((text, i) => ({ text, start: i, end: i + 0.5, speaker: 'Speaker 1' }));
const text = timedPodcastTranscript({ segments: [{ start: 0, end: 7, text: 'Um I I do not not agree.', speaker: 'Speaker 1' }] });
const copy = formatPostCopy('Talking Video', podcastPiece('Talking Video', { sourceSegmentIds: [0], visualHook: 'A different view' }, sourceSegments(text)));
test('optional cleanup removes hesitation and immediate repetition without removing negation', () => {
  const r = cleanPodcastSpeech(copy, words);
  expect(r.cleaned).toBe('I do not not agree.');
  expect(r.original).toBe('Um I I do not not agree.');
  expect(r.cuts).toEqual([{ start: 1, end: 1.5, speaker: 'Speaker 1' }, { start: 3, end: 6.5, speaker: 'Speaker 1' }]);
});
test('cleanup requires exact returned timing, never inferred word positions', () => {
  expect(() => cleanPodcastSpeech(copy, [])).toThrow('Reliable word timing');
  expect(() => cleanPodcastSpeech(copy, words.slice(1))).toThrow('Reliable word timing');
});
test('meaningful emphasis is preserved instead of treated as a hesitation', () => {
  const emphatic = timedPodcastTranscript({ segments: [{ start: 0, end: 3, text: 'Very very important.', speaker: 'Speaker 1' }] });
  const c = formatPostCopy('Talking Video', podcastPiece('Talking Video', { sourceSegmentIds: [0], visualHook: 'Important' }, sourceSegments(emphatic)));
  expect(cleanPodcastSpeech(c, ['Very', 'very', 'important.'].map((text, i) => ({ text, start: i, end: i + 1, speaker: 'Speaker 1' }))).cleaned).toBe('Very very important.');
});
test('approved cleaned speech saves but invented words still fail', () => {
  const edited = applyPodcastCleanup(copy, words);
  expect(parsePostCopy(validatePodcastEdit('Talking Video', edited, edited)).script).toBe('I do not not agree.');
  expect(() => validatePodcastEdit('Talking Video', edited, 'Script:\nI agree and buy now.')).toThrow();
});
test('coverage uses processed duration, not the last spoken word', () => {
  expect(transcriptCoverage({ durationSeconds: 7500, transcribedSeconds: 7500 })).toMatchObject({ verified: true });
  expect(() => transcriptCoverage({ durationSeconds: 7500, transcribedSeconds: 7200 })).toThrow('transcribed only');
  expect(transcriptCoverage({})).toMatchObject({ verified: false });
});
test('word times retain speaker attribution and reject invalid ordering', () => {
  expect(podcastWords({ segments: [{ start: 0, end: 1, speaker: 'Speaker 2', words: [{ word: 'Hello', start: 0, end: 1 }] }] })).toEqual([{ text: 'Hello', start: 0, end: 1, speaker: 'Speaker 2' }]);
  expect(() => podcastWords({ words: [{ word: 'a', start: 2, end: 3 }, { word: 'b', start: 1, end: 2 }] })).toThrow('Invalid');
});