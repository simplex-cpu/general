# Cleaner Add to planner window, file limits, and slimmer planner windows

## 1. Add to planner window
- Swap the "Footage link" text box for the same Attach box the planner cards use. One box where you can drop or pick files, or paste a Drive/Dropbox link. Anything you attach shows up inside that box.
- Make the window cleaner: a plain white header with dark title text instead of the indigo strip, which removes the white halo around its edges. The two choices ("Produce now" / "Add to production queue") become lighter cards. Cancel becomes an outlined button and Confirm becomes indigo. There is less spacing overall.
- Files you attach here are uploaded and linked to the post, just like files attached in the planner.

## 2. File type and count limits before production
These limits are checked before any request is sent to production, everywhere you can attach material: Add to planner, the planner card, the Produce/Review window and Edit Yourself.

| Post type | Allowed | Count |
| --- | --- | --- |
| Carousel | Images | 1 to 24 |
| Single graphic | Images | exactly 1 |
| Talking video | Video clips | 1 to 5 |
| B-roll | Video clips | exactly 1 |

- The file picker only offers the allowed file type.
- If a file is the wrong type or there are too many, it is rejected with a short red message, for example "B-roll takes 1 video clip".
- The send button stays disabled until the count is right. A pasted Drive/Dropbox link still counts as valid footage, because we can't count the files inside it.

## 3. Slimmer planner windows
Applies to the post card window, the review/produce window, and every other window opened from the planner:
- A thin header: smaller title row and status chip, with less space above and below.
- A thin footer: small buttons in one compact row.
- Minimal tabs: small text with a thin underline on the active tab, and no boxed buttons.
- A taller card (nearly full screen height), so the media to approve gets most of the space.

## Technical details
- New `src/lib/slate/attachLimits.ts` with `ATTACH_LIMITS` by normalized post type ({ accept, kind, min, max }) and `checkAttachments(type, files)`. Add a test that asserts the four rules above.
- `AttachBox` gets optional `accept`/`max` props and an `error` line. Used in `AddToPlannerDialog` (it will receive `postType` instead of `isVideo`, and `onSubmit` will carry `files`). The upload goes through the existing `dwy-content-upload` path after the post is created.
- Gate `canSubmit` in `ProduceReviewModal`, the `ApproveAndPostMode` attach boxes (~1777/1813), and the `EditYourselfMode` box (~1454) with `checkAttachments`.
- Modal shells in `ApproveAndPostMode` (1567, 1947, 2309) and `ProduceReviewModal`: switch to `h-[96vh]` and compact header/footer padding (`py-2`), and replace the tab buttons with a shared underline tab style.
