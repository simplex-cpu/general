# A cleaner, more compact Viral Kit

## Direction
Replace the oversized tiles with **four clean tool rows**, as selected. Keep the gray page background, restrained white surfaces and existing indigo accent. No new tools or changes to analysis behavior.

## Viral Kit gallery
- Keep the bare-background **Viral Kit** heading aligned with other sections.
- Arrange four full-width rows in one column, aligned with the heading and capped at a comfortable reading width.
- Use approximately 72px row height, 16px horizontal spacing inside each row, and 10–12px gaps between rows; allow long titles to wrap on phones.
- Align a small tool icon on the left and a 14px medium-weight title beside it. Remove the large empty space between icons and labels.
- Put a small **right-facing chevron at the far right**, vertically centered, for Refine My Strategy. The entire row opens the tool—not a separate floating arrow.
- Use a fine border, restrained corner radius and no decorative shadows. Give the available row a subtle indigo interaction state rather than a large colored button.
- Keep the other three tools disabled: muted icons/titles, a small **Coming soon** label at the right, and no opening arrow. Labels must not collide on narrow screens.

## Refine My Strategy header
- Move the **left-facing back arrow immediately to the left of the title**, forming one aligned group at the upper left.
- Remove the arrow from the top-right corner. Keep its accessible label **Back to Viral Kit** and a comfortable touch area around the compact icon.
- Keep the heading on the gray page background; do not add a banner or breadcrumb text.
- Preserve the existing analysis controls, reports, credits, history and handoff to Script; Viral Kit remains selected while this tool is open.

## Technical scope
- Update ViralKitMode’s presentation and the strategy header in SlateApp.
- Add an optional leading-control slot to SectionHeader if needed; leave all existing section headers unchanged.
- Reuse the existing Button component, semantic color tokens and shared tool-availability rules. No database, AI, Airtable or automation changes.
- Record the selected compact-row preference when implementing; keep architecture guidance within its size budget.

## Verification
- Check 1092px desktop and 390px phone layouts: compact rows, aligned icons/titles/chevrons, no clipped titles or Coming soon labels.
- Open Refine My Strategy from its row, confirm Viral Kit stays selected, and return using the arrow beside the title.
- Confirm unavailable tools cannot open or trigger requests, and keyboard focus remains clear.
- Run the existing Viral Kit tests and check preview errors. Live analysis-to-Script verification still requires an authorized access-code session; do not claim that flow was tested using sample data.

Publishing remains a separate action.