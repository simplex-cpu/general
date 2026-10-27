# Long form and production window fixes

## 1. Changing category to "Talking from long form" doesn't stick
- The category list already offers the four "from long form" options and the save sends them to Airtable, so the exact failure isn't confirmed yet.
- First step: try the change on a real card and read Airtable's reply (likely candidates: the option name in Airtable differs slightly, e.g. emoji or spacing, or the card's other fields get rewritten for the old format and the save is rejected).
- Fix the cause, then show a clear error on the card if a save is ever refused, so it no longer fails silently.

## 2. Timestamps and Creative direction only for Talking video from long form
- Today they show on any card linked to a long form or tagged with any "from long form" category.
- Change: show them only when the category is "📹 Talking from long form" (or the card is a Talking video linked to a long form). B-roll, carousel and graphic cards stop showing them, both in the planner and in the long form screen.

## 3. Add long form: only B-roll and Talking video counts
- In the "Add & create short forms" counts, and the manual format picker, list only B-roll and Talking video. Carousel and Graphic are hidden for now (old pieces still open normally).

## 4. Second window ("How do you want to design it?") matches the first
- Same width, height, white surface, header with close button and centered title as "Choose who will produce this post".
- Two standard buttons side by side: **AI design** first in solid indigo, **Template design** second in the white/indigo outline style.
- Remove the small explainer text inside each button.
- Use the app's standard button component for both windows so they look identical everywhere this window opens (planner, long form screen, scripting).

## 5. Three-dots menu on the card window
- Restyle the overflow menu to match the card's new look: smaller text, the same soft gray/ink colors and spacing as the status and format menus.

## Technical details
- `dwy-client-content.ts` PATCH: reproduce with a live call; compare `Post Type` options from the Airtable schema to `POST_TYPE_CHOICES`; check `contentScriptFields` clearing on format change. Surface `!res.ok` body in the card toast.
- `ApproveAndPostMode.tsx`: `isClip` becomes talking-only (`baseStyle(postType) === "Talking Video"` and long-form tagged/linked); same rule in `LongFormClipperMode.tsx` scope.
- `LongFormClipperMode.tsx`: a `CLIP_FORMATS = ["BROLL", "Talking Video"]` list for the counts (line ~160) and manual select (~768); server count schema unchanged.
- Design picker (`ApproveAndPostMode.tsx` ~2418) rebuilt with the `ProduceReviewModal` choice-screen shell and `Button` variants.
- Overflow menu (~916, ~2315) uses the shared dropdown styling of the status picker.
- Add a test for the timestamps visibility rule; update `AGENTS.md` if the rule wording changes.
