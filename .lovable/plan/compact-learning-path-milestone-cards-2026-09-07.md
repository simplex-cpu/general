# Compact learning-path milestone cards

## Goal
Make each milestone card on the Learning path even neater and smaller, improve the visual hierarchy so the elements do not feel clumped in the center, and replace the text action with a simple arrow.

## Changes

### 1. Shrink the dark visual thumbnail (`MilestoneVisual` in `MilestonePath.tsx`)
- Reduce the panel from `min-h-28 sm:min-h-32 sm:w-36` to roughly `min-h-20 sm:min-h-24 sm:w-24`.
- Reduce internal padding from `px-3 py-3` to `px-2 py-2`.
- Drop the icon tile size from `h-12 w-12` to `h-10 w-10` and use a smaller icon size (`18px`).
- Keep the locked icon smaller and more centered.

### 2. Remove the icon square container, keep the frosted glass effect
- Remove the `rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl` square that wraps the icon.
- Instead, render the icon directly over the dark navy background with a very subtle, larger frosted circular/square glow behind it (`bg-white/5 backdrop-blur-md rounded-2xl`) or a soft radial gradient.
- Apply a locked state only by dimming the icon, not by adding an extra tile.
- Keep the milestone number label directly beneath the icon, but smaller and tighter.

### 3. Improve card body distribution and hierarchy
- Restructure the body so the milestone name is top-aligned, due date/course count is middle-aligned, and progress is bottom-aligned, rather than all items stacking vertically in the center.
- Use a two-column internal layout on desktop: left column for name + due date + course count, right column for progress bar and the arrow.
- Increase the body padding slightly and use a consistent `gap` between sections so the card does not look collapsed.
- Make the progress bar a bit wider (no longer capped at `max-w-[11rem]`) so it aligns with the right edge.
- Keep the layout single-column on mobile with a clear vertical rhythm: name → progress → arrow at the far right of the same row.

### 4. Replace the text action with a larger gray chevron
- Remove the label text ("Review", "Continue", "Start") and the `ArrowRight` icon pair.
- Use `ChevronRight` (or a custom `>`) at a larger size (`24px`) in a soft gray color (`text-[#1A1A1D]/25` or `text-[#A8A8B0]`).
- Keep it aligned to the right, vertically centered.
- For locked cards, do not show the arrow at all (already disabled).

### 5. Keep the summary strip compact
- Already reduced; leave it as-is unless a tiny further trim is needed after the cards shrink.

## Out of scope
- No changes to milestone detail (`MilestoneDetail.tsx`), course player (`CourseView`), or progress logic.
- No data/backend changes.
- No color or traffic-light changes to progress.

## Verification
- View the Learning tab at desktop and mobile widths.
- Confirm at least ~5–6 milestone cards fit on a typical laptop screen without scrolling.
- Confirm locked, partially complete, and completed states all look balanced.
- Confirm the arrow is visible and clickable but not visually dominant.
