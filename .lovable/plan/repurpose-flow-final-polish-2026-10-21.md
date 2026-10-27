# Repurpose flow — final polish

## Fix first: viral talking video came back as a B-roll
What the audit found (cause not yet confirmed on your exact post):
- A viral post's format is whatever the post reader saved when it was found. If the reader decides the video has "no meaningful speech" (for example the transcription came back empty or mostly silent), it labels the post B-roll and saves the on-screen text or caption as its copy instead of the spoken words. The writer then faithfully writes a B-roll from thin text, which looks unrelated to the original.
- The repurpose window hides the format picker whenever a format is saved, so a wrong label can't be corrected there.

Steps:
1. Look up the post you just tested and its new chat: confirm its saved format, whether a transcript was saved, and what format the writer was asked for. The fix below is adjusted to what that shows.
2. Viral path keeps the original format, always. The repurpose window shows the format as a fixed label ("Talking Video — same as original") with a small "Wrong format? Change" link for mislabeled posts. The writer is told the format is locked and refuses to switch structure.
3. Post reader: never label a video B-roll just because transcription failed; it retries transcription, and if speech still can't be read it keeps "Talking Video" when a person is on camera and flags "Transcript missing" on the card instead of saving thin copy. Repurpose is blocked with a clear message when a talking video has no transcript.
4. Re-read the affected saved posts (talking videos saved as B-roll with no transcript) so their format and copy are corrected.
5. Send the original's fields to the writer clearly labeled by format, instead of one mixed "copy" block: Talking Video gets Transcript (full spoken words), On-screen hook and Caption; B-roll gets On-screen text and Caption; Carousel gets Cover title, Slides 1..N and Caption; Graphic gets Slide copy and Caption. The writer must match the transcript's length and beats. The angle suggester gets the same transcript.

## Two separate routes, kept clean
```text
Viral post  -> same format (locked) -> pick angle -> keep hook + beats + length, change topic/stance -> chat
Own post    -> pick any format      -> no angle   -> keep message; new format follows that format's guidelines -> chat
```
- Each route has its own server request, rules and saved context; no shared format default between them.
- Tests: viral route rejects a format different from the post's saved one unless the user changed it explicitly; own-post route to a new format includes that format's guidelines.

## Angle step (viral posts)
- Angle titles: semibold to medium weight.
- "Suggested angles" and "Write my own" labels: darker text, more space between the two sections.
- Repurpose window subtitle: shortened so it fits on one line (truncates if needed).
- Progress bar: green instead of indigo (both viral and own-post paths share it).

## Angles must fit the hook
- The angle suggester receives the post's hook template and framework (already saved on each viral post) as binding constraints.
- Each angle must be writable using that exact hook pattern and beat order; the prompt asks the AI to drop any angle that would force changing the hook shape.
- Each angle also returns a short "hook preview" (the original hook rewritten for that angle) used to self-check fit; angles without a valid preview are discarded and the list is retried once.

## "Inspo" field everywhere a repurposed script appears
- Script card in the scripting chat: a small "Inspo" row with the original post link (opens through the safe link page) when the session came from a repurpose.
- Planner record window: an "Inspo" field showing the original post link for repurposed content.
- The link is saved with the session and carried into the planner record when the script is added to the planner. If the planner table has no inspo link field, one is added (long URL text field) to the Content table.
- Applies to both viral-post and own-post repurposes.

## Viral post window
- Thumbnail on the card no longer opens the preview; clicking the card opens the window as now.
- Inside the window, a centered play button sits over the media; clicking it plays the post in-app.
- Media frame a bit taller; gray details box tighter: smaller field text and less spacing between rows, stats stay large on the first row.

## Technical details
- Files: `RepurposeAnglePicker.tsx`, `RepurposeProgress.tsx` (green token), `InspoBankMode.tsx` (card click, modal play overlay, box sizing, subtitle), `api/repurpose-angles.ts` (hook template/framework + hookPreview validation), `inspoRepurpose.ts` / `api/inspo-repurpose.ts` / `api/post-repurpose.ts` (store `inspoUrl` in repurposeContext), `ScriptCard.tsx` (Inspo row), planner add-to-planner path and record window in `ApproveAndPostMode.tsx` (Inspo field).
- Green uses an existing success token in `styles.css`; add one if absent.
- Add a test: angles lacking a hook preview are rejected.
