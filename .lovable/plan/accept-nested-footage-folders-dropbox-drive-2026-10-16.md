# Accept nested footage folders (Dropbox / Drive)

## What I found in your link
It's a podcast studio export ("Kash R – Session 11.10.2026", from Poddster), 184 GB in total:

```text
Kash R - Session ... /
  Audio/  Stereo Mix.wav (2.0 GB), Track1-Combo 1.wav (1.0 GB), Track2-Combo 2.wav (1.0 GB)
  C1/     C8915.MP4 (55.9 GB)   camera angle 1
  C2/     C8915.MP4 (55.9 GB)   camera angle 2
  C3/     C8904.MP4 (55.9 GB)   camera angle 3
```

What this means:
- **Transcription:** we never need the cameras. `Stereo Mix.wav` has everyone's voice and is small enough to transcribe directly. It's the best source.
- **Storage:** copying 168 GB of raw camera files into Drive for every episode isn't practical (time, cost, and Drive quota). For folders like this, the folder link itself stays as the stored footage, and editors open it directly. A Drive copy is only made for single videos up to 5 GB, such as YouTube links.
- **Camera files:** the app can't play, preview or transcribe the 56 GB camera files. They're passed to the editor as-is.

## What to ask clients for
1. **Footage link:** the shared folder or file, set to "Anyone with the link can view". Dropbox and Google Drive, both folders and files, plus YouTube.
2. **For multi-camera folders:** a mixed audio track (a "Stereo Mix" or "Program" WAV/MP3) inside the folder. If there's no mix, one full-length camera file with good audio.

## What we can't accept
- Links that need a login or permission request (private Drive, Dropbox "invite only").
- iCloud, WeTransfer or other expiring links. They stop working before editing is done.
- Folders with no audio file and only huge camera files. Transcription would be unreliable and very slow.
- Separate per-person tracks only, with no mix. We'd transcribe one voice and miss the other speakers.

## Changes in the app
- **Add long form:** the Footage URL field accepts Dropbox and Google Drive folders. When a folder is pasted, the app checks it and lists what it finds:
  - It picks the mixed audio automatically: names containing "mix", "program" or "master", otherwise the largest audio file, otherwise the smallest full video.
  - It shows "Transcribe from: Stereo Mix.wav" with a dropdown to choose a different file.
  - If the folder can't be read (private or expired), it says exactly that and asks for a "view" link.
- **Long form detail:** **Footage** opens the original folder. A small "Transcribed from: Stereo Mix.wav" note shows the source file.
- **Produce now:** the footage link for clipped pieces is the folder, so editors get every camera angle.
- **Footage copy:** the Drive copy is skipped for folders and for files over 5 GB, and the button reads "Footage stored in Dropbox" or "Footage stored in Drive".

## Technical details
- New `footageSource.server.ts`:
  - Dropbox: list a shared folder with the Dropbox API `sharing/get_shared_link_metadata` and `files/list_folder` with `shared_link`. This needs a Dropbox app access token (one new secret, `DROPBOX_ACCESS_TOKEN`). Direct file URLs are built with `dl=1`.
  - Google Drive: list public folders through the existing Drive connector (`'folderId' in parents`).
  - The listing is recursive, up to 3 levels deep and 200 files.
- Pure helper `pickTranscriptionFile(files)` in `src/lib/slate/footageSource.ts`, with tests covering mix/program naming, largest audio, video fallback, and the per-person-tracks-only warning.
- The long form stores `Footage file` = folder link, plus a new `Transcription source` field (file name and direct URL). `startLongTranscription` receives the direct file URL instead of the folder URL.
- `startFootageCopy` runs only for single files of 5 GB or less, or YouTube.
- Record the footage-source rule in `AGENTS.md` and update `roadmap.md`.

## Needs from you
- A Dropbox access token, so the app can read shared folders. I'll open a secure form for it when building. Without it, Dropbox folders can't be listed, only single-file links.
