# Fine-tune Learning path sizing

## Goal
Make the learning path feel denser and less overwhelming by reducing the size of the summary card and the milestone cards so more than ~3 cards fit on a typical laptop screen.

## Changes
1. Shrink the “Your learning path” summary strip in `MilestonePath.tsx`:
   - Reduce padding from `p-6` to `p-5` (or tighter on mobile).
   - Reduce headline from `text-[22px]` to `text-[18px]`/`text-lg`.
   - Reduce progress bar height and spacing.
   - Make the “Continue learning” button a smaller `py-2.5` size.

2. Compact each milestone card in `MilestonePath.tsx`:
   - Reduce visual panel height from `min-h-36 sm:min-h-40` to `min-h-28 sm:min-h-32`.
   - Shrink icon tile from `h-16 w-16` to `h-12 w-12`.
   - Reduce milestone number label text size.
   - Reduce body padding from `p-4` to `p-3`/`p-3.5`.
   - Reduce milestone name font from `text-[14px]` to `text-[13px]` and tighten course-count/due-date spacing.
   - Slightly shrink the progress bar and status arrow area.

3. Tighten the overall path layout:
   - Reduce gap between milestone cards from `space-y-4` to `space-y-3`.
   - Reduce margin between summary strip and path from `mt-16` to `mt-10`.
   - Keep the timeline dot and line aligned with the smaller cards.

4. Verify responsive behavior so the cards still look balanced on mobile and the visual panels remain legible.

## Out of scope
- No changes to milestone detail (`MilestoneDetail.tsx`) or course player (`CourseView`).
- No data/backend changes.
- No functional behavior changes (locking, progress, click handlers remain the same).
