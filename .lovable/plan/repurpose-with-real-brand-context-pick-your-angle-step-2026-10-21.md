# Repurpose with real brand context + "Pick your angle" step

Applies to both paths: **Repurpose from a viral post** (Find Viral Posts) and **Repurpose from your own post** (Home "All posts").

## What the user will see

```text
Click Repurpose
  -> Step 1  Pick format        (Talking video / B-roll / Carousel / Graphic)
  -> Step 2  Pick your angle    (3-5 suggested angles + "Trending now" + "Write my own")
  -> Step 3  Writing...         (same writer as today, now with full brand reality)
  -> Result  (Viral: opens in Scripting; Own: Send to production queue / Produce now)
```

Step 2 "Pick your angle" shows:
- **Suggested angles (3-5 cards):** each has a one-line angle, the audience belief it challenges, and why it fits the brand. Generated from the brand brief + the session brief (do's, don'ts, expertise) + the source post.
- **Trending now (3-5 chips):** recent headlines/topics in the brand's niche from a live web search, each with source name and date; clicking one turns it into an angle.
- **Brand topics:** chips from the brand's saved content pillars.
- **Write my own:** free text box.
- One selection required; "Regenerate angles" button; Back to format.

Path differences:
- **Viral post:** angle = the new topic/stance. Hook template, beats, format and length stay locked (current surgical rules).
- **Own post:** default card is "Keep original angle" (pre-selected, matching today's reformat behavior); other cards offer a fresh angle on the same main idea. If "Keep original" is chosen, nothing about the message changes.

## Brand reality sent to both writing calls (the main fix)

Today the viral call sends only audience/topics/tone, and the own-post call sends a few raw fields; neither sends the session brief. Both will receive one shared brand context block:
- Brand in a nutshell, offer/expertise, competitive edge, target audience + how they call themselves, pain points, topics/pillars, tone of voice.
- Session brief: scripting do's and don'ts and brand expertise (same source the Scripting hub uses).
- An explicit "audience reality" rule: assume the audience already uses current tools (e.g. AI); never pitch angles they've already solved (e.g. "without hiring anyone"); angle must address a present, specific tension from pain points.
- Monetization funnel stays excluded from viral writing (no-pitch rule kept).

## Technical details

- New `src/lib/slate/brandContext.ts`: `brandRealityBlock(briefFields, sessionBrief)` — single builder used by angle suggestions and both repurpose routes; unit-tested for included/excluded fields.
- Session brief: reuse the loader behind `/api/client-session-brief` (server helper extracted, not an HTTP hop).
- New `/api/repurpose-angles` (POST, access-code auth, brand ownership checked like today): input `{ source: "viral"|"own", id|postId, brandId, format }`; returns `{ angles[], trending[], pillars[] }`. Angles via `generateLovableText` with structured JSON validation; one retry on malformed output, never blank cards.
- Trending: live web search scoped to the brand niche/audience over the last ~30 days. Needs a search connector (Perplexity or Firecrawl) — I'll check existing connections first and ask to connect one if none; if unavailable the "Trending now" row is hidden and the rest works.
- `inspo-repurpose.ts` and `post-repurpose.ts`: accept `angle: { text, kind: "suggested"|"trending"|"pillar"|"custom"|"keep" }` (zod, max length); inject `brandRealityBlock` + the chosen angle; viral rule text updated so the angle replaces "choose the new topic yourself". Keep anti-slop + surgical repurposeRules; still no full scripting envelope.
- Angle + brand block saved into the session's `briefSnapshot` so History/continuations stay consistent.
- UI: shared `RepurposeFlow` modal (format -> angle) used by `InspoBankMode` and `HomePostsFeedModal`, replacing their separate pickers; same button styling, single-flight lock while loading.
- Tests: brandContext fields, angle request validation, own-post "keep" leaves rules unchanged, viral angle is injected while hook/beat rules remain.
- AGENTS.md: one rule — repurpose calls take a user-chosen angle and the shared brand-reality block.
