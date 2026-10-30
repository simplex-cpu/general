# Planner and design-flow correction

## Outcome
Make the Production workflow unambiguous, preserve structured carousel copy from writing through design, and add practical footage and teleprompter tools without repeating decisions.

## Changes

### 1. Production status and assignee clarity
- Replace the distracting moving progress bar with a compact, static activity indicator.
- Show **AI working** for DWY/automated production and a person-style **In production** indicator for work handled by Risevoice.
- Add an **Assignee** column derived from the existing request type: **Risevoice** for Risevoice requests and **You** for DWY work. No new Airtable field is required.
- Keep comments available on Production work.

### 2. Prepare Footage actions
- Replace **To Edit / To Design** with **Attach** for every post in Prepare Footage.
- Show **Teleprompt** only for Talking Video posts.
- Reuse the existing upload-or-link attachment window.
- Add a simple full-screen teleprompter using the saved script, with adjustable text size, scroll speed, play/pause, restart, and close controls.

### 3. One carousel-copy model from writing to design
- Make the shared labeled slide model the only source for carousel and graphic copy across scripting cards, production handoff, reopening, editing, rendering, and persistence.
- Show structured fields directly inside writing cards:
  - Cover: Title and Label only; never Body.
  - Content slide: Title, Subtitle, Body.
  - CTA slide: Closing statement, Invitation, CTA button.
- Keep edits synchronized immediately so one click or later handoff cannot restore stale copy.
- Persist the same normalized fields used by the preview instead of maintaining a separate flattened copy.

### 4. Remove leaked “Content” labels
- Harden legacy slide parsing so role markers such as `Slide 2 · content`, including punctuation and same-line variants, are stripped before becoming editable copy.
- Use the same sanitizer for writing cards, saved records, and artwork.
- Add regression tests proving structural labels never appear in titles or exported images.

### 5. Button visibility
- Give every white secondary action a clear neutral outline in the design and production windows, including Back, Cancel, and secondary routing actions.
- Preserve the existing indigo primary actions and green approval action.

## Technical details
- Update the planner table and drawer together so actions and labels remain consistent.
- Keep Assignee derived from request ownership rather than introducing another Airtable source of truth.
- Refactor the Divide Scripts handoff to use the shared slide-field parser and serializer; remove the stale parallel slide-copy path.
- Keep the teleprompter client-side and read-only so it cannot accidentally modify the saved script.
- Add focused tests for assignment display, Prepare Footage action availability, cover-field constraints, synchronized slide edits, and role-label stripping.

## Verification
- Run the focused rule tests and full test suite.
- Confirm the preview builds without errors.
- Click through Prepare Footage, Production, design editing, and a Talking Video teleprompter on desktop and mobile-sized views.
