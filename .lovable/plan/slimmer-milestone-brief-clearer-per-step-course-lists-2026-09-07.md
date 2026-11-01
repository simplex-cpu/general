# Slimmer milestone brief + clearer per-step course lists

Two refinements to the milestone detail page so scrolling feels natural and each step's courses read as a clean checklist.

## 1. Minimal "About / Your goal" treatment

The current white cards inside the banner are tall, so they dominate the screen and make scrolling feel like the page is fighting you.

- Merge the two white cards into a single slim strip inside the banner: "About this milestone" text on the left, "Your goal" on the right, separated by a thin vertical divider (stacked on mobile).
- No card boxes, shadows, or rounded containers — just the small uppercase labels and body text directly on the dark banner, using white text at reduced opacity (labels ~40%, body ~70%).
- Cap the brief text at ~3 lines each with a subtle "Read more" expand toggle only if the text is longer, so the banner stays compact by default.
- Result: the banner takes roughly half its current height; the scroll-collapse to the slim bar stays as is.

## 2. Clearer course list inside each step

- Add a small "Courses to complete · X of Y done" line at the top of each open step, so the purpose of the list is stated before the items.
- Give each course row a clear completion checkbox indicator on the left (empty circle → green check) in place of the bare index number, so progress reads at a glance per course, not just per step.
- Keep thumbnails but reduce them slightly and align row heights so rows scan as an even list.
- Add a hairline divider between course rows instead of full bordered boxes, making the list feel like one checklist rather than a stack of cards.
- Locked courses stay greyed with the lock icon; no other color changes.

## Technical details

- All edits in `src/components/slate/learning/MilestoneDetail.tsx`.
- Uses existing `description`, `goal`, and course `status` data — no API or Airtable changes.
- Verify desktop + mobile, and locked / in-progress / completed states.
