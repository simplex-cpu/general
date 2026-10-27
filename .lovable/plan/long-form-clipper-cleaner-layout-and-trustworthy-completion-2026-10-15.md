# Long form Clipper: cleaner layout and trustworthy completion

## Confirmed transcript finding
The saved long form is marked **Done**, but contains about **4,686 words**, no timed segments, and no stored duration/coverage evidence. That does **not** confirm the full two-hour recording was transcribed. Transcript length alone also does not prove which part is missing.

The current checks reject explicitly truncated or partially processed results when duration metadata exists, but allow completion when that evidence is absent. This gap will be closed.

**No paid retranscription starts in this round.** After the checks are repaired, confirm the original source and ask before starting a new transcription, as requested. Preserve the existing transcript and seven short forms.

## 1. Long-form table
- Add the standard tab container above the table: **Transcribing** and **Transcribed**, with counts.
- Transcribing holds unfinished/unverified records, including failed records with their real status visible. Transcribed holds records whose automatic transcription coverage is verified; manually supplied transcripts remain explicitly identified as uploaded, not service-verified.
- Add a **Short forms** column showing the number of currently saved linked pieces, including those already added to the board.
- Show a compact **Footage** link button instead of the full URL.
- Put an icon-only **Expand** button immediately beside each name, opening the long-form detail modal. Keep the name clickable as well.
- Use the YouTube title when available, otherwise a specific title based on the transcript's main idea. Repair URL-like completed names; naming failures remain retryable rather than leaving the URL as the permanent title. Unnamed pending records display a neutral temporary label instead of a full URL.

## 2. Clean detail modal
- Open centered with a brief opacity fade only: no sliding, side entry, or zoom movement. Scope this behavior to the clipper rather than changing other pages' dialogs.
- Keep the long-form name at the top and **Create short forms** as the primary action.
- Directly below the name, show one aligned metadata/action row in this order: **Status | Created date | Footage | Transcript**. The fourth item follows your later request for a transcript button; on narrow screens use a tidy two-by-two layout.
- Status is a tag, date is a readable label, and Footage and Transcript are compact buttons.
- Remove the collapsible transcript card. **Transcript** downloads the entire stored text as a `.txt` file, including timestamps and confirmed speaker labels where available. Disable it when no transcript exists.
- Preserve speaker-name correction in a separate compact **Speakers** control, without bringing back the transcript card.
- Show processing stages only during active work, or an interrupted/failed state requiring action. Remove the completed checklist and elapsed timer once work finishes.
- Keep a concise coverage warning for older/unverified transcripts; do not conceal it by removing the checklist.

## 3. Short-form table
- Add standard tabs immediately above the table: **New** and **Added to Board**, with counts; New is the default.
- Use saved board links and production status to classify rows, so a linked piece never returns to New accidentally.
- Move a piece to Added to Board immediately after a successful handoff, updating both counts.
- Preserve existing editing, deletion, cleanup, and queue/produce-now actions and the once-only board rule.

## 4. Reliable transcription completion
- Verify the actual transcription service input/output contract before changing field mappings. Existing requested fields alone are not proof that the service supports them.
- Compare authoritative source duration with processed-duration evidence; validate timed output, explicit truncation flags, and complete retrieval of all returned transcript items/chunks.
- Never infer full coverage from word count, a successful service run, or the last spoken timestamp alone; silence can legitimately occur at the end.
- Save and read back all transcript chunks and coverage evidence before promoting automatic transcription to a completed state or starting automatic short-form generation.
- Missing evidence remains **unverified/needs attention**, not a verified completion. Partial or explicitly truncated output is not marked complete. Preserve recoverable text and provide a clear next step.
- Keep transcription completion separate from short-form generation completion, so a finished batch cannot disguise an unverified recording.
- Treat the existing Done record as coverage-unverified without deleting its material. Identify whether the original provider result can be inspected without rerunning transcription; if not, explain what cannot be established and request permission before retranscribing.

## Technical details
- Update `LongFormClipperMode.tsx` and shared clipper presentation/filter helpers; reuse `SectionTabs`, existing buttons, and semantic design tokens.
- Use the existing linked short-form IDs for table counts; refresh the parent list after piece deletion or board actions.
- Implement a browser-generated UTF-8 text download with delayed object-URL cleanup and the supported touch-device file-sharing fallback.
- Limit server changes to naming, transcription validation/recovery, and completion semantics in the existing clipper pipeline. Preserve ownership checks, processing locks, saved source provenance, and keep-open behavior.
- Record the agreed preferences and structural rules during implementation, and track the work in `roadmap.md`.
- No n8n changes, posting-tool work, or unrelated layout changes.

## Verification
- Add focused tests for tab classification, short-form counts, board-link classification, and full transcript export data.
- Test a 7,200-second source with only partial processed coverage, absent duration evidence, explicit truncation, and a fully processed result. Verify incomplete/unverified results cannot become verified completion.
- Test transcript chunk round-tripping and completed-name fallback/retry behavior.
- Check desktop and phone layouts, centered modal opening, completed-checklist removal, tab transitions, and a real `.txt` download whose contents match the full saved transcript.
- Distinguish controlled checks from authenticated live checks; do not claim the original two-hour transcription is complete without source/provider evidence.