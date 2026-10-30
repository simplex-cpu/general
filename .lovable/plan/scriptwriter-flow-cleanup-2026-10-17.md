# Scriptwriter flow cleanup

## What changes for the user
1. **Always start fresh**: every click on "My Scriptwriter" (rail or sidebar) opens "Do you want to create a single script or a batch?". Work already written stays in History and can be continued from there.
2. **Brand always second**: after choosing Single script or Batch, the brand picker always appears next (auto-picked when there is only one brand). Single script's format and idea step comes only after a brand is chosen.
3. **One back control, flow only**: the extra "Back" buttons are removed. A single compact header line at the top of the flow shows the choices made, e.g. `Batch · Rise Voice`, with two links:
   - "Change type" returns to Single / Batch.
   - "Change brand" returns to the brand picker (hidden when there is only one brand).
   If a script is being written or unsaved, it asks for confirmation first. "Start new session" stays as is. The back arrow inside Single script's format step is removed.
4. **History**: the brand dropdown in History is removed. Instead, each conversation title shows its brand, e.g. "Rise Voice · Carousel - Oct 17", in the History list and at the top of an opened session.

## Technical details
- `ScriptMode.tsx`: when the rail's writer view is selected (and on section entry), reset to mode chooser via the existing reset (`startNewBatch`-style: clear writeMode, scriptBrand, sessionFormat, live session) while keeping ScriptMode mounted. "Continue session" from History still resumes, bypassing the reset.
- Gate `SingleScriptForm` behind `scriptBrand` like batch; reuse `ScriptBrandPicker` without its `onBack`. Replace the Back buttons (lines ~4984, ~5043, picker `onBack`, SingleScriptForm `onBack`) with one `FlowHeader` component rendering the two change links with the existing busy-confirm.
- `ScriptRail.tsx`: remove the `BrandSelect` filter and `filterId`; `sessionDisplay` takes `brands` and prefixes the brand name resolved from `session.brandIds` (legacy unlinked sessions use the legacy brand via `sessionMatchesBrand`).
- Tests: update `scriptBrands.test.ts` with a brand-name-for-session helper; keep existing auto-pick test.
