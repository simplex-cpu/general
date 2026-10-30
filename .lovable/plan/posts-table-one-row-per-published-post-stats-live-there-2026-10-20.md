# Posts table: one row per published post, stats live there

DWY System has no posts table today (only Brands, Brand brief, Client Content). Stats are currently written onto planner rows, which is why unlinked posts were skipped.

## New Airtable table: "Posts" (DWY System)
One row = one published post on one platform.

Own fields (real links, not lookups):
- Brand (link to Brands) — always set
- Content (link to Client Content) — optional, only when the post matches a planner piece
- Platform (Instagram / TikTok), Post URL, Post Key (shortcode / video id, unique per platform), Posted At
- Views, Likes, Comments, Saves, Shares, Stats Status, Stats Updated At, Stats Error
- Format, Topic, Caption, Transcript, Hook, Cover, Slide Copy

Lookups only: Brand brief, workspace, access/user — via the Brand link.

## New "Refresh stats" process
1. Scrape the brand's handle (unchanged).
2. For each scraped post, find its Posts row by Platform + Post Key.
3. Found: update stats (blanks never overwrite). Not found: create it, linked to the brand.
4. If a planner piece has the same post link, set the Content link (never required).
5. Tagging (transcript, format, topic, hook, slide copy) runs on Posts rows missing them.
6. Message: "Updated 12 · added 8 new posts".

## Home and "See all posts"
- Performance card totals and the feed read from Posts for the brand, so every live post counts, planned or not.
- Thumbnail/title come from the post itself; if linked, the planner name is used as title.

## Existing data
- One-time copy: planner rows that already have stats/links become Posts rows linked to both brand and content. Planner stat fields stay but are no longer written.

## Technical details
- Create table + fields via the "Simplex's Airtable" connection (has schema write on DWY).
- New `posts.server.ts` (read/upsert by key, batch 10); `statsRefresh.ts` gains `buildPostUpserts` (pure, tested: match, create, link, no-blank-overwrite).
- `home-refresh-stats.ts` and `home.server.ts` switch to Posts; AGENTS.md rule: stats live only on Posts.
- Needs a publish to go live.
