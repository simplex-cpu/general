# Home: "See all posts" performance feed + stats collection audit

## Part 1 — What we collect today (confirmed in code)

Stats refresh runs only for Instagram and TikTok (Facebook/YouTube have fields but nothing fills them).

| Item | Instagram | TikTok | Saved to the post? |
|---|---|---|---|
| Views | Yes | Yes | Yes |
| Likes | Yes | Yes | Yes |
| Comments | Yes | Yes | Yes |
| Saves | No (not public) | Yes | Yes when available |
| Shares | No (not public) | Yes | Yes when available |
| Format (B-roll / Talking video / Carousel / Graphic) | Yes | Yes | Yes, only if the post had none |
| Topic (from transcript + caption) | Yes | Yes | Yes, only if the post had none |
| Transcript (videos) | Made | Made | No — used for tagging, then discarded |
| Caption / copy | Read | Read | No — used for tagging, then discarded |
| Cover image | Read | Read | No — only used to help classify format |
| Hook (first line spoken / on cover) | No | No | No |
| Text on screen / carousel slide copy | No | No | No |

## Part 2 — Fill the gaps (so the feed has real content)
- During the existing tagging step, also save: caption, transcript, cover image link, and a hook (first spoken sentence for videos, first caption line otherwise).
- Carousels/graphics: read slide text from the slide images with the AI (image-to-text) and save as slide copy; topic uses it too.
- Store in new fields on the Client Content record (Caption, Transcript, Hook, Cover URL, Slide copy). Refresh fills only empty fields, like today. No n8n changes.

## Part 3 — "See all posts" modal from the Performance card
- Add a "See all posts" link in the Performance card header; opens a modal using the card's current platform + period filter.
- Feed layout, one row per post, sorted by views: thumbnail (produced file or saved cover), post name, hook, short caption excerpt (expand for full copy/transcript/slide copy), format chip, topic chip, publish date, and Views / Likes / Comments / Saves / Shares (dash when unknown), plus "Open post" link.
- Simple sort control (Views, Likes, Comments, newest). Empty and loading states; honest dashes, no invented numbers.
- Same posts as the summary totals (same filter), so numbers add up.

## Technical details
- `home.server.ts` reads the new fields; `MetricsPost` gains caption/transcript/hook/coverUrl/slideCopy.
- `home-refresh-stats.ts` tag step writes them via `tagFields`; `postTagging.server.ts` gets a slide-text reader. Requires creating 5 Airtable fields on Client Content.
- New `HomePostsFeedModal.tsx`; reuse `analyzePostMetrics` publications list.
- Tests: tag fields only fill blanks; feed list matches summary filter.
