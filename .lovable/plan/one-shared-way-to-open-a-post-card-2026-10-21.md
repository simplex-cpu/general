# One shared way to open a post card

## Goal
Priority board cards and Planner cards open through the exact same loading code, so a card opens instantly and behaves identically everywhere, without leaving Home.

## What changes for the user
- Clicking a Priority card shows the card window right away with its title, status, format and date already filled in.
- The rest of the card (script, media, captions, comments) fills in a moment later, in place, instead of a full "Opening card…" wait.
- If loading fails, the card shows a small inline "Couldn't load details — Try again" line instead of a blocking spinner.
- Planner and Priority cards look, save and refresh the same way.

## Steps
1. Create one shared card loader used by both Planner and Home: fetch one record by id, with the same timeout, busy-Airtable handling and ownership check.
2. Planner: when a row is opened, use the shared loader to refresh that record (the list data is shown instantly meanwhile).
3. Home: pass the board card's known data (id, title, status, format, created date, brand) as a starter so the window opens immediately, then the shared loader fills the rest.
4. Remove the special Home-only loading branch and the full-screen "Opening card…" overlay.
5. After saving or dragging, both screens update from the same returned record so the board and the card never disagree.

## Technical details
- New `src/lib/slate/contentCardLoader.ts`: `loadContentCard(id, accessCode, signal)` wrapping `GET /api/dwy-client-content?id=` with 20s abort and typed errors (busy / not found).
- `ApproveAndPostMode`: accept `initialItem?: Partial<Item>`; in `modalOnly` render the draft immediately from it and merge the loaded record; drop the separate single-fetch effect. Planner row open calls the same loader to refresh the selected item.
- `HomeMode`: pass `initialItem` built from `MetricsPost`; remove opening overlay; apply returned item on save/drag.
- Server route unchanged (single-record read already fixed).
- Add a small test for the loader's error mapping and the starter-merge (loaded fields win, starter fills gaps).
