# Priority board, Stories removal, and clipping/editing alignment with n8n

## 1. Posting options
- Remove "Instagram Story" and "Facebook Story" from the format choices. Cards that already have a Story format saved keep it until edited, but it can't be picked again.

## 2. Home board ("Priority")
- Rename "Needs your attention" to **Priority**.
- Columns, named exactly like the planner statuses: **Prepare Footage**, **To Edit**, **To Design**, **Approve**, **Ready to Post**.
- The "Ready to Post" column holds cards whose status is the planner's "Ready to Post" / "To Post". I'll check the exact status name in the Client Status field first and use that everywhere (board, drop target, the posting gate).
- Dropping a card into a column writes that column's exact status.
- **Cards not opening:** reproduce in the browser first and find the actual cause (most likely the post window only looks up the card in its own loaded list, or closes itself before the card is set). Then fix it so clicking a card opens the same post window on top of Home, without leaving Home. If the card isn't in the loaded list, it gets fetched directly by its id (ownership still checked).

## 3. Clipping (podcast scripts callback v3.3)
Trigger, webhook URL, shared key, job tracking and callback endpoint stay as they are. Only the result reading and saving change.
- Read the new fields for each script: `text_overlay`, `timestamps`, `creative_direction`, `captions.instagram/facebook/tiktok/youtube`, and keep `visual_hook` and `speech_only_text`.
- Save each one to its own Client Content field:
  - B-roll: Text overlay, Timestamps, Creative Direction, four caption columns. No spoken script.
  - Talking Clip: Visual Hook, Script Text (speech only), Timestamps, Creative Direction, four caption columns.
  - CTA Copy only when provided.
- Stop building our own Creative Direction from duration/speaker/excerpt notes when n8n sends one; older results without the new fields still load the way they do now.
- Timestamps: one range per line (`00:03:40-00:03:58`), splitting n8n's `;` separated ranges.
- Review flags stay visible to the reviewer (in the clip card), not mixed into Creative Direction.
- Retried callbacks don't create duplicate records and don't clear fields edited by hand.
- Make sure nothing in the checks or saving step strips the new fields.

## 4. Editing (Edit Yourself, status-driven)
Prepare everything but keep it **switched off** until you confirm the Airtable automation and n8n reader are connected. At the switch, direct n8n calls stop and Airtable takes over, never both.
- Four exact editing styles: `BROLL`, `Talking Video`, `B-roll from long form`, `Talking video from long form` (the old long-form labels map to these). If a choice is missing in Airtable, show which one instead of using another.
- Write a `video_edit` snapshot (version 1) into **Editing preferences**, keeping other saved preferences (non-JSON text kept as `legacy_text`):
  - B-roll from long form: source video, 1–12 timestamp ranges (each 3s or more, end after start), on-screen text, optional CTA, text position (top/center/bottom), duration 5–15s (default 10), music only when picked.
  - Talking video from long form: source video, one start/end (10 min max), hook and CTA required.
  - Ordinary BROLL (up to 3 clips) and Talking Video (up to 10 clips): clips with durations, hook, CTA, picked music/text position.
- Fill the readable fields too: Raw clip 1–3, Text Overlay, Visual Hook, CTA, Text position, Music reference.
- Save everything in one write with Status "To Edit" (only after uploads finish), one Original request link, one User, Brand link.
- Status shown on the card: To Edit = Queued, Editing = Processing, Edited + video = Ready, Error = friendly message. Checked every 10 seconds, resumes after reload, no double submits, retry only from Error/Edited.
- Long form timestamps come from the card's Timestamps field: all lines for B-roll, the first range for Talking video (you'll be asked to confirm if there are several).

## What I need from you
- Tell me when the Airtable "To Edit" automation is connected so I can switch editing over and run one test request.
- After publishing, run one long form request so we can check every field lands in Client Content.

## Technical details
- `postTargets.ts`: drop Story formats; `plannerStatus.ts`: five stages, exact statuses; update `plannerStatus.test.ts`, `postTargets.test.ts`.
- `HomeMode.tsx` board; `ApproveAndPostMode.tsx` modalOnly open fix (fetch by id via `dwy-client-content` when missing from items).
- `podcastJobs.server.ts`: extend `brollScript`/`talkingScript` schemas, map new fields in piece builder and `saveCallbackPieces`; `longFormClipper.ts` ShortPiece gains captions; fixture `completed.json` v3.3 + tests in `podcastJobs.test.ts`.
- New `src/lib/slate/videoEditInput.ts`: builds/validates the `video_edit` object and merges Editing preferences; tests per format rule (range counts, 3s min, 5–15s, 10 min, 240 chars).
- `dwy-edit-yourself.ts` / `longFormTypes.ts`: new style names, snapshot write, status polling; dispatch switch behind a server flag `EDIT_DISPATCH_MODE` (default `direct`).
- Update AGENTS.md rule on Edit Yourself dispatch.
