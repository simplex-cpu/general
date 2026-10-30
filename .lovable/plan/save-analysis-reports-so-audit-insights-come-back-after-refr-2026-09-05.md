# Save analysis reports so audit insights come back after refresh

Today the audit findings only live in the browser while the session is open. This adds a permanent home for them in Airtable so the "Audit insights" box in the Script tab keeps showing the latest report, even after a refresh or a new login.

## What the user will see

- Run an analysis once: the findings are saved automatically.
- Open the Script tab later (or after a refresh) and the Audit insights box is still there, with a small note showing when the report was created and which account it analysed.
- If several analyses exist, the most recent one is shown.

## New Airtable table: "Analysis Reports"

Created in the same base as Brands / Brand brief (`appf1QABtQbAENYDz`), with fields:

- `Access code` (text) — links the report to the client
- `Brand Name` (text)
- `Profile` (text) — the analysed account handle
- `Platform` (single select: instagram, tiktok)
- `Posts Analysed` (number)
- `Report JSON` (long text) — the full report object
- `Summary JSON` (long text) — headline numbers (avg views, top views, median)
- `Created At` (date/time)

Storing the report as JSON keeps it flexible: no schema migration needed when the report shape evolves.

## Technical changes

1. **New route `src/routes/api/analysis-report.ts`**
   - `POST` (guarded by `requireAccessCode`): validates the body, stringifies `report` + `summary`, creates a row in Analysis Reports. Truncates safely if JSON exceeds Airtable's long-text limit (~100k) by dropping `samplePosts`-style bulk arrays first.
   - `GET` (guarded by `requireAccessCode`): fetches the newest row for the caller's access code, sorted by `Created At` desc, `maxRecords=1`, and returns `{ report, summary, profile, platform, createdAt }`.
   - Follows the existing pattern in `brand-guidance.ts` (`AIRTABLE_TOKEN`, `esc`, `filterByFormula` on `Access code`).

2. **`src/components/slate/AnalyzeMode.tsx`**
   - After a successful analysis, fire-and-forget `POST /api/analysis-report` with the report, summary, profile, platform and post count. A save failure never blocks the on-screen report; it logs quietly.

3. **`src/components/slate/SlateApp.tsx`**
   - On mount (once the access code is known), `GET /api/analysis-report`; if a stored report exists and no in-session report is set, hydrate `analysisReport` / `analysisAccount` from it.
   - Keeps existing "Send to scripts" behaviour untouched — an in-session report always wins.

4. **`src/components/slate/StrategyStrip.tsx`**
   - Accept an optional `auditMeta` (profile + createdAt) and show it as a small caption under the "Audit insights" heading. No layout change otherwise.

5. **Clearing** — the existing "clear analysis" control keeps clearing the in-session view only; the stored row stays as history. If you want clearing to also delete the stored report, say so and I'll add that.

## Verification

- `bunx tsgo --noEmit`
- Confirm a report row is created in Airtable after an analysis, and that reloading the app repopulates the Audit insights box.
