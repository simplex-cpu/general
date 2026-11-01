# DIY Design: real AI path + smaller row buttons

## What goes wrong today
- After you pick "AI design", the AI request starts before your brand look has loaded. When the brand look arrives a moment later, the slides change, the AI results no longer match them and get thrown away, so you only see the template design.
- The design editor uses one screen for both paths, so even when it works, AI design looks like the template flow.
- The buttons in the "How do you want to design it?" window use the default dark button style, so they come out black.

## The flow after this change
```text
DIY Design
   -> "How do you want to design it?"  (two light cards + gray Cancel)
        Template design -> current editor, unchanged
        AI design       -> AI design screen
                              1. waits for your brand look (fonts, ink colors, accents, background style)
                              2. sends each slide's exact copy + brand look to Claude, one slide at a time
                              3. shows "Designing slide 2 of 5" while it works, slides appear as they finish
                              4. when done: browse slides, "Redesign this slide", "Redesign all",
                                 then the same send/produce step as today
                              5. if a slide can't be designed cleanly, that slide falls back to the
                                 standard layout and says so; credit/permission errors stop with a clear message
                              "Use template instead" link switches to the current editor
```

## Changes
1. **Design picker window**: indigo/white styling, light-gray Cancel, nothing black.
2. **AI design mode in the design editor**
   - Starts only after the brand look has finished loading.
   - Clear "AI design" title and progress, no template-only controls (layout/background pickers).
   - Editing the copy marks affected slides as "out of date — redesign" instead of silently showing the template version.
   - Finished AI slides are what gets exported and sent on.
3. **Row buttons**: smaller and shorter in every planner tab (Attach, Teleprompt, DIY, Assign, Approve, Re-do, Post, Send to production, Comment).

## Technical details
- `ProduceReviewModal.tsx`: add a `mode: "template" | "ai"` state seeded from `autoAiDesign`; the auto-run effect waits for `brandStyleReady`. In AI mode, render the AI preview and progress (`aiWorking` index / `frames.length`), hide layout/backdrop controls, keep stale AI slides with a "Redesign" badge instead of dropping to `DesignPreview`. Confirm `designSlide` sends the brand tokens and copy from `frames`, and that export uses the AI SVGs.
- `ApproveAndPostMode.tsx`: restyle the picker buttons with explicit token classes (not default `Button`); shrink row action classes from `px-3 py-1.5 text-xs` to about `px-2.5 py-1 text-[11px]`, icons 11px.
- Verify with one live AI design call on a sample carousel, then run `bun test src/lib/slate`.
