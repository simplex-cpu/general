# Past audits, persistent audit insights, and a calmer strategy screen

Three related fixes: keep a visible history of past audits, make the audit insights stick around, and simplify how strategy plus findings are shown together.

## 1. Audit history below the Analyze form

Add a "Past audits" list under the analyze form (same idea as the request tables in Design and Edit):

- Rows show: account/handle, platform, posts analysed, date and time.
- Newest first, all previous cycles for the signed-in account.
- Each row has "View" (opens that saved report in the existing report view) and "Use for scripts" (loads it into the Script tab as the active audit).
- Empty state: "No audits yet. Run your first one above."

Technical:
- `src/routes/api/analysis-report.ts`: extend `GET` with a `?list=1` mode returning up to 20 rows (`id`, profile, platform, postsAnalysed, createdAt, no heavy JSON), plus `?id=<recordId>` to fetch one full report. Existing default GET (latest) stays as is.
- `src/components/slate/AnalyzeMode.tsx`: fetch the list when no report is on screen, render the table, wire "View" to `setReport`/`setSummary` from the stored `Report JSON` / `Summary JSON`, and "Use for scripts" to the existing `onSendToScripts` bridge.
- Fix the save call so history rows are accurate: today the POST sends the `summary` state variable, which is still empty at that moment, so rows land with `Posts Analysed: 0` and null summary values (confirmed on the one stored row). Send the freshly computed summary/report values instead.

## 2. Audit insights disappear after refresh

Confirmed cause (not a saving problem): the report is stored and `SlateApp` does re-fetch it, but `ScriptMode`'s init effect runs once behind an `initedRef` guard and returns early whenever a session was restored from storage, so a report that arrives after mount is never applied to `state.seedReport` — and `StrategyStrip` only reads that.

Fix in `src/components/slate/ScriptMode.tsx`:
- Add a separate effect that dispatches `SET_SEED` whenever `seedReport` changes and differs from current state, independent of the one-time init guard.
- Keep the greeting line ("I've got your analysis report loaded for @x") firing only once so nothing is duplicated.

## 3. Calmer single-screen layout for strategy + findings

`src/components/slate/StrategyStrip.tsx` is currently two tall stacked walls of text. Change to a compact two-column header with progressive disclosure:

```text
┌───────────────────────────────┬───────────────────────────────┐
│ STRATEGY                      │ AUDIT INSIGHTS   @handle·date │
│ short intro (3 lines)         │ Top topic: ...                │
│ Do / Don't summarised as       │ Winner: Talking video         │
│ compact chip rows              │ Top post: 65k views           │
│ [Read full strategy] [Edit]   │ [See all findings]            │
└───────────────────────────────┴───────────────────────────────┘
┌───────────────────────────────────────────────────────────────┐
│ FORMAT SPLIT (unchanged)                                      │
└───────────────────────────────────────────────────────────────┘
```

- Strategy box: first paragraph plus a condensed Do/Don't summary (counts + first items), with "Read full strategy" opening the full formatted breakdown in a side panel/modal. Editing still works and still autosaves.
- Audit insights box: three headline facts only (top topic, format winner, best post), with "See all findings" opening the full audit detail in the same style of panel.
- Both boxes get equal height and matching type scale so the screen reads as one row, not two essays.
- No change to the data flow, autosave, or Format Split behaviour.

## Files touched

- `src/routes/api/analysis-report.ts`
- `src/components/slate/AnalyzeMode.tsx`
- `src/components/slate/ScriptMode.tsx`
- `src/components/slate/StrategyStrip.tsx`

## Verification

- `bunx tsgo --noEmit`
- Past audits list shows the stored `drninahelps` audit with correct date, and "View" reopens it.
- After a full refresh, Audit insights still appears next to the strategy in the Script tab, including when a scripting session is resumed.
