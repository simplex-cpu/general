# Finish Batch 4: n8n handoff guide and live verification

## Goal
Complete the final long-form batch: give you a precise n8n field-by-field guide, then run the live owned-record verification against your real long video once you share the access code.

## Part 1 — n8n production handoff guide
Write `docs/n8n-production-handoff-guide.md`, a field-by-field mapping your n8n work can follow without touching the app:

- **Client Content (podcast-clip records):** `Clipper operation key` (`shortform:<record id>`) — process each key once; `Short forms` and `Long forms` links; `Format`; `Visual Hook` (editorial hook, never recorded speech); `Creative Instructions` — includes source ranges and confirmed speaker names to interpret for cutting and attribution.
- **Edit Yourself (DIY podcast requests):** `Source speech` — the exact retained spoken words for subtitles (use this when present, otherwise fall back to the original timed segment ranges); `Source cuts` — JSON array of ordered time ranges to cut from the long video, in order; `Request ID` — idempotency: process each request exactly once and write output/status back to the linked Content record.
- **Rules for the sequence:** cut `Source cuts` in order; subtitles derive from `Source speech`; keep the Visual Hook separate from recorded speech; never append a spoken CTA; confirmed speaker names apply to attribution only, never rewrite the transcript.
- **Regular (non-podcast) content:** unchanged — existing workflows keep working as before.

## Part 2 — Live Batch 4 verification (needs your access code)
Once you paste your access code in chat, I use it once to sign in to the app in the test browser and:

1. Open the existing owned long video and inspect its stored transcript, speaker names and coverage evidence.
2. Read back the saved short-form pieces (BROLL, Talking Video, Graphic, Carousel) and compare speech, quotations, attribution and cut ranges against their own source transcript.
3. Exercise edit/save, speaker correction, cleanup restore, delete-without-replacement, and interrupted continuation.
4. Run Add to board for both queue and produce-now choices, then read back the linked Client Content / Edit Yourself records with `Source speech`, `Source cuts`, `Clipper operation key` and selected branding intact.
5. Check the clipper interface on desktop and phone sizes: progress, completion, error recovery and long-transcript scrolling.

The access code is used only to sign in for these checks; it is never echoed back or stored anywhere.

**Completion check:** the guide exists and matches the fields the code actually writes (verified against the handoff code); live checks read back real owned records correctly; the report states plainly what is verified live vs. what stays blocked (real multi-hour transcription coverage depends on your recording, and n8n rendering itself stays outside this app).
