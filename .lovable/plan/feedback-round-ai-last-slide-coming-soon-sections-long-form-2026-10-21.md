# Feedback round: AI last slide, Coming soon sections, long-form editing styles

## 1. AI design: last slide shows only text
- Reproduce with a recently designed carousel: compare the saved images against the slides shown in the card.
- Likely causes to confirm: the closing (CTA) slide is not designed by the AI, so it falls back to a plain text frame, or its image fails to save/attach.
- Fix so every slide, including the last, is designed and attached the same way; retries still replace the set without duplicates.

## 2. Growth Path disabled with "Coming soon"
- In the side menu (desktop and mobile), show Growth Path greyed out and not clickable, with a "Coming soon" tooltip on hover.
- Links elsewhere that open Growth Path (e.g. "Continue" milestone actions) won't open it either.

## 3. Planner card "Post" button disabled
- Show the Post button on approved cards as disabled with a "Coming soon" tooltip. Other card actions stay the same.

## 4. Home: remove Community and Growth Path cards
- Remove both cards from Home and rearrange the remaining cards so no empty gap is left.

## 5. Long form record slow to open
- Measure what loads when a long form record opens (record, its short forms, linked planner cards, transcript, media checks).
- Fix the slowest part: show the page immediately with its saved details, then load the rest in parallel instead of one after another, and stop loading large data (such as the full transcript) until it's needed.

## 6. Editing styles for long-form clips
- When a video clip from the long form flow is sent to editing, create the Edit Yourself record with:
  - "Talking from long form" for talking clips
  - "BROLL from long form" for B-roll clips
- These replace "Clipping". Clips that don't come from a long form keep their current styles. The automation still starts when the new record is created.

## 7. "from long form" post types on cards
- Recognise the new Content post types (📹 BROLL from long form, 📹 Talking from long form, 🖼️ Carousel from long form, 🖼️ Graphic from long form, and similar).
- Cards with these types show Timestamps and Creative direction plus the normal fields for that format (text overlay, visual hook, script, slides, captions).
- They behave like their base format everywhere else: previews, design, editing handoff and checks for missing fields.
- When the long form flow adds a clip to the Planner, tag it with the matching "from long form" type.

## Technical notes
- Read the exact Post Type and Editing Style option names from Airtable before writing them; do not create new options.
- Replace `"Clipping"` in `send-to-production.ts`, `ProduceReviewModal.tsx`, and `dwy-edit-yourself.ts` (allowed styles and format resolution); keep request-style preference validation based on the base format.
- Add a shared helper that maps "from long form" post types to their base format and a long-form flag, used by the card rail, Media preview, and `contentScriptFields.ts` (`isBroll`/`isTalking`).
- Menu disabling stays in the shared navigation component so role filtering still applies.
- Tests: style mapping (talking -> "Talking from long form", B-roll -> "BROLL from long form"), post type -> base format, and the last slide being included in the design job.

## Verification
- Run the focused tests and check the preview for errors. Signed-in checks on real cards may be blocked by the access-code gate; anything not checked will be called out.
