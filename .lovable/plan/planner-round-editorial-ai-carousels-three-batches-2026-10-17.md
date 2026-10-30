# Planner round + editorial AI carousels (three batches)

## Can Claude design better carousels?

Yes, with one caveat. Claude can't draw images on its own. What it can do is write a full slide design as layout code (SVG): text boxes of different sizes, icons, simple bar or number charts, and editorial layouts. The app turns that design into the final 1080x1350 image. Your workspace already allows Claude models, and the app already calls one for scripts and Repurpose.

Risks and how the plan handles them:
- **Off-brand or messy slides:** Claude only gets your brand fonts, your two ink colours, up to 3 accents, your background choice and one fixed icon set. It can't use other colours, photos, hand drawings or effects.
- **Cut-off text:** the app measures every text box. If anything overflows or leaves the safe margins, Claude redesigns that slide once. If it still fails, the slide falls back to today's clean layout.
- **Fonts:** brand fonts are built into each image before it's exported, so the downloaded file looks the same as the preview.
- **Cost and speed:** each slide is one Claude request (about 10–30 seconds). Slides show up one at a time as they finish.
- **Consistency:** all slides in a carousel share one design brief (grid, type sizes, accent use), so the set looks like a series.

## What the code shows today
- Cards in the table have no three-dots menu. The one in the card window only contains Delete.
- The main buttons on each row change with the tab, for example Attach, Teleprompt, DIY Edit/Design, Assign to Risevoice, Approve, Re-do and Post.
- The platform picker inside the table sits within the table's scroll area, so it makes the table taller instead of floating over it.
- Column widths are fixed starting values, and you can drag to resize them.
- The Action column header is pinned to the right. It's coloured on its own, apart from the rest of the header row, which is where the cut-off appears.
- Re-do today asks for a comment and sets the status to "Re-do", which shows as "AI Redo". A "Risevoice Redo" status already exists.
- Carousel copy is one big "Slides copy" text box, even though the app already stores slide-by-slide fields.
- The teleprompter only shows text. There's no camera.

## Batch 1: Planner table
- The header colour runs across the whole row, including the pinned last column, and doesn't cut off as you scroll sideways.
- A brand filter sits above the table on every tab. It's set to All brands by default and keeps your choice when you switch tabs.
- Columns start wide enough to show the header and the usual cell text in full. Very long text (for example post names) is capped. Dragging to resize still works, and your manual widths win.
- Every dropdown in the table, including platforms, opens floating over the table.
- Each row gets an expand button, like the long form table, that opens the card window.

## Batch 2: Actions, Re-do, carousel copy, teleprompter camera
- A three-dots menu on every row and in the card window lists, at every stage: Teleprompt, Attach, DIY Design, DIY Edit, Assign to Risevoice, Move to Approval, Move to Ready to Post, Re-do, Post.
  - If an action is already a visible main button, it's left out of the menu.
  - Actions that don't fit the format are greyed out with a short reason: Teleprompt only for Talking Video, DIY Edit only for videos, DIY Design only for carousels and graphics.
  - Post stays greyed out until a post has produced files and platforms, using the same checks as today.
  - Delete stays at the bottom of the menu.
- Re-do asks one question first: **DIY Re-do** opens your own editor or designer, and **Assign Re-do** goes back to Risevoice with your comment. Either way the comment is kept in the thread.
- Carousel copy is shown slide by slide: Cover (Title, Subtitle), each middle slide (Title, Subtitle, Body) and the closing slide (statement, invitation, button). Each slide folds closed and only the cover starts open. Graphics show Title, Subtitle and Body.
- The teleprompter gets a **Camera** switch. Your webcam fills the screen, mirrored like a selfie, with the scrolling text over it on a soft dark band so it stays readable. The browser asks for permission first. If you refuse, you see a short message and the text-only view still works. Nothing is recorded or uploaded.

## Batch 3: Editorial AI designs
- **Design with AI** in DIY Design for carousels and graphics. Your saved Visual Style goes with it automatically.
- Claude plans the carousel's look once, then designs each slide from that slide's copy. One design per image, with icons only, editorial type and a chart only when the copy has numbers.
- You can redesign a single slide, redesign all of them, or switch back to the standard layout. Copy edits update the slide.
- Approved slides are exported and sent with the production request, the same way today's rendered slides are.

## Open question
- Should the three-dots menu be on the table rows too, or only inside the card window? The plan puts it in both places.

## Technical details
- Batch 1: give the whole header row one opaque background and give the sticky header cell the same background, with a full-height left divider. Filter by brand on the client from each record's brand link, and persist the choice per session. Set starting widths by measuring header and cell text (canvas `measureText`) per column, clamped to a min/max, with stored manual widths taking priority. Move the platform picker and any inline menus to Radix Popover portals. Reuse the shared planner card modal for the row expand button.
- Batch 2: add `plannerActions(item, stage)` to `plannerPresentation.ts` returning `{ id, placement: "primary" | "menu", disabled, reason }`. Rows and the modal render from it, with unit tests per stage × format. Re-do choice routes to the existing DWY editor or Risevoice confirmation state and records `AI Redo` / `Risevoice Redo` plus the comment. Carousel copy uses `slideFields.ts` parse/serialize only, inside Collapsible sections. The teleprompter uses `getUserMedia({ video: true })` in a mirrored `<video>`, and its tracks are stopped on close and on unmount.
- Batch 3: add a server route on `/v1/messages` with `anthropic/claude-sonnet-5` and streaming. Step 1 returns a JSON design brief; step 2 returns per-slide SVG drawn from a whitelisted element set, with brand colour/font tokens and an inlined Lucide icon subset. Server validation strips scripts, external refs and off-palette colours. Browser validation measures text bounds; one retry, then fall back to `designFrames`. Rasterise with embedded font data to 1080x1350 PNG and upload through the existing Drive path. Copy rules stay in `designTemplates.ts`. Errors follow gateway semantics (402/403 shown, no auto-retry loops).
- Record the actions-helper and AI-design validation/fallback rules in `AGENTS.md`, and track each batch in `roadmap.md`. The production-flow details you still have to send me remain open.
