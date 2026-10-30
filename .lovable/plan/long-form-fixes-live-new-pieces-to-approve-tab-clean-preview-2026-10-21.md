# Long form fixes: live new pieces, To Approve tab, clean previews

## 1. New pieces appear without refreshing
**Cause found:** the long form window only reloads its pieces when a finished AI Studio run replaces an *earlier* finished run. On a long form's first run (or right after opening the window), nothing triggers the reload, so new pieces stay hidden until a manual refresh.

**Fix:** reload the pieces whenever any run the window saw as in progress becomes finished (completed, partial or needs review), tracked per run. Also reload once when the window opens with a run that finished in the last few minutes, and refresh the long form gallery count on close.

## 2. New "To Approve" tab
- Short form tabs become: **Review**, **Production**, **To Approve**, **Ready to Post**, **Posted**.
- Pieces whose planner card is in the planner's "Approve" status go under To Approve instead of Production.

## 3. Strange text over video previews
**Cause found:** the preview window draws the B-roll text overlay on top of the video as a mock-up. The real file already contains its own text, so the preview shows text the final file doesn't have.

**Fix:** remove the drawn text from the video preview in the post window and the clipper. The text overlay stays visible in the Script tab where it's edited.

## Technical details
- `LongFormClipperMode.tsx`: replace the `studioDoneAt` effect with a `Set` of job ids seen active; refetch `["long-form", id]` when one becomes terminal; invalidate `["long-forms", accessCode]` too.
- `clipperPresentation.ts`: add `'approve'` to `ShortFormStage` (matches `/^approve$/i`), tab label "To Approve", ordered between Production and Ready to Post; update `clipperPresentation.test.ts`.
- `MediaStage.tsx`: drop the `overlay` paragraph and the shifted play-button position; remove the `overlay` prop from callers.
