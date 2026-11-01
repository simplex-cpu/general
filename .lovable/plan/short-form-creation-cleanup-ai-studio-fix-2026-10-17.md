# Short form creation cleanup + AI studio fix

## 1. Remove "AI generated" option
In the Long Form "Create short forms" chooser, drop the "AI generated" card. Remaining options: AI studio and Manual.

## 2. Remove Carousel and Graphic counts from AI studio
Delete the two disabled "Carousel" / "Graphic — Not supported" boxes. The studio form shows only B-roll and Talking Clip counts, plus optional Audience and CTA. The request still sends carousel/graphic as 0 (required by the v1 contract).

## 3. Fix "name.trim is not a function"
Cause: when the studio panel builds the speaker list, a speaker label or saved speaker name can come through as a non-text value (for example a numeric speaker id from transcription), and the code calls `.trim()` on it.
Fix: convert every speaker label, saved name and bio to text before trimming — in the studio panel speaker setup, the save step, and the matching server-side roster builder — so the panel opens and Generate works.

## Technical details
- `src/components/slate/LongFormClipperMode.tsx`: remove the `genMode "ai"` card (line ~717) and the Carousel/Graphic map (line ~776); wrap labels/names in `String(...)` in the studio speakers effect (~464-474) and submit (~452).
- `src/lib/podcastJobs.server.ts`: `String(...)` coercion in `speakerRoster` / segment speaker mapping.
- Run `bun test src/lib` (podcast tests).
