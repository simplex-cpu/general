# My Brand polish: accounts, fonts, colors, brand cards

## 1. Connected Accounts layout
- Platform cards sit in a fixed two-column grid (one column on phones), so Instagram's two buttons have room and don't squash.
- Secondary buttons (Via Instagram, Remove) become white with a gray outline and dark text, instead of black.

## 2. Font dropdown arrows
- Replace the browser's default arrow with our own small chevron, placed inside the box on the right with room so long font names cut off before reaching it. Applies to every font and direction dropdown in Visual Style.

## 3. One "Colors" section in Visual Style
A single, clean list of color swatches (no extra explainers or sub-groups), each with a picker:
- Accent 1
- Accent 2
- Ink over footage
- Ink over light
- Light background
- Dark background
- Brand background
- Gradient (optional) — off by default; when on, pick two colors and a direction
The existing previews stay and update live from these colors. Designs, video overlays and exports use the chosen backgrounds instead of the fixed dark/indigo defaults.

## 4. Brand card footer in My Brand
A quiet 2x2 block under the brand name, separated by a thin line:

```text
Brief             72%   | Stats
[======----] (amber)    | 12.4K views  310 likes  28 comments (avg)
------------------------+---------------------------------
Milestone               | Accounts
Stage 2 · Growing       | [IG] [TT] [YT]  (filled = connected)
```
- Brief bar uses traffic-light color: red under 40%, amber 40–79%, green 80%+.
- Stats show averages from saved posts; "No stats yet" when empty.
- Milestone shows the brand's current Growth Path milestone, or "Not started".
- Accounts shows small platform icons, full color when connected, faded when not.

## Technical details
- `BriefMode.tsx`: grid `sm:grid-cols-2` (drop `lg:grid-cols-3`); outline buttons get `bg-brand-surface text-brand-ink`.
- `VisualStylePanel.tsx` / `VisualStyleControls.tsx`: `appearance-none pr-8` + absolutely positioned ChevronDown.
- `brandVisualStyle.ts`: extend `SimpleStyle` with `accent2`, `lightBg`, `darkBg`, `brandBg`, optional gradient `{start,end,angle}`; stored in existing graphic preferences JSON, mapped through brandVisualStyle so previews, production and exports share them; legacy `backgroundStyle` read for back-compat. Add tests for mapping and defaults.
- `MyBrandsMode.tsx` + brand summary loader: add avg views/likes/comments (from DWY Posts), current milestone, and connected platform list per owned brand; traffic-light thresholds in a small helper with a test.
