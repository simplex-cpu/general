# Long form Clipper: planner-style short forms

## Long form window
- Status and created date sit directly under the title with only a small gap.
- "Create short forms" first asks: **AI generated** or **Manual**.
  - AI generated: the current flow (counts per format, CTA, progress).
  - Manual: pick a format, then fill a template with that format's fields (BROLL: text overlay; Talking Video: visual hook + script + CTA; Carousel: cover title/subtitle + slides 1–6; Graphic: cover title/subtitle), plus name and timestamps. Saving creates the piece the same way AI pieces are created.

## Short forms go straight to the planner
- Every new short form (AI or manual) is immediately created as a Content record in the planner, linked to the short form and the long form. No more "Add to board".
- Existing pieces not yet on the board are added once, automatically, the next time the long form opens (each piece only once).
- Tabs: **Review**, **Production** (renamed from "To Edit | Designed"), **Ready to Post**, **Posted**, still following the planner status.
- The table shows the same columns as the planner (post name, format, status, assignee, date and so on), plus Timestamps. Delete stays at the end of each row.

## Clicking a piece
- Opens the same window as a planner card: **Script / Media / Comments** tabs, same sections and actions.
- One extra field: **Timestamps** (the moment in the long form).
- In Review, the main action is **Send to production**, using the existing planner production window (Risevoice or Do it myself; footage defaults to the long form's stored footage).

## Technical details
- Extract the planner card detail modal from `ApproveAndPostMode.tsx` into a shared `PlannerCardModal` with an optional `extraFields` slot; the planner and clipper both use it (no behavior change in the planner).
- `api/long-forms` generation and a new manual-create path call the existing Content creation (stable key `shortform:<id>`) right after saving each Short form; idempotent backfill for unlinked pieces on detail load.
- Review "Send to production" reuses `ProduceReviewModal` and `send-to-production`.
- Clipper table reuses the planner column definitions; `shortFormStage` label "edit" becomes "Production"; update tests.
- Remove `AddToPlannerDialog` use from the clipper; update `AGENTS.md` clipper rule and `roadmap.md`.
