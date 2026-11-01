# Scripting Hub refinements

## What changes for the user

1. **Colours**: the main writing area on the right uses the same dark gray as the other sections. The left side panel (History, New script) becomes light, close to white.
2. **Chat bubbles**: AI and user bubbles, cards and buttons get new colours so text stays easy to read on the darker area. Cards stay white, user bubbles indigo, AI text on light gray panels.
3. **Choose a brand before Batch**: after clicking "Batch", a brand picker comes first. The script pipeline (formats, brief chat, topics) appears only after a brand is chosen. If the user has only one brand, it is chosen automatically.
4. **Choose a brand before Strategy details**: the monthly split / strategy brief asks which brand first, then shows that brand's split, hooks test, words to use or avoid, and backup.
5. **Back button**: after entering "Batch" or "Single script", a "Back" link at the top returns to "Do you want to create a single script or a batch?". If there is unsaved work in progress, it asks for confirmation first. Work that was already written stays in History.
6. **Filter History by brand**: a small brand dropdown at the top of History ("All brands" by default) shows only that brand's sessions.
7. **Add to Planner window**: replace the odd slide-in with a short, simple fade and slight scale-up, centered, matching other windows in the app.

## Technical details

- `ScriptRail.tsx`: rail `bg-brand-wash` becomes a near-white surface token; content shell gets the shared dark-gray section background. Add brand filter dropdown (reuse `BrandSelect`), filtering sessions by their stored brand id/name; sessions without a brand show under "All brands" only.
- `ScriptMode.tsx`: add a brand-selection step that gates the batch pipeline and the strategy view (reuse existing `SET_BRAND` / `loadAdminBrandContext` and owned-brand list); auto-select when only one brand exists. Add a "Back" action that resets mode to the chooser (reuse `startNewBatch`-style reset), confirming when a generation is active or the draft is unsaved. Retheme bubble/card classes with semantic tokens only.
- `StrategyStrip.tsx` / `useBrandGuidance`: accept a selected brand id so guidance loads per brand; `/api/brand-guidance` gets an optional brand param, validated against the user's owned brands.
- Writer sessions: ensure new sessions save the brand link so History filtering works; older sessions without a brand still appear under "All brands".
- Add to Planner dialog: remove slide-in classes, use standard centered fade/zoom.
- Tests: brand gating (pipeline hidden until brand chosen) and History brand filter.
- Keep ScriptMode mounted and existing single-flight/session rules unchanged.
