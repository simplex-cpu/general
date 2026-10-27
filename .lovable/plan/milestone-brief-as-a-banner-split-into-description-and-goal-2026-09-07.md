# Milestone brief as a banner, split into description and goal

The milestone page currently opens with a card that looks like the step cards below it, and its text is one long block. This change turns the top into a distinct banner and splits the text into two clear parts.

## 1. Two new milestone fields

Add to the Milestones table:

- **Milestone Description** — what this milestone is about.
- **Milestone Goal** — what the client will have achieved by the end.

A one-time pass copies the existing "Milestone Overview" text into these two fields per milestone, splitting on the existing headings and discarding the "important reminders" part. Text stays editable afterwards, and the original overview field is left untouched.

If a milestone has neither new field filled in, the page falls back to showing the current single block, so nothing disappears.

## 2. Milestone brief as a sticky banner

- The top of the milestone page becomes a full-width dark brand banner (same visual language as the milestone thumbnails): milestone number, name, course count, due date, and progress.
- It is pinned to the top of the screen and collapses as you scroll into a slim bar with just the back arrow, milestone name, and a thin progress line.
- Below the banner, the description and goal sit side by side on desktop and stacked on mobile, each with a small label ("About this milestone" / "Your goal") so they read as two short blocks instead of one wall of text.
- The existing "Steps" divider and step list stay as they are, now clearly separated from the banner.

## Technical details

- Airtable: create `Milestone Description` and `Milestone Goal` long-text fields on the Milestones table; run a one-time split-and-populate over existing records.
- `src/routes/api/learning.ts` returns `description` and `goal` alongside the existing `overview`; `Milestone` type in `src/components/slate/learning/types.ts` gains both optional fields.
- `src/components/slate/learning/MilestoneDetail.tsx`: replace the header card with a sticky banner component (scroll listener with a small threshold, `sticky top-0 z-*`), plus the two-column brief block; keep the overview fallback and the existing step rendering.
- No changes to progress logic, locking, or course data.
