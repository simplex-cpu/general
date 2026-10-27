# Designing graphics and carousels from the saved visual style

## Summary
Turn the Design request into a real design flow: the preview shows exactly what will be produced using the colours saved in the Visual style tab, an optional script fills the copy, photos sit behind the copy, and the app renders the finished image files that go out with the request.

## 1. Graphic

- Uses the saved cover colours: cover background for the canvas, title colour for the copy.
- Preview shows a single 4:5 graphic (not the phone frame) with the copy laid over it.
- Optional script upload autofills the copy; the user can still edit it.
- Assets: at most one photo. Attaching a second replaces the first, with a short note explaining only one photo is used.
- With a photo: it fills the frame, slightly darkened so the copy stays readable, copy on top.
- Without a photo: the saved cover background colour fills the frame.

## 2. Carousel

- Uses the saved cover colours for slide 1 and the saved slides colours for the rest (background, title, subtitle, body text).
- Preview shows one full slide at a time with arrows and dots, matching the Visual style preview.
- Optional script upload fills the cover copy and each slide's copy in order, following the number of slides chosen; fields stay editable.
- Assets: one photo per slide, optional. Each slide row gets its own photo slot so a photo is tied to a specific slide instead of a shared pile.
- A slide with a photo shows the photo behind the copy; a slide without one shows the saved background colour for that slide type.

## 3. Finished image files

- A "Generate designs" step renders each frame (the graphic, or every carousel slide) at 1080x1350 from exactly what the preview shows: colours, fonts, photo, copy.
- The user sees the rendered images and can regenerate after edits.
- On submit, the rendered PNGs are uploaded alongside the request so the finished art, the copy, and the source photos all arrive together.

## Technical details

- Extend the script parser to return carousel-aware copy: a cover line plus an ordered list of slide copy, alongside the existing fields, so one endpoint serves both formats.
- Replace the shared `slideCopy` string array in `EditYourselfMode` with a per-slide model holding copy plus an optional photo file, and add a single optional photo slot for graphics. Keep validation: copy required, photos optional.
- Add a design preview component that renders a graphic frame and a carousel slide frame from `PhonePreviewStyle` (cover/slides background, title, subtitle, body colours) plus per-slide photo object URLs. Reuse the existing colour normalisation helpers rather than duplicating them.
- Render output with an offscreen HTML canvas in the browser: draw background colour or cover-cropped photo, apply the readability scrim, wrap and draw text with the saved font family/weight, then export a PNG blob per frame. Wait for the selected web fonts to load before drawing so text is not rendered in a fallback face.
- Upload rendered PNGs through the existing direct-to-Drive upload path and include them in the request payload next to the source assets, keeping current field names intact.
- Graphics reuse the existing Carousel Cover Background and Carousel Title Color settings; no new brand fields are added, and the Visual style panel labels are updated to make clear the cover colours also drive single graphics.
