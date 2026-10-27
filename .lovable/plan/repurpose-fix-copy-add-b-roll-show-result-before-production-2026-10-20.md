# Repurpose: fix copy, add B-roll, show result before production

## What changes
1. **Button style** — the format buttons in the Repurpose window use the app's standard outlined indigo style (same as other buttons), not black.
2. **B-roll format** — add B-roll as a fifth option next to Story, Carousel, Single graphic and Talking video. Rules: B-roll to B-roll keeps the overlay copy with a new hook line; any other original is reformatted into one text overlay.
3. **"No copy stored" fix, end to end**
   - First, check real Posts rows for the brand that failed to confirm which copy fields (caption, transcript, slide text, hook) are empty and why. The exact message isn't in the current code, so the live site may be running an older version — that gets confirmed too.
   - Make sure Refresh stats saves the scraped caption (and hook) onto every Posts row when it creates or updates it, not only during tagging.
   - When a post has no saved copy, the repurpose request first fills it from the post itself (caption from the scraper data or linked planner piece) before giving up; only show an error when nothing exists, with a clear next step.
4. **Result window** — after Repurpose finishes, a second window shows the new copy (script or slide-by-slide text) with two buttons:
   - **Send to production queue** — adds it to the planner as a new piece linked to the brand, ready for production.
   - **Produce now** — opens the existing production flow for that piece (same one used from the scripting board).
   The session is still saved in History as before.

## Technical details
- `postRepurpose.ts`: add `broll` to `REPURPOSE_TARGETS`/`TARGET_LABEL`; `planRepurpose` returns `visual` for B-roll→broll; tests updated.
- `HomePostsFeedModal.tsx`: replace black button classes with the shared outline variant; add result dialog rendering the returned `script`; reuse `AddToPlannerDialog` logic for queue and the existing ProduceReviewModal/production entry for Produce now.
- `post-repurpose.ts`: return `script` alongside `sessionId`; fall back to reading the Posts row / linked Content copy server-side when the body has none.
- `home-refresh-stats.ts` / `postsTable.ts`: include Caption and Hook in creates/updates (blanks never overwrite).
- Verify with a real repurpose on a Posts row after the fix.
