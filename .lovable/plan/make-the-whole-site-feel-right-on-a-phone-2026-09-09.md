# Make the whole site feel right on a phone

Goal: every screen reads as a clean, well-proportioned mobile layout. No squeezed text, no stretched controls, no oversized gaps, nothing cut off at the edge.

## What changes

1. **Consistent page margins**
   Every main screen currently uses the same wide side margin whether it is a phone or a desktop. Introduce one shared page wrapper with a tighter margin on phones that grows on larger screens, and use it on: dashboard, brief, analyze, strategy, script, divide scripts, design and edit, edit yourself, approve and post, learning, chat, header, footer, status strip.

2. **Vertical spacing**
   Large top/bottom breathing room (currently the same on all sizes) is reduced on phones and restored at tablet and up, so screens no longer start with a big empty band.

3. **Header, tabs and status strip**
   - Header: logo and account button stay on one line, with the small brand tag hidden on very narrow screens instead of squeezing the logo.
   - Mode tabs: keep the horizontal swipe, but slightly smaller tap targets and edge padding so the first and last tab are not clipped; a soft fade at the edges hints there is more.
   - Status strip and footer: stack their two sides on phones instead of colliding.

4. **Tables (approve and post, requests, analyze, edit yourself)**
   Each table gets a proper horizontal scroll container with rounded edges and no clipped cells, so rows scroll instead of crushing columns. Row padding tightens on phones. Where a table has a wide primary column, its minimum width is lowered so a phone shows a usable amount before scrolling.

5. **Fixed multi-column grids**
   The dashboard overview metric rows (fixed four across) become one or two across on phones and four from tablet up, with the dividers only showing where columns actually sit side by side.

6. **Visual style / design previews**
   Phone frame, mode selector and the settings gear scale with the screen instead of a fixed narrow width, staying centered with even spacing. Carousel and graphic previews get the same treatment so nothing overflows its card.

7. **Chat (Ask the team) and script chat**
   Message bubbles cap at a readable width on phones, the input bar keeps its send/attach buttons on one line without shrinking the text field, and the composer respects the phone's bottom safe area.

8. **Panels, modals and side rails**
   Modals get phone-friendly width, padding and scrolling so long content (strategy detail, audit review, request forms) is reachable. The account rail already adapts; its inner spacing is tightened to match.

9. **Small-text and truncation pass**
   Long names, handles, and file names truncate rather than pushing layouts sideways; badges and pills stop forcing rows wider than the screen.

## Technical notes

- Follow the responsive pattern already in the project: two-column grid with `minmax(0,1fr)_auto` on mobile promoted to flex at `sm:`, `min-w-0` on text containers, `shrink-0` on icons, `truncate` on single-line headings.
- Add one shared wrapper (e.g. `PageShell`) in `src/components/slate/` and replace the repeated `max-w-7xl mx-auto px-6 md:px-8 py-*` blocks with it, keeping any per-screen full-width exceptions (visual style, socials tab) intact.
- Purely presentational changes: no data, API, Airtable, or business logic edits.

## Verification

- Review each tab at 375px, 414px, 768px and desktop widths.
- Confirm no horizontal page scroll at 375px, tables scroll inside their own container, and no element is clipped at the screen edge.
- Run the TypeScript check.
