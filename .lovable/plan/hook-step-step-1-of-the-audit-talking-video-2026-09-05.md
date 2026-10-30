# Hook step, step 1 of the audit (talking video)

Scoped to the hook stage and its handoff into the script. Captions, exports and Airtable stay untouched in this step.

## 1. Two hooks per topic, two different angles, chosen by the AI

The AI keeps choosing the angles, but the choice is constrained to three internal types only:

- A Callout
- Numbered List or Tips
- A Reframe

Rules sent with the request:

- Exactly 2 hooks per topic, and the two must use two different types from that list.
- The topic stays identical across both options; only the angle and the way the value is delivered change.
- The type names are internal. No catalogue, no labels, nothing angle-related in the UI.
- Each option carries its own promise, and the promise has to be deliverable. If the opening line is "5 tips to get you fit", the script that follows must actually give five tips.
- The existing anti-slop and voice rules, admin hook guidelines, output structure and QA checklist stay in the call unchanged.

## 2. Only the spoken opening line is written at this stage

The hook call stops producing a visual hook. It writes the opening line (the first thing said on camera), nothing else.

The visual hook becomes a derivative: after you tick a hook, it is generated as part of the script call as a shorter, punchier, more visual version of that exact approved opening line. It can no longer wander off into a different idea, and the line you approved stays the single source of truth.

## 3. One pick per topic

Ticking a hook selects it for that topic. Ticking the other option for the same topic replaces the first pick rather than eating a slot from another topic. Approve stays disabled until every topic has exactly one pick.

## 4. The script has to deliver the hook's promise

The script call keeps following your admin "Talking Script · Fleshed" or "Talking Script · Framework" guidelines as it does now, with two additions:

- The approved opening line opens the script word for word.
- The body must pay off the specific promise that line made, in the shape it promised (a numbered promise gets numbered payoff, a callout gets the callout resolved, a reframe gets the reframe explained).

## Technical notes

- `src/lib/slate/envelope.ts`: `hookTalking` deliverable text updated for opening-line-only output, the three internal angle types, the two-distinct-types-per-topic rule and the deliverable-promise rule. No code-side angle picker (the B-roll picker stays as it is).
- `src/routes/api/hooks.ts`: task text carries the new rules; `perTopic` stays 2; JSON retry, topic re-stamping, sorting and token budget unchanged. Hooks return the spoken line; `visual` is no longer requested.
- `src/routes/api/script.ts`: derives the visual hook from the approved opening line inside the script call, keeps `spokenHook` as the approved line, and adds the promise-payoff instruction. Admin length/format rules stay authoritative.
- `src/components/slate/ScriptMode.tsx`: `toggleHookApproved` enforces one pick per topic group; approve gate requires one pick per topic; hook list keeps showing the opening line only.
- Admin panel output-structure prompt for the talking hook may need its "visual hook" section removed so the model isn't asked for a field we no longer use; I'll check the saved prompt and flag it rather than silently rewrite your copy.

## Verification

Live 3-topic talking-video batch: confirm 6 options, two per topic with clearly different angle types and no labels; ticking the second option in a topic swaps the pick; the generated script opens with the approved line, pays off its promise, and the visual hook reads as a short version of that same line.
