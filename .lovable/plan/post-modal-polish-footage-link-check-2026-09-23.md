# Post modal polish + footage link check

## 1. Are the text fields saving to the right place?

Checked against the content table. Result:

| Field in the modal | Where it is saved | Status |
| --- | --- | --- |
| Post name | Name | correct |
| Post type / Posting date / Platform | Post Type / Posting date / Platform | correct |
| Visual hook + Script (talking video) | inside the single Script Text field, kept apart with labels | works, no separate columns exist |
| Text overlay (BROLL) | inside Script Text, labelled | works |
| Slides copy (carousel) | Slides Copy | correct |
| Slide copy (graphic) | Cover Copy | **wrong** — will be changed to Slides Copy |
| Captions per platform | IG / FB / TikTok / YouTube Captions | correct |
| Footage link | Google Drive to RAW Files | correct |
| Delivered link | Edited File | correct |

Only one fix needed: the graphic "Slide copy" box will write to Slides Copy so it matches carousels and is not mixed up with cover text.

## 2. Modal presentation

- **Platform** becomes a single dropdown that allows several choices at once, showing "Instagram, TikTok" style summary text instead of a row of chips. Built on the existing branded dropdown so it matches the rest of the app, with a tick next to each chosen platform.
- **Fixed size** — the modal keeps one height across Script, Media and Comments, so switching tabs no longer makes it jump or resize. The content area scrolls inside it.
- **Tabs** stretch evenly across the full width of the card, centred, with darker and slightly bolder text; the active tab keeps its indigo underline.
- **Status** below the title becomes a coloured chip that is still clickable to change the status — the colour follows the status (red for to-film stages, amber for in progress, green for approved/posted, grey for the rest), matching the dots already used in the table.
- **Backdrop shading** — header and footer of the modal stay white, the middle (tab content) sits on a pale grey so the reading area is visually separated. Input boxes stay white against it.

## 3. Check the footage link before an edit request

Before "Risevoice request" or "Do it myself" is accepted in the production review card, the pasted folder link is checked:

- A new check runs on the server: it reads the folder or file id out of the link and asks Google Drive whether it can be opened and whether it actually contains files.
- Possible outcomes shown to the client, inline under the footage row:
  - link cannot be read (private / wrong link) → "We can't open that link. Set sharing to anyone with the link."
  - folder opens but is empty → "That folder has no files in it yet."
  - link is not a Drive link → allowed through, with a note that we can't verify it.
  - all good → a green "Folder found, N files" line and the request proceeds.
- While checking, the buttons show "Checking your footage…" and are disabled. The check also runs once when the card opens and a link is already stored, so the client sees the state up front.

## Technical notes

- `src/components/slate/ApproveAndPostMode.tsx`: multi-select support added to `BrandSelect` (or a small `BrandMultiSelect` next to it), fixed modal height (`h-[92vh]` shell, scrolling body), full-width `flex-1` tab buttons, status chip variant in `ClientStatusSelect`, `bg-[#F7F7F9]` body with white header/footer, graphic copy bound to `slidesCopy`.
- New route `src/routes/api/check-footage-link.ts`: access-code protected POST, extracts Drive id, uses the existing service-account headers from `src/lib/googleDrive.server.ts` to call `files.get` and `files.list` with `supportsAllDrives`, returns `{ status: "ok" | "empty" | "unreachable" | "unknown", fileCount }`.
- `ProduceReviewModal.tsx` calls that route on open and on submit; `canSubmit` gains the check result.
