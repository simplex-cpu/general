# A calmer, performance-first Home

## Direction
Redesign Home as a premium dashboard with one obvious reading order: **performance → pending work → growth and community**. Keep Risevoice’s indigo accent and existing navigation. This is a presentation redesign, not a change to statistics collection or production workflows.

## What changes

### 1. Performance leads
- Replace the large welcome block, “YOUR CREATOR SPACE” label, and competing Write a script / Planner shortcuts with a compact Home heading and personal greeting.
- Make Performance the first and widest section, independent of the height of pending work or growth.
- Keep platform and date-range filters together in one understated toolbar.
- Give Views the strongest numeric emphasis; display Likes, Comments, Saves, and Shares as quieter, aligned summary items. Avoid five equally loud boxes.
- Place a compact Top posts list directly underneath, using available post thumbnails, titles, view counts, and one clear way to open each post.
- Replace repeated “measured posts” text beneath every number with one discreet coverage/freshness line. Put detailed availability information behind an accessible information control.
- Keep missing results honest: use dashes and one short empty-state message. Do not invent trends, charts, comparisons, or statistics.

### 2. Pending work becomes the single action area
- Place “Needs your attention” below performance as a clearly separated, compact queue.
- Show up to three pending posts initially, preserving the existing priority order. Each row shows only the title, the required action, and a date when available.
- Use neutral clickable rows rather than a collection of prominent buttons. Only the highest-priority row gets a filled indigo action, opening its existing planner review.
- Show one quiet “View all” link when more items exist, and keep the production count as a small status label.
- When there is nothing pending, show one short completion state without adding a competing creation button.

### 3. Growth and community stay useful, but secondary
- Finish with two compact summaries: Growth Path and Community. Use smaller headings and restrained neutral styling.
- Growth shows the current milestone, progress, and next course, with one understated continuation link instead of a filled button.
- Community shows at most two recent updates with author, short excerpt, and time; omit reaction totals and redundant category descriptions from this overview.
- Preserve links to the exact course or community post. Keep full detail in those sections rather than repeating it on Home.

## Visual system and spacing
- Use a light neutral dashboard canvas, crisp typography, consistent alignment, and generous separation between full-width sections—not floating cards around every section.
- Reserve indigo emphasis for the primary action and selected controls; use quieter charcoal and gray for supporting information.
- Establish distinct heading, metric, row-title, and metadata sizes. Remove unnecessary decorative icons, uppercase labels, and duplicate descriptions.
- Give repeated post rows stable thumbnail and action dimensions, subtle separators, and clear keyboard focus. Keep corner radii at 8px or less.
- Keep the order unchanged at narrower widths. Allow filters to wrap cleanly, metrics to reflow, and secondary summaries to stack without text or buttons colliding.

## Technical scope
- Restructure `HomeMode.tsx` into focused presentation sections, reusing the existing Button, Select, statistics analysis, and navigation callbacks.
- Add only Home-scoped semantic color/style tokens where existing tokens are insufficient; do not restyle the rest of the app.
- Preserve access-code checks, owned-content reads, metric definitions, publication ranges, task classification, and existing learning/community queries.
- No Airtable field changes, new statistics collectors, or n8n investigation or modifications.

## Verification
- Check populated, loading, error, partially measured, and empty states without making empty sections dominate the page.
- Check wide desktop, the current 1092px view, and phone-sized layouts for spacing, readable text, filter wrapping, and no overlap or horizontal scrolling.
- Verify platform/range selection and navigation from pending posts, top posts, the next course, and community updates. Use an active client session when available; label any sample-data checks separately.
- Run existing statistics/status tests and inspect preview errors before reporting completion.

## Result
Home reads as a performance dashboard first, provides one clear place to act next, and keeps growth and community visible without competing for attention.