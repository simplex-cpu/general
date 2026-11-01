# Simpler, one-step-at-a-time Script tab

## What changes for the user

```text
+-------------------+------------------------------------------+
| My scriptwriter   |  "Do you want to create a single script  |
| Strategy details  |   or a batch?"                           |
|                   |   [ Single script ]   [ Batch ]          |
| History           |                                          |
|  - Batch Oct 5    |                                          |
|  - Single Oct 4   |                                          |
+-------------------+------------------------------------------+
```

- **Side rail** (like ChatGPT/Claude): "My scriptwriter", "Strategy details", then a History list of past writer sessions.
- **Strategy details**: the audit findings and strategy that are hidden behind buttons today get their own page.
- **My scriptwriter**: the first question (Single or Batch), plus the format pipeline once Batch is picked.
- **History**: past sessions open read-only. One action: "Re-purpose", which starts a new session that writes variations of that session's scripts.

### Single script (3 screens)
1. Single or Batch.
2. Form: raw script or ideas (text), inspo video link (optional), format (B-roll, Talking video, Carousel, Graphic).
3. The finished script, in the same card used by batches (two hook variations, then captions, download or add to planner).
- With an inspo link, the app reads the video's transcript and key frames, then rewrites it for this brand using the brief and our guidelines.

### Batch (chat, one decision at a time)
1. Pick a format from the pipeline. Your choice shows as a reply bubble.
2. Approve the brand brief.
3. "Do you have topics or do you want me to suggest?" (current wording).
4. Topic shortlist, with the current carousel mix rules. The instruction ("Pick the 2 topics you want") always comes **before** the choices, never after.
5. **No hook approval step.** For each topic, the app writes two full scripts, one per hook.
6. Buttons: Regenerate or "Approve & Write captions". The second stays disabled until a variation is picked.
7. Captions are written for that one script only.
8. Buttons: Download (that script as a PDF) or "Add to Planner & Write Next".
9. A confirmation window: **Produce now** or **Add to production queue**.
   - Produce now asks for footage (required for video, optional for design) and who handles it (Risevoice team or Do it myself).
   - Do it myself also creates the Do-it-myself request record, on top of the Content record.
10. Repeat steps 5 to 9 for the next topic.
11. When the batch is done: a success message with "Download all scripts in PDF" and "Write next batch", which starts a new session.

## Rollout in batches

**Batch 1: Study and map (no visible change)**
- Map the current Script tab steps to the new ones: what gets kept, removed (hook approval, batch captions, tone sample) or added.
- Check the Airtable Content and Do-it-myself tables for the fields this flow needs.

**Batch 2: Airtable and backend**
- New Airtable table **Writer Sessions**: Session ID, Brand (link), Type (Single/Batch), Format, Title, Status (In progress/Completed), Started/Updated, Brief snapshot, Topics (JSON), Scripts (JSON transcript), Linked Content records, Re-purposed from (link).
- New endpoints to create, update, list and read sessions, each limited to the signed-in brand.
- New endpoint that writes **two script variations at once** (each with its own hook), reusing current script rules.
- Change captions so they run for one script at a time.
- New "add to planner" endpoint: creates the Content record with Request type, status (Prepare footage / To edit or To design, or queue), and footage. For Do it myself it also creates the request record.
- Inspo video analysis: transcript plus sampled frames read by an image-capable AI model, then a rewrite for the brand.
- Other outstanding Airtable items: a "Writer Session" link field on Content, and a single-PDF export.

**Batch 3: Rail layout and Strategy details**
- Side rail, Strategy details page (audit findings and strategy moved there), History list (read-only view).

**Batch 4: Batch flow rebuild**
- Two variations per topic, select then captions, download or add to planner, the confirmation window, the repeat loop, the end screen. Instructions shown before choices.

**Batch 5: Single script flow and inspo video**
- 3-screen flow, inspo analysis, shared script card.

**Batch 6: Re-purpose and polish**
- Re-purpose from History, end-of-batch PDF, mobile layout, tests for the rules: approve stays disabled until a variation is picked, captions for one script only, video footage required for Produce now, and Do it myself creates both records.

Each batch ships on its own and is checked in the preview before the next one starts.

## Open questions (answer before Batch 2)
1. Should I create Writer Sessions in your Airtable base, or have you already made it? If you made it, share the field names.
2. "Add to production queue": what status should the Content record get? Suggestion: Prepare footage, with no team assigned.
3. Inspo links: which platforms (Instagram, TikTok, YouTube)? Reading frames uses AI credits for every video.
4. Single script: do you also want two hook variations there? Suggestion: yes, so both routes show the same card.
5. Talking-video on-screen hooks are written at the captions step today. Keep that?

## Technical details
- ScriptMode.tsx (about 150k characters) gets split into: rail shell, StrategyDetails, WriterSession (chat state machine), SingleScriptForm, VariationPair, AddToPlannerModal.
- New phases: askMode, singleForm, approveTopics, writingVariations, pickVariation, writingCaptions, addToPlanner, sessionDone. Removed phases: approveHooks, askScriptType, writingSample, approveTone, offerCaptions.
- Session state is saved to Writer Sessions after each step (Airtable is the source of truth, the browser keeps a cache). Re-purpose clones topics and scripts into a new session.
- Reused: send-to-production.ts and dwy-edit-yourself.ts logic, designTemplates.ts rules, captions.ts (single-script input), the shared Lovable Responses helper for fast steps.
- Inspo: fetch the media server-side, extract the transcript plus about 6 frames, and send them to a vision model through the AI Gateway. Workers cannot run ffmpeg, so frame extraction uses an external fetch, or the browser grabs frames.
- AGENTS.md gets a rule that Writer Sessions is the session store.
