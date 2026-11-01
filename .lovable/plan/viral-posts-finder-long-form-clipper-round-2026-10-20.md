# Viral posts finder + Long form Clipper round

## 1. Find Viral Posts
**Find more posts per round**
- Each search term now keeps up to 10 posts instead of 5, and reads 60 results per term instead of 30. With 5 terms, a round can save up to 50 posts. Since 13 posts per round is about half the current limit, this should give at least 26.
- If a term still comes back short after the quality filters (recent, enough views or likes), the round tops up from the other terms' next-best posts.

**Search terms**
- At least 2 of the 5 terms always use the words the audience uses for themselves (e.g. "founders", "small business owners"). These come from the brand brief's target audience. The app checks the terms it gets back and asks the AI again if fewer than 2 qualify.

**Card layout (one item per row)**
1. Posted date
2. Title (bold)
3. Creator handle
4. Stats (views, likes, comments)
5. Topic | Format: two columns, each with its label

The "Why it works" button comes off the card. Clicking a card opens it in a pop-up.

**Card pop-up**
- Shows the thumbnail or preview, all the card details in the order above, and the Open, Repurpose and Discard actions.
- "Why it works" is split into two boxes: **Hook template** and **Framework**. Older saved analyses that are one block of text are split by their existing labels. If no labels are found, all the text goes in Framework.
- Posts found by the search stay read-only. Posts you added yourself can still be edited here.

## 2. Long form Clipper
**"Retry saving footage" never finishing**
- The cause isn't confirmed yet. First, I'll read the saved error on the affected long forms and look at the server logs. Possible causes are that the downloader can't read the link, the Drive upload is failing, or a quiet failure that retries forever without showing an error.
- Then I'll fix that cause. I'll also show the real reason under the button, and stop a failure from looking like an endless retry. After about 3 failed tries, it will say what to do next.
- I'll confirm the fix by saving a real long form's footage all the way to Drive.

**Full-screen long form page**
- Opening a long form now uses the whole screen, not a frame inside the page. The short form window can then open at full size without spilling past the edges.

**Readable "Creative Direction"**
- Add a **Creative Direction** field to Short forms. It's written in plain language, for example:
  ```text
  Clip: 05:39 – 06:00 (21 sec) · Speaker: Speaker 1
  What happens: Shows how to cover the cake in one layer of buttercream and smooth the top and sides with an offset spatula.
  Quote: "Sometimes you want to do a crumb coat… Smooth the side."
  Note: Use this exact range. Don't add other speech or a spoken CTA.
  ```
- The short form window and the production handoff show this text instead of the raw code-like block. The exact source data is still kept behind the scenes, so clip accuracy doesn't change.
- Existing short forms are converted when they're shown, so the old code-like text never appears again.
- The empty "Confirmed speaker names: {}" line is removed. Speaker names only show when there are some.

## Technical details
- `inspoFind.ts`: `KEEP_PER_TERM` 10, `PER_TERM_RESULTS` 60, a top-up step, and a self-identifier rule plus a check in `searchTermsPrompt`/`parseTerms`. Tests for both.
- `InspoBankMode.tsx`: card reordered, a detail dialog, and a Hook template/Framework splitter (pure helper with a test).
- `longFormFootage.server.ts`: look into the swallowed `catch`, which keeps returning `long` forever. Add a failure counter and save the error after repeated failures.
- `LongFormClipperMode.tsx`: the detail view becomes a fixed, full-viewport layer, and the short form dialog is no longer nested in a scrolling frame.
- `longFormClipper.ts`: `creativeDirection(sourceNotes, speakers)` formats the provenance JSON into readable text (with tests). `boardScript` uses it for `creativeInstructions`, and the raw JSON stays in Source notes.
- Airtable Short forms: a new long text field, "Creative Direction".
