# Planner polish round

## 1. Audit first
Before changing anything, sign into the preview and click through every planner tab (rows, card window, create post, three-dots menu, Re-do, DIY Design/Edit, teleprompter, carousel copy, AI design). Capture screenshots, list every visual or flow issue found (beyond the items below), and fix them in this same round. Report the extra findings at the end.

## 2. Brand filter
- Smaller, shorter control aligned to the right above the table.
- Multi-select (choose several brands; empty = all brands).
- A magnifying-glass button next to it opens a search box that filters rows by post name, caption or topic.

## 3. Table rows
- Expand button moves to the right of the post name.
- Post name column gets a tighter default and cap width (still drag-resizable).
- Remove the three-dots button from table rows; it stays only inside the card window.

## 4. Empty tables
Every empty tab/group still shows the column headers plus one "+ New post" row that creates a post inline.

## 5. Create post
- The "+" form asks only: post name, post type, status, posting date, platforms. Captions and media are removed from this form.
- After creating, the new card window opens immediately.
- The inline "+ New post" row uses the same fields and also opens the card.

## 6. Card window
- Save keeps the card open and shows a short "Saved" confirmation.
- The three-dots overflow menu becomes gray (light gray surface, dark text) instead of black.

## 7. DIY Design
Clicking "DIY Design" first shows a small choice: "Template design" (current editor) or "AI design" (opens the editor and starts Design with AI). Video posts keep going straight to DIY Edit.

## Technical details
- `ApproveAndPostMode.tsx`: replace the brand `BrandSelect` with `BrandMultiSelect` (compact, right-aligned) plus a search toggle/input; filter logic becomes `brandIds.includes`.
- Move the `Maximize2` button after the name text; lower post-name width cap in `fitColumnWidths()` (`plannerPresentation.ts`).
- Drop the row `MoreHorizontal` menu; keep card menu, restyle to gray tokens.
- Render table head when `filtered.length === 0`, with an inline create row; share create logic with the modal and call `setOpenId(newId)` on success.
- `saveDraft()` no longer clears `openId`.
- DIY Design picker dialog; AI path opens `ProduceReviewModal` with an `autoAiDesign` flag that triggers `runAiDesign()`.
- Update `plannerActions.test.ts` for row-menu removal if affected; run `bun test src/lib/slate`.
