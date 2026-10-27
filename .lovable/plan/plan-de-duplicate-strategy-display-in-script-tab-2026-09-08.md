# Plan: De-duplicate strategy display in Script tab

## Problem
The Script tab currently shows the written strategy twice: once in the top "Your Strategy" area and again fully parsed in the "Strategy breakdown" box below Format Split. They contain the same information.

## Agreed intent (from the original design)
Two boxes side-by-side below Format Split:
- **Audit insights** — analysis report data (top topic, format comparison, top posts). Keep as-is.
- **Strategy breakdown** — the written strategy parsed into Rationale + Do/Don't columns. This is the *detailed, formatted* view of the strategy.

## Change
Make the top strategy area a compact summary instead of a full duplicate:

1. **Top "Your Strategy" section** — show only a short read-only preview (first ~3 lines) with the existing click-to-edit behavior and "Read full strategy" affordance removed or repurposed to point at the breakdown below. Editing still works by clicking the preview.
2. **Strategy breakdown box** — becomes the single place where the full strategy is rendered with formatting (rationale sections + Do/Don't two-column layout). No content changes, it already does this.
3. Keep everything else unchanged: Format Split buttons, Audit insights box, autosave on edit, conditional rendering (breakdown only when a strategy exists, audit insights only when a report exists).

## Files
- `src/components/slate/StrategyStrip.tsx` — trim the top strategy rendering to a preview; no changes to `StrategyBreakdownBody` or `AuditInsightsBox`.

## Verification
- `bunx tsgo --noEmit` passes.
- Script tab with a strategy + report: top shows a short preview; breakdown box shows the full formatted strategy next to Audit insights; no duplicated full text.
