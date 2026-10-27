# Bank of Inspo: silent videos, topic-free analysis, hidden title

## 1. Read on-screen text when a video has no speech
- If transcription returns no speech (or only music/lyrics), the video gets read visually: its on-screen text is extracted across the clip, not just from the cover frame.
- The progress line updates from "Transcribing video" to "Reading on-screen text".
- That on-screen text becomes the post copy and feeds the "Why it works" analysis, the same way carousel slide text does.
- If visual reading isn't possible, it falls back to the cover frame plus the caption, and the window says the reading was partial.

## 2. Topic-free "Why it works"
- Hook template uses neutral placeholders only, e.g. "Stop doing [common habit] if you want [desired result]". It never names the post's subject, niche or product.
- Beats describe the structure and the psychological job of each beat (pattern interrupt, tension, proof, payoff, loop back). They never retell what the post said.
- The analysis also notes the framework used (e.g. list, myth vs truth, before/after) and why its statements are powerful, phrased so it can be applied to any industry.
- A check rejects or redoes results where the hook template or beats repeat distinctive words from the post's own text.

## 3. Post title is no longer a visible field in Add inspo
- The Add inspo window shows Post URL and Platform first. The title is created automatically by the reading and is still saved.
- If reading fails, the title comes from the post copy or the creator handle, so saving still works. It remains editable afterwards in the table.

## Technical details
- Silent-video detection: transcript empty or under a few words, or flagged as lyrics/no speech by the analysis prompt.
- Visual reading: first confirm a video-capable model is available on the AI gateway, then send the downloaded video for on-screen text extraction. If none is available, send the cover plus any frame images the scraper provides.
- Add an `isTopicFree` check in `src/lib/slate/inspoRead.ts`. It flags distinctive (non-stopword) words that the post copy shares with the hook template or beats, and triggers one corrective re-ask.
- Form validation: the title becomes server-derived (`derivePostTitle` fallback) rather than required from the dialog.
- Tests cover: the silent-video branch switches to visual reading, the topic-free check flags leaked subject words, and saving without a typed title still produces a title.
