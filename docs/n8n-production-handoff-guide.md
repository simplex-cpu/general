# n8n production handoff guide — podcast clips from the Long form Clipper

This guide is for the n8n workflows that render podcast-clip content. The app writes the fields below; n8n reads them, cuts/renders, and writes results back. The app side is complete — nothing here requires app changes. Regular (non-podcast) content records are unchanged, so existing workflows keep working as before.

## Which records are podcast clips

A Client Content record created from the Long form Clipper has a **`Clipper operation key`** of the form `shortform:<short form record id>` plus **`Short forms`** and **`Long forms`** links. If `Clipper operation key` is empty, treat the record as regular content and use the existing flow.

## Client Content fields (read from)

| Field | Content | How to use it |
| --- | --- | --- |
| `Format` | BROLL, Talking Video, Graphic or Carousel | Picks the rendering branch |
| `Script Text` | Full copy: script/slides, then `Creative Instructions:` appended | Human-readable reference; the structured fields below are authoritative |
| `Visual Hook` | Editorial on-screen hook text | Overlay only. Never treat as recorded speech; do not add it to subtitles |
| `CTA Copy` | Talking Video only: user-supplied CTA | Overlay/caption only. Never append it to the recorded speech |
| `Creative Instructions` | Source ranges (segment IDs / timings) and confirmed speaker names | Use for cutting decisions and on-screen attribution |
| `IG Captions` / `FB Captions` / `Tiktok Captions` / `Youtube Captions` | Per-platform captions when generated | Posting copy only |
| `Cover Copy` / `Slides Copy` / `CTA Copy` / `Number of slides` | Carousel copy broken out per part; podcast carousels can have 8 slides | Render all slides listed, not a fixed 6 |
| `Clipper operation key` | `shortform:<record id>` | Idempotency key — process each key exactly once (see below) |
| `Short forms` / `Long forms` | Links to the source records | Provenance; use the Long form URL as the source media when needed |
| `Client Status` | e.g. To Film / Production / In production | Trigger and completion states |

## Edit Yourself fields (DIY video requests)

| Field | Content | How to use it |
| --- | --- | --- |
| `Request ID` | Stable unique ID | Idempotency — process each request exactly once |
| `Editing style` | BROLL / Talking Video / Graphic / Carousel | Rendering branch |
| `Source speech` | Exact retained spoken words (cleaned verbatim when cleanup was approved, otherwise original speech) | **Subtitle text source.** When present, use this for subtitles instead of re-transcribing |
| `Source cuts` | JSON array of ordered time ranges, e.g. `[{"id":12,"start":"00:12:34","end":"00:13:10","speaker":"Speaker 1","text":"..."}]` | **Cut list.** Cut the long video at exactly these ranges, in this order |
| `Visual Hook` | Editorial hook | Separate overlay; never spoken |
| `CTA` | Talking Video user CTA | Overlay/caption only |
| `Raw clip 1` | Footage link when the planner supplied one | Source media; otherwise use the linked Long form URL |
| `Slide copy 1..10`, `Number of slides` | Carousel copy per slide | Podcast carousels can exceed 8 — render `Number of slides` copies |
| `Instructions` | Creative instructions (source ranges, speaker names) | Attribution and cutting context |
| Brand fields + style snapshot fields | Selected brand links and request-scoped visual style | Request-scoped values override brand defaults |

## Sequence rules

1. **Cut exactly `Source cuts`, in order.** These ranges derive from provider word timing against the original transcript. Never estimate timestamps; never reorder.
2. **Subtitles come from `Source speech`** when present. If it is empty, fall back to the original timed segment ranges from `Creative Instructions` / the Short form record — do not re-transcribe.
3. **Keep the Visual Hook separate.** It is editorial on-screen text, never part of the recorded speech or subtitles.
4. **Never append a spoken CTA.** If `CTA` / `CTA Copy` exists it is overlay/caption text only.
5. **Speaker names in the instructions are confirmed attributions.** Use them for on-screen attribution; the original transcript itself is never rewritten.
6. **Process each record once.** Use `Clipper operation key` (Client Content) or `Request ID` (Edit Yourself) to detect and skip repeats — the app reconciles retried saves by these keys, so a repeated trigger may arrive with identical fields.
7. **Write results back** to the linked Client Content record (output attachment/link and status) so the app's planner reflects completion.

## Verification status

These fields are written and read back by the app and covered by controlled tests. End-to-end rendering through n8n is owned by the user-managed automation and is not covered by the app's verification.
