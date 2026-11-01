# Strategy modal, request confirmations, delivery banner, calmer style panel

## 1. Format Split moves to the top of the full strategy view

- In the "Read full strategy" panel, the monthly split block moves from the bottom to the very top, above the strategy text.
- The compact "Format Split" row on the Script tab (still-missing counts) stays exactly where it is and keeps its current numbers.
- Editing the monthly numbers keeps autosaving as it does today.

## 2. Success modal after a Risevoice request

- When a Risevoice Request is submitted successfully, a centered confirmation appears over the page instead of the small inline "Request received" line.
- Content: a green check, "Request received", and "Your edited material will be ready within 24 to 48 business hours." plus a "Done" button that closes it and clears the form.
- The existing inline success text is removed so there is only one confirmation.
- Errors keep their current inline behaviour.

## 3. "Delivered" banner in the Do it Myself list

- The submitted-requests list already refreshes on its own; when a request flips from "To Edit" to "Edited", that moment is recorded in the browser.
- A banner appears above the list summing everything delivered in the rolling window that started with the first delivery: "3 edits were delivered in the last 12 minutes."
- Wording adapts to edits, designs, or a mix, and to singular/plural.
- The banner disappears once 15 minutes have passed since that first delivery, and can be dismissed with an x.

Note: the requests feed does not carry a delivery timestamp, so the window is measured from when the app first sees the status change. A request already marked "Edited" before the page is opened is not counted.

## 4. Calmer visual style block in Do it Myself

- The dark "aesthetic preferences" block loses its header label and its settings rail: no font/colour controls, no "Save changes" inside this block.
- The "Use these aesthetics" / "Aesthetics approved" button is removed; the style is treated as approved, so submitting no longer asks for confirmation and never blocks with "Please confirm your aesthetic preferences."
- Only one action remains: "Modify visual style", which takes the user to Brand info → Visual style.
- The preview itself (phone frame with hook/captions or BROLL text) stays, tightened up with quieter spacing and borders.
- The empty-style and error states keep their guidance but drop the approval button.

## Technical details

- `StrategyStrip.tsx`: reorder the detail panel so the monthly-split section renders before the strategy body; keep `buttonCounts` and autosave wiring untouched.
- `RequestEditsMode.tsx`: add local `showSuccess` state and a fixed-overlay modal; remove the inline success banner.
- `EditYourselfMode.tsx`:
  - track previous request statuses in a ref plus a `localStorage` map (`slate.delivered.<accessCode>`) holding `{ id, format, at }`, pruned to the last 15 minutes; derive the banner from it.
  - strip `AestheticsPanel` down to preview + "Modify visual style"; delete the `approved` gate from validation and from the submit payload defaults (keep sending `aestheticsApproved: true` so the backend contract is unchanged), and drop the now-unused branding-rail props and handlers.
