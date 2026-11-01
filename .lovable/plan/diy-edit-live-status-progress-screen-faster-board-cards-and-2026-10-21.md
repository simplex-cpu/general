# DIY edit: live status, progress screen, faster board cards, and Edit Yourself QA

## What goes wrong today
- After a DIY edit is sent, the planner refreshes in the background, but the open card keeps its old copy. It only reloads when you open a different card, so you keep seeing the old status and "Do it yourself" tag instead of "Editing" and "AI working".
- The form closes with a short "submitted" message and no progress, so it looks like nothing happened.
- A card opened from the Home board waits for the whole planner list to load before it appears.

## Changes
1. **Status changes right away**
   - Once the Edit Yourself request is saved, the card changes straight to **Editing** (videos) and gets the **AI working** tag in place of "Do it yourself".
   - The open card, the planner row and the Home board all update at once. The app doesn't wait for a background refresh, and anything you're typing is kept.
   - Last-round decision kept: designs still go to Approve.
2. **Progress screen after submitting**
   - Each step shows as it happens: Uploading footage (with %), Saving your request, Sending to the editor, Done.
   - At the end you see "Your video is now Editing", with the card's new status and a button back to the card.
   - If any step fails, you see which step failed and a Retry button. Retrying never creates a second request.
3. **Format icon in the Approve column**
   - Each card in the Home board's Approve column shows a small icon above its title: video, carousel or graphic, with the format name when you point at it.
4. **Faster card opening from the board**
   - A card opens straight away using what the board has already loaded. The full details then load just for that one card, without loading the whole planner first.
   - A light loading state shows only for the parts still loading.
5. **QA check of the Edit Yourself record**
   - Check every path that creates an Edit Yourself record (DIY Edit from a card, Long form B-roll, Long form Talking video, plain BROLL, plain Talking video). For each one, confirm the fields it should fill:
     - Status To Edit
     - Editing style tag
     - User, Brand, Original request link
     - Raw clips or footage link
     - Text Overlay / Visual Hook / CTA, by format
     - Timestamps and Creative Direction (long form only)
     - Text position and music
     - The saved editing snapshot
   - Add tests that check those fields for each format.
   - Run one real end-to-end request with sample footage and read back the Edit Yourself and Client Content records. This needs your OK, because the request will reach your editors.

## What I need from you
- Your OK to create one real test edit request. If you don't give it, the QA stops at the tests and a check of the saved fields without submitting anything.

## Technical details
- `ApproveAndPostMode.tsx`: the draft resets only when `open.id` changes. Add an `applyLocal(id, patch)` step that updates `items` and the `draft` together (status "In Progress", requestType "AI"). Call it from `ProduceReviewModal`'s `onDone(patch)`, then refresh in the background. Board → modal: pass a `seed` post from HomeMode and open it right away, plus a single-record GET in `dwy-client-content` (`?id=`, ownership checked) in place of the full list fetch in `modalOnly` mode.
- `ProduceReviewModal.tsx`: add a step-based progress state for the DIY video path (upload → Edit Yourself POST → content PATCH), a final screen showing the new status, and per-step retry using the existing submission/requestId.
- `dwy-edit-yourself.ts` / `send-to-production.ts`: confirm Client Status "In Progress" plus the AI request type are written in the same update as the request; check the Airtable choice names first.
- `HomeMode.tsx`: add a format icon (Film / GalleryHorizontal / Image) on approve-stage cards from `post.postType`.
- New test `editYourselfFields.test.ts` covering the field map per format; check the 5 formats against the Airtable schema.
