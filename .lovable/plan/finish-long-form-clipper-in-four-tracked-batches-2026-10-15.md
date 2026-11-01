# Finish Long Form Clipper in four tracked batches

## Goal
Finish the remaining long-form work without changing the approved format designs or n8n. Use your existing long video for final verification rather than asking for another reference.

## Verified starting point
- The long-form table, detail window, transcript display, sequential creation and saved short-form editing are implemented.
- Source validation checks saved quotations and speaker passages; Talking Video speech is assembled from the selected source rather than rewritten.
- The transcript controls currently display text only: there is no speaker-name correction interface. Talking Video edits currently allow only continuous excerpts, not internal filler/repetition removal.
- Generation checks previously saved passages before saving, but the inspected flow has no atomic cross-request lock. Add to board creates Content and links the source in separate requests; this needs interruption and duplicate protection.
- Transcription requests speaker labels, word timing and a 600-minute limit. Storage preserves large transcripts across ten text fields, but the parser currently retains segment timing only. Neither configuration nor synthetic tests prove full coverage of a real two-hour recording.

## Batch 1 — Safe creation, continuation and board handoff
- Prevent two tabs or overlapping requests from generating the same request slot or using the same source passage concurrently.
- Preserve completed pieces and continue only unfinished work after refresh, interruption or a failed save. Deleting a completed piece must not silently request a replacement.
- Make Add to board recover safely when Content is created but linking fails. Repeated clicks and retries must resolve to the same Content record for both queue and produce-now choices.
- Preserve clear progress, release blocked controls on errors, and show the actual safe failure reason. Access denials must not turn into automatic retry loops.

**Completion check:** concurrent-request, interrupted-save and repeated-handoff tests pass; reopened progress matches saved work; no extra short-form or Content records are created.

## Batch 2 — Correctable speaker names and complete long transcripts
- Add a compact speaker-name editor within Transcript. Names are user-confirmed; unidentified speakers remain clearly unidentified.
- Store names as a mapping over immutable source speaker IDs, so corrections do not invalidate source checks. Apply confirmed attribution to new pieces and owned saved pieces without altering their quotations.
- Retain the original transcript, timed segments and provider word timings when available. Preserve existing records and uploaded transcripts.
- Verify the transcription provider's documented duration/coverage output and validate truncation, malformed timing and coverage evidence. Missing coverage evidence must not be presented as verified completeness; silence at the end must not be mistaken for truncation.
- Ensure moment selection can inspect the beginning, middle and end of large transcripts without exceeding the existing model's request limits or silently ignoring later material.

**Completion check:** speaker corrections survive reload; original source remains unchanged; tests cover late-recording excerpts and incomplete results; all source text round-trips without truncation.

## Batch 3 — Optional faithful cleanup with accurate cuts
- Keep verbatim speech as the default. Offer optional light removal of filler words and repeated phrases, with original and cleaned speech available for comparison.
- Never paraphrase, reorder speech, merge speaker identities, change meaning or invent spoken transitions/CTAs. Keep negations and meaningful emphasis.
- Derive ordered retained cut ranges from source word timing, not model-estimated timestamps. If word timing is unavailable, allow only reliable whole-segment/continuous trimming and clearly explain the limitation.
- Keep carousel quotations faithful and attributed, with editorial text separate. Preserve the approved eight-slide podcast carousel and the standard scripting rules unchanged.
- Carry original speech, approved cleaned speech, speaker identities and ordered cuts into the saved short form and its Content/DIY handoff. Document the exact fields your automation should consume.

**Completion check:** tests reject invented words, reordered passages, unsafe deletions, wrong speakers and guessed cuts; save/reload and production handoff preserve the approved version and exact source ranges.

## Batch 4 — Real-video QA and completion report
- First try to restore the authorized app session and locate the existing owned long video. If that fails, request only the sign-in needed to continue—not credentials in chat—and mark live verification blocked.
- Inspect the saved transcript first; reuse complete verified transcription where possible rather than incurring an unnecessary new run. Run a real long-video transcription only where needed to verify missing speaker/timing/coverage information.
- Check actual recording duration and inspect beginning, middle and end. Do not claim two-hour coverage if the existing recording or provider evidence cannot establish it.
- Generate and read back BROLL, Talking Video, Graphic and Carousel pieces from saved records. Compare speech, quotations, attribution and ranges with their own source—not with the independent reference uploads.
- Exercise edit/save, correction, cleanup, delete, interrupted continuation and duplicate prevention. Verify both queue and produce-now handoff and read back linked Content/DIY records with selected branding intact.
- Check the running interface on desktop and phone, including progress, completion, error recovery and long transcript scrolling.
- Report any n8n sequence requirements separately. App handoff verification does not prove external rendering works.

**Completion check:** focused tests and preview checks pass; real saved records and production links read back correctly; report separately what is implemented, tested with controlled data, verified live or blocked.

## Batch tracking
During implementation, add a dedicated four-batch checklist to the existing roadmap and keep it updated after each delivery. Each batch gets **Pending / In progress / Complete / Blocked**, its verification result and any blocker. Complete a batch before moving to the next; if an external blocker prevents its live check, finish the independent work and leave that check explicitly open. Every delivery summary names the completed batch and the next batch.

## Technical approach
- Keep Airtable Long forms, Short forms and Content as the content records. Add only required speaker, timing, cleanup and stable operation-key fields after inspecting the live field definitions.
- Use a private Lovable Cloud operation ledger with atomic per-long-form leases and unique operation keys for cross-request protection. Authorize the existing access-code owner before privileged operations; do not introduce a new login system or expose ledger rows to browsers.
- Reconcile Airtable writes by stable operation key before retrying ambiguous saves. Airtable and Cloud cannot share a transaction, so uncertain writes must be reconciled rather than blindly repeated.
- Keep processing bounded to one short-form piece per request. Preserve the existing generation model, shared Responses helper and requested format counts.
- Preserve AI error statuses/reasons and persistent pause rules across all continuation paths. Provider denial/refusal stops work; resuming blocked work requires restored access and a fresh user action.
- Add focused rule tests beside the existing clipper tests and update architecture documentation during implementation.

## Explicit boundaries
- Keep-open processing remains the approved behavior; no closed-page runner, scheduler or new automation service.
- n8n remains untouched. You handle its triggers, cutting/rendering sequence and outputs.
- Second-carousel style mixing stays deferred until its reference arrives; it does not block finishing the approved single style.
- Publishing is not included without your explicit instruction. The final report will distinguish preview completion from a live deployment.