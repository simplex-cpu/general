# Standardize My Brand, Home and Growth Path

## Visual changes
- **My Brand:** Remove the darker band behind Brief / Visual Style / Connected Accounts. Keep the approved darker pill container and white active tab, sitting directly on the same gray background as the section below. Leave the separate brand label/header unchanged.
- **Matching backgrounds:** Use Community’s existing gray background throughout Home, the Growth Path overview and milestone detail pages, including empty and loading areas. Preserve Home’s four white cards and make the welcome text darker without increasing its size or weight.
- **Your learning path:** Give the summary card a subdued gray-indigo fill, with readable dark text and a clearly differentiated progress track and action.
- **Locked milestones:** Make locked cards visibly inactive through a muted neutral surface, softened blue thumbnail accents, a clear lock icon and a visible “Locked” label. Keep titles readable, avoid dark or blurred thumbnails, and remove active hover/lift styling. Preserve existing unlocking rules.

## Milestone header
- Replace the black banner with a light neutral surface, dark text, soft dividers and restrained indigo accents matching the rest of Risevoice.
- Keep the expanded header concise: back action, milestone number, title and completion progress. Place longer About / Goal content below the sticky header so it does not take up reading space.
- Shrink the header as the actual content area scrolls. The compact state keeps only the back arrow, milestone title and small progress indicator; scrolling back to the top restores the expanded state.
- Prevent header flicker or scroll jumps and respect reduced-motion preferences.

## Technical scope
- Reuse the Community background token; introduce semantic tokens only for the gray-indigo summary and disabled states where needed. Do not change shared colors globally in ways that alter unrelated pages.
- Update the My Brand tab wrapper, Home canvas and greeting, Growth Path shell, milestone cards and milestone detail header only.
- `LearningMode` scrolls inside an `overflow-y-auto` panel, while `MilestoneDetail` currently watches `window.scrollY`. Connect header collapse and view-change scroll resets to the actual scrolling panel, with proper listener cleanup.
- Use existing design-system controls for touched actions. No changes to learning completion, access, unlocking, production or external automation.

## Verification
- Compare Community, My Brand, Home, Growth Path and milestone detail backgrounds for an exact match.
- Check active and locked milestones together, ensuring locked items remain non-interactive and clearly labeled.
- Open a milestone, scroll through steps, verify the compact header, scroll back to restore it, then navigate back and into another milestone without retaining an incorrect scroll position.
- Check long titles, short content, loading/empty states and narrow layouts for clipping or overlap.
- Run focused existing tests and inspect preview errors; distinguish sample-data checks from any real-account checks that cannot be completed.