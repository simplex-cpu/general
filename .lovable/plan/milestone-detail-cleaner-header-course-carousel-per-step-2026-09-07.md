# Milestone detail: cleaner header + course carousel per step

Two refinements to the milestone detail page.

## 1. Slimmer milestone header

- Remove the "Due {date}" and "{percent}%" text from the meta line under the title — keep only "X of Y courses complete".
- Add a circular progress ring to the right of the milestone title (same conic-gradient style as the existing `Ring` component in `ui.tsx`, but on the dark banner: white text, white/15 track, progress color from `progressTone`). Title on the left, ring on the right.
- Remove the horizontal progress bar at the bottom of the banner entirely (both expanded and collapsed states). The collapsed slim bar keeps just the back arrow, title, and the small ring (or % text if the ring is too tall for the slim bar).

## 2. Courses above the step text, as a carousel row

Inside each open step in `MilestoneDetail.tsx`:

- Reorder: the course list now appears first, directly under the step header, still labeled "Courses to complete · X of Y done".
- Courses render as a horizontal snap-scroll carousel row (one row, swipe/scroll on overflow) instead of a vertical checklist. Each course becomes a compact card (~180px wide) with the thumbnail on top, completion/lock indicator overlaid on the thumbnail corner, the course name (2-line clamp), and the status pill below. Locked courses stay greyed with the lock.
- Below the carousel, the step's notes text gets its own small uppercase section label, e.g. "About this step", so it's clear the text describes the step rather than being more course content.
- The step notes text keeps its current smaller muted styling.

## Technical details

- All edits in `src/components/slate/learning/MilestoneDetail.tsx`; reuse the existing `Ring`-style conic gradient inline (adapted for dark background) rather than importing the white-background `Ring`.
- No data/API changes.
- Verify desktop + mobile carousel scrolling, and locked / in-progress / completed states.
