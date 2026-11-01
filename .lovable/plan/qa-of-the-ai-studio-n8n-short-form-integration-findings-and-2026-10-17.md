# QA of the AI studio (n8n) short-form integration — findings and fixes

I re-checked the integration against the package (LOVABLE-HANDOFF, INTEGRATION-CONTRACT, UPSTREAM-REQUIREMENTS, CORRECTION, request/callback schemas and examples). Most of it matches: correct v1 body shape, `X-Scripting-Key` / `X-Scripting-Callback-Key` headers, no model/callback fields in the body, Carousel/Graphic forced to 0, 202 acknowledgment stored with its `execution_id`, no automatic replay on uncertain outcomes, result saved before replying `{ok:true}`, late failures can't overwrite a saved result, 30‑minute "needs attention" watchdog, and secrets stay on the server.

## Issues found

**Would cause the job to be rejected (422) or mis-saved**
1. Transcript lines aren't checked for chronological order before sending; out-of-order lines make n8n reject the job.
2. The callback doesn't check that `delivered_count` equals the number of scripts, or that requested counts match what we sent (both required by the contract).
3. The 202 reply isn't checked to confirm its `job_id` matches ours.

**Duplicate protection**
4. The "one active job per long form" check isn't atomic — two fast clicks or two tabs could send two jobs. The contract asks for atomic protection.

**Speaker data**
5. When a speaker has no saved bio we send filler bios ("Speaker in the source recording.", "Source label: X"). The handoff says not to invent bios; the fix is to ask for a bio before sending.
6. The handoff asks the studio panel to show a short source summary and let the user fix speaker names/bios with the existing controls; the panel currently has only counts, audience and CTA.

**Results on screen**
7. B-roll caption, visual direction, duration, source excerpt, and Talking Clip segments, visual plan and caption are saved but kept in hidden notes, so they don't show on the piece. The contract requires showing them, plus the draft/review status.
8. A job whose outcome is uncertain shows "AI studio is writing…" instead of "needs checking before resending".
9. "Partial" and "needs review" show the same message, and the per-format shortfall reason isn't shown.
10. Unmatched `execution.failed` events are only logged, not kept for later matching.

**Tests**
11. There are no automated checks for this integration.

## Fixes

1. Sort lines by start time and drop overlapping ones before sending, and run the package's own validation rules on the request before it goes out.
2. Callback: reject (409) when delivered counts don't match the script lists or requested counts differ from the saved job.
3. Treat an acknowledgment with a different `job_id` as uncertain.
4. Add a database rule that allows only one active job per long form; a second click returns the job that's already running.
5–6. Studio panel: show source summary (title, length, speakers) and the existing speaker name/bio controls inline; block Generate until every speaker in the transcript has a real bio. Remove the filler bios.
7. Show the studio fields on each piece (B-roll: overlay, duration, visual direction, caption, source excerpt + times; Talking Clip: visual hook, spoken hook, ordered verbatim segments with times, visual plan, caption) with a "Draft — needs review" badge and review flags. All shown as plain text.
8–9. Distinct banners: uncertain ("We couldn't confirm it was received — check before resending"), partial, needs review, failed, with each format's shortfall reason.
10. Save unmatched failure events for reconciliation.
11. Add tests: request built from a sample long form passes the package's request schema and validation; the package's `completed.json` example parses and maps to the right pieces; mismatched counts are rejected; a repeat callback saves nothing twice; Carousel/Graphic stay 0.

## Still needed from you (unchanged)
- Publish the n8n workflow and confirm its Production URL (`https://simplexmedia.app.n8n.cloud/webhook/podcast-scripts-v1`) is saved in secure settings, along with the two keys.
- After that, one live run with 1 B-roll + 1 Talking Clip to confirm end to end.

## Technical details
- Files: `src/lib/podcastJobs.server.ts`, `src/routes/api/podcast-script-jobs.ts`, `src/routes/api/public/podcast-scripts-callback.ts`, `src/components/slate/LongFormClipperMode.tsx`, new migration (partial unique index on `(owner_id, long_form_id)` where status in active set; `podcast_unmatched_events` table, service-role only), new `src/lib/podcastJobs.test.ts` using the package's `request.schema.json`, `normalize-request.mjs` logic and `examples/*.json` copied in as fixtures.
- Submit catches unique-violation (23505) and returns the running job.
