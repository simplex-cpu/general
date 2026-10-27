# Performance card: clearer refresh result + readable posts feed

## 1. "Updated 0 posts" — what it means and fixing the message
Refresh reads the Instagram profile, then matches each post to a planner post by its **Instagram link** saved on that planner post. "Updated 0" means none of the profile's posts matched a planner post with a saved Instagram link (or the profile returned no posts).

- First step: check Nina Savelle's planner posts in DWY System to confirm which case it is (no Instagram links saved, links in a different format, or wrong handle) and fix the matching if links exist but aren't recognised.
- Replace the vague toast with a specific one, e.g.:
  - "Found 24 posts on @handle, but none are linked on your planner. Add the post link to a planner post to track it."
  - "Couldn't find any posts on @handle. Check the handle."
  - "Updated 5 posts · 19 on Instagram aren't on your planner."

## 2. Posts window (Kash and all brands)
- **Thumbnails:** use the saved cover from the published post first, then the produced file. Instagram/TikTok cover links expire, so during refresh save the cover image into the post (as a file) instead of only its link; show a neutral placeholder when none.
- **Readable titles:** clean the planner name — strip bracketed parts, dates and brand names (e.g. "[Kash] 2026-10-03 – Why PR matters" → "Why PR matters"). If nothing meaningful is left, use the hook, then the first caption line.
- **Layout per post, stacked:**
  1. Title
  2. Created/published date
  3. Format
  4. Topic
  5. Stats row (Views, Likes, Comments, Saves, Shares)
  6. "Show hook" toggle revealing the hook (and caption/transcript/slide text beneath it)

## Technical details
- `home-refresh-stats.ts` finish response adds `scraped` count already; client toast uses `scraped`, `updated`, `notOnPlanner`. Verify `postKey` handles stored link formats found in the data.
- Refresh tag step uploads the cover as an attachment to "Posted Cover" (change field to attachment, or add "Posted Cover Image") so it stops expiring.
- New `readableTitle(name, brandNames)` in `postMetrics.ts` with unit tests (brackets, dates, brand names, fallback).
- `HomePostsFeedModal.tsx` FeedRow restructured to the stacked order; hook collapsed by default.
