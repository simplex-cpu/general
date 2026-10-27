# Final QA and hardening: B-roll and Talking Video

## Goal
Make both DIY video paths reliable from script approval through Airtable handoff, external editing, and final approval—without modifying n8n.

## Confirmed findings
- The Scriptwriter **Produce now → Do it myself** path creates an Edit Yourself record before it has the complete request-specific style contract. It currently omits `Editing preferences`, and Talking Video can omit the visual CTA.
- The standalone editor creates the Edit Yourself record before creating/linking its Client Content record. A create-triggered sequence can therefore see the request before `Original request` exists.
- The standalone editor generates a new request ID for each retry, so a timeout or reload can create duplicate Edit Yourself and Client Content records.
- Client Content reads do not return the saved `Visual Hook`; Talking Video can reopen with a missing or incorrectly inferred hook.
- A late brand-style response can overwrite style choices the user already changed in the preview.
- The standalone Drive-link path checks only that the text looks like a URL, unlike the planner editor’s real footage check.
- The shared preferences builder correctly separates flat B-roll styling from Talking Video hook/caption styling, and the live Airtable fields now have the expected types.
- Video completion is intentionally external: the app does not create the rendered video or mark video requests complete.

## Implementation

### 1. Make one canonical video request contract
- Centralize the complete B-roll and Talking Video payload builders.
- Require exactly one request ID, user, original Content link, brand, brand brief, and usable footage source before a video request becomes trigger-ready.
- Validate every preference property, not only the outer JSON shape:
  - font family present
  - weight 100–900 in 100-point steps
  - size 1–20
  - `#RRGGBB` text/background colors or `none` for transparent backing
  - opacity 0–100
- Keep B-roll preferences flat; keep Talking Video `hook` and `captions` independent.

### 2. Fix the Scriptwriter “Produce now” handoff
- Preserve the selected Talking Video visual hook and selected CTA when adding the post to the planner.
- Build B-roll fields as footage + complete text overlay + optional music + flat style preferences.
- Build Talking Video fields as footage + visual hook + visual CTA + nested hook/caption preferences; do not duplicate the spoken script into Text Overlay.
- Resolve style defaults from the exact linked brand brief when no request-specific edits have been made.
- Create the Client Content record first, then create the fully populated Edit Yourself record linked to it.
- Return a clear partial-failure result if one record succeeds and the second does not, with a retry that reuses the same request ID.

### 3. Harden both editing entry points
- Persist one request ID for the lifetime of a draft and reuse it across retries and reloads.
- Apply the same single-flight submission guard to the standalone editor that already protects the planner editor.
- Prevent a late brand-style fetch from replacing style choices the user already edited.
- Use the existing footage-link check in both flows and block invalid, empty, unreachable, or unverified links until rechecked.
- Return `Visual Hook` from Client Content so Talking Video reopens with the exact approved hook.

### 4. Make Airtable writes trigger-safe
- Reorder standalone creation so Client Content exists first and the Edit Yourself record is created once with every required linked field and production input already present.
- Keep `Request ID` stable and owner-scoped for idempotent retries.
- Treat missing brand, brief, original request, footage, or required format copy as a request error rather than silently creating an incomplete trigger record.
- Keep request-specific style fields on Edit Yourself; do not overwrite brand-wide defaults.

### 5. Verify completion and approval mapping
- Confirm the app displays `To Edit → Editing → Edited/Error` correctly for both video formats.
- Confirm completed media is read from Client Content `Produced Files`, with `Edited File` as the viewer link, and appears under To Approve when Client Status becomes `Approve`.
- Add a safe reconciliation check: when an owned request is `Edited` and its linked Content still has an earlier status, move the Content record to `Approve` without creating media or changing the sequence.
- Surface `Error` clearly instead of leaving a request looking indefinitely active.

## Tests and QA
- Add contract tests for complete B-roll and Talking Video Airtable payloads, including deliberately different hook and caption styles.
- Add route-level tests for missing fields, invalid preferences, ownership, stable retry IDs, and no duplicate record creation.
- Add regression tests proving:
  - Talking Video never places spoken script in Text Overlay.
  - B-roll never sends hook/CTA styling.
  - selected visual hook and CTA survive Scriptwriter → Planner → Edit Yourself.
  - request-specific style is not overwritten by a late brand response.
  - an unverified footage link cannot submit.
- Run focused tests and type checks, then perform browser QA for both entry points and inspect the resulting Airtable records field-by-field.
- Use clearly named QA records and remove them after verification where removal cannot trigger production work.

## Sequence requirements for you to confirm in n8n
No n8n changes will be made here. Your sequence should:
1. Trigger only after a fully populated Edit Yourself record exists; use the Edit Yourself record ID.
2. Accept only `Editing style = BROLL` or `Talking Video` and require exactly one `Original request`.
3. Set Edit Yourself Status to `Editing` and linked Client Content Client Status to `In Progress` on pickup.
4. On success, attach the final video to Client Content `Produced Files`, write the Drive viewer URL to `Edited File`, set Client Status to `Approve`, attach the result to Edit Yourself `Video`, then set Edit Yourself Status to `Edited`.
5. On handled failure, set Edit Yourself Status to `Error` and do not create a second Content record.
6. Skip completed requests that already have a final video, so webhook retries are idempotent.
7. Keep Graphic and Carousel out of both video sequences.

## Acceptance criteria
- A B-roll request reaches Airtable once with complete footage, overlay, optional music, links, and flat preferences.
- A Talking Video request reaches Airtable once with complete footage, visual hook, visual CTA, links, and separate hook/caption preferences.
- No request is visible to a create-triggered sequence before its required links and inputs are present.
- Retrying after a timeout or reload does not create duplicate request/content pairs.
- The final video appears on the original planner card under To Approve after the external sequence writes the documented outputs.
