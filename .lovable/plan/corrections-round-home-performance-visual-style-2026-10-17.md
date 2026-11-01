# Corrections round: Home performance + Visual Style

## Home — Performance card
- Remove the **Top posts** list.
- Remove the "X / Y posts measured · Collected …" line (and its info button row) from under the totals. Show that same text small and soft in the **bottom-right corner** of the card, under the topic/format row. The info details stay attached to it.
- Under the totals, one row with two side-by-side items:
  - **Your top performing topic** (as today: small label, big topic, avg views below).
  - **Your top performing format** — Broll, Talking Video, Carousel or Graphic, ranked by highest average views, same style. If no measured posts, a short "Not enough data yet."
- On phones the two stack.

## My Brand — Visual Style
- Remove the phone preview. The settings take the full width as a clean, centered form (no narrow side rail).
- **Background style** cards become large (about 16:9), each showing sample text in its ideal colour on top: Dark with the footage colour (white), Light with the light-background colour (black), Gradient (accent 1 → accent 2) with white.
- Fix the font dropdowns so they never stretch/distort: fixed height, single-line truncated text, consistent width; the font name shows in its own font without changing the box size.

## Keep editing/design calls working
- Every save forces **Hook backing = none** ("transparent") and **Transcription colour = Text colour over footage** (white by default). Hook text colour = the same footage colour.
- Existing brands are normalized to these values the next time they save; reading old values stays tolerant.

## New carousel / graphic background rule
- **Cover and closing slide**: Gradient (accent 1 → accent 2) when Gradient is chosen, otherwise Dark, with white text.
- **Middle slides**: always Light, with the light-background text colour.
- Single still graphics use the cover treatment.
- The Background style question becomes "Cover & closing style": **Dark** or **Gradient** (the Light card is shown as the fixed middle-slide style, not a choice).
- **Text is centered by default** on every slide. In the actual graphic/carousel design preview, the user gets left / center / right and top / middle / bottom position buttons for the slide being edited; that choice is saved with the design, not the brand.

## QA round
- Unit tests: format ranking (ties, unknown types ignored, empty), mapper always writes transparent backing and transcription = footage ink, each background style.
- Re-run existing suites for video production, design frames, production requests, brand style and post metrics.
- Browser check of Home and Visual Style at 1092px and phone width; confirm saved fields feed the Edit Yourself / design preview frames (fonts, colours, backgrounds) as before. Report anything that needs a signed-in session separately.

## Technical details
- `postMetrics.ts`: add `topFormats()` (normalize Post Type to Broll / Talking Video / Carousel / Graphic) and return it from `analyzePostMetrics`; drop `top` usage in `HomeMode.tsx`.
- `VisualStylePanel.tsx`: remove `StylePhonePreview`, single-column layout `max-w-2xl`, larger background radio cards; `FontSelect` gets `h-10 truncate` with fixed line-height.
- `simpleStyleToFields` already writes transparent backings and footage ink to Secondary; add tests locking this and check `videoProduction.ts` / `EditYourselfMode.tsx` read paths still resolve those fields.
