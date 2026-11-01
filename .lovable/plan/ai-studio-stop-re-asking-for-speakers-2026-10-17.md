# AI studio: stop re-asking for speakers

## Why it happens today
- The n8n script generator requires every speaker to have a name and a short bio. Without them it can't attribute quotes.
- When AI studio opens, the panel reads speaker names from the transcript, which labels each voice, and bios from what was saved when the long form was added. Then it always shows the full speaker form again, even when everything is already filled in.
- It "assumes speakers" because the transcription service labels every voice. If no labels exist, it falls back to the saved speaker list, or shows one blank row.

## Change
1. **Already complete:** If every speaker found already has a saved name and bio, the speaker form is hidden. A single line shows "Speakers: Ana (Host), Luis (Guest)" with a small "Edit" link that reopens the form.
2. **Something missing:** Only the speakers that still need a name or bio are shown, with a note: "Add a short bio so the AI can attribute quotes."
3. **No speakers detected and none saved:** Show one row, labelled "Speaker", with the note above, instead of an unexplained blank list.
4. Nothing is saved again unless the user changed a speaker.

## Technical details
- `LongFormClipperMode.tsx` studio panel: add `editingSpeakers` state, defaulting to true only when `!studioSpeakersOk`. Render a summary line plus Edit when false. Filter rows to incomplete speakers unless the user is editing all. Skip the PATCH in `submitStudio` when the speakers equal their initial values.
- No server or contract changes.
