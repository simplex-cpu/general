# Community feed and Growth Path visual refinement

## 1. Make Community feel like a social feed
- Reduce lateral margins and widen the composer and posts together. Use narrow, consistent gutters rather than the current 672px maximum feed width.
- Keep the white **Community** title header no taller than the Risevoice logo header (80px on desktop). Move **Creator Circle / Ask your team** into a separate full-width tab row below it.
- Shrink the composer’s initial text area and action row. Keep emoji, tags, support and team-only strategy controls as compact icons with accessible names and tooltips; retain a small, clear **Post** button.
- Remove the divider above composer actions. Reveal tag and support fields only when selected, as today.
- Preserve a deliberate gap between the composer and feed.
- Give the area beginning at **Feed / Support / Strategy ideas / My Posts**, including the feed background, a darker neutral-gray surface than the composer. Keep posts light and text high-contrast—not a dark theme.
- Reduce the filter tabs’ height and typography while keeping four equal-width columns spanning the feed. Ensure longer labels fit without clipping.

## 2. Make milestone thumbnails bright and premium
- Replace the current dark icon blocks with light, coordinated editorial-style illustrations reflecting each milestone’s subject: foundations, strategy, creation, growth, and optimization.
- Use crisp subject icons, restrained geometric detail, varied soft accent colors, and readable milestone numbering. Avoid dark overlays, glows, and blurred decoration.
- Keep thumbnail proportions consistent. Locked milestones remain clear, with a subtle lock/status treatment instead of blurring the whole card.
- Limit this change to milestone thumbnails and their locked presentation; leave course content, milestone detail banners, and progress rules unchanged.

## 3. Simplify Ask your team messages
- Display the user’s messages in soft gray bubbles with dark text, aligned to the right.
- Display strategist and creative-team messages as plain text on the conversation background, aligned to the left, without borders, filled bubbles, or decorative containers.
- Retain sender names, timestamps, reply references and reaction controls. Ensure quoted text remains readable in both message styles.
- Keep these styles local to team chat so scripting-chat bubbles are unaffected.

## Technical scope
- Presentation changes in `CommunityMode.tsx`, `learning/MilestonePath.tsx`, and `learning/TeamChat.tsx`, with semantic color tokens in `src/styles.css` and local illustration assets/helpers if needed.
- Keep existing posting, filtering, permissions, profile access, chat requests, and learning progress behavior unchanged. No Airtable or automation changes.
- Use existing design-system controls and accessible tooltips. Keep visually compact controls comfortably tappable.

## Verification
- Check the current desktop size, a wider desktop, and a narrow phone layout: header height, wider feed, full-width filters, compact composer, and no horizontal overflow.
- Check empty and populated feeds, expanded tags/support inputs, emoji selection, and the staff strategy control.
- Check user/team messages, long text, replies and reactions; confirm the team messages have no bubble treatment.
- Check milestone thumbnails in available, completed and locked states without changing access or progress behavior.
- Verify live interactions using an available real access-code session; if unavailable, explicitly distinguish visual checks from unverified live posting/chat actions.