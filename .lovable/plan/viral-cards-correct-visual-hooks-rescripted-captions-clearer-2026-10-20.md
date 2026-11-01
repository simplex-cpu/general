# Viral cards, correct visual hooks, rescripted captions, clearer alerts

## Find Viral Posts cards
- Order: thumbnail, **bold title**, stats row (views, likes, comments) right under the title, then handle, date, format and topic on one quiet line.
- Cleaner card: fewer borders and chips, more white space, smaller meta text, one divider before the footer.
- The expander is just "Why it works".
- Footer buttons (Open, Repurpose, Discard) share the full width equally.
- Posts found by "Find viral posts" are read-only; only posts you added yourself can be edited. Each saved post records how it was added; older posts with a scraped thumbnail or stats count as found.
- Brand picker arrow in the Find modal sits inside its box.

## Visual hook fix (posts from Refresh stats)
- Cause: the video reader returns on-screen text plus a "Visuals:" description, and the description was saved as the visual hook.
- Fix: the visual hook becomes the first on-screen text line seen in the video. The "Visuals:" description is no longer saved anywhere.
- Clean-up: one run goes through saved posts. Any visual hook that reads like a scene description is replaced with the first on-screen text line when there is one, or cleared so the next refresh fills it in. Nothing gets scraped again.
- Repurpose ignores a visual hook that reads like a scene description.

## Captions rescripted on repurpose
- Every repurpose writes new captions and hashtags that match the new hook or cover. The main idea and content stay the same, since it's a variation.
- If the format stays the same, the body stays word for word and only the hook or cover and the caption change.

## Attach box
- Follow a common pattern from Notion, Linear and Slack: a clear outlined "Attach file" button with a paperclip, and next to it a link field with an "Add link" button. Dropping files still works anywhere in the box.

## Alerts
- Every pop-up alert in the app is colored the same way: green for success, red for errors, yellow for warnings. Plain neutral alerts that are really warnings, such as "Refresh stats first", become yellow.

## Handle on the Performance card
- A wider handle pill shows the full handle. Clicking it opens that profile on Instagram, TikTok and so on in a new tab, so you can check which account is being read. The same link appears in the handle picker.

## Technical details
- `minePostCopy.server.ts`: split `readVideoText` output; `visualHook` = first non-empty text line before `Visuals:`. Add `looksLikeSceneDescription()` in `postCopy.ts` (test). One-off backfill over Posts/Content rows via a script, not on page load.
- `postRepurpose.ts`: drop "Keep captions unchanged"; `preserveOriginalBody` no longer restores captions; prompt requests `captions` for all modes. Update `postRepurpose.test.ts`.
- Inspo: add an `Origin` (Found/Manual) single select to DWY Bank of Inspo, set it in inspo-find/inspo-bank, and block edits on the server for Found rows.
- `sonner.tsx`: `richColors` plus theme-token classNames for success/error/warning; audit `toast(` calls → `toast.warning` where appropriate.
- `AttachBox.tsx`: two explicit buttons; consumers unchanged.
- `HomeMode.tsx`: handle pill becomes an anchor using a `profileUrl(platform, handle)` helper (test).
