# My Brand: bare header + simpler Visual Style

## 1. Brand header
- Remove the lighter band behind the logo + brand name in the brand detail page. The name sits directly on the same gray as the tabs and content below.

## 2. Visual Style becomes six simple questions
The Video / Graphic split, cover/slides switches, positions and per-element colour pickers in the settings rail are replaced by one short list. The preview on the right stays and reflects the answers.

1. **Title font** — font dropdown (shown in its own font).
2. **Subtitle font** — font dropdown.
3. **Body font** — font dropdown.
4. **Text colour over footage** — defaults to White, hint: "We recommend white."
5. **Text colour on light backgrounds** — defaults to Black, hint: "We recommend black or charcoal."
6. **Brand accents** — up to 3 colour swatches (add / remove), first one used for highlights.
7. **Background style** — three choice cards: **Dark**, **Light**, **Gradient** (gradient built from your accents).

One Save button at the bottom, as today.

## How answers feed existing outputs (nothing breaks downstream)
- Title font → Visual Hook font + graphic titles; Subtitle font → graphic subtitles; Body font → transcription + graphic body.
- Text over footage → Visual Hook and transcription colours (backings become transparent).
- Text on light → carousel/graphic title, subtitle and body colours when Light is chosen; with Dark/Gradient, the footage colour (white) is used instead.
- Background style → cover, slides and still-graphic backgrounds (Dark = charcoal, Light = white, Gradient = accent 1 → accent 2 or a darker accent 1).
- Existing brands: answers prefill from their current saved values; text positions keep their current values or defaults.

## Technical details
- `BriefMode.tsx`: header `bg-brand-wash` → `bg-social-feed` (no other change).
- Rewrite the rail in `VisualStylePanel.tsx`; keep `StylePhonePreview` with a small Video / Carousel / Graphic preview toggle only.
- Store accents and background choice inside the existing graphic preferences JSON field (`accents`, `backgroundStyle`); add a pure `simpleStyleToFields()` mapper in `brandVisualStyle.ts` that writes the existing Airtable fields, with tests for defaults (white / black) and each background choice. No new Airtable fields, no n8n changes.
- Update `mem://design/visual-style` to reflect the simplified question set.
