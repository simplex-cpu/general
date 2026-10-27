# Cleaner, more modern Visual Style

## Goal
Turn Visual Style into a focused settings-and-preview workspace: fewer controls at once, clear format choices, and an immediate view of the saved brand style.

## Already applied
- Community now has one continuous darker-gray background below its heading, including the composer surroundings and Ask your team.
- A thin, soft divider separates the composer from Feed / Support / Strategy ideas / My Posts.
- Brand detail uses that same continuous gray across Brief, Visual Style and Connected Accounts, with the brand name/header kept separate. Inputs and individual content surfaces remain light for readability.
- These presentation changes passed sample-data browser checks; no live account data was changed.

## 1. Focused settings and format tabs
- Use a compact Video settings / Graphic settings selector in the settings column. Only the active family's controls are shown; video opens by default.
- Video settings offers exactly **Visual Hook** and **Transcription** preview tabs.
- Graphic settings offers exactly **Carousel** and **Still graphic** preview tabs.
- Keep each format's draft when changing tabs; switching views never resets saved or unsaved styles.

## 2. Fixed samples, no sample-text boxes
- Remove the editable sample-copy boxes from every brand Visual Style preview.
- Use fixed, realistic sample copy so font, color, positioning and backgrounds remain easy to compare.
- Video samples show a hook or transcription. Carousel shows a cover and content slides with arrow navigation and a compact counter. Still graphic shows title, subtitle and body in one complete image.
- Keep real script text and production editing elsewhere unchanged. Carousel cover samples follow the existing no-body rule.

## 3. Graphic positioning and typography
- Add separate horizontal **Left / Center / Right** and vertical **Top / Center / Bottom** controls, using recognizable alignment icons with tooltips.
- Carousel has separate Cover and Slides positioning; Still graphic has its own positioning.
- Horizontal alignment moves and aligns the text block within safe image margins—not merely the letters inside a centered block.
- Add independent **Title**, **Subtitle** and **Body** font dropdowns, using the existing supported font options and weights. Graphic fonts no longer depend on video hook/transcription font choices.
- Preserve existing colors and layouts; hide irrelevant controls for covers rather than implying they contain body text.

## 4. One background control per surface
- Replace separate Cover background and Cover gradient rows with one background swatch/button.
- Opening it reveals **Solid / Gradient**, one or two color swatches, and a compact gradient-direction selector.
- Use the same control for **Slides background** and **Still graphic background**, including gradients.
- Show the actual solid/gradient swatch when closed. Preserve the second color when switching modes during editing, but apply it only in Gradient mode.
- Existing solid colors and two-color cover gradients reload without changing their appearance.

## 5. Recommended visual clean-up
- Keep settings in an unframed column on the shared gray background, with quiet group labels, consistent field heights and generous spacing between groups—not nested cards.
- Center the preview and constrain its mode selector to the preview width. Remove the empty space formerly used by sample-copy editors.
- Keep one consistent indigo Save changes action pinned within the settings column, with clear saving, saved and failure states.
- Fit the full preview within available space where practical, rather than cutting off the phone/image below the screen. On narrow screens, stack controls and preview without sideways scrolling.

## Technical details and safeguards
- Reuse `VisualStylePanel`, `StylePhonePreview` and the shared graphic frame renderer instead of adding a parallel styling system.
- Extend shared style types/mapping for graphic title/subtitle/body fonts, horizontal alignment, slide gradients and still-graphic settings. Preserve existing vertical-alignment field semantics.
- The brand read/write endpoint has an explicit style allowlist: verify the live Airtable field schema, add only missing fields, and extend that allowlist so new choices actually save and reload.
- Use legacy video-font/color values as fallbacks for brands without new graphic fields; new graphic choices must not change video styling.
- Carry the same values through brand preview, production design editing, saved request preferences and image exports. Check every existing style consumer before introducing new keys.
- Keep all reads/writes scoped to the selected owned brand; no brand switching in Home, Script or Planner. No n8n investigation or changes.

## Verification
- Test format-tab switching, fixed samples and carousel navigation; confirm no editable sample fields remain in brand Visual Style.
- Test all horizontal/vertical positions and each text font independently; verify long sample text remains inside safe margins.
- Test solid/gradient switching for Cover, Slides and Still graphic, including saving and reloading existing brands.
- Test legacy fallbacks, brand isolation and matching preview/export styles with focused logic tests.
- Check desktop and narrow layouts, disabled/saving/error states, and preview errors. Verify live save/readback with an authorized account; report any unavailable live-account checks explicitly.