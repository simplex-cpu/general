# Bank of Inspo: read the post first, then save

## New flow in the Add inspo window
```text
Paste link -> Read post -> Review filled card -> Save (or Discard)
```
1. **Paste link.** Only the Post URL is needed to start. A "Read post" step begins automatically once a valid Instagram/TikTok link is pasted.
2. **Basics.** The system detects platform and creator handle, fetches posted date, caption and media.
3. **Content reading.** Videos are transcribed; graphics and carousels have their on-image copy read from the images (every carousel slide, not just the cover).
4. **AI analysis.** One AI call reads the transcript/copy and returns:
   - **Post title** — a short brief of the post.
   - **Format** — one of Talking Video, B-roll, Carousel, Graphic.
   - **Topic**.
   - **Why it works** — the hook template (e.g. "Stop doing X if you want Y") plus the beats that likely made it go viral, as a short list.
5. **Review.** All fields appear filled in the same window, each editable, with a clear step-by-step progress line (Reading post, Transcribing / Reading slides, Analyzing). Save stays disabled until reading finishes or fails. Nothing is written to Airtable before the user clicks Save; Discard closes without saving.

## Failure handling
- If any step fails, show which step failed and leave the remaining fields editable; the user can fill them and still save (URL, title and platform required).
- Unsupported platforms skip straight to manual fields.
- Changing the URL cancels the previous reading so stale results never fill the card.

## Saving
- Save writes all fields, including transcript/copy into Post Copy, in one Airtable record. The previous "save first, patch later" enrichment is removed.

## Cost
- Each read uses the scraping service, one transcription or image reading, and one AI analysis call. Repeated reads of the same URL in the session are cached.

## Technical details
- New server endpoint `/api/inspo-read` (access-code gated) chaining: existing single-post Apify lookup -> transcription via the existing `/v1/audio/transcriptions` pattern from `scrape-posts.ts` for videos, or vision reading of slide/image URLs for graphics/carousels -> one structured-output analysis call (default Responses model, strict JSON schema with title, format enum, topic, whyItWorks).
- Extract the transcribe helper from `scrape-posts.ts` into a shared server module rather than duplicating it.
- Stream progress events (SSE) so the dialog shows each step; no artificial timeouts.
- Remove the pending-lookup patch logic in `InspoBankMode.tsx`; dialog holds the full draft until Save.
- Tests: analysis response validation (format limited to the four options, non-empty why-it-works), video vs graphic branch selection, and save payload containing all read fields.
