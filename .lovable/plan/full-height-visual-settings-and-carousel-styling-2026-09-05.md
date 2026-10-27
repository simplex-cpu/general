# Full-height visual settings and carousel styling

## Summary
Expand the Visual style workspace so the settings rail fills the available screen height, and make carousel previews show one complete 9:16 slide at a time instead of several mini cards.

## Changes
- Make the Visual style layout span the available page width and viewport height below the tabs.
- Keep the settings rail flush to the left, full height, and independently scrollable when its controls exceed the screen.
- Add saved color controls for:
  - Cover background
  - Slides background
  - Carousel title
  - Slides subtitle
  - Slides text
- Replace the multi-card carousel preview with a full-frame slide preview inside the phone.
- Add simple slide navigation so the cover and content slides can each be previewed at full size.
- Preserve the existing Hook and Captions preview modes unchanged.

## Technical details
- Extend the shared preview style shape with carousel-specific colors and safe defaults.
- Add the new style fields to the existing brand-brief read/write allowlist so Save changes persists them.
- Ensure the corresponding backing fields exist before relying on them, while preserving all current brand data.
- Keep the layout responsive: desktop uses the full-height left rail; narrower screens stack the settings and preview without clipping.
- Verify saved values reload and that the three preview modes render correctly.
