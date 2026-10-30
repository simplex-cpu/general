# Long-video transcription for Long Form Clipper

## Problem
Transcription currently downloads the video and uploads it to the transcription endpoint, which caps at 24 MB — so 2h+ videos (and Google Drive / YouTube links) fail. The published app runs on a serverless runtime where ffmpeg isn't available, so we can't split the file ourselves.

## Approach
Delegate long videos to the Apify actor `memo23/video-audio-transcriber` (already have an Apify token). It accepts any URL — direct files, Google Drive, Dropbox, YouTube — extracts the audio, and transcribes any length internally. Short direct files (≤24 MB) keep the current fast, free path.

Cost: the actor bills ~$0.80 per 1,000 seconds to your Apify account — roughly $6 per 2-hour video. Silent/failed media is not charged.

## Changes

1. **`src/lib/inspoRead.server.ts`**
   - `transcribeMedia(url)`: before downloading, do a HEAD check for `content-length`. If ≤24 MB and a direct file → current gateway path (unchanged). If larger, unknown, or a Drive/Dropbox/YouTube link → new `transcribeLongMedia(url)`.
   - `transcribeLongMedia`: starts an Apify run of `memo23~video-audio-transcriber` with `{ mediaUrls: [url] }` and returns `{ runId, datasetId }` instead of waiting (a 2h video can take 10–30 min, longer than a request can stay open).

2. **Long Form Clipper flow (`src/routes/api/long-forms.ts`)**
   - When the long path is needed, save the Long form record with status "Transcribing" plus the Apify run id (new "Apify Run ID" field on the Long forms table).
   - New endpoint `GET /api/long-forms/:id/refresh`: checks the Apify run; when finished, saves the transcript, sets status "Ready", then continues the existing short-form generation if "Add & Create Short Form" was chosen.

3. **Clipper UI (`LongFormClipperMode.tsx`)**
   - While a long form shows "Transcribing", poll the refresh endpoint every ~15s and show "Transcribing long video — this can take several minutes" on the card.
   - Update the Add new modal hint: direct file links of any size, Google Drive, Dropbox and YouTube links now work; long videos cost Apify transcription time (~$6 per 2 hours).

4. **Inspo reading** (`/api/inspo-read`): keep the short-file path only (inspo posts are short); if a long file is detected, return a clear message instead of failing silently.

5. **Tests**: size-routing logic (short → gateway, long/unknown/Drive → Apify), refresh endpoint state transitions (running → still Transcribing, succeeded → Ready + transcript saved, failed → error status).

## Notes
- No n8n changes.
- Needs the existing `APIFY_API_TOKEN` secret only.
