# Faster, clearer script approvals

## What will change

- Replace the misleading post-topic “Generating hooks” status with wording that reflects preparation for the CTA choice, and remove any redundant transition delay that does not protect the flow.
- Format Talking Video scripts into short, readable paragraphs with no paragraph exceeding three sentences, while preserving the approved hook and naturally integrated CTA.
- Keep the chosen script visible while captions are being written, then update that same card to show the complete script and all captions together.
- Standardize scripting approval actions: primary approval/continue actions use green; regenerate and other secondary actions use neutral gray.

## Technical details

- Add a shared Talking Video paragraph formatter at the script boundary so newly generated copy, cards, History, exports, and planner handoff receive the same readable structure.
- Adjust the caption-loading render state so it does not replace the chosen card with a captions-only/loading presentation.
- Extend focused tests for three-sentence paragraph limits and preserving script content when captions are attached.
- Verify the scripting tests, type checks, current build status, and the topic → CTA → variation → captions flow in the preview.
