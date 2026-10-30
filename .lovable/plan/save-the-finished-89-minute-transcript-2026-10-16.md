# Save the finished 89-minute transcript

## What happened
The transcription itself worked. The service finished all 89 minutes at 13:41 your time, with 14,005 words, and confirmed full coverage.

The failure came when the app tried to save it. The app stores the time of every single word so clips can be cut exactly. For this video that timing data is about 1.1 million characters. The app's safety limit is 900,000, so it refused to save rather than cut anything off. Each check after that hit the same limit, and the screen showed "Failed to execute".

Nothing is lost. The finished transcript stays on the transcription service, and the long form is still waiting for it. You won't pay to transcribe it again.

## Fix
1. **Store word timing in a compact form.** Each word is saved as a short list (start, end, word, speaker number) instead of a labelled block. This 89-minute video drops to about 410,000 characters. That's well under the limit, and every word and time is kept exactly. A video up to about 3 hours fits the same way.
2. **Older long forms keep working.** Word timing saved the old way is still read correctly.
3. **Finish this long form automatically.** Once the fix is in, the next check saves the transcript you already paid for. It still has to pass the full checks before it's marked done: whole recording covered, transcript read back in full, every word time read back.
4. **Clear error instead of "Failed to execute".** If saving ever fails, the long form window shows the real reason in plain words, not a broken-page error.

## Something to know about speakers
The service labelled **24 speakers** in this video, but almost all the speech belongs to 3–4 of them (Speaker 8, 7, 14 and 13). The rest are most likely the same people, split up by mistake. After it saves, give the same name to the labels that are the same person. Just the 3 or 4 main labels covers almost everything.

## Technical details
- `podcastTranscript.ts`: add `packWords(words)` → `{ v: 2, speakers: string[], w: [start, end, text, speakerIdx][] }` and `unpackWords(details)`, which accepts both packed v2 and the legacy object array.
- `longForm.server.ts`: in `patchLongForm`, pack `words` before serializing Transcript details. In the reader, unpack, so `transcriptDetails.words` keeps the same `PodcastWord[]` shape for short-forms cleanup and send-to-production.
- `long-forms.ts` refresh: the readback comparison still compares the full unpacked words with the service result. Keep the record at "Transcribing" on save errors, so a later poll can recover without starting a new run.
- `LongFormClipperMode.tsx`: when a refresh response isn't JSON, show "Couldn't save the finished transcript yet, will retry" instead of the raw error.
- Tests: pack/unpack round-trip is exact (including the 3-decimal times), legacy data still reads, and a 14k-word sample stays under the 900k limit.
- Then trigger a refresh for `rec1ztMcWncMD9X2U` and confirm it's marked Ready with 5,337 s of coverage.
