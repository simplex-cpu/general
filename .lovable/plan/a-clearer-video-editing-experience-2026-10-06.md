# A clearer video editing experience

## Already updated
- Added a small amount of space above Scripting Hub.
- Replaced both plain arrows with sidebar collapse/expand icons that change with their state, with descriptive tooltips.
- Checked both controls and the layout in the preview; the app reports a successful build.

## What the review found
- The current video preview is a small text mockup on a phone, not the uploaded footage or an edited video.
- Talking Video places the whole script into the visual-hook preview; BROLL places the whole script into a single caption block. Neither gives a realistic impression of the result.
- Video settings force centered captions and full backing opacity in this preview, rather than using a complete, consistent brand treatment.
- Carousel/graphic previews use the same layout as their finished images. Video cannot promise that fidelity before the external edit finishes.
- The production modal has a structured preview-and-settings layout for images, but a vertically stacked form for video.
- Video submission creates a DIY request, then makes another status update whose failure is ignored. That can leave the planner's displayed state inconsistent after submission.

## Proposed solution

### 1. Standardize the production workspace
Keep the existing choice between Do it Myself and Risevoice. Within Do it Myself, use the same spacious workspace structure as carousel/graphic: a large preview area and one focused settings panel.

For video, organize the panel into **Footage**, **Text**, and **Style**, with one clear submission action. Preserve the current draft while switching panels.

### 2. Replace the phone mockup with real footage
- Show uploaded footage in a large, correctly proportioned player, with play/pause, seeking, sound and fullscreen.
- Allow immediate playback of local video files, without waiting for their upload to finish.
- Support selecting among attached clips without stretching or hiding their content.
- For Drive links that cannot be played directly, show the linked footage and an open-original action rather than pretending a text mockup is the video.
- Keep a clearly distinguished style sample when no playable clip exists; do not present it as the finished edit.

### 3. Make text and branding believable
- Separate the short visual hook from the full script for Talking Video.
- Show a short caption/overlay segment at a time for BROLL instead of squeezing the entire script onto the screen.
- Load brand fonts, colors and backing treatment consistently. Use safe text placement and fitted sizing.
- Only expose production choices already accepted by the existing DIY handoff. Do not introduce preview-only settings that the finished edit would ignore.
- Treat this as a footage-and-style preview, not a claim to reproduce automated cuts, transcription timing or effects.

### 4. Make submission and return visits dependable
- Keep footage required for video, with clear upload/link readiness before submission.
- Prevent duplicate submissions while saving.
- Preserve the existing DIY record creation and external automation; do not call n8n from the app.
- Confirm that the request was saved and return to the same planner item.
- Check the planner status update instead of ignoring errors. If the DIY request already exists, retry only the failed synchronization—not record creation.
- Distinguish the submitted/editing state from approval. Show the actual completed video when it becomes available through the existing content response.

## Technical implementation
- Add a focused video workspace/player rather than expanding the generic branding phone mockup.
- Centralize the video brand mapping and request preparation used by reachable video-production entry points; retain the archived design/edit tab without reintroducing it.
- Preserve the existing request fields, ownership checks, Airtable links and status vocabulary. No automation or schema changes are included.
- Add small tests for video footage requirements, format-specific text fields, submission locking and retry behavior.
- Verify uploaded-clip playback, link fallback, draft preservation, submission outcomes and completed-media rendering in the browser.

## Out of scope
- n8n investigation, reconnection or changes.
- Claims about the exported video's resolution or encoding: the app's current mockup proves a preview problem, not a compression problem in the finished file.
- Invented editing progress, timings or queue estimates.

## Expected result
A video workspace that feels like the carousel/graphic editor, shows real footage at useful size, respects branding, and has a reliable handoff without changing the external edit automation.