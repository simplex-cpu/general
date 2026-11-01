# Unify script anatomy and approval actions

## Goal
Make each finished script read as one clean piece of content: no repeated hook, no separate CTA block, and format-correct CTA placement.

## Changes

1. **Create one shared script-anatomy rule**
   - Keep the approved spoken hook as the first line of a Talking Video script, but never append or display it a second time as a separate Hook section.
   - For Talking Video, integrate the selected CTA into the final lines as a friendly continuation of the script’s main idea. Preserve any required action, keyword, and reward, but do not merely paste the CTA text.
   - For Carousels, keep the CTA inside the final slide and require the invitation to flow naturally from the carousel’s conclusion.
   - For B-roll and Graphics, keep CTA language out of the on-screen script/copy; include it only in the captions.
   - Preserve compatibility with existing saved sessions while normalizing what is shown, copied, downloaded, and sent onward.

2. **Update generation and validation**
   - Adjust the writing instructions so Talking Video returns one complete spoken script containing the approved hook once and the natural CTA ending.
   - Stop stripping the Talking Video CTA after generation, while continuing to reject invented offers and conflicting actions.
   - Keep B-roll and Graphic writing free of CTA copy and keep caption generation responsible for their CTA.
   - Update the shared CTA helper so it applies the correct behavior by format rather than storing a separate video CTA for every video.

3. **Use the same anatomy everywhere**
   - Remove the separate Hook and CTA sections from script cards, copy/download output, History summaries, planner handoff, and production records.
   - Send the complete Talking Video script once, without an additional Hook field or appended “On-screen CTA” line.
   - Keep Carousel CTA copy in its structured final slide; do not add another standalone CTA block.
   - Ensure production metadata and post naming read the unified script without duplicating its opening line.

4. **Restyle the variation actions**
   - Make **Approve & Write Captions** green.
   - Make **Regenerate** dark gray, visually aligned with the three-dot action rather than the primary indigo action.
   - Preserve disabled, focus, and loading states.

5. **Regression coverage and verification**
   - Add focused tests for: Talking Video hook appearing exactly once; natural selected CTA inside the script; no separate CTA field; Carousel CTA remaining on its final slide; B-roll and Graphic CTA appearing only in captions.
   - Test copy/export and planner payload composition so legacy fields cannot reintroduce duplicates.
   - Run the relevant script, caption, carousel, planner, and session tests plus the type check.
   - Verify Talking Video, B-roll, Carousel, and Graphic variation cards and planner handoff in the preview, including the updated button colours.

## Technical notes
- Keep CTA ownership and format rules centralized in the existing shared CTA module.
- Keep carousel structure and CTA-slide limits in the existing shared design-template module.
- Retain legacy hook/CTA fields only where required to read older sessions; new completed output will use the unified script representation.
