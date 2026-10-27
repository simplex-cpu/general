# Unified section headers + collapsible milestone brief

## 1. One header style for every section (except Home)
- Create one shared section header: title sits directly on the gray page background (no white banner, no bottom border), bold title on the left, optional actions on the right.
- Spacing: same side padding as My Brand, but less space above the title (roughly half the current top padding) so content starts higher.
- Apply to: Community (title "Community"), Growth Path, My Brand gallery. Page backgrounds all use the same gray as Community (My Brand gallery currently uses a slightly different gray — aligned too).
- Home keeps its "Welcome back" line unchanged.

## 2. My Brand: "Add new brand" in the header
- The "Add new brand" button moves into the shared header, right-aligned on the same line as "My Brand", vertically centered with the title and matching its height rhythm. The empty-state button stays in the empty gallery.

## 3. Milestone page: About and Goal collapsed by default
- The white milestone header shows title + progress as today, plus a small quiet toggle row beneath: "About this milestone" with a chevron (info icon on the left).
- Clicking it smoothly expands a panel inside the white header showing "About this milestone" and "Your goal" side by side (stacked on phone); chevron rotates; clicking again collapses it.
- Always starts collapsed when opening a milestone. When the header shrinks on scroll, the panel hides automatically and stays closed after.
- Keyboard and screen-reader friendly (button with expanded state).

## Technical details
- New `SectionHeader` component (title, actions) used by CommunityMode, LearningMode, MyBrandsMode; header padding ~`px-5 sm:px-8 pt-4 pb-2`, `bg-social-feed`.
- MyBrandsMode wrapper `bg-brand-wash` -> `bg-social-feed`; button passed as header action.
- MilestoneDetail: `briefOpen` state reset on milestone change and forced false when `collapsed`; expanded header height becomes content-driven with height transition via grid-rows trick.
- Verify with sample-data Playwright at 1092px and 390px.
