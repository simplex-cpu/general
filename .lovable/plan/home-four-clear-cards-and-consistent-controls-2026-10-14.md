# Home: four clear cards and consistent controls

## Layout
- Give **Performance**, **Needs your attention**, **Growth Path**, and **Community** their own white card on the existing light-gray canvas, with a subtle border, 8px corners, consistent inner spacing, and clear gaps between cards.
- Keep Performance first and full-width, followed by a full-width attention card. Place Growth Path and Community side by side when space allows; stack all four in the same order on smaller screens.
- Preserve the hierarchy: Views remains the strongest number, supporting metrics stay quieter, and section titles are consistently sized. Do not add smaller cards inside these four cards.

## Heading
- Replace the current “Home” heading with **“Welcome back, {signed-in name}”**, using the existing name supplied by the sign-in flow.
- Remove the repeated greeting below it. If the name is unavailable, show “Welcome back” without a blank name or punctuation.
- Allow long names to wrap without clipping or increasing the heading’s font size.

## Consistent controls
- Create a bottom-left control area in every card, with consistent spacing from its content and edges. Align footers on the side-by-side Growth Path and Community cards.
- Move the Performance platform and period selectors into its bottom-left control area, rather than beside the title.
- Use the same compact control dimensions: 144px width, 36px visual height on desktop, and 44px height on touch layouts. Use 12px labels so controls do not compete with section titles.
- Use **ArrowRight** consistently for navigation actions. Dropdowns retain the familiar downward chevron, and the statistics-information control retains its information icon.
- Move the highest-priority attention action from its row into the card’s bottom-left footer; it still opens that exact post. Keep a quieter “View all” control beside it only when needed.
- Give Growth Path a short “Continue” footer button when a next course exists, otherwise “View Growth Path.” Display the course name in the card content rather than stretching the button.
- Move Community’s header arrow into a bottom-left “Open community” button.
- Keep individual post/update rows clickable for their exact destinations, but remove separate row-end arrow buttons so they do not compete with the footers.
- Keep one indigo primary action in the attention card; use the same restrained outlined treatment for secondary navigation controls. Equal sizing does not mean equal visual emphasis.
- Do not add a redundant Performance navigation button: its two filters are its footer controls. In loading, empty, and error states, retain the card framing; place any retry action in the same footer position.

## Technical scope
- Limit implementation to Home presentation and its existing name input. Reuse the current Button, Select, data helpers, and navigation callbacks; use existing semantic color tokens.
- Preserve metric calculations, date ranges, task ordering, ownership/access checks, growth progress, and exact post/course/community destinations.
- No changes to Airtable fields, statistics collection, production workflows, or n8n.

## Verification
- Check the current 1092px view, wide desktop, and phone layouts for four distinct cards, consistent button sizing, aligned footer placement, long-name wrapping, and no overlapping text or horizontal scrolling.
- Check populated, loading, empty, and error states, including long post/course titles.
- Verify platform/date selection and all existing post, planner, course, and community navigation. Use a real client session where available; label sample-data checks separately and report any live-account verification blocker.
- Run the existing statistics/status tests and inspect preview errors before completion.