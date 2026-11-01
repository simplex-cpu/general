# AI studio window clean-up (Create short forms)

## What changes

1. **One-line subheadline** — replace the long text with: "Writes B-roll and Talking Clip scripts from your transcript."
2. **Transcribed file shown as a file, not a field** — in "Add new", when the audio file is found in the folder, show it as a plain file row (file icon, name, size). Only show a picker if the folder has more than one audio file.
3. **Speakers asked only when needed** — the speaker section appears only when the transcript found more than one speaker and at least one of them has no name (in some parts or everywhere). Otherwise nothing about speakers is shown. When shown, only the unnamed speakers are listed, asking for a name; bio is optional.
4. **Fewer disclaimers** — remove helper/explainer lines under fields and buttons (speaker note, "Each speaker needs…" line, "Overrides the saved clip CTA" placeholder, transcript-line summary trimmed to name + length). Button reads "Generate scripts".
5. **No audience question** — remove the Audience field. The job automatically uses the audience from the brand brief of the long form's brand.
6. **CTA works like the scripting studio** — replace the free-text CTA box with the same CTA picker used in scripting (same options; keyword + "what they'll receive" boxes for lead-magnet / DM-keyword). Required, like in scripting, and formatted the same way before it is sent.

## Technical details

- File: `src/components/slate/LongFormClipperMode.tsx` (studio panel ~L759-799, add-new folder file ~L334-338, speaker init ~L466-482).
- Speaker gating: count distinct transcript speaker labels; show section only if `labels.length > 1` and any label lacks a saved name in `speakerNames`. `studioSpeakersOk` requires names only for those shown.
- Bios: `podcastJobs.server.ts` `contractSpeakers` — send bio as null/empty when missing (no invented bios); verify against the v1 contract validator and adjust the check that blocks submission without bios. Single-speaker transcripts send that one speaker with the long form owner's brand name if no name is saved.
- Audience: in `POST /api/podcast-script-jobs`, resolve the long form's brand brief audience field server-side and pass it into `buildJobRequest` `campaign_context.audience`; drop the client `audience` field.
- CTA: reuse `CTA_OPTIONS`, `ctaNeedsKeyword`, and the existing `formatCtaChoice` (already used in the Add-new flow) so the text sent as `approved_cta` matches scripting.
- Update/extend podcast job tests for: no bio required, audience from brief, formatted CTA. Run the test suite.
