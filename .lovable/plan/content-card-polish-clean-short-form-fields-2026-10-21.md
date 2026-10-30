# Content card polish + clean short-form fields

## 1. Header (shared content card)
- Make the header a little taller (about 8px more total) and match the mockup's padding: ~48px on the left and right, title on row 1, the status/format/date/platforms/Inspo row below it with the mockup's spacing, and a thin divider under it.
- Platforms show **icons only** (no "Instagram, TikTok" text) and the icons are 0.5px smaller. Platform names stay as hover tooltips and screen-reader labels.

## 2. Script tab left rail
- Rail rows show only the section name (Cover, Slide 1, Visual hook, Script, Caption…). The text previews and word counts go away.

## 3. Media tab, matching the screenshots
- Two columns: **Media to post** on the left (about two thirds) and **Raw footage / Source files** on the right (about one third). Each has a small uppercase label, with a right-aligned detail: file name and ratio for videos, "7 slides · 4:5" for carousels, "1 file" for the files column.
- Left column: a large light-gray rounded stage with the media centered:
  - Video: a 9:16 dark frame with a soft shadow, a round play button in the center, length in the bottom-left corner, and an open-in-new-tab icon in the top-right. B-roll also gets a small "B-ROLL" tag and its text overlay drawn on the frame.
  - Carousel/Graphic: a 4:5 white card showing "01 / 07", round previous/next arrows on each side, and a row of numbered thumbnails below with the current one outlined in indigo.
  - No media yet: the same stage with an empty placeholder.
- Right column: a dashed "Drop files or **browse**" area, a "Paste a Drive link" field with an outlined Add button, then file rows (icon, name, domain, open and delete icons).
- The footer stays as it is now: "All changes saved" plus the action buttons for each stage.

## 4. Timestamps and Creative Direction always visible for long-form clips
- Any content card linked to a long form (opened from the Planner, from a chat link, or from the Long Form Clipper) gets visible **Timestamps** and **Creative direction** sections in the Script rail. Both are editable and save to their own fields on the planner record and the short form.
- Cards that don't come from a long form don't show these sections.

## 5. Short-form generation writes separate fields
- Today the AI Studio results add a "Source notes" block (segments, timestamps, visual plan) to the end of the Script copy. The Creative Direction field stays empty because it only understands an older format.
- Change: the Script field holds only the script parts (visual hook + script for Talking clips, text overlay for B-roll, plus the CTA). Timestamps and Creative Direction go into their own fields.
- **Timestamps format:** one range per line, padded `HH:MM:SS-HH:MM:SS`, one line per segment in order, for example:
  ```text
  00:05:33-00:05:35
  00:07:10-00:07:42
  ```
- **Creative direction:** readable notes only: visual plan/direction, spoken hook, speakers, review flags and the "use exact range" note. No timestamps, no raw data.
- The duplicate check that prevents saving the same results twice will use a hidden marker instead of reading the Script text.
- Existing clips: when a card opens and its Script still has a "Source notes" block, the app moves that block's timestamps and direction into the right fields once and removes it from the Script.
- Production handoff (Edit Yourself / Clipping) keeps reading from these fields, so it gets the clean multi-line timestamps.

## Technical details
- `ApproveAndPostMode.tsx`: header spacing/height, icon-only platforms (size -0.5px), rail rows without previews, new `MediaStage` (video/B-roll/carousel variants + numbered thumbnails) and restyled files column; clip fields shown whenever the record has a Long Form link (read Timestamps/Creative Direction from the Client Content record, not only from the clipper scope).
- `contentCardRail.ts`: remove preview/word-count from rail items; update its tests.
- `podcastJobs.server.ts` `piecesFromResult`: build `timestamps` from each segment (`formatRange` → `HH:MM:SS-HH:MM:SS`, newline-joined; B-roll uses one source range), build `creativeDirection` as plain text, and stop passing `sourceNotes` into Post copy. Dedupe uses an idempotency key/marker kept outside Script.
- `longFormClipper.ts`: drop the sourceNotes append in `formatPostCopy`; add `normalizeTimestamps` (accepts `m:ss`, `h:mm:ss`, en dash) used by the manual form, the inline editor and the API; add a one-time legacy splitter for old "Source notes" copy.
- `short-forms.ts` / `send-to-production.ts`: raise the Timestamps limit beyond 200 chars to fit multiple lines; normalize on save.
- Tests: timestamp format (one range per line, padded), Script contains no timestamps or direction after generation, legacy split.
