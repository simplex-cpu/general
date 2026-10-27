# Community polish, full-height brand settings, and Viral Kit

## Batch 1 — Spacing and brand controls
- Add 8px more space below the **Community** title without changing the other section headers.
- Add 12px more space below **Creator Circle / Ask your team**, keeping the existing pill container and continuous gray background. Apply the spacing to both views.
- Make **Add new brand**, brand-detail **Save**, and Visual Style **Save changes** slimmer: 32px visible height instead of 40px, preserving their text size, indigo styling, and comfortable touch targets on phones. Leave unrelated connection, upload, and dialog buttons unchanged.

## Batch 2 — Continuous Visual Style settings rail
- Extend the light-gray settings rail from the top of its **Video settings / Graphic settings** container to the bottom of the available section, including the Save area.
- Keep that same light-gray surface behind the settings tab container and its surrounding spacing; retain the darker segmented container and white selected tab.
- Replace the fixed viewport-height subtraction with a layout that fills the available space below the brand header and Brief / Visual Style / Connected Accounts tabs. The separate brand header and outer brand tabs keep their current backgrounds.
- Keep settings and preview scrolling usable independently on desktop. On phones, retain a natural stacked layout without clipped controls or unnecessary empty height.
- Preserve all style fields, preview behavior, and save behavior; this is a presentation change only.

## Batch 3 — Viral Kit gallery and navigation
- Replace **Analyze** in primary navigation with **Viral Kit**, in the same position and available to the same users. Apply this to expanded/collapsed desktop navigation and mobile navigation.
- Open a page titled **Viral Kit**, using the shared bare-background section header and neutral-gray canvas.
- Show four equal, individually framed card-buttons, each with a distinct icon and its tool name:
  1. **Refine My Strategy**
  2. **Analyze Competitors**
  3. **Thumbnail Variations**
  4. **Long form Clipper**
- Use a clean two-column desktop gallery and a single column on narrow screens, restrained borders, and the existing indigo accent. No extra explanatory paragraphs or nested cards.
- **Refine My Strategy** opens the existing Analyze experience, not a new strategy-generation flow. Add an icon-only back arrow with an accessible name to return to Viral Kit, and identify the tool as Refine My Strategy.
- Keep Viral Kit highlighted while inside Refine My Strategy. Preserve existing analysis inputs, report/history behavior, credits, strategy approval, and handoff to Script.
- As requested, the other three cards display **Coming soon** and are visibly unavailable. They make no requests, spend no credits, and do not open empty tools.

## Technical approach
- Current primary navigation and analysis rendering use `ModeTabs` and `SlateApp`; retain this section-state architecture rather than introducing a competing router or replacing the analysis implementation.
- Add a focused Viral Kit gallery component and connect its working card to the existing `AnalyzeMode`. Keep the existing internal analysis mode available for other entry points, while removing its standalone navigation item.
- The Visual Style workspace currently uses `height: calc(100dvh - 200px)` with a 390px minimum. Use an available-height brand-detail shell and stretch the settings column instead of extending that fixed subtraction.
- Scope Community spacing and brand button changes locally. Reuse semantic colors and the existing Button and segmented-tab components.
- No database, AI-provider, credit-price, Airtable, or n8n changes. Record the navigation/layout decisions in project guidance and update the task list and relevant preferences during implementation.

## Verification per batch
- Check Community spacing in Creator Circle and Ask your team, with no changes to Home or other headers.
- Check all three slimmed brand actions for readable labels, loading/disabled states, and phone touch targets.
- Check the rail surface behind its inner tabs, throughout short/long settings, and through its Save area at wide, short, and phone viewports. Confirm fonts, colors, previews, and saves still work.
- Verify navigation → Viral Kit → Refine My Strategy → back, including active navigation in the collapsed rail and mobile bar.
- Verify the existing analysis-to-Script handoff with an authorized account when available. If account access is unavailable, explicitly report that end-to-end check as unverified.
- Add focused navigation tests for the working card, removal of standalone Analyze navigation, and unavailable tools; run relevant existing tests and inspect preview errors.

## Deferred
Analyze Competitors, Thumbnail Variations, and Long form Clipper remain Coming soon; their workflows and implementation are outside this release. Implement the batches in order after approval; publishing is a separate action.