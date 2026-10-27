# Home Performance: exact refresh reason, better post feed, previews and Repurpose

## 1. Exact refresh reason
- When Instagram hides a profile (age limit, private, missing), Refresh stats shows that exact reason, e.g. "Instagram is hiding @drninahelps's posts because the account has an 18+ age restriction. Turn it off in Instagram Settings → Account → Age restriction, then refresh again."
- Message stays on screen until dismissed.

## 2. Thumbnails in "See all posts"
- Thumbnail fills the full height of each post row and is wider (about 4:5 instead of the current narrow strip).
- Load order: saved cover → live post cover → finished file → video first frame → placeholder. Video files show a still frame with a play badge.
- Images load without referrer and fall back cleanly when a link has expired.

## 3. In-app preview
- Clicking the thumbnail opens a preview window: videos play inline (finished file or saved video link), images/carousels show in the existing slide carousel.
- If only the Instagram/TikTok link exists (their videos can't be embedded reliably), the preview shows the cover with an "Open on Instagram/TikTok" button.

## 4. Repurpose button
- New "Repurpose" button next to the open-post icon on each feed row.
- Opens a modal with four choices: Story, Carousel, Single graphic, Talking video.
- Behaviour depends on original vs new format:
  - Talking video → Talking video: new visual hook / visual direction, same spoken script.
  - Carousel/graphic → same format: new cover title, rest of copy kept.
  - Different format: copy reformatted to the new format (same message, new structure).
- Result opens in the Scripting writer as a Repurpose card (same as Bank of Inspo repurpose), so it can be edited, approved and sent to the planner.
- Story is a new format: one to three vertical frames of short text, written into the writer as story copy.

## 5. Performance card layout
- "Your top performing topic" takes about 60% width, format about 40%.
- Both section values slightly smaller so the topic fits on one line (truncates with full text on hover if still too long).
- "See all posts (N)" moves to the bottom-right corner of the card.

## Technical details
- Refresh: surface the scrape-posts restriction reason through `/api/home-refresh-stats` start/finish responses; toast with `duration: Infinity` and close button.
- Feed modal (`HomePostsFeedModal.tsx`): `Thumb` becomes `self-stretch w-28 sm:w-32`, adds `<video preload="metadata">` frame fallback; new `PostPreviewDialog` reuses `SlideCarousel`.
- Repurpose: new `planRepurpose(originalFormat, target)` in `inspoRepurpose.ts` returning mode `visual | cover | reformat`, unit-tested per rule; `/api/inspo-repurpose` accepts source copy (hook, caption, transcript, slide copy) from the Posts row plus mode; adds `story` target with its own validator. Writer opens via existing repurpose transcript handoff.
- HomeMode grid: `sm:grid-cols-[3fr_2fr]`, value text `text-[18px]` with `truncate`; button wrapper `justify-end`.
