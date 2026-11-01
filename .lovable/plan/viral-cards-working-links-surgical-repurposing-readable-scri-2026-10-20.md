# Viral cards, working links, surgical repurposing, readable script link

## 1. Viral post cards
- Row order: Posted date, Title (bold), Creator, Topic, Stats.
- Format is removed from the card and stays only in the pop-up.
- More space between rows.

## 2. Viral post pop-up
- Under the title, one darker gray box holds all post details.
- First row: stats (views, likes, comments) in larger numbers.
- Then one field per row with its label (Creator, Posted date, Topic, Format, Platform), with more padding per row.
- Hook template and Framework boxes stay below.

## 3. Links that open a blocked page (full diagnosis, two batches)
Diagnosis step first: reproduce in a browser by opening links from the preview and from the published site, and record what each site returns. Current finding: about 30 link buttons across the app open the outside site directly in a new tab with privacy settings that Instagram, TikTok and Drive often refuse ("page blocked"), especially when the app runs inside the editor preview. A safe redirect page already exists in the app but nothing uses it.
- Batch A: one shared "open link" button used everywhere. It opens our own redirect page in a new tab, which then moves to the real site as a normal visit (the pattern sites accept). If the browser still blocks it, that page shows "Open post" and "Copy link".
- Batch B: replace every outside link in the app with it: viral cards and pop-up, See all posts, Performance handle, planner, Produce/Review, Do It Myself, Request Edits, Long Form Clipper footage, Attach box, media carousel, Community, Learning, scripting.
- Check: open several links from the published site and confirm they load.

## 4–6. Surgical repurposing
Both repurpose writing calls drop the full scripting-flow guidelines and only use the general "no AI-slop" writing rules, plus the strict rules below.

From your own post (Home "See all posts"):
- Topic, main idea and delivery stay almost word for word.
- Different format: visual hook and opening line stay exactly; only the structure changes to fit the new format.
- Same format: only the visual hook or cover title gets a small variation; body stays word for word.

From a viral post (Find Viral Posts):
- Hook stays almost intact, beats followed one for one, format kept, word count within about 10%.
- What changes: topic, main idea and stance, swapped to the brand's.
- Opening line and visual hook keep their wording and structure, with only the topic words swapped.

Follow-up step (captions and visual hook after the script appears):
- Receives the original caption and visual hook and writes close variations: words swapped, same structure, length and format.

## 7. Script link in chat
- "View post in Planner" in the chat bubble gets readable contrast against the bubble.
- It opens in the same tab inside the app, so you stay signed in.

## Technical details
- `InspoBankMode.tsx`: card row order, drop format chip, `space-y` increase; modal details box `bg-brand-wash`/darker token, stats row first.
- New `src/components/slate/ExternalLinkButton.tsx` + `externalHref(url)` → `/go?u=`; replace raw `target="_blank"` anchors and `window.open` for outside URLs. Verify with Playwright on the published URL.
- New `repurposeRules.ts` with `ownPostInstruction(mode)` and `viralPostInstruction()`; `post-repurpose.ts` and `inspo-repurpose.ts` stop calling `buildEnvelope(scriptDeliverable…)` and use the slop rules + these. Captions/hook follow-up (`captions.ts`/`hooks.ts`) take `originalCaption`/`originalHook` from the repurpose context and use variation instructions. Tests for each rule.
- `ScriptMode.tsx` ~4371: use the router `navigate` to `/?planner=` same tab, and a contrasting token color on the user bubble.
