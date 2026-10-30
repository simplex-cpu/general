# Fix the DWY design flow

## What changes for the user

```text
Production row  ->  [Assign to Risevoice]  or  [DWY Design]
                                                  |
                    1. Copy (per-slide fields: Title / Subtitle / Body)
                    2. Backdrop photo? (Yes: upload  |  No: brand background)
                    3. Layout (text position + alignment, brand colors editable)
                    4. Preview + [Back]  [Send for approval]
```

1. **No repeated choice.** Clicking "DWY Design" / "DWY Edit" goes straight into the design editor. The modal no longer shows "Assign to Risevoice / DWY" again. "Assign to Risevoice" keeps its own short confirmation (footage + preview).
2. **Backdrop photo step.** A clear question: "Add a backdrop photo?" Yes opens the upload with the footage helper line (everyday photo, open space, no close-ups). No uses the brand background. Choice can be per carousel (one photo for all) or per slide.
3. **Editable text position.** For cover and slides: vertical position (Top / Center / Bottom) and alignment (Left / Center / Right). Defaults come from the brand brief; changes update the preview live.
4. **Labeled copy fields instead of one text box.** Each slide is edited as separate fields:
   - Cover: Cover title, Cover label, Cover body
   - Slide N: Title, Subtitle, Body
   - Last slide: Closing statement, Invitation, CTA button text
   No "Content" or other section tags ever reach the image or the copy; the AI writes directly into these fields.
5. **Clear finish.** Replace "Finish design" with "Send for approval" (moves the post to Approve) and a "Back" button that returns to the Production choice (Assign to Risevoice or DWY) without losing edits.
6. **Brand background applied and editable.** The cover/slide background colors (and gradient) from the brand brief are used by default, with color pickers to adjust them for this design only.

## Order of work

1. Check why the brand background isn't applied: inspect the real brief values for the test brand (likely color names or non-hex values, or empty fields) and fix the color reading accordingly.
2. Remove the duplicate handler choice when the modal opens from DWY; route DWY straight to the editor.
3. Structured per-slide fields + remove role tags; migrate saved Slides Copy text into the fields on open.
4. Backdrop photo step.
5. Position/alignment and background controls wired into the shared preview.
6. Send for approval / Back actions.
7. Tests (field parsing never outputs tags; brand colors fall back correctly; position choices map to the renderer) and a click-through in the preview.

## Technical details

- `ProduceReviewModal.tsx`: when `initialHandler === "myself"` hide the handler buttons and open `EditYourselfMode` for that post; Back re-opens the choice.
- `EditYourselfMode.tsx`: replace the single `copy` string per slide with `{headline, subtitle, body}` (cover: `title, label, body`; CTA: `headline, body, actionLabel`); role is derived from position only and never serialized. Add per-design overrides `{coverAlign, slidesAlign, horizontalAlign, coverBackground, coverBackground2, slidesBackground}` seeded from `/api/my-brief`.
- `designFrames.ts`: add `horizontalAlign: "left" | "center" | "right"` to frames (today only center/left), feed overrides into `buildCarouselFrames`/`buildGraphicFrame`; make `normalizeColor` accept common color names/rgb and log when falling back to defaults.
- `designTemplates.ts` / `formatFields.ts`: serialize Slides Copy as labeled lines (`Slide 2 Title: ...`) and parse both new and old formats so existing records still load.
- Persist overrides with the design request so Risevoice sees the same layout.
