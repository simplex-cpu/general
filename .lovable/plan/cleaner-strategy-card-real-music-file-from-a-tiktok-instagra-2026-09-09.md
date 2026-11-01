# Cleaner strategy card + real music file from a TikTok/Instagram link

## 1. Remove the confusing counters

On the strategy card, drop the two small pills ("1 to double down on", "4 to avoid"). The strategy text and its labelled sections stay exactly as they are.

## 2. Turn a music link into an actual audio file before the request is created

In the "Do it myself" request form, the Music field becomes a link box that produces a real audio file:

1. You paste a TikTok or Instagram post link.
2. The app fetches that post, pulls the sound, and turns it into an `.mp3`.
3. A small row appears under the field: "Preparing audio…", then the file name with a play button (you can listen to check it is the right sound) and an option to remove it and paste another link.
4. The Submit button stays disabled while the audio is being prepared, so the record is only created once the audio file exists.
5. On submit, the audio file is attached to the new "Music" file field on the request, and the original link is still saved as the reference. The record is created with the file already attached, so the editing automation sees it immediately.

If a link cannot be read (private post, wrong URL, deleted post), you get a plain message asking for another link, and submit stays blocked until a valid one is prepared or the field is cleared.

## Technical notes

Strategy card: delete the do/don't count pills block in `StrategySummaryBody` (`src/components/slate/StrategyStrip.tsx`) and the now-unused count helpers.

New route `src/routes/api/music-extract.ts` (access-code protected), POST `{ url }`:
- Detects platform from the URL. TikTok: run `clockworks~tiktok-scraper` on the single post URL and read `musicMeta.playUrl` — this is already an audio-only file, so it is used directly. Instagram: run `apify~instagram-scraper` on the post URL and read `videoUrl`. Reuses the existing `APIFY_API_TOKEN` and the run/poll helpers pattern from `scrape-posts.ts`.
- Returns `{ kind: "audio" | "video", mediaUrl, title }`. Nothing is stored yet.

Audio extraction: the server runtime has no ffmpeg, so conversion happens in the browser. New `src/lib/audioExtract.ts`:
- Fetches the media bytes through a small server proxy route (`/api/music-extract?fetch=...`) to avoid CORS on Instagram/TikTok CDNs.
- Decodes with `AudioContext.decodeAudioData` (works for mp4 and mp3 payloads) and encodes to MP3 with `lamejs` (pure JS, added via `bun add lamejs`), mono, 128 kbps.
- Produces a `Blob` plus a filename such as `trending-audio-<shortcode>.mp3`.

Upload and attach:
- The MP3 is uploaded with the existing direct-to-Drive path (`src/lib/driveDirectUpload.ts` + `/api/drive-upload-session`), giving a public file URL.
- `EditYourselfMode.tsx` holds `musicFile` state (`{ status: "idle" | "working" | "ready" | "error", url, filename, error }`), triggered on blur/paste of the music link. `canSubmit` requires `musicFile.status !== "working"` and, when a link is present, `status === "ready"`.
- The submit payload carries `musicFileUrl` and `musicFilename` alongside the existing `music` link.
- `src/routes/api/dwy-edit-yourself.ts`: add `FIELD_MUSIC_FILE = "Music"` (attachment). Create that field on the Edit Yourself table if missing, and set it as `[{ url, filename }]` in the same create call that makes the record, so the automation trigger fires with the file attached. `Music reference` keeps the link.

## Verification

- `bunx tsgo --noEmit`.
- Paste a public TikTok link and an Instagram reel link, confirm the player appears, submit is blocked until ready, and the created Airtable record has a playable MP3 in the Music field.
