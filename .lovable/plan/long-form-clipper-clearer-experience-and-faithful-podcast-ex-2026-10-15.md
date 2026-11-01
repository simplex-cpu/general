# Long Form Clipper: clearer experience and faithful podcast excerpts

## Goal
Make long forms easy to track, inspect and turn into source-faithful posts. Deliver in stages, with the podcast rules approved against the actual examples before enabling them.

**Your choices:** automatically mix the two carousel styles; allow light cleanup of filler words and repeated phrases without changing the speaker’s meaning.

## Confirmed issues
- Long forms currently appear as cards and open a separate detail view.
- The detail response hides the transcript, so it cannot be displayed.
- Format counts start at zero, and dropdown values inherit the heavier label weight.
- Names currently come from the URL’s final path segment rather than the video title or transcript.
- Transcription completion is checked only while the detail view is open. Short-form generation then runs inside that check. Closing the window does not reliably complete the whole sequence.
- Generation currently rewrites material for the brand, asks for a baked-in Talking Video CTA, estimates missing timestamps, and reads only the first 120,000 transcript characters. These rules are unsuitable for faithful podcast excerpts.

## Stage 1 — Read and approve the reference formats
The five Instagram links expose only limited public metadata; caption fragments are not substitutes for the actual examples.

**Received references:**
- BROLL: `relearnwithkash_DeYg6A2EQBX.mp4`. Received, but its frames/audio have not yet been analyzed. Video contents cannot be read directly with the current document tools; inspect extracted still frames and use a supported audio-transcription path during reference review. Do not pretend a video upload has already been transcribed.
- Talking Video: `kashrofficial_Dee4rLzoUm1.mp4`. Received; apply the same frame/audio inspection process before returning exact copy or specifying its sequence.
- Graphic: `relearnwithkash_DeYeiHrARqr.jpg`, visually inspected. Exact visible copy, preserving capitalization: **“your shame is dressed as anger!”** The design has two podcast participants framing a central headline, with **“dressed”** highlighted. This image alone cannot establish whether the headline is a verbatim spoken quotation; compare it with the source before treating it as one.
- Carousel: `relearnwithkash_DeYs2F3D_Vq.zip`, confirmed to contain eight numbered JPG slides. Initial text recognition indicates a hook, context, speaker introduction, quotations, interpretation, takeaway and final conversation CTA. This is provisional until every image is visually checked; OCR errors are not approved copy.

**Reference scope clarified:** the uploaded examples replace the unavailable downloads as format references. They are not related to the existing long-form transcript, and must not be matched against it or used as its quotations, speaker identities or timestamps. Study their presentation and sequencing independently; validate future generated posts against their own long-form source.

**Still needed:** the second carousel style, unless it is supplied among additional uploads. Return the exact carousel transcription only after checking all eight slides visually. Confirm which carousel style the uploaded archive represents before assigning Option 1/2 rules.

For each example, return:
- Exact visible text, preserving slide order and separating overlay text from captions.
- Spoken transcript for the reels, with speaker labels and source timing where available.
- A format specification describing how the source becomes the post: opening, quotation boundaries, sequence, attribution and ending.
- A clear distinction between copied quotations and newly written editorial headlines.

Approve these specifications before implementing the example-dependent BROLL, Graphic and two Carousel templates. No invented example copy or guessed differences between the carousel options.

## Stage 2 — Modal polish and long-form table
- Keep the gray Add long form window, white fields and indigo primary actions.
- Make Cancel and Close white, outlined secondary controls with readable indigo text; match the close icon locally without changing other windows.
- Remove the requested long-video cost/time disclaimer from the form.
- Keep labels medium-weight and dropdown values regular-weight.
- Start format-count fields visually blank rather than displaying leading zeros. Blank means zero; preserve 0–10 per format and require at least one requested piece for creation. Entering a number must never produce a prefixed zero.
- Replace the gallery with a white table: **Name · Status · URL · Created date**. Long URLs truncate visually but remain available through an accessible link.
- Clicking a row opens a large gray detail modal, leaving the table behind it.
- Show name, status, created date and URL above the short-form table. Retain editing, red Delete and Add to board actions.
- Add a clearly labeled, scrollable **Transcript** section inside the detail modal. Preserve its speaker labels and timestamps; show pending/unavailable states honestly.

## Stage 3 — Reliable completion and truthful progress
Make this reliable before saying the window can be closed safely.

- Persist the job independently of the browser, including requested formats, completed pieces, current phase and failure information.
- Use an authenticated Apify completion callback to collect finished transcription. Queue subsequent naming and short-form work durably; do not perform generation inside a status-read request.
- Process bounded steps with a database-backed lease and unique item keys so two tabs, callbacks or retries cannot create duplicate pieces.
- Preserve completed work after interruption and resume only unfinished work. Distinguish failure, partial completion and access/credit pauses.
- Closing the modal or leaving the page must not stop accepted work. Keep the window’s close control available after the job has been accepted.
- Replace ambiguous Close/Cancel choices after submission with **Back to long forms** and **View progress**. Cancellation before submission remains Cancel; hiding an accepted job does not cancel it.
- Show phases: **Saved → Transcribing → Naming → Creating short forms → Complete**. Skip creation when Just add was chosen.
- Use an indeterminate indicator for transcription when the provider supplies no reliable percentage. Never display fabricated progress.
- During creation, show actual completed/requested totals and each format’s queued, active, saved or failed state. Saved pieces remain visible while others finish.
- Display a clear success state and update both the long-form table and detail modal automatically.

## Stage 4 — Complete transcripts, speakers and useful names
- While transcription is pending, use the full submitted URL as the record name, not a filename fragment.
- After completion, use the returned YouTube video title when available; otherwise generate a concise name from the transcript’s main idea. Uploaded transcripts follow the same naming rule. A naming failure must not discard the transcript.
- Enable documented speaker labeling and timed segments for podcast transcription. Preserve a raw transcript plus structured segments with start/end times, speaker ID and exact text.
- Use Speaker 1, Speaker 2, etc. unless a real name is supported by the source or confirmed by the user. Do not identify speakers from an account name or guess their identity.
- Offer a small speaker-name mapping in the transcript section so users can correct anonymous labels and carry attribution into posts.
- Verify the actor’s documented duration limits and coverage fields before use on 2h+ footage. Research indicates its default may cap transcription at 120 minutes; configure a supported longer limit and reject incomplete coverage as a finished transcript.
- Inspect the full recording through timestamp-preserving transcript chunks rather than silently omitting later sections. Never invent timestamp estimates for production clips.
- Keep legacy plain-text transcripts readable. Missing reliable speakers or timing must be shown as a limitation, not filled with invented data.

## Stage 5 — Source-faithful podcast clipping
Separate podcast extraction from the ordinary brand-rewriting workflow.

### Talking Video
- Select a coherent source passage and retain its actual spoken words, speaker turns and precise source range.
- Allow only the agreed light cleanup: filler words and repeated phrases. No paraphrasing, invented transitions or new spoken CTAs.
- Preserve the original wording alongside the cleaned version. If removals create separate cuts, retain all source ranges in order rather than implying one continuous clip.
- Keep newly written visual hooks or captions separate from the source speech.

### Carousel
- Follow the two verified example specifications and automatically mix them across requested carousels, with their counts differing by at most one.
- Quote the actual speaker and retain source attribution and ranges for every quoted passage.
- Do not merge different speakers into one quotation or make an editorial headline look like something the speaker said.
- Adapt storage and rendering to the approved examples where necessary; do not force quotations into unsuitable title-only fields.

### Graphic and BROLL
- Implement their exact source-to-post rules after Stage 1 approval. Do not assume the examples use either verbatim quotations or paraphrased summaries until the media is read.
- For the inspected graphic, support one dominant headline with optional emphasis and source attribution; do not force a visible subtitle onto a reference style that contains none. Keep this exception scoped to the approved podcast template, leaving ordinary graphic requirements unchanged.

### Shared safeguards
- Brand information may guide moment selection, presentation and separate editorial copy, but must not alter what a speaker said.
- Validate every quotation against its source segment, allowing only approved cleanup. Block invented quotes, unsupported speaker attribution and missing clip timing.
- Select distinct moments across the whole request, not only within each format.
- Do not add anything to Content automatically. Add to board remains the explicit handoff, linked to the short form and long form.
- Adjust podcast handoff validation so a source clip without a spoken CTA is not blocked or forced to gain an invented CTA. Keep ordinary scripting CTA requirements unchanged.
- Send source speaker, ranges and quote information with the handoff where required. Leave n8n unchanged and document any sequence changes you must handle yourself.

## Stage 6 — End-to-end QA and staged release
- Add focused tests for blank counts, naming precedence, transcript coverage, speaker attribution, permitted cleanup, quote validation, carousel mixing, accurate source ranges and single-add board behavior.
- Verify callback replay, overlapping requests, browser closure, interrupted generation and retry without duplicated pieces.
- Test a real 2h+ multi-speaker recording, checking the beginning, middle and end of its transcript and resulting excerpts.
- Check presentation and sequencing against the approved independent examples; check wording, speakers and timing against each generated post’s actual long-form source. Include read-back from saved records and the planner handoff.
- Verify readable controls, scrollable transcript, table-to-modal navigation, truthful progress and completion states in the running app.
- Release presentation improvements first; enable close-safe background processing only after its test passes; enable podcast templates only after reference approval and source-fidelity QA.

## Technical details
- Retain Airtable Long forms, Short forms and Content as the content records. Add only the fields required for raw/structured transcripts, source title, speaker mapping, attribution and ordered clip ranges.
- Store durable job state, leases and deduplication keys in Lovable Cloud; Airtable patches alone are not an atomic lock. Keep callback handlers authenticated and avoid private data in their responses.
- Prefer the Apify completion webhook over permanent polling. Browser polling becomes display-only. Confirm a supported durable job runner before implementation; do not assume native Worker cron or queue bindings are available.
- Keep generation through the existing shared server-side Responses helper and preserve its model. Apply the documented background-job error and pause rules.
- Keep progress, naming and quotation contracts in shared tested helpers; keep the detail modal and long-form table separate from job execution.
- Update architecture documentation and the task roadmap during implementation. Do not modify n8n.

## Blockers and approval boundaries
- Complete inspection of the received BROLL, Talking Video and eight-slide carousel. Final two-style mixing waits on a second verified carousel reference; the existing long-form transcript is not a source for these examples.
- Speaker and duration support are documentation-backed, not yet verified on a real run. Stage 4 includes that live verification before claiming 2h+ coverage.
- Any additional service connection or charge needed for durable processing will be explained before activation.