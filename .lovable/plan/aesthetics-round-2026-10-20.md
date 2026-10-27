# Aesthetics round

## My Brand: Brief
1. Text boxes grow to fit all their text, with no inner scrolling.
2. The brief uses the full screen width; only the small left rail stays.
3. Brand name and Niche/Industry sit on separate rows.

## My Brand: Visual Style
1. Uses the full screen width.
2. More space between sections. Main section labels (Fonts, Colors, Cover/Slides/Closing…) are bigger and bolder.
3. Renamed: "Ink over footage" becomes "Text color over footage", and "Ink over light" becomes "Text color over light".
4. Gradient becomes a small color picker like the others, on the same row as Brand color.

## Community
1. Posts stay left-aligned. The composer and both rows of tabs stretch across the full width.
2. "Strategy ideas" becomes "Risevoice news", including the badge on posts.
3. "Ask your team" becomes "Ask support".

## Find Viral Posts
1. Smaller cards: 4 to 5 per row on desktop (2 on phone, 3 on tablet). Thumbnails are a bit shorter and the text smaller.
2. Thumbnails: the cause isn't confirmed yet. Likely causes are older saved posts with no thumbnail (the field is new) and Instagram/TikTok image links that expire or block outside sites. Fix:
   - First check the saved posts to see which are missing a thumbnail and which have a broken one.
   - Save a lasting copy of the image when a post is added.
   - Fill in missing thumbnails for existing posts from the post link.
   - If an image still fails, show the placeholder instead of a broken image.
3. Stats: each card shows Views, Likes and Comments in one compact row. The numbers are saved when a post is found or added, using new number fields in the viral posts table. Posts saved before this show "—".

## Home: Performance card
- The "i" helper moves next to "Last update", and its separate row is removed.

## Technical details
- `BriefMode.tsx`: remove the `max-w-6xl` limit and use small side padding. Text areas auto-size from their content height. Name and niche go in single-column rows.
- `VisualStylePanel.tsx`: remove `max-w-3xl`. Use `space-y-12` between sections and `text-sm font-semibold` labels. Rename the two labels. Gradient becomes the shared compact color control, placed in the brand-color row.
- `CommunityMode.tsx`: the composer and tab wrappers lose `max-w-5xl`; the feed list keeps it, left-aligned. Rename the labels here and in `learning/TeamChat.tsx`.
- `InspoBankMode.tsx`: grid becomes `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5`. Add an `onError` fallback and a stats row.
- Thumbnails: `inspoBank.server.ts` / `inspo-find.ts` upload the image as an Airtable attachment. A one-time backfill uses `inspoMetadata.server.ts` for rows with no thumbnail.
- Stats: add Views, Likes and Comments number fields to DWY Bank of Inspo. Map them in `inspoBank.ts` and the server read/write, filled from scraped metadata.
- `HomeMode.tsx`: move the Info popover into the Last update line.
