# AI Design as a background request (like DIY Edit)

## The flow
```text
DIY Design -> "How do you want to design it?"
   Template design -> current editor, unchanged
   AI design       -> short confirm ("Design N slides with AI using your brand")
                      -> window closes right away
                      -> card/row moves to Production as "Designing" with live progress
                         ("AI design · slide 2 of 5")
                      -> each slide: copy + brand look sent to Claude, checked, turned into an image
                      -> when all are done: the slides are attached to the card's
                         "Media to Post", in order, and the card moves to To Approve
                      -> on failure: card shows "AI design failed" with Retry and
                         "Use template instead"; nothing half-done is attached
```
No editor or preview opens for AI design. You review the result in the card's Media tab like any other produced post, and Re-do works as usual.

## Details
- Progress shows on the planner row (same spot as the DIY Edit activity) and inside the card window.
- You can close the card, switch tabs or go to other sections of the app while it runs.
- Limitation: the slides are turned into images inside your browser, so closing or reloading the browser tab stops the run. When that happens the card says "AI design interrupted" with Retry, instead of staying stuck on "Designing".
- A slide the AI can't design cleanly is redone once, then falls back to the standard brand layout so the set is always complete; the card notes which slides used the fallback.
- Credit or permission errors stop the run and show the reason; nothing retries automatically.
- Remove the in-editor "Design with AI" buttons and the AI preview added last round, so the Template editor is the plain template flow again.

## Technical details
- New browser module `src/lib/slate/aiDesignJobs.ts`: in-memory job store keyed by content id (subscribe/getJob/start), so jobs outlive the modal and planner unmount. Builds frames with the same `buildCarouselFrames`/`buildGraphicFrame` + `graphicFrameStyle(/api/my-brief)` path the editor uses, calls `designSlide` sequentially, `svgToPngFile`, then uploads each PNG via `/api/dwy-content-upload` (`Produced Files`, multiple=1) only after all slides succeed.
- Status: on start PATCH `clientStatus` to the existing designing status (`Editing | Designing`) so the row shows `ProductionActivity`; on success PATCH to `Approve`; on failure revert to the previous to-produce status. A `beforeunload` warning while a job runs; on load, a card in designing status with no live job and no request record shows "interrupted" + Retry.
- `ApproveAndPostMode.tsx`: AI design choice calls `aiDesignJobs.start(post)` instead of opening `ProduceReviewModal`; row and card subscribe to job progress.
- `ProduceReviewModal.tsx`: drop `autoAiDesign`, AI preview and AI buttons.
- Extract frame-building into a shared helper so the editor and job produce identical copy/brand input; add a test that the job uploads nothing when a slide errors, and that slide order is preserved.
- Run `bun test src/lib/slate`; one live run on a sample carousel to confirm images attach and status moves to To Approve.

---

# Better-looking AI designs

**Which AI made them:** Claude Sonnet 5 at medium effort. Each slide was designed on its own, from a short list of rules, with no picture of what "good" looks like, and nobody checked how it looked before using it. That's why the slides came out flat and inconsistent.

## Changes
1. **Stronger model:** switch AI design to Claude Opus 5.5 (Anthropic's top design and reasoning model) at high effort. It costs more credits per slide.
2. **Art direction first:** one call plans the whole carousel before any slide is drawn: grid, type scale, which accent goes where, and a layout for each slide picked from a set of editorial layouts (big-number stat, headline + supporting line, numbered list, split quote, simple bar chart, CTA closing). Every slide then follows that plan, so the set looks like one series.
3. **Real design guidance in the instructions:** concrete type sizes (huge cover headlines, clear body sizes), spacing, alignment, contrast and color-use rules, plus a few hand-made example slides as a quality bar. No clip-art-style icons, which were a big part of why they looked cheap.
4. **Look-and-fix pass:** after each slide is drawn, it's turned into an image and shown back to Claude. Claude critiques it (crowding, weak hierarchy, poor contrast, misalignment) and draws one improved version. The existing copy and safety checks still apply.
5. **Before switching it on:** I generate a sample carousel from a real brand and show you the before and after images. You approve the look before your posts use it.

## Technical details
- `src/routes/api/ai-design.ts`: `MODEL = "anthropic/claude-opus-5-5"`, `output_config.effort: "high"`, adaptive thinking, keep streaming and status handling. New `mode: "plan"` returns a JSON series plan (layout per slide, type scale, accent mapping) using `output_config.format`. Slide calls receive that plan. New `mode: "review"` takes the rendered PNG (base64 image block) plus the SVG and returns a revised SVG.
- Rewritten `SYSTEM` prompt with a layout library and 2–3 inline reference SVGs; remove the icon allowance except simple geometric marks.
- `aiDesignJobs.ts` order per post: plan, then for each slide draw, render PNG (`svgToPngFile`), review once, validate, render the final image. The fallback rules stay the same.
- Tests: plan schema parsing; the review step never changes the copy (existing copy-word validation).
