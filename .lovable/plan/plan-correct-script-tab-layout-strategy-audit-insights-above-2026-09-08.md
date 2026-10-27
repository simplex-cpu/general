# Plan: Correct Script tab layout — strategy + audit insights above Format Split

## What went wrong
The previous change placed "Audit insights" and "Strategy breakdown" boxes **below** the Format Split, duplicating the strategy text. The intended design is two blocks side-by-side **above** the Format Split: the strategy brief and the audit insights.

## New layout (Script tab, non-compact StrategyStrip)

```text
┌─────────────────────────────┬─────────────────────────────┐
│  STRATEGY                   │  AUDIT INSIGHTS             │
│  (brief, formatted +        │  (top topic, format         │
│   editable, Do/Don't)       │   comparison, top posts)    │
└─────────────────────────────┴─────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│  FORMAT SPLIT (Script BROLL / Talking / Graphic /         │
│  Carousel buttons)                                        │
└───────────────────────────────────────────────────────────┘
```

## Changes in `src/components/slate/StrategyStrip.tsx`

1. **Top area becomes a 2-column grid** (`md:grid-cols-2 gap-4`, stacked on mobile):
   - **Left: Strategy box** — eyebrow label "Strategy", edit/done button, and the strategy rendered with the existing formatted `StrategyBreakdownBody` (rationale + Do/Don't columns). When editing, show the autosizing textarea as today. Empty state text unchanged.
   - **Right: Audit insights box** — existing `AuditInsightsBox`, rendered only when an audit report exists. If there is no report, the strategy box spans full width.
2. **Format Split moves below** the grid, full width — content unchanged (chips/buttons with editable counts and autosave).
3. **Remove** the bottom grid containing the separate "Strategy breakdown" box and the short 3-line preview added earlier — the strategy box at top is now the single, full, formatted view. No duplicated strategy text anywhere.
4. Keep conditional rendering: audit box only with a report, strategy box only when a strategy exists (or placeholder when empty), autosave status text unchanged.

## Files
- `src/components/slate/StrategyStrip.tsx` only. No changes to `ScriptMode.tsx` wiring (props stay the same).

## Verification
- `bunx tsgo --noEmit` passes.
- Preview Script tab: strategy brief and audit insights sit side-by-side above Format Split; no strategy text below Format Split; editing the strategy still autosaves.
