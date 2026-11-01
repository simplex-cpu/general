# Planner groups, DWY backgrounds, and desktop navigation rail

## Planner production groups

- Change **To Edit** and **To Design** group indicators to red while keeping **Editing** and **Designing** visually distinct.
- Reduce group-heading height and typography so headings remain slightly stronger than column headers without overpowering the table.
- Preserve the current collapsible grouped-table behavior, pinned actions, and row layout.

## DWY Design loading and backgrounds

- Prevent the generic black fallback design from appearing while the saved brand style is loading; show a contained loading state and reveal the design only after the saved styling is ready.
- Ensure the saved cover gradient loads into DWY Design immediately and remains consistent while navigating slides or opening Photo & layout.
- Extend Photo & layout background controls from one solid colour to an editable gradient:
  - first colour;
  - optional second colour;
  - clear/reset gradient back to the saved brand styling.
- Keep carousel slide backgrounds and cover backgrounds distinct, while preserving the existing photo-backdrop option and text-position controls.
- Add focused checks for saved-gradient hydration and gradient overrides so a manual change cannot silently discard the second colour.

## Desktop navigation rail

- Rename the client-facing primary destinations:
  - Learn → **Home**
  - Brand Info → **My Brand**
  - Analyze → **Analyze**
  - Script → **Script**
  - Posts Planner → **Planner**
- Replace the desktop horizontal primary tabs with a fixed left rail inspired by the supplied reference: Risevoice branding at the top, clear icon-and-label navigation, a restrained indigo active state, and credits/account access anchored near the bottom.
- Keep role-based visibility intact, including staff/admin-only destinations, without changing where any destination leads.
- Make the rail collapsible to a compact icon strip, keeping the control visible and preserving usable content width.
- Reflow the page shell so every section occupies the remaining viewport width and Script keeps its independent full-height scrolling behavior.
- Keep the existing horizontal navigation on smaller screens for now; mobile navigation will be handled in the later round requested.

## Verification

- Test planner grouping colours, collapse behavior, and heading scale.
- Verify DWY Design opens without a black template flash and that saved and edited gradients render in preview and export paths.
- Check the desktop rail across client, staff, and admin visibility states, including collapse/restore, active destination, credits, account access, and full-height Script behavior.
- Confirm the current mobile navigation remains functional and unchanged apart from the requested labels.
