// @ts-nocheck -- Bun test runner.
import { expect, test } from 'bun:test';
import { pickTranscriptionFile, footageLinkKind } from './footageSource';
const f = (name, size) => ({ name, path: name, size, url: name });
test('the studio stereo mix wins over cameras and single tracks', () => {
  expect(pickTranscriptionFile([f('C8915.MP4', 55.9e9), f('Track1-Combo 1.wav', 1e9), f('Stereo Mix.wav', 2e9)]).file.name).toBe('Stereo Mix.wav');
});
test('largest audio is used with a warning when only separate tracks exist', () => {
  const r = pickTranscriptionFile([f('Host.wav', 1e9), f('Guest.wav', 2e9)]);
  expect(r.file.name).toBe('Guest.wav'); expect(r.warning).toBeTruthy();
});
test('smallest video is the fallback', () => {
  expect(pickTranscriptionFile([f('A.MP4', 50e9), f('B.mp4', 3e9)]).file.name).toBe('B.mp4');
  expect(pickTranscriptionFile([f('notes.txt', 1)]).file).toBe(null);
});
test('folder links are recognised', () => {
  expect(footageLinkKind('https://www.dropbox.com/scl/fo/abc/xyz?rlkey=1')).toBe('dropbox-folder');
  expect(footageLinkKind('https://drive.google.com/drive/folders/1abc')).toBe('drive-folder');
  expect(footageLinkKind('https://youtu.be/x')).toBe('youtube');
  expect(footageLinkKind('https://www.dropbox.com/scl/fi/abc/Stereo.wav?rlkey=1')).toBe('file');
});
