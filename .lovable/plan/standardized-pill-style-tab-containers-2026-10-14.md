# Standardized pill-style tab containers

## What will change

Standardize the nested tab bars in **Community** (Creator Circle / Ask your team) and **My Brand detail** (Brief / Visual Style / Connected Accounts) so they look like real tabs:

1. Each tab group sits inside a clearly visible **rounded container** in a darker gray (#D8D8DE family), darker than both the tabs and the page background behind it.
2. The **active tab** becomes a white pill with a soft shadow and dark text, so it reads as the selected tab.
3. **Inactive tabs** stay transparent inside the container with muted text, and gently lighten on hover.
4. Spacing, height, rounded corners, and icon+label layout become identical in both sections.

Other tab bars (Visual Style inner tabs, planner, etc.) stay unchanged for now — this round covers only the two sections you named.

## Technical details

- Add one shared tab-bar component (e.g. `SectionTabs`) so both sections use the exact same markup and styling.
- New/adjusted design token for the container gray in `src/styles.css`; container uses `rounded-lg p-1` with the darker gray fill.
- Active tab: white surface, soft shadow, dark ink text. Inactive: muted text, subtle hover wash.
- Replace the current tab markup in `CommunityMode.tsx` and `BriefMode.tsx` with the shared component, keeping icons, labels, and accessibility roles (`tablist`/`tab`/`aria-selected`).
- Verify at phone and desktop widths with the sample-data browser check, then run tests and build.
