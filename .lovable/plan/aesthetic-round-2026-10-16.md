# Aesthetic round

## 1. Sidebar expand/collapse button
- Center the button at the bottom of the side menu when it's collapsed. Right now it sits off to the side.
- Make the icon about 20% bigger and darker (main text color instead of soft gray), with a thinner line so it looks less bold.

## 2. Growth Path milestone header
- When a milestone is open, make the whole top area white: the "Growth Path" title row and the milestone banner below it, as one block.
- The milestone list view and other pages keep their current headers.

## 3. Creator Circle post spacing
- Move the composer and posts in so their left and right edges line up with the Feed / Support / Strategy ideas / My Posts tabs. They stay left-aligned.

## 4. Viral Kit buttons
- Two columns on desktop, one column on phones. Make the buttons taller (about 96px).
- Rename and reorder:
  - Row 1: **Analyze my Account** (was Refine My Strategy) | **Find Viral Posts** (was Bank of Inspo)
  - Row 2: **Long form Clipper** | **Create Thumbnails** (was Thumbnail Variations, still Coming soon)
- Use the same new names in the headers inside each tool, including the back-arrow title.

## Technical details
- `ModeTabs.tsx`: the toggle becomes `mx-auto` when collapsed, with a larger icon, `text-brand-ink`, and `strokeWidth` around 1.5.
- Growth Path detail header (`SlateApp` / `MilestoneDetail`): show `SectionHeader` on the white surface while a milestone is open.
- `CommunityMode.tsx`: give the feed the same horizontal padding as the tabs.
- `viralKit.ts`: new labels and order. `ViralKitMode.tsx`: `grid sm:grid-cols-2`, `min-h-24`. Update `viralKit.test.ts` for the new order and labels.
- Presentation only. No changes to data, credits or automation.
