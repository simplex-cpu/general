# Find Viral Posts fix, 90-day default, and a Performance "Refresh stats" button

## 1. "Request failed (502)" when generating search strings
- The message has no detail, so the failure most likely happens before the app can answer (the request times out or crashes), not in the AI step: a test generation from here worked and returned 5 strings in under 2 seconds. The cause is not confirmed yet.
- First step: reproduce it with your brand, read the server error, and fix the actual cause.
- Hardening either way: the AI call gets a time limit and one retry; strings the AI returns that are too long are trimmed to 5 words instead of failing everything; any failure shows a readable message ("Couldn't generate search strings — try again") instead of a status code.

## 2. Last 90 days by default
- Home Performance opens on **Last 90 days**. 7 / 30 / 180 / 365 stay available.

## 3. "Refresh stats" in Performance
- A small **Refresh stats** button in the Performance card, next to the platform and period dropdowns.
- It uses the handle saved in the selected brand's **Connected Accounts** tab for the chosen platform (Instagram or TikTok). With "All brands" selected, it refreshes every brand that has a handle.
- **No handle saved:** a small window asks for it ("@yourbrand"), saves it to that brand's Connected Accounts, then continues.
- **What it does:**
  1. Reads the latest posts from that profile with the same scraping service already used for account analysis.
  2. Matches each scraped post against posts **already on your planner** by their posted link (post code) — only those are updated, with views, likes, comments, saves, shares and the time they were collected. Nothing is overwritten with blanks; a real zero stays zero.
  3. Scraped posts that aren't on your planner are **not** added (for now), and the summary says how many were skipped.
- While running: the button spins, shows "Refreshing…", and can't be pressed twice. When done: "Updated 12 posts · 3 not on your planner", and the numbers on Home reload.
- Limits: one refresh per brand and platform at a time; scraping costs Apify credits, so it reads at most the latest ~100 posts per refresh. Facebook/YouTube aren't covered (no handle reader yet), so the button is hidden for those.

## Technical details
- `inspo-find.ts` generate: wrap `generateLovableText` with a timeout plus one retry; make `parseTerms` lenient (trim to 5 words, top up/limit to 5) with tests; client shows the server `error` text or a friendly fallback.
- `HomeMode.tsx`: `useState("90")`; Refresh button + handle dialog; invalidate the Home content query on success.
- New `/api/home-refresh-stats` (access-code gated, ownership checked): resolves brand handle from the brief's `{Platform} User` field; reuses the Apify runners from `scrape-posts.ts` (extract to a shared server module, no behavior change there) with an async run + slow poll returning progress; matches by normalized post shortcode/ID against owned Client Content `{Platform} Posted link`; PATCHes only the existing `{Platform} Likes/Comments/Saves/Shares/Views/Stats Updated At/Stats Status/Stats Error` fields in batches of 10. Single-flight via the existing operations lease table keyed by owner+brand+platform.
- Tests: shortcode matching (instagram /p/ and /reel/, TikTok video ids), no-blank-overwrite merge, "not on planner" counting.
- No new Airtable fields; external n8n stats automation untouched.
