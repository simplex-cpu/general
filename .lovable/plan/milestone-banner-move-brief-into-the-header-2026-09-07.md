# Milestone banner: move brief into the header

Refine the sticky milestone header so the description and goal sit inside the banner instead of in a separate white-content block below it.

## What will change

- In `src/components/slate/learning/MilestoneDetail.tsx`:
  - Move the "About this milestone" and "Your goal" blocks into the dark navy banner, below the milestone title/meta line and above the progress bar.
  - Render them on white/light cards so they stay readable against the dark banner.
  - Keep the existing scroll-collapse behavior: the full banner (title + description + goal + progress) shrinks into the slim bar on scroll, only the back arrow, title, and progress line remain when collapsed.
  - Increase the gap between the "All milestones" back button and the header content.
  - Style the "All milestones" button: uppercase, indigo text/arrow, smaller tracking.
- No data or API changes; the `description` and `goal` fields already flow through the API.
- The "Steps" divider and step list below the banner stay as they are.

## Out of scope

- Progress logic, locking, or course data.
- Mobile/desktop step list layout beyond the natural reflow of the new banner cards.
