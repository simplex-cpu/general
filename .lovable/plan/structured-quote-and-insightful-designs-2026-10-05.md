# Structured quote and insightful designs

## Summary
Create four strict content templates—Quote Carousel, Insightful Carousel, Quote Graphic, and Insightful Graphic—and use the same rules from AI writing through editing, preview, export, and production handoff.

The user will choose **Quote** or **Insightful** immediately after choosing Carousel or Graphic. Carousels will use **one optional photo across every slide**. Every design will keep copy inside a **10% inner safe area**.

## 1. One shared ruleset

Create a single source of truth for each template so the writer, editor, validator, preview, and PNG renderer cannot drift:

| Template | Required structure |
|---|---|
| Quote Carousel | Exactly 6 slides: cover, 4 quote slides, CTA |
| Insightful Carousel | Exactly 10 slides: cover, 8 insight slides, CTA |
| Quote Graphic | Exactly 1 slide with one centered quote |
| Insightful Graphic | Exactly 1 slide with title and body |

The ruleset will define required labels, maximum words, slide roles, line limits, text-area limits, alignment, safe area, and photo treatment.

## 2. Script tab: choose and generate the correct copy

- After Carousel or Graphic is chosen, ask whether it is **Quote** or **Insightful**.
- Remove the variable carousel slide-count question for these formats; the subtype fixes the count at 6 or 10.
- Update AI instructions and structured output so every slide returns labeled parts rather than an unstructured copy block.
- Generate a relevant generic CTA when the user skips CTA input. The CTA slide will contain one CTA sentence and one action label such as Comment, Follow, or Share.
- Enforce these limits in code after generation and before approval—not only in the AI prompt:
  - Quote carousel cover: title only, 9 words, up to 3 lines.
  - Quote carousel content: one body-style quote, 20 words.
  - Insightful carousel cover: title 8 words and subtitle 10 words; title up to 3 lines and subtitle up to 2.
  - Insightful carousel content: title 6 words and body 15 words.
  - Quote graphic: one centered text box, 20 words.
  - Insightful graphic: title 6 words and body 15 words.
- Show purpose-specific editable fields in script cards—Title, Subtitle, Quote, Body, CTA text, and CTA label as applicable—with live word counts and clear over-limit states.
- Preserve the chosen subtype and labeled copy through script persistence, production requests, and reopening a post.

## 3. Four fixed visual templates

Build four role-aware frame templates rather than treating every design as the same generic slide:

### Quote Carousel
- Cover: centered title only, constrained to 35% of the safe canvas.
- Four content slides: one centered, body-style quote box constrained to 25%.
- CTA: one CTA sentence plus a distinct action label.

### Insightful Carousel
- Cover: title plus subtitle, together constrained to 40%.
- Eight content slides: title area up to 20% and body area up to 25%, together no more than 45%.
- CTA: one CTA sentence plus a distinct action label.

### Quote Graphic
- One centered quote box constrained to 25%; no cover or CTA treatment.

### Insightful Graphic
- One title and one body box; title up to 20%, body up to 25%, combined no more than 45%; no CTA.

All four templates will use the saved brand fonts and colors and remain at 1080×1350.

## 4. Safe fitting, photos, and contrast

- Keep all text within a shared 10% inner safe area.
- Add measured line wrapping and shrink-to-fit behavior so word, line, and occupied-area limits hold in both preview and exported PNGs.
- Prevent overflow rather than clipping text differently between preview and export.
- With no photo, use the saved brand backgrounds and text colors, with an automatic contrast safeguard when a saved combination is unreadable.
- With a photo, apply the same photo to every carousel slide, add one consistent dark veil, and force all copy to white.
- Use identical veil strength, fitted font sizes, positions, and measurements in the live preview and the exported file.

## 5. Review/design sequence and stored fields

- Carry the selected Quote/Insightful subtype and structured parts into the review modal.
- Reopen carousel and graphic posts from their structured cover/slides/CTA copy, not the spoken-script field.
- Keep user edits attached to the same labeled fields when sending a Risevoice request or choosing Do it Myself.
- Store carousel cover, content slides, and CTA separately using the existing cover/slides/CTA fields; serialize labels predictably where a field contains several slides.
- Store graphic title/body structure without overwriting unrelated script copy.
- Use the four templates for preview, browser rendering, uploaded PNGs, and production requests.

## 6. Validation and tests

Add focused tests for each business rule:

- Exact slide counts: 6 for Quote Carousel and 10 for Insightful Carousel.
- Exact role order: cover, required content slides, CTA.
- Every word maximum and title/subtitle line maximum.
- Generic CTA creation when CTA input is blank.
- No CTA for either graphic template.
- Photo mode forces white text and applies one photo across every carousel frame.
- Text-box occupancy stays within the stated 25%, 35%, 40%, or 45% limits and the 10% safe area.
- Structured copy survives save, reopen, Risevoice request, and Do it Myself without moving into the wrong backend field.
- Preview and PNG export use the same computed layout.

## Technical details

- Extend the shared content model with a design subtype and explicit slide roles/parts; avoid representing graphics as truncated generic carousels.
- Branch the script prompt and strict JSON schema by format plus subtype, using the existing AI model and endpoint.
- Add deterministic validation/normalization after AI output so malformed counts or over-limit fields cannot enter the UI silently.
- Refactor frame building around shared template definitions and layout measurements consumed by both CSS preview and canvas export.
- Centralize carousel/graphic classification to remove the current duplicated format detection.
- Keep existing Airtable field names and request flows; extend their serialized values and subtype metadata only where required.
