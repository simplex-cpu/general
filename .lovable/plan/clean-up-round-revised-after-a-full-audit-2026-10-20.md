# Clean-up round (revised after a full audit)

## What the audit found
- **Find Viral Posts** is a 10-column table. Its "discard" is the trash button, which asks "Delete this inspo?" first.
- **Planner grouping:** Approval is grouped by Videos/Images, and Production by To Edit/To Design/Editing/Designing. **Prepare Footage and every other tab are one flat list.** You can't turn grouping off; groups only expand and collapse.
- **Slides copy** folds away only in the planner post window. Produce/Review, Do It Myself and the Repurpose result show every slide open, all at once.
- **Captions & hashtags** appear only in the planner post window, and they never fold away. Hashtags have no field of their own anywhere except the posts feed.
- **Attaching media** works five different ways:
  - Planner: a link box, an "Attach raw footage" button and an "Attach more" button
  - The planner also has a separate "Attach" picker with its own link box
  - Produce/Review: a Drive-link box, an "Attach footage" button and an "Attach raw footage" button
  - Do It Myself: three "Raw clip" link boxes, behind a "Share a Drive link instead" switch
  - Request Edits: the same switch with one link box
- **Media display:** the planner shows images in a carousel but shows videos, and a mix of videos and images, in a grid. The carousel doesn't keep the 4:5 post shape, and videos aren't held at 9:16.
- **Sizes:** designs are already exported at 1080x1350 (4:5), and the video style preview is 9:16. The app doesn't set the finished video size. Editors and the production automation decide it.

## 1. Find Viral Posts becomes a gallery
- Swap the table for the "See all posts" card. Each card shows the thumbnail (taller and wider), title, posted date, format and topic. It keeps the creator handle with the platform icon, and "Why it works" and the hook sit in a section you can open.
- Each card's corner has Open, Repurpose and **Discard**. Discard is the current delete, with its confirmation step.
- Status shows as a small label on the thumbnail. Platform shows as the icon next to the handle.
- Layout: 1 column on phone, 2 on tablet, 3 on desktop.

## 2. Planner always grouped
- Every tab is grouped. Prepare Footage groups by type: Talking Video, B-roll, Carousel, Graphic. Any other flat tab (for example Posted or Scripting) also groups by type.
- Groups start collapsed, as they do now.

## 3. One consistent post window
This covers the planner post window (which Long Form Clipper pieces also use), Produce/Review, Do It Myself, Request Edits and the Repurpose result.
1. **Slides copy:** one "Slide 1…N" section where each slide opens on its own, used everywhere, including the Repurpose result and Do It Myself.
2. **Script area:** always open. Talking Video shows Visual hook, then Script. B-roll shows Text overlay. A single graphic shows Text on screen.
3. **Captions & hashtags:** each platform's caption opens on its own, and hashtags get their own line. The Repurpose result gets the same section.
4. **One "Attach" box:** it replaces every button and box listed above. It's a single soft-gray area with a light shadow, labelled "Attach". Click it or drop files, or paste a Drive/Dropbox link into the same box. Files and links are listed inside it, each with a remove button. The existing link check and upload progress still apply. Do It Myself's three "Raw clip" boxes become one box that takes several links.
5. **Carousel display:** produced and attached media always use one carousel with arrows, dots and thumbnails. That includes videos and a mix of videos and images.
6. **Social sizes:** previews are framed at 9:16 for videos/Reels and 4:5 for carousels and graphics. Designs keep exporting at 1080x1350. Video requests sent to production will state 1080x1920 (9:16). The app can't resize a finished video, so footage that isn't 9:16 gets a "Not 9:16" note in the preview.

## Not changing
- Request Edits stays a form. It only gets the new Attach box.
- Bank of Inspo's Add and Repurpose windows only get matching styling.

## Technical details
- New `src/components/slate/post/`: `CollapsibleSlides` (generalized from CarouselCopyEditor), `CaptionsBlock`, `ScriptBlock`, `AttachBox` (files + links, wraps existing upload/link-check handlers), `MediaCarousel` (SlideCarousel extended to video and fixed aspect frames).
- `PostCard` extracted from HomePostsFeedModal FeedRow with slots for handle/actions; used by HomePostsFeedModal and InspoBankMode.
- `plannerPresentation.ts`: default grouping by normalized format for non-approval/production tabs; add tests.
- `src/lib/slate/socialSizes.ts`: `REEL = 1080x1920`, `FEED = 1080x1350`; used by DesignPreview, designFrames, aiDesign, StylePhonePreview, MediaCarousel and the production request payload; plus a test.
- Replace attach controls at ApproveAndPostMode ~1738-1760/1833/2096, ProduceReviewModal ~623-635/960-986, EditYourselfMode ~1472-1512, RequestEditsMode ~452-503.
- Add an AGENTS.md rule: post windows compose the shared `post/` blocks.
- Work in three batches (gallery + grouping, shared blocks + planner window, the other windows + sizes), running the tests after each.
