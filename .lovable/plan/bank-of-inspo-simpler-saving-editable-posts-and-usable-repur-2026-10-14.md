# Bank of Inspo: simpler saving, editable posts and usable repurposed scripts

## 1. Clean up the Add inspo window
- Use the same neutral gray as the other pages, with white inputs, dark readable labels and an indigo Save button. Keep this change local to Add inspo.
- Show exactly three fields: **Post URL**, **Post title**, and **Platform**. All three are required; no other field is required to save a post.
- Detect Platform from recognized URLs and prefill it, while keeping the selector available for correction. Require a valid web URL and a nonblank title.
- Remove handle, format, posted date, topic, post copy and why-it-works fields from this form entirely.

## 2. Fill details from the URL when available
- Reuse the existing Instagram/TikTok scraping integration to retrieve creator handle, posted date, post copy and media information. Use existing format classification where there is sufficient evidence; do not assume every video is a Talking Video.
- Run one lookup for the current URL, show a compact loading state, and discard stale results if the URL changes. Do not overwrite the user's title or platform correction.
- Saving must remain possible with only the three required fields, even if retrieval fails. Leave unknown details empty rather than inventing values.
- For other platforms, detect the platform where possible; additional metadata retrieval is not promised in this round.
- Retrieval uses the existing scraping service and may consume its usage allowance. Avoid duplicate lookups and do not run a full strategy analysis just to save an inspo post.

## 3. Make the table editable and its actions compact
- Let users edit every visible post detail directly from the table: title, URL, platform, format, creator handle, topic and why it works. Open compact cell editors with Save/Cancel; long text gets a larger editor.
- **Post age** remains calculated: editing that cell opens the posted-date editor, then recalculates the age.
- Persist changes to the same owned Airtable record and show save errors without losing the draft. User edits take precedence over retrieved metadata.
- Keep Repurpose as a slim indigo button. Replace Delete text with a small trash-icon button, accessible label and tooltip; retain delete confirmation.
- Reduce spacing and width in the pinned action column without compromising usable click targets.

## 4. Open repurposed scripts in the actual scripting flow
The current endpoint saves the result as plain chat text, and the Bank of Inspo handoff opens a saved transcript rather than an immediately editable writer session.

- Name each new conversation exactly **Repurpose**, including its saved History title. Keep the source post title inside the conversation and script topic for context.
- Continue using Fable and the selected brand brief, with the same language, format, CTA and copy constraints as normal scripting.
- Convert and validate the generated result through shared script/slide rules, then save it as a structured script message—not a plain-text bubble.
- Open this new in-progress session directly in the live writer, with its selected brand and format restored. Do not require an extra Continue session click.
- Show the existing script card with the correct sections for Talking Video, B-roll, Carousel or Graphic. Allow section editing and saving, approval, caption generation and the normal optional Add to Planner action.
- Preserve the existing Talking Video visual-hook approval gate and format-specific CTA placement. Adding to Planner remains an explicit choice; leaving the conversation does not add content automatically.
- If the source format is unknown, request a format in the Repurpose window before generation—not in Add inspo. If source content cannot be retrieved, show a clear message and let the user supply Post Copy through table editing rather than pretending the URL was analyzed.
- Save edits and continuation into the same linked Chat sessions record. Preserve read-only behavior for unrelated historical/completed sessions and prevent duplicate sessions or planner records.

## Technical details
- Add shared validation for the three required creation fields and an owner-checked PATCH path for editable table values; never permit ownership/session-link fields to be changed by the client.
- Extract/reuse targeted metadata lookup logic rather than invoking the bulk analysis endpoint. Validate platform hosts and redirect destinations, keep credentials server-side and bound lookup time.
- Use shared script parsers and slide serialization, with a focused repurpose-to-writer adapter that initializes the complete single-script state. Reuse existing ScriptCard and AI Elements conversation primitives rather than building a parallel chat UI.
- Scope single-result approvals to repurpose continuation so ordinary paired-variation flows remain unchanged.
- Keep the existing Airtable tables and source/session relation. No n8n or external automation changes.
- Update project guidance, requirements memory and the roadmap during implementation.

## Verification
- Tests: each of title, URL and platform is required; a three-field post saves successfully without optional metadata; URL detection and stale-result handling; unknown format is not silently treated as Talking Video; owned edits succeed and another user's edits are denied.
- Test structured results for all four formats, exact conversation name **Repurpose**, same-session continuation, saved card edits, and existing CTA/visual-hook/planner gates.
- Check the gray modal, white fields, table editors and compact pinned actions at desktop and narrow widths.
- Exercise add → metadata retrieval → table correction → repurpose → edit/save → captions → optional planner handoff, then reload and confirm the saved result. Verify real service retrieval on public Instagram/TikTok posts when access is available.
- Check automatic build results and run focused tests and lint. If an authorized access-code account is unavailable, report real-account verification as blocked rather than claiming sample checks prove it.