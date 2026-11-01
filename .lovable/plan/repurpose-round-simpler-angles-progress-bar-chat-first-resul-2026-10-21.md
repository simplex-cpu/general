# Repurpose round: simpler angles, progress bar, chat-first results, full hooks, inspo previews

## 1. Angle step (viral posts only)
- Remove the "Trending now" and "Your topics" sections; keep only Suggested angles plus "Write my own".
- Each suggested angle becomes a collapsed card: title always visible, arrow on the right expands "Challenges" and "Why you". Clicking the title selects it; clicking the arrow only expands.
- Own posts skip the angle step entirely: after choosing a format, writing starts straight away (always "keep original angle").

## 2. Progress bar in both paths
- When the user confirms (viral: "Write script"; own post: format choice), the window content is replaced by a progress view: title "Writing your script", a bar that moves through steps (Reading the post, Applying your brand, Writing in the new format, Writing captions, Saving to your chat) and a percentage.
- Steps advance on a timer up to ~90%, then jump to 100% when the script is saved, and the user is taken to the chat. On error the bar is replaced by the red error and a "Try again" button.

## 3. Own-post results go to the chat, never a pop-up
- Remove the "Your repurposed post" window ("Send to production queue" / "Produce now") from Home's posts feed.
- After writing, the feed closes and the new session opens in the scripting chat, same as the viral path; the user decides there (approve, captions, planner, production).

## 4. New format = new format's rules (own posts)
- When the target format differs from the original, the writer also receives that format's scripting guidelines (talking video, B-roll, carousel, graphic) plus the carousel/graphic slide limits, so the structure truly becomes the new format.
- Topic, main idea, delivery and wording stay from the original; only the structure follows the new format's rules.
- Same-format repurposing is unchanged (only visual hook or cover title changes).

## 5. Full visual hooks from mined posts
- Today the saved hook can be partial (only part of the on-screen text is kept). Change the video reader so the visual hook is all the text shown on screen during the opening, kept together as one block, never a scene description.
- Fix existing posts: run a one-time refresh of the visual hook only, for every mined video post that has a saved video link, overwriting short/cut hooks. Posts with no readable video keep their current hook. This uses the video reader once per post (no stat scraping).
- The hook shows on one line in the windows (lines joined), with the full text when expanded.

## 6. Preview viral posts inside the app
- Clicking the picture on a viral post card (and in its detail window) opens the same Preview window used for your own posts: video plays in place, images show as a carousel.
- If no media file is saved for that post, show the platform's official in-page player for Instagram/TikTok; the "Open on Instagram/TikTok" link stays as a backup.

## Technical details
- `RepurposeAnglePicker.tsx`: drop trending/pillars rendering, add per-card expand state; `/api/repurpose-angles` stops fetching trending for this step. New shared `RepurposeProgress` component used by `InspoBankMode` and `HomePostsFeedModal`.
- `HomePostsFeedModal.tsx`: remove result dialog + send-to-production; on success call `onOpenSession(sessionId)` and close.
- `post-repurpose.ts`: when `planRepurpose` mode is a format conversion, append `FORMAT_PROMPT[fmt]` (from `inspo-repurpose.ts`) to the system prompt alongside `designStructurePrompt`. Add a test asserting conversion prompts include the target format's guidelines and same-format prompts do not.
- `postCopy.ts` / `minePostCopy.server.ts`: hook extraction keeps the full opening on-screen text block; add a test with a multi-line hook that must be returned complete. One-off backfill script over Posts/Client Content visual-hook fields.
- `InspoBankMode.tsx`: reuse the preview dialog; use saved media URLs when present, otherwise Instagram/TikTok embed iframe from the post URL.
