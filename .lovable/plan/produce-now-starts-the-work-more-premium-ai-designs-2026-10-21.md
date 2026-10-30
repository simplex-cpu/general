# Produce now starts the work + more premium AI designs

## 1. Chat fixes
- The "Produce now, I'll do it myself" message gets its own line, and the "View post in Planner" button sits below it so they no longer overlap.
- Remove the extra "Save" button on the final card. Only **Regenerate** and **Add this to Planner** stay, because edits are already saved automatically.

## 2. "Produce now" starts production right away
**Carousels and single graphics** (Do it myself):
- The post is added to the planner, then the AI design starts straight away. You don't have to click it again in the planner.
- The chat shows "Designing your slides…" with a link to the planner card, which shows live progress. When it's done, the slides are attached to Media to Post and the card moves to To Approve, the same as today.
- If you added photos, they go into the design (see section 3).

**Talking Video and B-roll** (Do it myself, with footage):
- The post is added to the planner, and a full Edit Yourself request is created at the same time with everything the edit flow needs (footage, script/overlay, the brand's video style, 1080x1920), so your editing automation starts.
- It uses the same request as the planner's DIY Edit button, so a request is never duplicated and the automation never sees a half-filled one.
- If footage is missing for a video, Produce now asks for it before continuing (this already exists).

**Risevoice team handles it:** stays as it is today.

## 3. Better AI designs
- **More premium, smaller text:** smaller and lighter body text, slimmer type and more space around everything, so the slides read like a high-end magazine rather than a poster.
- **Each slide gets its own kind of design, based on its copy:** a quote slide, a visual explainer (a simple diagram or flow), a statement, a big number, a short list, or a closing slide. Lists are used only when the copy actually is a list. The whole carousel still looks like one series.
- **Gradient instead of accent:** a slide can use the brand gradient as its single highlight instead of the accent colour, but never both on the same slide.
- **Hand-drawn touches:** allowed, but only one per slide (for example a scribbled circle, an underline or an arrow), drawn in the accent colour or the gradient.
- **Photos:** if you attach photos (a backdrop or images for each slide), the AI places them as a design element, such as a framed cutout or a full-bleed photo with text on a clean area. The text must stay readable over the photo. Without photos, nothing changes.
- The current safety nets stay: the copy is never changed, text has to fit, one redesign if a slide fails, and then the standard brand layout as a backup.

## 4. Checks before I call it done
- I generate a sample carousel from a real brand (with and without a photo) and show you the images.
- One Produce now run for each format, to confirm the planner record and the design or Edit Yourself request appear.

## Technical details
- `ScriptMode.tsx`: wrap the user bubble text and planner link in a column; drop the `onSave` footer action for repurpose cards. After `/api/send-to-production` returns `recordId` with `planner.action === "produce" && handler === "self"`:
  - graphic/carousel: call `startAiDesign(post, deps)` from `aiDesignJobs.ts` (built from the returned record and slides, plus any `designImages`), and subscribe the chat message to job progress.
  - video: send-to-production already creates an Edit Yourself row. Change it to go through the same idempotent DIY handoff as the planner (`videoProduction` / `dwy-edit-yourself` request builder) so style fields, dimensions and all required inputs are written in one call, keyed by `stablePlannerRequestId(recordId)`.
- `src/routes/api/ai-design.ts`:
  - SYSTEM/PLAN prompts: new layout set `cover-headline | quote | visual-explainer | statement | big-number | list | photo-feature | cta-closing`, chosen per slide from the copy, with "list" only for enumerated copy.
  - Smaller type scale (body roughly 30–38px, headline capped lower, lighter weights) and a single highlight that is either the accent or a `linearGradient` built from the brand gradient.
  - At most one hand-drawn stroke path per slide.
  - Allow `<image>`, only with `href` set to app-supplied data URLs that are passed in as numbered slots.
- `aiDesign.ts` validation:
  - Permit `image` only when it references a provided slot (strip anything external).
  - Count highlight uses (accent or gradient, not both), and count hand-drawn paths as no more than one.
- `aiDesignJobs.ts`: accept optional images (backdrop or per slide), convert them to data URLs, and pass them to the plan and slide calls. Rendering embeds them before PNG export.
- Tests:
  - Validator accepts provided-slot images and rejects external ones.
  - A slide using both accent and gradient is rejected.
  - Produce now (self) triggers design for carousel/graphic and exactly one Edit Yourself request for video.
- Update the `AGENTS.md` AI-design rule (highlight = accent or gradient, image slots) and `roadmap.md`.
