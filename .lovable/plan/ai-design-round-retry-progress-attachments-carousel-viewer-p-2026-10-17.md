# AI design round: retry, progress, attachments, carousel viewer, premium designs

## 1. Retry only when something went wrong
- While a design is running normally, the progress tag shows only the spinner and step — no Retry.
- Retry appears only when the run failed or has stalled (no progress for 4 minutes).
- The generic "AI working" tag (used when no live job is in this tab, e.g. after a reload) shows Retry only once the post has been "In Progress" with no live job — i.e. the run was interrupted.

## 2. Clearer progress message
Your note here was cut off ("The button/progress message that AI is designing / attaching media to post is …"). Assumed fix: make the tag a clear, readable progress pill — "Designing slide 3 of 6", a small progress bar, then "Attaching slide 2 of 6 to Media to Post". Tell me if you meant something else (e.g. wrong place, too small, stays after finishing).

## 3. Fix broken attachments
- Investigate first: inspect the failed post's Media to Post files to see which slides errored and why (bad file, Drive link Airtable can't fetch, or overlapping writes).
- Then fix the cause; likely changes: confirm each uploaded file is publicly readable before attaching, attach slides one at a time and confirm each one landed, retry a single failed slide once, and only move the post to To Approve when every slide is attached. A partial result shows "4 of 6 attached" with Retry for the missing ones instead of silently passing.

## 4. Carousel viewer in Media to Post
- Carousel posts show their slides one at a time in a slider: large slide, left/right arrows, dots, "3 / 6" counter, keyboard arrows and swipe on phones, thumbnails underneath to jump.
- Graphics and videos keep their current single view.

## 5. Premium, on-brand AI designs
Confirmed problem: the brand accent colours are never sent to the design AI's palette — only colours already used by the template text are. So the AI often has no accent to use, and the gradient is only described as text.
- Check that Risevoice's saved Visual Style actually contains its accents and gradient, and report what's saved.
- Send the full brand kit to every design call: all accents, gradient start/end, light/dark ink, fonts, plus the logo-free brand name.
- The background gradient is drawn by the app into every slide, so it can't be skipped; the AI designs on top of it.
- Rewrite the art direction toward modern premium social design: bold oversized type, layered accent shapes and colour blocks, gradient panels and glows, cards for points, large icons, numbered markers, chart blocks for numbers — no "text plus thin lines" layouts.
- Harder checks before a slide is accepted: must use the accent at least once, at least three text sizes, and at least one graphic element beyond lines (shape block, icon, card or chart). Slides failing these get one redesign.
- Produce sample slides for a Risevoice carousel and show them before you test.

## Technical details
- `AiDesignStatus` / `ProductionActivity` in ApproveAndPostMode.tsx: conditional Retry; progress bar from `current/total`; attaching step reports per-file progress via `aiDesignJobs.ts`.
- `aiDesignClient.ts`: pass brand accents into `framePalette(frames, accents)` and a `brand` object in the payload; `ai-design.ts` adds it to prompts and a `checkDesignQuality` validator in `aiDesign.ts` (accent used, ≥3 font sizes, ≥1 non-line shape) with unit tests.
- Attachment loop: per-slide verify/retry, partial-state reporting; diagnosis read of the affected Airtable record first.
- New `SlideCarousel` component used in the Media tab for carousel posts.
