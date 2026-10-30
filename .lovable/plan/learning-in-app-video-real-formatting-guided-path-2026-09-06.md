# Learning: in-app video, real formatting, guided path

Four fixes: play the training inside the app, format the written content properly, break the milestone into clear steps instead of one wall of text, and give the whole section a premium, guided feel.

## 1. Watch the training in the app

The training files are real video files that can play directly in the page, so there is no reason to send anyone to another tab.

- The course view gets a proper player at the top: large rounded frame, the course thumbnail as the poster image, standard play/pause/volume/fullscreen controls.
- "Open in a new tab" stays available as a small secondary link for anyone who prefers it.
- If a course has no video, the space is used for the written lesson instead of showing an empty frame.

## 2. Real formatting for milestone and course text

The stored text is written in Markdown (headings, bold, bullets, numbered steps, quotes, links, tables, emoji). Today it is flattened, which is why it reads badly.

- Render it with a real Markdown renderer instead of the current hand-rolled line parser.
- Style it once as a shared "lesson text" style: clear heading sizes, comfortable line length and line height, spaced bullets and numbered lists, highlighted quote blocks, indigo links, and inline code/emphasis handled correctly.
- The same treatment applies to milestone overviews, mission notes and course instructions.

## 3. Clear sectioning instead of one long page

The milestone page becomes a guided path rather than a dump.

- Milestone header: name, due date, one progress bar, "X of Y courses complete".
- The overview collapses to the first few lines with a "Read more" toggle, so it never buries the steps.
- Each mission becomes its own collapsible step ("Step 1 · Mission name") with its own small progress indicator. The current step is open by default; finished steps are collapsed with a green check; locked steps are collapsed and greyed with a lock.
- Inside a step, courses are a numbered vertical list (thumbnail, name, duration-free status chip) rather than a loose grid, so the order to follow is obvious.
- The course page shows "Step 2 · Course 3 of 5" plus Previous / Next course buttons, so learners move through the path without going back to the list each time.

## 4. Premium look

- Path-style milestone list: each milestone is a wide card with its thumbnail, a soft gradient overlay, a numbered badge, the progress ring/bar and a clear "Continue" or "Start" action. A connecting vertical line ties them into one journey.
- A top summary strip: overall progress across all milestones, current milestone and next course to do, with one "Continue learning" button that jumps straight there.
- Consistent surfaces (white cards, soft borders, subtle shadow on hover), the existing indigo accent for actions and progress, green only for completion, grey for locked.
- Course completion turns into a footer bar with "Mark as complete" plus "Next course", and shows a brief confirmation state instead of a plain text swap.

## Technical notes

- Frontend only, aside from one small backend addition. `LearningMode.tsx` splits into `LearningMode.tsx` (data + routing between list / milestone / course), `MilestonePath.tsx`, `MilestoneDetail.tsx`, `CourseView.tsx`, and a shared `LessonText.tsx`.
- Add `react-markdown` + `remark-gfm` for the lesson text (pure JS, safe in the current runtime; raw HTML disabled).
- Inline playback uses a native `<video>` with `poster`, `preload="metadata"` and `playsInline`. The CDN serves `video/mp4` with permissive CORS, so no proxy is needed.
- Backend: `/api/learning` also returns each course's video and thumbnail already, so the only change is exposing the mission-level ordering fields already fetched plus a `nextCourseId` hint computed server-side for the "Continue learning" button. No Airtable schema change.
- Attachment/video URLs from Airtable expire, so they stay request-fresh as today; the summary strip does not cache them.
