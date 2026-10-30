# Bank of Inspo tabs + Long form Clipper

## Batch 1 — Bank of Inspo: New / Repurposed tabs
- Add the standard pill tab container above the table: **New** | **Repurposed**, each with a count.
- New is the default. Records follow their Status; repurposing a post moves it to the Repurposed tab right away.
- Find Inspo and Add inspo stay above the tabs.

## Batch 2 — Airtable tables
**Long forms** (new table)
- Name, URL, Created date, Created by, Transcript, Status, Short forms (link), Produced content (link to Content).
- Status options: Transcribing, Ready, Generating, Done, Failed.

**Short forms** (new table)
- Post name, Status (New / In production), Format (BROLL, Talking Video, Carousel, Graphic), Created date, Created by, Long form (link), Timestamps, Post copy, Content (link).
- Post copy follows a fixed layout for each format:
  - BROLL: Text overlay
  - Talking Video: Visual hook + Script
  - Carousel / Graphic: Cover title, Cover subtitle, Slide 1–6 title text
- Nothing is copied to Content unless the user clicks "Add to board".

## Batch 3 — Long form Clipper gallery + Add new
- In Viral Kit, Long form Clipper becomes available and opens a gallery: one card per long form, showing name, status pill, URL and created date. You only see your own records.
- **Add new** button in the top right opens a gray modal:
  1. Footage URL (required)
  2. Dropdown: **Transcribe** | **Add transcript**. If Add transcript, show a file drop area for .md or .txt files.
  3. Dropdown: **Just add** | **Add & create short form**. If Add & create, show four number boxes: BROLL, Talking Video, Graphic and Carousel required (0–10 each, at least one above 0).
- Saving creates the Long form record. With Transcribe, a progress screen shows each step (transcribing, saved).

## Batch 4 — Short-form generation
- Uses the transcript and the brand brief to write exactly the requested number of each format.
- Each piece gets a name, timestamps (the source moment in the long form) and Post copy in the format layout above.
- Follows the same writing, CTA and slide rules as the scripting studio. Carousels are capped at 6 slides plus the cover.
- A visible progress screen shows each format as it finishes. Results save to the Short forms table, and the long form's status moves to Done.

## Batch 5 — Long form detail + short-form table
- Clicking a card opens a detail page with a back arrow, the long form name, and status/URL info.
- Below that is a table with one row per short form: Post name, Status, Format, Timestamps, Post copy preview. A pinned column on the right holds a red icon-only **Delete** button and an indigo **Add to board** button.
- Clicking a row opens the piece in a side panel, where you can edit and save the post copy.
- **Add to board** opens the same "Add to planner" pop-up as the scripting studio (Add to queue or Produce now, then Risevoice or Do it myself).
  - It creates a Content record linked to both the short form and the long form, filled with that format's required fields.
  - The short form's status becomes In production, and the Content record is added to the long form's Produced content.
  - Each short form can only be added once.

## Open assumption
- Point 8 got cut off ("since the long form…"). My assumption: Produce now for video pieces pre-fills the footage link with the long form URL, so no extra link is needed. Please confirm or correct this.

## Technical details
- New helpers: `longFormClipper.ts` (post-copy layout, count validation, status rules, with tests) and `longForm.server.ts` (Airtable reads and writes with ownership checks).
- Routes are protected by access code: `/api/long-forms` (CRUD), `/api/long-form-generate` (streamed progress), `/api/short-forms` (list, edit, delete, add to board).
- Transcription reuses the existing transcription and read pipeline. Uploaded .md/.txt files are read in the browser and size-limited.
- Add to board reuses `plannerPlacement` and `AddToPlannerDialog` with the existing Content record creation path.
- Updates to `viralKit.ts` availability, `AGENTS.md` and `roadmap.md`.
