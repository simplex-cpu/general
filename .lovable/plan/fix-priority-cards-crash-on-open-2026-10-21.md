# Fix: Priority cards crash on open

## Cause (confirmed)
On Home, the code that builds the card's starter data (title, status, date) reads the list of cards you dragged to a new column. But that list is created a few lines further down. So when you click a card, the app reaches for something that doesn't exist yet and the whole screen shows "Cannot access 'moved' before initialization".

## Fix
1. Move the "dragged cards" list above the starter-data code in Home, so it exists first.
2. Make the starter data refresh when the cards list loads or a card is dragged (right now it only updates when a different card is clicked, so it could show an old status).
3. Check the rest of Home and the post window for the same mistake (anything used before it's created).

## Verify
- Sign the preview in and click several Priority cards: each opens on the first click with title/status shown, then details fill in.
- Drag a card to another column, then open it: the window shows the new status.
- Open a card from the Planner to confirm it still works.
- Build log clean, existing card-loader tests pass.

## Technical details
- `src/components/slate/HomeMode.tsx`: move `const [moved, setMoved] = useState(...)` (line 94) above the `modalStarter` useMemo (line 91); change deps to `[modalPostId, content.data, moved]`.
