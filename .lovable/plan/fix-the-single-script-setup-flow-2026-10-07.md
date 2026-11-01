# Fix the single-script setup flow

## Changes
- Make format selection the first step of the Single Script screen.
- After one format click, show the idea field and keep the chosen format visibly selected.
- Fix the B-roll path so one selection is enough and session creation happens only once.
- Replace the subtitle with: “Share your raw script or ideas and pick a format.”
- Keep the back arrow beside the “Single script” title, using an icon-only control.
- Style format choices as purple outlines and keep “Write my script” indigo.
- Derive a concise topic title from the submitted idea instead of using the entire first line.

## Verification
- Add focused tests for topic-title derivation.
- Verify B-roll, Talking Video, Carousel, and Graphic each advance after one click.
- Check the latest build result and the live single-script flow.
