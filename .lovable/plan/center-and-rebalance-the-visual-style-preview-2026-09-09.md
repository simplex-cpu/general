# Center and rebalance the visual-style preview

## Goal
Make the preview read as one polished, centered unit instead of three disconnected elements.

## Changes
- Place the mode selector, phone frame, and “Modify visual style” action in one centered column with a shared width.
- Center the action below the phone rather than aligning it to the phone’s right edge.
- Hide the mode selector when only one preview is available, so B-roll shows only its centered Transcription preview.
- Keep the two-mode selector for other video formats, constrained to the phone width with evenly sized square segments.
- Preserve the wider Visual Style settings view, including its editable sample fields, while making its selector and preview spacing consistent.
- Tighten vertical spacing so the controls feel connected without crowding the phone.

## Technical details
- Refine the compact layout in `StylePhonePreview.tsx` around a single constrained preview column.
- Adjust the compact preview wrapper in `EditYourselfMode.tsx` so its action uses the same center line.
- Keep all existing preview content, saved styles, format rules, and editing behavior unchanged.

## Verification
- Check B-roll, Talking Video, and graphic previews at desktop and narrow widths.
- Confirm no stretched one-button selector appears for B-roll.
- Confirm the selector, phone, and action remain centered with balanced spacing and no overlap.
