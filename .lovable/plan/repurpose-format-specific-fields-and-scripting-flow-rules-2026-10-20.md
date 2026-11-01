# Repurpose: format-specific fields and scripting-flow rules

## What changes
1. **One field list per format, in this order** (used everywhere a post's copy is shown: the post row, the repurpose request and the result window)
   - Graphic: Slide copy, Captions and hashtags
   - Carousel: Cover title, Slides copy (Slide 1, Slide 2, ...), Captions and hashtags
   - Talking video: Visual hook (text on screen), Transcript, Captions and hashtags
   - B-roll: Text on screen, Captions and hashtags
   - Story: written like B-roll (Text on screen, Captions and hashtags)
2. **Visual hook means on-screen text.** No more "opening shot" directions. Same-format talking video repurpose writes a new on-screen hook line; the transcript stays word for word.
3. **Post row toggle** renamed "Show copy / Hide copy" and shows only that post's format fields above, nothing else (no stray Hook, Cover copy, Transcript on carousels, etc.).
4. **Compact display.** Visual hook and short fields show as one tidy line block; long fields (transcript, slides, captions) are collapsed with a short preview, so nothing expands line by line.
5. **Repurpose call** sends the target format's existing scripting guidelines plus only the original post's fields for its format.
   - Same format: only the cover title (carousel/graphic) or visual hook (talking video/B-roll) changes; everything else kept exactly.
   - Different format: rewritten into the new format's structure; topic, main idea and delivery kept.
6. **Result window** shows the target format's fields in the order above.

## Technical details
- New `postFields.ts`: `fieldsForFormat(format)` returns ordered `{key,label}` list from `PostCopy`; slides rendered via `parsePublishedSlides` as "Slide N". Unit tests per format order.
- `HomePostsFeedModal.tsx`: row details and result dialog render from `fieldsForFormat`; `CollapsibleField` for long fields; result maps `ScriptDoc` (visualHook/script/slides/captions) to the same list.
- `postRepurpose.ts` `modeInstruction`: talking video/B-roll "visual" mode = new on-screen hook text; reformat uses scripting-flow deliverable for all targets (already via `buildEnvelope`); same-format path also gets format guidelines.
- `post-repurpose.ts`: prompt's ORIGINAL POST section lists only source-format fields; output schema describes `visualHook` as on-screen text (max one short line); same-format talking video keeps transcript via `preserveOriginalBody`.
- Update `postRepurpose.test.ts` for new instructions.
