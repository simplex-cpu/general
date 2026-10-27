# A more useful Home and a cleaner Community

## 1. Visual refinements
- Use the same light blue palette as milestones 1 and 5 for **every milestone thumbnail**, retaining subject-specific icons and clear locked states. Reserve red/amber/green for real progress and status, never thumbnail decoration.
- Remove the horizontal dividers above Community’s section tabs and composer. Keep useful post boundaries and the selected-tab indicator.
- Make the entire area from **Feed / Support / Strategy ideas / My Posts** to the bottom one continuous neutral-gray surface, spanning the section width. It must fill the remaining screen with zero or one post and extend naturally with longer feeds; keep the composer light.
- Reduce the sidebar brand header and persistent section headers by **at least 20%**, including smaller titles/logos. Target the sidebar’s current 80px strip at 64px, its 24px logo at 19px, and Community’s 80px desktop / 64px phone header at 64px / 48px with a 16px title.
- Reduce the phone’s 60px top bar to 48px and its logo from 20px to 16px, updating the matching content offset. Keep account/navigation controls at least 44px tappable and preserve safe areas. Do not shrink bottom navigation or modal titles as part of this change.
- Keep the Scripting Hub’s title/toggle relationship and deliberate chat spacing while reducing its persistent header footprint.

## 2. Home: a personal daily overview
Replace the four large shortcut tiles with an action-first overview, not a second staff dashboard. Use unframed sections, compact rows and actual post previews where available.

**First: Needs your attention**
- Show counts and a short prioritized list of content awaiting footage, approval, requested corrections, or posting.
- Each row shows the post title, format/platform, reason for attention and a direct action opening that exact planner record. Use real posting dates for urgency; do not invent deadlines.
- Keep in-progress production separate from actions the client can actually take. If nothing needs attention, show a calm caught-up state.

**Next: Your growth journey**
- Show the current milestone, overall course completion, and the next available course with **Continue learning**.
- Keep the full milestone/course experience in Growth Path, not Home. The shortcut opens the actual next course, respecting existing locks.

**Performance**
- Provide platform selection and a publication-date range, starting with the last 30 days.
- Show stored views, likes, comments, saves and shares, the number of measured posts, and when results were collected.
- Show the best-performing posts for the selected platform, their real published links, and concise evidence-based takeaways such as which formats earn more views or saves.
- Separate workflow attention from performance observations. Do not label a post a failure just because its statistics are missing or it was recently published.
- Home reads and analyzes statistics stored on content records. It does **not** substitute old uploaded analysis reports, scrape posts on every visit, or treat a connected account as proof of available statistics.

**Community updates**
- Show a few recent Creator Circle posts, highlighting team strategy recommendations and support requests without duplicating the full feed/composer.
- Open the relevant Community tab/post from each preview. Show recent activity, not an unread count unless read tracking exists.

Desktop: attention and performance form the main column; growth and community occupy a lighter secondary column. Phone: attention → growth → performance → community, with compact sections and no horizontal page scrolling. Retain small Scripting Hub/Planner shortcuts rather than oversized navigation cards.

## 3. First establish the post-statistics contract
The app currently references separate **Content** and **Client Content** boards. Live schema reads confirmed that both already have Instagram/Facebook/TikTok/YouTube posted-link fields. Content has single aggregate Likes, Comments, Saves, Reposts and Views columns, but no per-platform metric breakdown; its `Stats update` is an automatic last-modified field, not a writable collection timestamp. Client Content has no statistics columns or collection timestamp. The planner reader currently exposes neither the posted links nor statistics in its response. The existing Airtable connector could inspect Content but not Client Content; a separate read using the app’s existing credential successfully inspected both.

Before adding fields, verify which board the publishing automation updates and how its record maps to the planner record. Keep one canonical content record for each content piece, with separate platform fields on that record; do not create a record per metrics refresh or blindly duplicate statistics across both boards.

Reuse the existing posted-link fields and compatible published-ID fields rather than create duplicates. Add the missing per-platform metric breakdown and writable collection timestamps/statuses to the verified canonical table. Preserve existing aggregate columns and any dependent reporting formulas. For each supported publishing platform—Instagram, TikTok, Facebook and YouTube where used—define:

| Fields per platform | Purpose |
|---|---|
| Post URL; Post ID where supplied; Published At | Identify the actual platform publication |
| Likes; Comments; Saves; Shares; Views | Non-negative whole-number metrics, separately stored by platform |
| Stats Updated At | Date/time of the successful collection |
| Stats Status; Stats Error | Distinguish pending, collected, unavailable and failed results |

Unsupported/unavailable metrics remain blank, not zero. Add a stable cross-board source reference only if the board mapping requires one. Do not mix totals from different platforms in one ambiguous field.

## 4. Automation handoff—without changing n8n
Deliver a precise field mapping and example payload for the user-managed sequences:
1. **Publishing:** after each platform confirms publication, update that platform’s URL/ID/publication time on the existing content record. Handle partial platform success separately; do not mark all platforms published because one succeeded.
2. **Statistics collection:** use the saved URL and Apify to retrieve available metrics, normalize the result, then update the five platform metrics and collection status/time on that same record.
3. **Reliability:** deduplicate by content record + platform + post identity; collection updates overwrite the latest snapshot rather than add records. Preserve the last successful metrics on collection failure; replace/clear the snapshot when the publication identity changes. Use bounded retries/backoff and stop permanent failures.
4. **Availability:** verify Actor output for each platform and content format, particularly saves/shares and static-post views. Never promise a metric Apify does not return; preserve explicit unavailable states.

The publishing URL writeback and statistics-collection sequence must be wired in the user’s automation before live Home performance can be verified. No n8n workflow will be inspected or modified. No Apify runs occur while opening Home. App-owned Apify access would need a separate connector setup only if responsibility for collection changes.

## Technical implementation
- Introduce a shared typed post/platform metrics contract and pure analysis helpers. Count unique content pieces separately from platform publications; calculate within-platform rankings and aggregates from eligible, measured records only.
- Derive engagement-by-views only when views are available and nonzero, clearly defining the formula and which interaction metrics are included. Avoid cross-platform rankings with incompatible metrics or unsupported period-over-period growth from a latest-snapshot-only store.
- Add a Home summary server function using the existing access-code authentication and record-ID ownership checks. Keep private data server-side, authenticate before reading, and return only the caller’s content plus safe community previews.
- Reuse learning and community data/query caches and shared planner status rules. Cache Home reads; invalidate after relevant actions; no fast polling or repeated full-board reads.
- Pass exact planner, course and community targets through existing section navigation; opening a card must preserve ownership/access checks and not discard an active scriptwriter session.
- Keep each Home section independently usable when another source fails. Missing automation results show an honest waiting/unavailable state without fake statistics.
- Use existing semantic design tokens/components; record the new requirements and architecture rules during implementation. Preserve app-specific route metadata.

## Delivery and QA
1. Apply the thumbnail, divider, full-height feed and compact-header changes.
2. Verify the canonical content table and existing fields; add missing statistics fields and provide the automation mapping before building performance against them.
3. Build Home’s attention, growth and community sections, then the stored-data performance analysis.
4. Add concrete tests for per-platform field mapping, blank vs zero metrics, aggregation/ranking, ownership isolation and planner attention classification using the existing status contract. Preserve current progress thresholds.
5. Check desktop and phone layouts, collapsed/expanded navigation, header measurements, zero/one/many posts, loading/error states and safe-area offsets.
6. With a real access-code session, open attention items, continue the next course, and open community updates end-to-end. Verify a real published post’s URL and collected metrics read back through the planner/Home data path after the user-managed automation writes them.

**Dependencies:** confirm which of the two content boards the publishing sequence updates and obtain field-creation access if its credential cannot modify that board; user-managed publishing URL writeback and Apify statistics collection. Home’s layout and non-statistics sections can proceed independently; live analytics must be reported as unverified until those sequences produce real results.