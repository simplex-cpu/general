# Home board polish, planner fix, and Zernio auto-posting approach

## 1. Open cards right on Home
Clicking a card on the "Needs your attention" board opens the same post window as the Planner, on top of Home. The screen no longer switches to the Planner. Closing the window keeps you on Home, and the board refreshes to show any changes.

## 2. Notion-style column headers
- The gray background behind each column goes away. Columns sit on the page background.
- Each column name sits in a small colored pill, like Notion. The color matches that status's color in the Planner: Prepare Footage is neutral, Produce blue, Approve amber, Post green. The card count sits next to the pill.

## 3. Drag and drop to change status
- You can drag a card into another column. The card moves straight away and the new status is saved.
- If the save fails, the card goes back to its old column and a short message explains why.
- What each column sets:
  - Prepare Footage: "Film"
  - Produce: "To Edit" for videos, "To Design" for carousels and graphics
  - Approve: "To Approve"
  - Post: "Approved"
- If a status is one clients aren't allowed to set, that column won't accept the drop, and hovering shows why. The same rule already applies in the Planner.
- On a phone, you have to hold a card briefly before it drags, so scrolling still works.

## 4. The same card opening every time you enter the Planner
The cause: the post opened from a link (or from Home) is remembered for good. The `?planner=` link also stays in the address bar. So every time the Planner loads, it opens that post again.
Fix: once that post has opened, the app forgets it and removes it from the address bar. After that, going to the Planner opens nothing.

## 5. Auto-posting through Zernio (approach only, no build this round)
Here's the suggested flow, for you to confirm before anything is built:
1. **When:** When a card reaches "Approved" and has a date, it can be scheduled. The Planner's Post button (now "Coming soon") becomes "Schedule" or "Post now".
2. **What's sent:** The app server asks Zernio to create a post. It sends the brand's connected account IDs for each chosen platform, the media to post (Zernio can read the file links), each platform's caption and hashtags, and the scheduled time.
3. **Tracking:** Zernio's post ID is saved on the Content record. The status changes to "Posting", then to "Posted" once Zernio confirms. Zernio can tell the app through a secure callback, or the app can check on its own. The live post link is saved to the Posts table, so stats tie in automatically.
4. **Rules:** You can only post to accounts that are connected and active. You get one Zernio post per card per run, so there are no duplicates. A signed-out account shows "Sign back in" instead of failing quietly.
5. **What I need from you:** which platforms to launch with, and whether clients may schedule on their own or only after staff approval.

## Technical details
- `ApproveAndPostMode` gets a `modalOnly` mode that renders only the card dialog for `initialPostId` and has an `onClose`. HomeMode renders it locally instead of calling `onOpenPost`. It also invalidates `home-content` when the dialog closes.
- The pill colors reuse `statusTone` tokens. A new helper `stageDropStatus(stage, format)` lives in `plannerStatus.ts`, with tests. Dragging uses native HTML5 DnD plus pointer long-press, and PATCHes `/api/dwy-client-content` `{ clientStatus }`. Drop targets check `isClientWritableStatus`.
- In SlateApp, a `consumePlannerLink` callback clears `plannerPostId` and runs `history.replaceState` to drop `planner`. `ApproveAndPostMode` calls it after the link opens.
