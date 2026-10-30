# Clearer step layout + step completion

## 1. Split each open step into two clear boxes

Inside an open step, the courses and the step text currently blend together. Change to:

- The open step body becomes a light padded canvas (subtle grey inset, generous padding: ~20px) holding two distinct white boxes stacked with a clear gap:
  - Box A — "Courses to complete · X of Y done": the horizontal carousel of course cards.
  - Box B — "About this step": the step notes text.
- Each box: white background, hairline border, rounded corners, its own small uppercase label at the top with a thin divider under the label, and comfortable inner padding.
- Increase spacing between the step header and the body, and keep the carousel edge-bleeding nicely inside its box so cards don't look clipped.
- If a step has no notes, Box B is omitted (no empty box).

## 2. Mark a step complete

- Add a "Mark step complete" button in the courses box header row (right aligned). It marks every unlocked, not-yet-complete course in that step as Completed, then the step's number badge turns into the green check automatically.
- Button shows a spinner while saving, is hidden when the step is already fully complete, and shows an inline error message if a save fails.
- Each course card's circle indicator becomes clickable: tapping it toggles that course to Completed (or back to In progress), without opening the course. Locked courses stay untouched. Clicking the card body still opens the course.

## Technical details

- `LearningMode.tsx`: pass a completion handler (and pending/error state) into `MilestoneDetail`; reuse the existing `complete` mutation against `/api/learning/module-status`.
- Step completion loops the step's eligible course ids through that endpoint (sequential, small batches) and invalidates the learning query once at the end. No API or Airtable schema changes.
- All layout work in `src/components/slate/learning/MilestoneDetail.tsx`.
- Verify desktop + mobile, locked/in-progress/completed states.
