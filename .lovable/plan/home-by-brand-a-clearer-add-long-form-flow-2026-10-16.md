# Home by brand + a clearer "Add long form" flow

## 1. Home — Performance: "Your top performing topic"
- New small section inside the Performance card, under the totals: the topic with the highest average views for the chosen platform and period, with how many posts it's based on and the runner-up.
- If no posts in the period have a topic yet, it says so plainly instead of guessing.

## 2. Home — brand dropdown
- One "Brand" dropdown in the welcome row (All brands + each owned brand). It filters only **Performance** and **Growth Path**; Needs your attention and Community stay general.
- Defaults to All brands; the choice is remembered on this device.

## 3. Add long form — a guided 3-step window
Today everything is one long form with pre-filled choices ("Transcribe" chosen twice, "What's next" already set). It becomes three short steps with a step indicator at the top (1 Source, 2 Speakers, 3 Next step). Nothing is pre-selected; every required choice shows a red asterisk and Continue stays disabled until it's filled.

**Step 1 — Source**
- Footage link* (with the existing folder handling and mixed-audio link).
- "Do you already have a transcript?"* shown as two cards: **Transcribe it for me** / **I have a transcript** (the file drop appears only for the second).

**Step 2 — Speakers (optional, skippable)**
- Name + short bio per speaker, explained as "helps us label who is talking and quote them correctly".

**Step 3 — What happens after?***
- Two cards: **Just save it** ("you can create short forms later") / **Create short forms now**.
- Create now reveals the format counts and the CTA (both required, CTA empty by default).
- A short summary of choices above the final button; the button names exactly what will happen ("Transcribe & save", "Transcribe & create 4 short forms", "Save transcript", etc.).
- Back works on every step; nothing is lost going back.

**Long form window consistency**
- "Create short forms" uses the same empty-by-default, required-marked format counts and CTA.
- Progress screen keeps the existing step list, with plain step names (Saving, Transcribing, Writing short forms).

## Technical details
- Topic: verify which Content field holds the topic (likely "Topic" / pillar) and its brand link before building; add both to the `home.server.ts` field list and `MetricsPost`, then a `topTopic()` helper in `postMetrics.ts` with tests (highest average views, ties by count, empty topics ignored).
- Brand filter: read the Content record's brand link; check whether milestones carry a brand link. If milestones are not brand-specific, Growth Path filtering is limited to what the data supports and I'll report it.
- Brand list from the existing owned-brands source (`BrandSelect`).
- Add-long-form: refactor `AddLongFormDialog` state to `source: "" | ...`, `mode: "" | ...`, a `step` index and per-step validation; request payload unchanged.
- Update `roadmap.md`.
