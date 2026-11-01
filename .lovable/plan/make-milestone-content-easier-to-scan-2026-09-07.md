# Make milestone content easier to scan

The milestone page currently reads as one long block: the milestone summary, its overview text, and the step sections all share similar type sizes and the same white cards, so it isn't obvious when you've moved from "about this milestone" into "Step 1".

## What changes

### 1. A clear break between the milestone and its steps

- The milestone header and overview stay together as one calm block at the top, visually separated from everything below.
- Below it, a small "Steps" label with a thin rule introduces the step list, so there is an unmistakable line where the milestone description ends and the work begins.

### 2. Stronger hierarchy inside each step

- Step titles get larger and heavier than the text inside them; overview and note text drop a size and use a softer grey so body copy never competes with headings.
- The milestone title stays the biggest text on the page; step titles sit clearly below it; course names sit below those.
- Tighter maximum line width on long paragraphs so text is easier to read.

### 3. Smaller, calmer sizing

- Reduce padding on the milestone header and step rows so more of the list fits on screen.
- Reduce the progress ring and course thumbnails slightly.
- Collapse all steps by default except the first unfinished one (current behaviour) — but the closed rows become slimmer.

### 4. Colour used for meaning only

- Step cards become a light neutral surface when closed and white when opened, so the open step visibly stands out.
- The traffic-light colours (red / amber / green) stay reserved for progress; indigo stays for links and actions only. No decorative colour on section backgrounds.
- Locked steps stay muted grey with no accent colour.

## Technical details

- All edits are in `src/components/slate/learning/MilestoneDetail.tsx`, plus type-scale tweaks in `src/components/slate/learning/LessonText.tsx` if body text sizing needs to be shared.
- No data, API, or Airtable changes.
- Verify at desktop and mobile widths with locked, in-progress, and completed steps.
