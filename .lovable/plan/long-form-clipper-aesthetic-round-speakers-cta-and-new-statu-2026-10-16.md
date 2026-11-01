# Long form Clipper: aesthetic round + speakers, CTA and new statuses

## Long form window (detail)
- Status and created date sit together in one row under the name.
- Remove the "Source" link and the "Full recording coverage verified" line.
- Remove the Speakers button and panel from this window.
- Transcript source link: first test whether the YouTube link opens from the app. If it shows "Blocked" (the preview frame refuses it), replace it with a "Copy link" button that copies the URL and shows "Copied".
- Short pieces table: "Add to board" comes before the red delete button.

## Add long form window
- A bit wider (about 640px) so the subtitle and the hint under "URL to footage" each fit on one line.
- "What's next" options become **Transcribe** and **Transcribe & Create Short-form**.
- New optional **Speakers** section before transcribing: add a row per speaker with name and a short bio (e.g. "Host, career coach"). Names help label who's speaking; bios guide which moments get clipped and how quotes are attributed.
- When **Transcribe & Create Short-form** is picked, ask for the call to action using the same picker as the scripting studio: Follow, Comment, Share, Save, or Comment keyword (keyword + what they get). DM keyword is added as an option in both places.
- All buttons in the window share the same smaller height.

## Statuses and tabs
- Long form statuses: **To Transcribe, Transcribing, Transcribed, To Clip, Clipping, Clipped** (plus Failed kept for errors).
  - Transcribe only: To Transcribe → Transcribing → Transcribed.
  - With short forms: ... → Transcribed → To Clip (short forms requested, waiting) → Clipping (writing pieces) → Clipped (pieces done).
  - Existing records are mapped: Ready/Done → Transcribed or Clipped (if pieces exist), Transcribing stays.
- Tabs above the long forms table: **New** (To Transcribe, Transcribing, Transcribed), **To Clip** (To Clip, Clipping), **Clipped**.
- "Done" only after full coverage is still enforced; nothing about the coverage checks changes, just the visible label.

## Questions answered by default
- Speakers shared at the start are used as name hints and clipping context; detected speaker labels are still mapped automatically. If you'd rather keep a way to fix names after transcribing, say so and I'll keep a small edit option.

## Technical details
- `LongFormClipperMode.tsx`: header row layout, remove Source/coverage/speakers UI, reorder row actions, modal `sm:max-w-2xl`, uniform `h-8` buttons, speakers repeater + `CtaDecisionCard`-style CTA in the add form, three tabs.
- `CtaDecisionCard` / `variationFlow.formatCtaChoice`: add `dm-keyword` option (shared, so Scripting Studio gains it too).
- `longFormClipper.ts`: `newLongForm` gains `speakers: {name, bio}[]` (max 10) and `cta`; status constants.
- `clipperPresentation.ts`: new `longFormStatus()` + `longFormTab()` mapping to new/toClip/clipped; update tests.
- `api/long-forms.ts` + `longForm.server.ts`: write new statuses at each step; store speakers (to existing Speaker names + new "Speaker bios" long text field) and CTA (new "CTA" field) on the Long Forms table; pass bios and CTA into short-form generation prompts. Airtable Status gets the new options via typecast.
- Copy-link check via Playwright before choosing link vs copy.
