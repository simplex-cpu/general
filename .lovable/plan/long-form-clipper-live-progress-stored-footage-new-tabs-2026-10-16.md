# Long form Clipper: live progress, stored footage, new tabs

## What happened with the stuck video
It isn't stuck. The video is 1 hour 28 minutes long, not 1:28 minutes. The transcription service finished all 89 minutes at 18:57 and is now labelling speakers, which is the last step. The app showed nothing more than "Transcribing" because it never displayed the service's own progress. The fix below adds that.

## 1. Real progress percentage
- While a long form is transcribing, the detail window and the table row show a percentage with a bar, for example "Transcribing: 76 of 89 min (85%)", followed by "Labelling speakers…" and "Saving transcript…".
- The figure comes from the transcription service's live status and refreshes every 15 seconds while the window is open.
- If no update arrives for 20 minutes, the long form shows "No progress for 20 min" with a Retry button, so a stalled job is easy to spot.

## 2. Store the footage, not just the YouTube link
- When a long form is added, the app saves a copy of the video file to your shared Google Drive folder and keeps that Drive link on the long form.
- **Footage** opens the Drive file. While the copy is being made, the button reads "Saving footage…". The original YouTube link stays available as a small secondary "Source" link.
- Existing long forms get a "Save footage to Drive" action.
- Produce now uses the Drive copy as the footage link for video pieces.

## 3. New tabs inside each long form
Replace New / Added to Board with:
- **Review**: pieces not yet added to the board.
- **To Edit | Designed**: on the board and in production.
- **Ready to Post**: approved and waiting to go out.
- **Posted**: published.
Each tab shows a count. A piece's tab follows the status of its linked board record, so it moves along on its own as production progresses.

## 4. Status under the title
The status tag (e.g. "Transcribing") moves directly below the long form title. Date, Footage and Transcript stay in the button grid.

## Technical details
- `checkLongTranscription` also returns the Apify run `statusMessage`. A parser in `clipperPresentation.ts` turns "transcribed X/Y min" and the "labelling speakers" message into a percentage and phase, with tests. A stall is detected when the last-log timestamp is more than 20 minutes old.
- Footage: start an Apify YouTube video downloader run, then stream the resulting MP4 into Drive with the existing `googleDrive.server.ts` resumable upload to `GOOGLE_DRIVE_SHARED_FOLDER_ID`. Save the link to a new long form field, "Footage file" (Airtable). The run is polled the same way as transcription, so no request has to stay open for long.
- Tabs: a `shortFormStage(short, contentStatus)` helper in `clipperPresentation.ts` maps the linked Content record's Client Status to the four tabs, with tests. Statuses are batch-read for the long form's linked Content records using the existing owned-content reader.
- Add a rule for stored footage and stage mapping to `AGENTS.md`, and update `roadmap.md`.

## Open question
Point 3 assumes the tabs follow the board record's existing statuses: To Edit/To Design, then Ready to Post, then Posted. If "Review" should instead mean something different, such as pieces waiting for your approval after they are added to the board, please say so.
