// @ts-nocheck -- Bun test runner.
import { expect, test } from 'bun:test';
import { longFormTab, shortFormTab, shortFormCount, transcriptExport } from './clipperPresentation';
test('Done without coverage remains unfinished, verified coverage is transcribed', () => {
  expect(longFormTab({ status: 'Done' })).toBe('transcribing');
  expect(longFormTab({ status: 'Ready', transcriptDetails: { coverage: { verified: true } } })).toBe('transcribed');
  expect(longFormTab({ status: 'Generating', transcriptDetails: { coverage: { verified: true } } })).toBe('transcribed');
});
test('uploaded transcripts are separate from service coverage', () => {
  expect(longFormTab({ status: 'Ready', transcriptDetails: { source: 'uploaded' } })).toBe('transcribed');
});
test('board links and production status both remove a piece from New', () => {
  expect(shortFormTab({ status: 'New', contentIds: [] })).toBe('new');
  expect(shortFormTab({ status: 'New', contentIds: ['content'] })).toBe('board');
  expect(shortFormTab({ status: 'In production', contentIds: [] })).toBe('board');
});
test('count includes all unique linked saved short forms', () => {
  expect(shortFormCount({ status: 'Done', shortFormIds: ['a', 'b', 'b'] })).toBe(2);
});
test('export preserves the complete two-hour transcript, changing only confirmed labels', () => {
  const line = '[00:00:00.000-00:00:01.000] Speaker 1: Speech remains exact.';
  const text = Array(5000).fill(line).join('\n') + '\n[01:59:59.000-02:00:00.000] Speaker 2: Final words.';
  const output = transcriptExport(text, { 'Speaker 1': 'Alice' });
  expect(output.split('\n').length).toBe(5001);
  expect(output).toBe(text.replaceAll('] Speaker 1:', '] Alice:'));
});import { transcriptionProgress, shortFormStage } from './clipperPresentation';
test('service status lines become percentages', () => {
  expect(transcriptionProgress('Item 1/1: transcribed 76/89 min, ~4 min left').percent).toBe(73);
  expect(transcriptionProgress('Item 1/1: labelling speakers…').phase).toBe('speakers');
  expect(transcriptionProgress('').phase).toBe('downloading');
});
test('short form tabs follow the board status', () => {
  expect(shortFormStage({ status: 'New', contentIds: [] }, 'Posted')).toBe('review');
  expect(shortFormStage({ status: 'In production', contentIds: ['c'] }, 'Production')).toBe('edit');
  expect(shortFormStage({ status: 'In production', contentIds: ['c'] }, 'Ready to Post')).toBe('ready');
  expect(shortFormStage({ status: 'In production', contentIds: ['c'] }, 'Scheduled')).toBe('posted');
});
test('speaker labelling progress moves the bar', () => {
  expect(transcriptionProgress('Item 1/1: labelling speakers… diarization 40%')).toEqual({ phase: 'speakers', percent: 90, label: 'Labelling speakers: 40% (90%)' });
  expect(transcriptionProgress('Item 1/1: labelling speakers… diarization 100%').percent).toBe(98);
});
import { longFormStatus, clipperTab } from './clipperPresentation';
const ok = { transcriptDetails: { coverage: { verified: true } } };
test('long form statuses and tabs', () => {
  expect(longFormStatus({ status: 'Ready' })).toBe('To Transcribe');
  expect(clipperTab({ status: 'Transcribing' })).toBe('new');
  expect(longFormStatus({ status: 'Ready', ...ok })).toBe('Transcribed');
  expect(clipperTab({ status: 'Ready', pendingCounts: '{"BROLL":1}', ...ok })).toBe('toClip');
  expect(longFormStatus({ status: 'Generating', ...ok })).toBe('Clipping');
  expect(clipperTab({ status: 'Done', shortFormIds: ['a'], ...ok })).toBe('clipped');
});
