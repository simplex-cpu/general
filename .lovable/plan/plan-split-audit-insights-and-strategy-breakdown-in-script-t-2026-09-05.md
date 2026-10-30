# Plan: Split audit insights and strategy breakdown in Script tab

## Goal
Below the existing strategy section in the **Script** tab, add two conditional boxes side-by-side on desktop (stacked on mobile):
- **Audit insights** — surfaced from the analysis report that was sent from Analyze mode.
- **Strategy breakdown** — the rationale plus Do/Don't guidance parsed from the written strategy.

## Current state
- `src/components/slate/ScriptMode.tsx` receives the analysis report as `seedReport` and renders `StrategyStrip` when the brand brief is submitted.
- `src/components/slate/StrategyStrip.tsx` currently shows the editable written strategy and the Format Split counts, but has no audit-insights UI.
- The `Report` type in `src/lib/slate/analyseHelpers.ts` exposes `scorecard`, `formatComparison`, `topPosts`, `topicPillars`, etc.

## Changes

### 1. StrategyStrip props
Add an optional `auditReport?: Report | null` prop to `StrategyStrip`. Keep `compact` behavior unchanged — the new boxes only appear in full (non-compact) mode.

### 2. Audit insights box (conditional)
Only render when `auditReport` is present. Show:
- **Top performing topic** from `scorecard.topPerformingTopic` plus the matching `topicPillars` entries (topic name, best result, why it connects).
- **Format comparison** — the winning format, reason, and per-format stats (posts, avg views, reaction rate).
- **Top-performing posts** — up to 5 posts from `topPosts` with format, views, reactions, and a clickable post link.

Style as a rounded card with a subtle border and a small "Audit insights" eyebrow label.

### 3. Strategy breakdown box (conditional)
Only render when a strategy exists. Reuse the existing `parseStrategy` / `StrategyBody` logic, but split the output into:
- **Rationale** — the plain/neutral sections that explain *why* the strategy is what it is (the text before or outside explicit Do/Don't headings).
- **Do/Don't** — the classified Do and Don't sections, rendered in the existing two-column layout.

Style as a rounded card with a subtle border and a small "Strategy breakdown" eyebrow label.

### 4. Layout
Place the two boxes in a 2-column grid below the Format Split section:
- `md:grid-cols-2 gap-4`
- Single column on smaller screens.
- Each box uses `min-w-0` and `break-words` to avoid overflow.

### 5. ScriptMode wiring
Pass `state.seedReport` into `StrategyStrip` as `auditReport` in the non-admin branch where `StrategyStrip` is already rendered.

### 6. Type safety
- Import the `Report` type from `@/lib/slate/analyseHelpers` into `StrategyStrip.tsx`.
- Access report fields defensively with fallbacks so a malformed report does not crash the UI.

## Verification
- TypeScript passes (`bunx tsgo --noEmit`).
- Preview the Script tab after sending an analysis report from Analyze mode; confirm both boxes appear side-by-side and contain the expected data.
- Confirm the boxes are hidden when no report or strategy exists.
