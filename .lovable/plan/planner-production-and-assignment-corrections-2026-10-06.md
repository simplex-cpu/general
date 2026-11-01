# Planner production and assignment corrections

## Planner table

- Make **DWY Edit / DWY Design** the primary indigo action and **Assign to Risevoice** the outlined secondary action everywhere they appear.
- Pin the **Action** header and cells to the right edge of the horizontally scrollable table, with an opaque surface and divider/shadow so actions remain readable while scrolling.
- Make every **Post** action green, including the row, post window, and final confirmation.
- Add recognizable Instagram, TikTok, Facebook, and YouTube icons to platform selectors and selected-platform displays while keeping their labels accessible.
- Render every row’s status as a consistently colored pill across Prepare Footage, Production, To Approve, Ready to Post, and Posted. Keep status editing available through the pill where it is currently allowed.
- Derive Assignee only after a production route has actually been chosen: **You** for “Do it Myself,” **Risevoice** for “Risevoice Request,” and **—** for unassigned To Edit / To Design records.

## Production grouping

- Keep Production as one table, grouped in this fixed order:
  1. To Edit
  2. To Design
  3. Editing
  4. Designing
- Show a clear group heading and item count for each populated group; preserve the existing row columns and actions inside every group.
- Classify each record from its normalized status plus its post format, so video and design work cannot land in the wrong group.

## Assignment and design flow

- **DWY Edit / DWY Design** opens the editor directly.
- Pressing **Back** from the DWY editor opens a blank decision screen containing only two centered choices: DWY and Assign to Risevoice. The design preview and editing controls remain hidden on that screen.
- **Assign to Risevoice** opens a lightweight confirmation view rather than the DWY editor:
  - confirm the existing script or structured slide copy;
  - for graphics/carousels, optionally attach or confirm a backdrop photo;
  - for video, retain the existing required-footage confirmation;
  - show only **Back** and **Send for approval** as the final actions.
- Submitting the Risevoice path keeps the existing Risevoice ownership and Production-stage behavior; it does not create or render a DWY design.
- Ensure switching paths never leaks DWY-only layout controls, local design rendering, or stale handler state into the Risevoice confirmation.

## Technical details and verification

- Refactor the production window into explicit `choice`, `dwy editor`, and `Risevoice confirmation` states instead of inferring the screen from one boolean.
- Add small shared helpers for platform icon lookup, normalized status colors, production subgrouping, and derived assignee display.
- Keep the pinned action column compatible with resizable columns and horizontal scrolling on desktop; preserve a usable compact layout on narrow screens.
- Add focused tests for unassigned Assignee, all four Production groups, route-specific modal states, and Risevoice submission fields.
- Verify the planner visually at desktop and narrow widths, including horizontal scrolling, pinned actions, platform icons, status pills, DWY Back behavior, and the Risevoice confirmation path.
