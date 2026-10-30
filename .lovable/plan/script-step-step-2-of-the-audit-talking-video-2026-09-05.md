# Script step, step 2 of the audit (talking video)

Scoped to what happens after the user approves one hook per topic, up to the approve/rewrite decision. Captions, exports and production handoff stay as they are.

## 1. What the script call receives

For each topic, exactly one approved opening line (the spoken hook the user ticked) goes into `/api/script` together with the topic, the brief, the admin prompts, the script type (Fleshed or Framework), and the optional CTA. The approved line is the single source of truth — it is never regenerated, reworded or re-angled by the script call.

## 2. What the script call must produce

One talking-video script per topic that:

- Opens with the approved opening line, word for word, and never repeats it later.
- Pays off the exact promise that line made, in the shape it promised: a counted promise ("5 tips") gets that many clearly separated items; a callout gets resolved for the person called out; a reframe gets the new frame explained.
- Follows the admin "Talking Script · Fleshed" or "Talking Script · Framework" guidelines for length, structure and voice, plus the locked anti-slop rules already in the envelope.
- Derives the visual hook inside the same call: a shorter, punchier, more visual version of the approved opening line only — never a new idea or claim. It stays hidden in the UI and is kept for downloads/production.
- Does not write an on-screen CTA; the user's own CTA is rendered as the pending CTA field on the card.

## 3. Server-side guarantees (already partly in place, tightened)

- `src/routes/api/script.ts`: if the model's body doesn't actually open with the approved line, the line is prepended programmatically; any stray CTA tail the model adds is stripped. Keep these guards and make the opening-line check tolerant of minor punctuation differences only.
- Parse hardening: if section headers are missing, keep the whole body rather than shipping an empty card; if the visual hook section is missing, fall back to a trimmed version of the approved line instead of inventing a new hook.
- Errors surface as a bounded 502 with the model's message, never a raw 500.

## 4. User flow in the chat

- Per topic: writing indicator, then one script card (Hook field on top showing the approved line, script body, pending CTA field).
- The approve / change-something decision stays in the chat bubble below the card, never on the card.
- "Change something" with typed feedback rewrites that same script with the feedback passed as a reprompt; the approved hook stays locked through rewrites.
- Approving script N auto-approves and moves to script N+1; after the last one, the captions prompt appears as today.

## Technical notes

- Edits: `src/routes/api/script.ts` (task text tightening, visual-hook fallback, opening-line guard) and, only if needed, small label/flow touches in `src/components/slate/ScriptMode.tsx`. No changes to `hooks.ts`, captions, exports, or the admin prompt storage.
- Model stays `claude-fable-5-1`; token budget and JSON/section parsing unchanged except the visual-hook fallback.

## Verification

Live 3-topic talking-video batch: each script opens with its approved line verbatim, pays off the promise in the promised shape, the hidden visual hook is a short version of the same line, a typed change request rewrites the correct script with the hook intact, and the CTA field shows the user's CTA or pending.
