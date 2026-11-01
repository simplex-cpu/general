# Refine Scriptwriter output and session continuity

## What will change

### 1. Clean numbering and aligned card actions
- Remove remaining leading-zero formatting from Scriptwriter output/export labels so script 3 is always shown as `3`, never `03`.
- Make variation cards use equal-height content areas with their action rows anchored to the same bottom position.
- Keep the two-column desktop layout and the existing stacked mobile layout.

### 2. Better captions and smoother CTAs
- Strengthen the shared caption rules so each platform caption has a clear opening hook, developed body, paragraph breaks between ideas, and a natural closing CTA.
- Increase useful caption depth, especially for Instagram and Facebook, while retaining the shorter platform-appropriate TikTok and YouTube versions.
- Treat the chosen CTA as an intent, action, keyword, and reward that must be preserved, while allowing the writer to add a short contextual bridge so it follows naturally from the script and caption.
- Stop displaying the raw CTA choice as a detached copy-paste line on video cards when a naturally written CTA is available.
- Keep safeguards against invented offers, changed keywords, or changed rewards.

### 3. Correct the final planner action
- For every script except the last, keep `Add this to Planner & Write Next`.
- For the final script, use `Add this to Planner` and then show the existing completed-session actions after it is added.

### 4. Continue active work from History
- Keep an in-flight generation running when the user navigates between sections inside the app; navigation will not cancel its request.
- Make the active `In progress` History entry show the live conversation and generation state, including newly completed cards and the current next action.
- Replace `Re-purpose` with `Continue session` for incomplete sessions. Only completed sessions with saved scripts can be re-purposed.
- Continue saving the transcript as it changes so History remains the source of truth for the session.

### 5. Reveal variation pairs atomically
- Generate both variations concurrently but hold both results outside the visible transcript until the pair has finished.
- Insert Variation 1 and Variation 2 together, in that order, in one update.
- If either variation fails, keep the pair hidden and offer one retry rather than exposing a half-finished choice.
- Preserve the existing in-place animation for regenerating one already-visible variation.

## Technical details
- Add focused helpers for final-script action copy, active-session History actions, CTA intent preservation, and atomic variation pairing.
- Update the card layout rather than imposing a fixed card height, so longer scripts and captions remain readable.
- Add regression tests for unpadded numbering, final-script copy, CTA keyword/reward preservation with natural transitions, incomplete-session action gating, and all-or-nothing ordered variation insertion.
- Verify the flow in the preview across: generation while viewing History, pair reveal timing, equal card-action alignment, caption formatting, final planner action, and completed-session re-purpose.
