# One linked audit, a regenerated strategy, and a calmer Script tab

## What you will see

- Exactly one audit can be linked to your strategy at a time. In "Past audits" the linked one is marked "Used for findings"; the others show a "Use for findings" button.
- Linking a different audit regenerates the strategy brief and the per-format production targets from that audit. You review the new strategy and numbers first, edit if you want, then approve.
- The Script tab shows the linked audit's findings beside the strategy brief, always, including after a refresh.
- "View" on a past audit opens it in a modal over the Analyze tab, with a close button, instead of replacing the whole screen.

## Analyze tab

1. Past audits list gains a status column. The linked row is highlighted with a "Used for findings" chip; the action on other rows becomes "Use for findings".
2. "View" no longer replaces the Analyze form. It loads the report into a modal (max-width, scrollable, closes on X, backdrop click, or Escape) that renders the existing report view read-only.
3. "Use for findings" flow:
   - Mark the chosen report as linked (server clears the flag on all other reports for that access code).
   - Call the existing `/api/brand-strategy` with that report to regenerate the strategy plus B-roll / Talking / Graphic / Carousel targets.
   - Open the existing review modal showing the new strategy and the four numbers, editable.
   - On approve, save through the existing `/api/brand-guidance` PATCH and switch to the Script tab with that report attached.
   - If the user closes the review without approving, the link stays but the strategy is not overwritten; the button can be used again.
4. A newly generated audit is saved as the linked one automatically, keeping today's behaviour of the fresh report feeding the strategy.

## Script tab

5. Strategy and audit findings sit as two compact, equal-height cards side by side (stacked on mobile), each showing a short summary with a link that opens the full detail in a side panel. Format Split stays below, unchanged.
6. The findings card is driven by the linked audit fetched on load, so it no longer depends on having just generated a report in the same session. It shows the account and audit date.

## Technical notes

- Airtable "Analysis Reports" table gains a `Linked` checkbox field. Setting it on one record clears it on every other record with the same access code, enforcing a single linked report.
- `src/routes/api/analysis-report.ts`:
  - `GET` (default) returns the linked report; falls back to the newest record when nothing is linked yet.
  - `GET ?list=1` includes `linked` per row.
  - new `POST ?link=<id>` (or a `PATCH`) sets the link and clears the others; returns the full report so the client can regenerate the strategy without a second fetch.
  - `POST` (save after an audit) sets `Linked` on the new record and clears the previous one.
- `src/components/slate/AnalyzeMode.tsx`: audit-view modal, status column, link-then-regenerate handler reusing `refineStrategy`/`approveAndScript`, refresh of the audit list after linking.
- `src/components/slate/StrategyStrip.tsx`: keep the compact summary cards and detail panels, ensure equal height and consistent empty states.
- `src/components/slate/SlateApp.tsx` / `ScriptMode.tsx`: hydration already fetches the stored report and forwards it; it now resolves to the linked report.

## Verification

- `bunx tsgo --noEmit`.
- Link an older audit: the review modal shows a different strategy and targets; approving updates the Script tab brief, format targets, and findings card.
- Refresh the app: the findings card still shows the linked audit.
- "View" opens the modal over Analyze and closes cleanly.
