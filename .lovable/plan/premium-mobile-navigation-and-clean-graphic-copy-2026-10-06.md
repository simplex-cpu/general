# Premium mobile navigation and clean graphic copy

## Goal
Remove structural slide labels from editable graphic copy, then replace the current mobile header-and-scrollable-tab layout with an app-like top bar and bottom navigation while leaving the desktop rail unchanged.

## What will change

### 1. Clean graphic copy everywhere
- Expand the shared slide-copy parser so legacy headings such as `Slide 1 Hook`, `Slide 2 Content`, and equivalent punctuation variants are treated as structure, never editable copy.
- Apply that cleanup through the existing shared parser so the production editor, script handoff, saved records, previews, and exports stay consistent.
- Add focused regression tests using the exact `Slide 1 Hook` case and confirm the label is absent from both the copy fields and rendered frame text.

### 2. Premium mobile top bar
- Replace the current information strip with a fixed, safe-area-aware top navigation bar.
- Center the Risevoice logo independently of the controls around it, so it remains visually centered on narrow screens.
- Put the account avatar/button at the top right with a minimum 44 × 44 pt touch target; keep staff settings available without crowding the bar.
- Use restrained borders, elevation, spacing, and the existing indigo brand system for a native iOS-style hierarchy.

### 3. Mobile bottom navigation
- Move the primary mobile destinations into a fixed bottom navigation bar instead of the current top tab row.
- Show the five destinations already available to each role, using icon-first items with short labels and a clear indigo active state.
- Respect the iPhone bottom safe area, use at least 44 pt interactive targets, and provide pressed/focus states and accessible labels.
- Preserve each role’s existing destination visibility and behavior; desktop navigation remains unchanged.

### 4. Mobile page fit and interaction polish
- Add top and bottom content offsets so pages, chat composers, planners, windows, and scrolling areas never sit beneath either navigation bar.
- Reconcile viewport-height screens such as Scripting Hub and Learning with the two fixed bars, including keyboard-friendly scrolling.
- Keep labels readable without horizontal scrolling or clipped text at compact widths.

### 5. Verification and rollout
- Run the slide-copy tests, related planner/design tests, and the project type check.
- Verify authenticated mobile flows at representative iPhone widths (390 × 844 and 430 × 932): every destination, centered logo, account access, safe-area spacing, scroll behavior, and modal/chat controls.
- Check desktop afterward to confirm its collapsible rail and content sizing are unchanged.
- Leave publishing as a separate final action after preview approval.

## Technical details
- The label leak is in the shared slide heading patterns: they support punctuated role labels but not a plain space between the slide number and role. The fix will stay in `slideFields` rather than adding one-off cleanup in a screen.
- Mobile navigation will remain role-driven from the existing navigation definition, with dedicated top and bottom presentation instead of duplicating destination logic.
- The shell will own mobile safe-area and content insets so individual pages do not each implement different spacing rules.
