# Fix visual-style preview alignment

## Goal
Make the visual-style preview feel balanced in Design and Edit, including B-roll where Transcription is the only available preview.

## Changes
- Center the phone preview within its available space instead of leaving it aligned to the left.
- Keep the preview selector the same width as the compact phone so its buttons no longer stretch across the surrounding panel.
- Hide the selector when only one mode is available; B-roll will simply show the Transcription preview without a distorted single-button bar.
- Align the “Modify visual style” action with the centered preview rather than pushing it to the far-right edge of the panel.
- Preserve the full three-option selector and editable sample fields in the Visual style tab.
- Keep the existing format behavior unchanged: B-roll shows Transcription, other video formats can switch between Visual Hook and Transcription, and graphic settings show Carousel.

## Technical details
- Update the shared compact layout in `StylePhonePreview.tsx` so the phone and selector use one constrained, centered preview column.
- Only render mode controls when at least two modes are available.
- Adjust the preview/action wrapper in `EditYourselfMode.tsx` to share the same centered width.

## Verification
- Check B-roll, Talking Video, and graphic previews at desktop and narrow widths.
- Confirm the phone, selector, and Modify visual style action stay aligned without stretching or overlap.
- Run the TypeScript check.