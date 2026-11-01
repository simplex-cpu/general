# Finalize the scripting call

## 1. Scripts speak to the brand's audience, not about them
Example problem: Risevoice speaks to founders, but a script said "Your founder answered…".
- Add a fixed "who you're talking to" rule to every script, hook and topic request: address the brand's target audience directly as "you"; never refer to the audience in the third person ("your founder", "your clients' founders").
- Pass the brand's target audience as its own labelled line, not buried in the brief.
- Add a final self-check line in the request: "Who is 'you' in this script? It must be the target audience."

## 2. Topics are subjects, not instructions
Example problem: "Turn one sales-call answer into next week's content" is a task, not a topic.
- Rewrite the topic research rules: a topic is a matter worth discussing that delivers value (a problem, belief, mistake, insight or question the audience has). It must never be a command, an exercise, or something that depends on the speaker telling a personal story.
- Delivery (story, list, reframe, etc.) is chosen later by the hook and script steps.
- Add a server check that rejects topics starting with an instruction verb (Turn, Share, Tell, Record, Write, Post…) and asks once for a replacement.

## 3. Topic description reaches the script
- Today the script request only receives the topic title. Send the topic's description (rationale) alongside it in every format (Talking Video, B-roll, Carousel, Graphic), including single scripts and Repurpose.

## 4. Fill-in placeholders only when strictly needed
- Change placeholder style from `[SPECIFIC METRIC]` to curly braces with a clear instruction, e.g. `{Add the date you did this}`.
- Rule: only use a placeholder when the script truly cannot work without a personal fact the brief doesn't contain. If the sentence works without it, rewrite the sentence instead (e.g. "Every founder answers the same pricing objection on sales calls. Almost none of those answers become a post.").
- Maximum two placeholders per script; zero is preferred. Applies to Fleshed scripts too, not only Framework scripts.

## 5. Remove the circles next to the number answer
- When the user types how many scripts they want, the chat shows circles to the left. Find the exact source (reply bubble rendering a list marker or the suggestion chips' radio dots) with a screenshot first, remove it, and confirm with a second screenshot.

## 6. Message order after picking a CTA
- After choosing the CTA type, the "Writing script" message appeared above the user's reply. Fix the order so the user's choice is always added first, then the writing message below it. Apply the same order fix to every pill choice that starts writing.

## 7. Delete conversations
- Add a delete button (with confirmation) to each History conversation. Deleting removes the saved session; if it's the open one, the writer returns to the Single / Batch start.

## 8. "Add to Planner & Write Next" after leaving and coming back
- When a script was approved for captions and the user leaves, reopening the conversation leaves the button disabled. Restore the conversation's step and the approved script on reopen so the button works, and continue to "write next" from there.
- Add a test covering reopen of a captions-approved session.

## 9. Production flow
- Your message ended at "Now regarding the production flow". Please send the rest and I'll add it to this plan.

## Technical details
- Prompts: `src/lib/simplex/prompts.ts`, `src/lib/slate/envelope.ts`, `src/routes/api/topics.ts`, `src/routes/api/hooks.ts`, `src/routes/api/script.ts` (add `topic.rationale` to the task text).
- Topic guard: shared validator in `src/lib/slate/` with tests.
- UI: `src/components/slate/ScriptMode.tsx` (count phase rendering, pill reply ordering, session restore phase/selection), `src/components/slate/ScriptRail.tsx` (delete), `src/routes/api/writer-sessions.ts` (DELETE with ownership check via `writerSessions.server.ts`).
- Verify with tests and a signed-in click-through of a batch: count, CTA pick, captions, leave and return, delete.
