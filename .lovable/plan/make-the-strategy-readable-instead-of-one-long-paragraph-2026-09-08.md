# Make the strategy readable instead of one long paragraph

## What you will see

The strategy no longer arrives as a single dense block. It is broken into clear labelled parts with breathing room between them:

- **Topics to double down on** — short lines, one topic per line
- **Hooks to test** — one hook idea per line
- **Words and phrases to use** — quoted phrases as separate items
- **Don'ts** — one rule per line, in the red "avoid" styling

This applies both to newly generated strategies and to the one already saved, on the Script tab card, in the full strategy panel, and in the review window on the Analyze tab. Slashes and dash ranges inside a phrase (for example "7.5-9.8%") stay untouched; only the section labels create new lines.

## How it will be done

1. **Generate it structured.** Update the strategist instructions in `src/routes/api/brand-strategy.ts` so the saved strategy text uses explicit labelled lines and dash bullets, one item per line, instead of one running paragraph. Keep the existing 4-part content requirements, the 24-post split rules and the tool call unchanged.

2. **Repair old text on display.** Add a normalizer used by `parseStrategy` in `src/components/slate/StrategyStrip.tsx`: when the strategy has no line breaks, split it on the known inline labels (`DO topics:`, `Topics to double down on:`, `Hooks to test:`, `Use phrases:` / `Words and phrases:`, `DON'Ts:` / `Don't:`), turn each label into a section heading, and split the remainder of each section into items on sentence ends and on `; `. Quoted phrase lists become one item per quoted phrase. Never split on `/` or on numbers, so ranges and compound words survive.

3. **Reuse the same rendering.** The existing `SectionCard`, do/don't tone colours and bullet markers already handle sections; once the text is split correctly they render with proper spacing. Small spacing bump between sections in the full panel so it reads as a list rather than a wall.

4. **Same treatment on review.** The Analyze tab review window shows the regenerated strategy in an editable textarea; it will show the newly structured multi-line text, so it is already readable there and stays editable.

## Technical notes

- New helper `normalizeStrategyText(raw)` in `StrategyStrip.tsx`, applied inside `parseStrategy` before splitting on `\n`, so every consumer (summary card, full panel, breakdown) benefits with no extra wiring.
- Label detection is case-insensitive and tolerant of `DON'T`, `DONTS`, `Don'ts`.
- No Airtable schema change; nothing is rewritten in storage. Editing and autosave keep whatever text the user leaves in the box.

## Verification

- `bunx tsgo --noEmit`.
- Paste the current one-paragraph strategy and confirm it renders as four labelled sections with items on their own lines, do items green and don't items red.
- Regenerate a strategy from an audit and confirm the new output is already multi-line, and that the format targets still sum to 24.
