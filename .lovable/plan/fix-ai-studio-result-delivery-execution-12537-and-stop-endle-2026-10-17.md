# Fix AI studio result delivery (execution 12537) and stop endless waiting

## What I found (checked live)
- The live site (risevoicetools.com and risevoice.lovable.app) answers the callback address with "406 Only HTML requests are supported here" for every request, with or without a key. The same happens for the job-submit address.
- The preview server answers correctly: an unauthenticated request gets "401 Invalid token", as intended.
- Older live addresses (long forms, script, AI design) still respond. So the live site is running an older published version that was built before the AI studio addresses existed. Nothing is wrong with the key or the code; the new addresses were never published.
- Job e7aac86a… is still "processing" in the app because the result could not land.
- The recovered result file (recovered-script-result-12537.json) is not in the uploaded files, so I can't replay it yet.

## Steps
1. **Publish the current version** so the callback address goes live. (Jobs were being sent from the preview, which is why n8n received them.)
2. **Verify live:** POST to `https://risevoicetools.com/api/public/podcast-scripts-callback` with JSON and no key returns 401 JSON; with a wrong key returns 401; invalid body with the right key returns 400 JSON. No real key is shown or used in chat.
3. **Recover 12537 without a new paid run:** you upload recovered-script-result-12537.json (or re-run only n8n's "Deliver completion" step for execution 12537). I deliver that exact body, with its original job and execution IDs, to the live callback through the same checks (ownership, source match, count match, idempotency). The one B-roll draft is saved, the job becomes "partial", and the reason for the missing second script shows.
4. **Confirm in the app:** the long form shows the 1 B-roll draft with "Draft, needs review", and the banner reads partial with the shortfall reason. A repeat delivery saves nothing twice.
5. **Never wait forever:**
   - No reply for 10 minutes (was 30): the banner turns red, "The AI studio didn't respond. It may have failed."
   - While running, the banner shows the elapsed time.
   - Failed, timed out or unconfirmed jobs offer "Try again" (same settings) and "Dismiss". These are never shown while a job is running normally.
   - Failure messages from n8n are shown as-is.
6. Add tests for the 10-minute limit and the retry/dismiss rules, then run the suite.

## Needed from you
- Approve publishing (step 1).
- Upload recovered-script-result-12537.json (step 3).

## Technical details
- Delivery in step 3: replay the body with an exec script that reads `N8N_SCRIPTING_KEY` from env server-side only (never printed), or a one-off owner-scoped admin path. Prefer the env-based POST to the live callback so the real deployed handler is exercised.
- `src/routes/api/podcast-script-jobs.ts`: WATCHDOG_MS → 10 min; `POST ?action=retry|dismiss` (owner-scoped; retry only from failed/needs_attention/submission_uncertain; dismiss → cancelled); save `cta` in `request` for retry.
- `LongFormClipperMode.tsx`: elapsed timer, red attention/failed banner with error text, Try again/Dismiss.
