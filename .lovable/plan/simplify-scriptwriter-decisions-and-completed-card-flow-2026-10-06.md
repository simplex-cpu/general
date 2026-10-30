# Simplify Scriptwriter decisions and completed-card flow

## Goal
Make the Scriptwriter feel sequential and self-contained: hide free typing until it is genuinely useful, keep decisions inside the relevant card, present variation pairs reliably, and make completed scripts the clear next-action surface.

## Plan

### 1. Show the composer only for explicit free-text moments
- Remove the always-present composer from the guided flow.
- Show it only when the user chooses **I have topics**, or when a generated script is available and the current step explicitly invites written feedback.
- Keep attachments available only in the brief step where they are needed.
- Replace the free-text CTA prompt with a decision card containing a dropdown:
  - Follow
  - Comment
  - Share
  - Save
  - Comment lead magnet keyword
- When the lead-magnet option is selected, reveal a keyword field inside that same decision card. Store the resulting CTA consistently for script and caption generation without opening the composer.

### 2. Make variation pairs one ordered decision surface
- Collect both generated variations before adding them to the transcript, then insert **Variation 1** followed by **Variation 2** deterministically.
- Group by the variation group itself rather than relying on message adjacency, so both cards always render together in one two-column row on the normal Scriptwriter viewport.
- Keep the cards readable on narrow screens by stacking only when two columns cannot fit.
- Replace the misleading **Draft** label with **Select** and a visible unclicked check control in the top-right corner.
- Put the same actions at the bottom-right of each variation card:
  - **Regenerate** — regenerates only that card, per the selected behavior.
  - **Approve & Write Captions** — selects that card and continues immediately.
  - **More** menu — Download.
- Remove the separate “What next?” decision bubble and any duplicate controls outside the cards.

### 3. Resend the approved result as a completed card
- After captions finish, append a new completed card after the latest reply instead of mutating only the earlier variation card.
- Keep the selected variation card above as part of the conversation record, but make the new completed card the active next step.
- Embed these actions at the completed card’s bottom-right:
  - **Regenerate captions**
  - **Add & Write Next** (or **Add to Planner** for the final script)
  - **More** menu — Download.
- Remove the separate planner/download prompt bubble for this step.
- Ensure caption regeneration updates the completed card without duplicating the approved script or planner record.

### 4. Restore reliable autoscrolling
- Trigger scrolling from stable transcript changes, not only the rendered child count.
- Scroll after paired variations, completed cards, caption updates, and expanded card content have finished laying out.
- Target the Scriptwriter’s own scrolling panel and preserve reduced-motion behavior.
- Avoid forcing the user downward when they have deliberately scrolled up to read older messages.

### 5. Refine the fixed session header
- Keep the header fixed inside the Scriptwriter scrolling area.
- Change progress feedback to traffic-light colors: red early, amber in progress, green near/completed, while retaining the numeric step count.
- Force **Start new session** to use white text on its indigo background in every state.

### 6. Improve History names without adding a new Airtable field
- Use Airtable’s built-in creation timestamp and the saved Format field for the title: **Format - Date**.
- Derive the description from the saved format and first selected topic title: **Format - Topic brief**.
- Read the existing Topics JSON in the History list so the description is available there; use a short “Choosing topics” fallback before topics have been selected.
- Show the same derived title and description in the opened saved session.
- Keep the existing Name field as a compatibility fallback for older records; no Airtable schema change is required.

### 7. Fix planner modal contrast
- Give the modal heading a solid indigo treatment with a white **Add to planner** title.
- Make choice buttons white: selected choices use blue text and a clear blue border/check state; unselected choices use black text.
- Apply the same readable convention to Produce now, Production queue, Risevoice team, and Do it myself.
- Preserve current footage-link validation and submission rules.

## Technical details
- Extend the script-card API with explicit variation and completed-state actions rather than rendering detached quick-reply pills.
- Add a dedicated structured CTA decision value and formatter so generation, saved transcripts, PDF/download output, and planner payloads receive the same CTA text.
- Make ordered pair insertion atomic after both parallel generation requests settle.
- Add an explicit completed-script transcript message/state so saved History replays the same final card and controls remain disabled in read-only sessions.
- Add focused tests for CTA option formatting, one-card regeneration, deterministic variation order, completed-card creation, progress color thresholds, and session display-name derivation.

## Verification
- Run the existing Scriptwriter tests plus the new rule tests, full typecheck, lint, and build checks.
- Exercise a batch in the live preview through CTA selection, two variations, one-card regeneration, approval, caption regeneration, planner modal, and next script.
- Confirm autoscroll, fixed header, traffic-light progress, two-column ordering, menu downloads, modal contrast, and read-only History replay at desktop and narrow widths.
