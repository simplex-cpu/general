# Premium design freedom + Long form Clipper cleanup

## Batch 1 — AI design call: more creative, still on brand
- The design call gets the brand colours, fonts and gradient as a toolkit. It no longer has to follow a fixed layout per slide.
- It picks a treatment for each slide based on the copy: **Cover, Quote, Visual explainer, Statement, Big number, List (only for real lists), Photo feature, Closing**.
- Brand guardrails stay in place: only brand colours, only brand fonts, one highlight per slide (accent *or* gradient), safe margins, at least 40% empty space.
- Drawings: at most one hand-drawn touch per slide (underline, circle or arrow). No illustrations or busy decoration.
- Small editorial labels are allowed (for example "01 / 06", a short section label, or the brand name) if they are tiny, muted and limited to 2 per slide. The main copy itself must still match the post word for word.
- Background: the design can choose between the brand's light, dark and brand backgrounds, or the gradient, for each slide. Saved cover, slides and closing colours become defaults, not forced values.
- The separate review pass is removed. Each slide is drawn once and checked automatically. If the check fails, it is redrawn once, and the template design is the last fallback.

## Batch 2 — Long form window layout
- Less space under the header and the Footage / Transcript buttons, so the short-form table starts right at the top.
- The "Clipped" tag and date always sit right under the title, with a small gap.
- Timestamps are removed from under each piece's name.

## Batch 3 — One table style for the clipper and planner
- The long form short-form table and the planner table both get the main Long form Clipper table's look: white background, thin outline, the same header style, row height and dividers.
- Grouping stays as it is on each table.
- The last column, Action, stays pinned on the right while you scroll sideways.

## Batch 4 — Creative direction and Timestamps as their own fields
- Each short form and its planner record get two new fields of their own: **Creative direction** and **Timestamps**. Neither is part of the script anymore.
- AI Studio and Manual creation fill both fields. Existing pieces are moved over once: timestamps and direction notes are taken out of the script and placed in the new fields.
- Both fields appear in the piece window and can be edited there.

## Batch 5 — Editing handoff (after Batches 1–4)
- When a clip is sent to editing, the Edit Yourself record gets the **Clipping** edit style, plus Visual hook, Timestamps, Creative direction and the long form's footage link.
- It reuses the existing single request, linked to its Content record, so each clip is sent only once.

## Needs from you
- Creating the two new Airtable fields (Short forms + Content, and Clipping/Timestamps/Creative direction on Edit Yourself) needs a connection with permission to change the base's structure. If that isn't available, I'll give you the exact field names to add yourself.

## Technical details
- `ai-design.ts`: rewrite SYSTEM/PLAN_SYSTEM around archetypes plus a toolkit, drop the `review` mode, and allow a per-slide `background` choice from the brand set. `aiDesignJobs.ts` paints the chosen background through `withBrandBackground`.
- `aiDesign.ts`: allow at most 2 small muted micro-copy words (font-size ≤ 22) outside the copy, keep the palette, safe-area and one-highlight checks, and add a check that allows at most one stroke-only path. Update tests.
- `LongFormClipperMode.tsx`: spacing, tag placement and removing the timestamps under the name. Shared table classes go in a small table-style helper used by the clipper detail table and `ApproveAndPostMode` rows (Action column uses `sticky right-0`).
- `longFormClipper.ts` / `slideFields`: strip timestamp and direction lines from post copy and use new `timestamps` / `creativeDirection` fields. `longForm.server.ts` handles reads, writes and the one-time move. `PlannerCardModal` `extraFields` shows both fields.
- Batch 5: `send-to-production.ts` / `dwy-edit-yourself.ts` add "Clipping" to the allowed styles and map the new fields. Update `AGENTS.md` and `roadmap.md`.
