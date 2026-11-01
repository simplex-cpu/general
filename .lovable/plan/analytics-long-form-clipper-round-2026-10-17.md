# Analytics + Long form Clipper round

## 1. Refresh stats = full analysis (audit result)
The current Refresh stats only updates numbers on posts already in the planner. It does not transcribe, assign a topic or classify the format. The fix:
- Refresh will run the same steps as "Analyze account": collect posts → transcribe videos (or read on-screen text for silent videos and graphics) → assign a topic → classify the format (Broll / Talking Video / Carousel / Graphic).
- Posts already in the planner get updated stats, and the topic and format are filled in only if they're empty. Saved values are never overwritten with blanks.
- Only new or unanalysed posts are transcribed, so repeat refreshes don't use extra credits.
- The progress text will say which step is running (Collecting, Transcribing, Tagging).

## 2. Viral Kit: "Analyze account"
- Rename the tool to "Analyze account".
- Replace the handle dropdown with a free text box that accepts any handle or profile URL (Instagram or TikTok). You can still pick a saved brand handle with one click as a suggestion.

## 3. Add long form modal (rewrite)
- The step dots (Source · Speakers · Next step) move into the small header line above the title, shown as plain text with dots so they don't look like buttons.
- Remove the disclaimers: each step keeps one short line and its buttons.
- Speakers step: the title reads "Speakers (optional)" all on one line. There are two clear choices: **It's just me** or **Add speakers**. Name and bio rows only appear after choosing Add speakers.
- Final step: before you confirm, a summary shows the estimated time based on the video length, for example "About 10–15 min to transcribe" or "About 20–30 min including short forms".
- Spacing is tighter, the type is easier to read, and all buttons are the same size.

## 4. Manual short form
- The fields match the planner for each format:
  - Carousel: one row per slide with Title, Subtitle and Body.
  - Talking Video: Hook and Script.
  - Broll: Text overlay.
  - Graphic: Title, Subtitle and Body.
  - Every format also has Caption, CTA and Timestamps.
- One clear column with sections labelled by slide or part.
- Fix the left edge of the modal getting cut off (the padding and width are clipping it).

## 5. AI short forms through n8n
- "AI generated" sends the long form (record ID, transcript, speakers, counts per format, CTA, brand) to your n8n workflow GwCNZUdyteKe16KN. That workflow then writes the short forms back.
- **Blocker:** I can't read this workflow yet. Please turn on "MCP access" in the workflow's settings in n8n so I can check which trigger and inputs it expects. If it uses a webhook, I'll also need its webhook URL.

## 6. Footage not saved
- Find out why the footage link gets lost: check whether closing the modal mid-flow drops it, or whether the save skips the Footage field.
- Save the footage link to the Airtable record at the very first step, before transcription starts, then read it back to confirm.
- Fix existing records that have a source link but no footage.

## 7. "Blocked" source link (definitive fix)
- Remove every remaining clickable source link in the list, the detail view and the planner card, and use Copy link everywhere.
- Test it in the preview: confirm that clicking never opens the blocked page.

## Technical notes
- Refresh reuses the Analyze account pipeline (the same transcription and classification helpers) from `statsRefresh.ts`.
- Add tests for: estimating time from video length; never overwriting saved topic or format; the planner field rules for manual short forms; saving footage first.
