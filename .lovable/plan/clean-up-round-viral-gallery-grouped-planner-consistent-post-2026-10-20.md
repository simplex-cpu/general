# Clean-up round: viral gallery, grouped planner, consistent post windows

## 1. Find Viral Posts becomes a gallery
- Replace the viral posts table with the same post card used in "See all posts": thumbnail (full height, wider), posted date, format, topic, stats row, collapsible hook.
- Each card keeps the creator handle (with platform icon) and the Discard button; existing open/repurpose actions stay.
- Cards sit in a responsive grid (1 column on phone, 2–3 on desktop).

## 2. Planner always grouped
- Rows are always grouped; the "ungrouped" option is removed.
- In Prepare Footage, groups are by type (Talking Video, B-roll, Carousel, Graphic). Other stages keep their current grouping.

## 3. One consistent post window everywhere
Audit every post/review window (planner post, Produce/Review, Approve & Post, Edit Yourself, Request Edits, Long Form Clipper pieces, Repurpose result) and make them share one layout:

1. **Slides copy** – collapsible section (closed by default when long).
2. **Script area** – Talking Video shows Visual hook + Script; B-roll shows Text overlay. Always visible.
3. **Captions & hashtags** – collapsible, same style as slides copy.
4. **One "Attach" box** – replaces "Attach raw footage" and "Attach more". A single clean drop area that accepts files or a Drive/Dropbox link, with attached items listed inside the same box. Light gray, soft shadow, no nested boxes.
5. **Media in carousel mode** – all attached/produced media shown in the shared carousel viewer with arrows and dots.
6. **Correct social sizes** – videos and Reels shown and produced at 9:16 (1080x1920); carousels and graphics at 4:5 (1080x1350). Previews use the same frames, and AI/template designs export at those sizes.

## Technical details
- Extract shared pieces into `src/components/slate/post/`: `CollapsibleCopy`, `ScriptBlock`, `AttachBox`, `MediaCarousel` (built on SlideCarousel), and reuse FeedRow card from HomePostsFeedModal as `PostCard`.
- InspoBankMode table (line ~452) swapped for a PostCard grid with a handle + discard slot.
- ApproveAndPostMode: drop the group-off toggle; Prepare Footage group key = normalized format.
- Replace attach buttons in ApproveAndPostMode (~1739/1759) and ProduceReviewModal (~986) with AttachBox; link input reuses the existing footage link check.
- Add `SOCIAL_SIZES` constants (reel 1080x1920, feed 1080x1350) used by designFrames, aiDesign export and video stage; test asserting those values.
- Record the shared post-window rule in AGENTS.md.
