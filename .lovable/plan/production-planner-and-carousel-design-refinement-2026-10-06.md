# Production planner and carousel design refinement

## Outcome

Make the planner’s production stage clearer, route each waiting post to either Risevoice or the client’s own workflow, and raise carousel output to a clean, dependable social-design standard without risking clipped text.

## Planner changes

- Rename **Editing | Designing** to **Production** everywhere the client sees it, including confirmation text and new-post choices.
- Keep all waiting and active production records in that tab, but vary row and post-window actions by status:
  - **To Edit / To Design:** show **Assign to Risevoice** and **DWY Edit / DWY Design**.
  - **Editing / Designing / In Progress:** show **Comment** only.
- Open the review modal from either assignment action with that choice preselected. The modal will show the post preview, copy, existing files, and the footage/photo link before confirmation.
- Preserve the current rules: video footage is required; design reference imagery remains optional. Add format-specific helper copy beneath the link:
  - Video: explain that the folder should contain the raw clips needed for the edit and be accessible by link.
  - Carousel: request one natural everyday photo with negative space, avoiding close-ups; a headshot is also suitable.
  - Graphic: request a clear supporting or brand image with room for text.
- Rename modal actions to match the planner: **Assign to Risevoice** and **DWY Edit / DWY Design**.
- Make **Approve** green in both the planner row and the opened post window.

## Carousel copy and visual structure

- Change the final carousel slide contract so it always contains:
  1. a short, powerful closing statement that completes the carousel’s idea;
  2. the selected invitation to act, preserving its action, keyword, and promised reward;
  3. a short action label rendered as a CTA pill.
- Keep section metadata such as `content`, `title`, `hook`, and `cta` out of generated artwork. Those values remain internal structure only.
- Strengthen the shared frame model so title, subtitle, and body have distinct font weights and visual hierarchy:
  - title: boldest and most prominent;
  - subtitle: lighter supporting emphasis;
  - body: regular/light reading weight.
- Add adaptive text fitting to both live preview and exported images. Text will wrap and step down in size until it fits its allocated box, with a safe minimum rather than being clipped.
- Enforce Instagram’s 1080×1350 portrait canvas and safe inset on every slide, including the CTA pill and any photo-backed layout.
- Render the CTA action inside a true pill in both preview and export, with contrast calculated from the chosen brand colors.
- Refine spacing, vertical rhythm, and alignment while preserving the saved brand fonts, colors, backgrounds, and photo treatment.

## Design approach

Use AI for the copy and closing statement, but keep layout deterministic in the app. A second AI call for image composition would make spacing, brand consistency, and text safety less predictable. The existing shared renderer is the right place to guarantee identical previews and exports; AI remains responsible for the words, not pixel placement.

## Validation

- Add focused tests for the two-part closing slide, CTA intent preservation, internal-label removal, status-specific planner actions, and footage requirements.
- Verify the preview and exported image use the same hierarchy, CTA pill, safe margins, and fitted text at maximum allowed copy lengths.
- Click through both Production paths for a video and carousel, confirm the correct helper copy and assignment, and verify the green Approve action.
- Check desktop and narrow layouts for overflow, clipped text, or modal/action overlap.
