# Header, sub-tab, and learning-path refinements

## What will change

1. Keep the welcome message on the left and pin **My account** to the far right at every screen size. Increase the button weight slightly without changing its size or behavior.
2. Replace the three-line mark beside RISEVOICE with the existing square **R** monogram asset everywhere that shared mark appears.
3. Change active navigation sub-tabs from a solid indigo fill to a clean indigo outline with indigo text. Apply this consistently to the nested tab bars for Brand Info, Analyze, Design and Edit, Approve and Post, and Learn; main navigation tabs and ordinary option buttons stay unchanged.
4. Simplify **Your learning path** by removing the milestone/progress description beneath the course name and adding more space above the course name.

## Technical details

- Update the shared brand mark component to render `/brand/monogram-dark.svg` at a stable compact size.
- Restore `justify-between` behavior in the status strip’s wider flex layout and add a stronger font weight to My account.
- Update only active sub-tab states to use a white background, indigo border, and indigo text while preserving inactive and hover states.
- Remove the `nextMilestone` detail line from the learning summary and increase the heading-to-course spacing.
- Verify the header alignment and tab appearance at phone and desktop widths, then run the project checks.
