# Long form page fix + cleaner content card

## 1. Long form full screen (fix)
- The status tag and date sit right under the title, and the Footage / Transcript buttons and table follow directly beneath. Nothing floats in the middle of the screen anymore.
- Cause: the full-screen window spreads its sections out to fill the whole screen height, which creates the big empty band. The window will stack its sections from the top instead.
- Verified in the preview at your screen size before reporting back.

## 2. Content card audit — where it appears
There is one content card window, and it opens from four places:
- **Planner** (the main board, every tab).
- **Planner links** from the scripting chat ("View post in Planner"). They open the same window directly.
- **Long form Clipper → long form page.** It's the same window plus the clip's Timestamps and Creative direction.
- **Home → "See all posts"** opens its own preview/repurpose windows, not this card, so it isn't affected.

The Production window ("Produce now / Send to production") is a separate window and stays as it is.

Since all three real uses share one window, redesigning it once updates the planner, chat links and clipper together.

## 3. New content card (following your attachment)
**Header (one thin bar)**
- Row 1: post name, a compact **Script · Media · Comments** switch (pill style, with counts) and close.
- Row 2: small inline controls in this order: status chip with dropdown, then a divider, then format, posting date, platforms (checkbox menu) and an "Inspo" link when there is one.
- The separate Post type / Posting date / Platform boxes are removed from the Script tab, because they now live in the header.

**Script tab: left rail + one editor**
- The left rail lists the parts of the post. Clicking one shows only that part on the right:
  - Carousel: COVER, 01, 02… plus "Add slide". Each slide has a headline and supporting copy, a delete option, and previous/next arrows.
  - Graphic: one SLIDE entry (headline + body).
  - B-roll: TEXT, with the on-screen overlay and a word count.
  - Talking video: HOOK (visual hook) and SCRIPT (spoken script with a word count and "Open teleprompter").
- At the bottom of the rail: **Caption & hashtags**. It opens one editor with platform tabs (Instagram, TikTok, Facebook…), a dot on tabs that are filled, and a character count.
- Clipper pieces show Timestamps and Creative direction as extra rail items.

**Media tab: large preview first**
- "Media to post" fills most of the card at the right shape: carousels and graphics 4:5, reels and B-roll 9:16.
- Carousel: big slide with previous/next arrows and a numbered thumbnail strip underneath.
- Video: player with play/open.
- Below the preview is a compact Raw footage box (drop files, or paste a Drive link and click Add) with the attached files listed (open / remove). It keeps the existing type and count limits.

**Comments tab**
- Thread with initials avatars, with "Leave a note for the editor" and Send pinned at the bottom.

**Footer (one thin bar)**
- "All changes saved" status on the left, then the three-dots menu.
- In To approve: **Re-do** and **Approve**.
- In other stages: the existing main actions for that stage, e.g. Assign to Risevoice / DIY edit. They come from the same action list the planner uses today, so no options are lost.

## What stays the same
- Saving, statuses, approvals, AI design progress, production hand-off, attachment limits and the clipper's delete all keep working as they do now. Only the layout changes.

## Technical details
- Fix 1: `LongFormClipperMode` full-screen `DialogContent` (shadcn grid stretches rows over 100dvh) gets `flex flex-col content-start` / `grid-rows-[auto]` so children stack from the top. Then remove the `-mt-1`/`pl-[52px]` workaround if it's no longer needed.
- Extract the inline modal in `ApproveAndPostMode.tsx` (lines ~1561–1930) into `src/components/slate/post/ContentCardModal.tsx` with subparts `CardHeader`, `ScriptRail` + `PartEditor`, `MediaStage`, `CommentsThread` and `CardFooter`. State and save handlers stay in `ApproveAndPostMode` and are passed as props.
- The rail model comes from `scriptShape`/`splitScript`/`slideFields.ts` (carousel slides via `parseCarouselCopy`), so serialization is unchanged. `CarouselCopyEditor` logic is reused per slide.
- Captions: one textarea driven by `captionFieldsFor(draft.platforms)` with a platform pill switch.
- Media: reuse `SlideCarousel` for the stage, `AttachBox` for raw footage, and `attachLimits` for checks. Footer actions come from `plannerPrimaryActions`.
- Clipper `ClipMetaFields` become rail items.
- Add a small `contentCardRail.ts` helper (rail items per format) with tests. Update `AGENTS.md` (one rule) and `roadmap.md`.
