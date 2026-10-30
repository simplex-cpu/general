# Refine Learning milestone visuals and progress colours

Update the Learning experience so every milestone is visually distinct, the artwork feels cleaner and more premium, and progress uses traffic-light colours instead of blue.

## Milestone artwork

- Replace the current broad overview-based icon matching with a clearer resolver that prioritizes the milestone name and uses more specific subjects such as branding, filming, content, analytics, strategy, ideation, launch, audience, and production.
- Give unmatched milestones deterministic icons based on their position so adjacent milestones do not all fall back to the same symbol.
- Remove the decorative background grid and the coloured glow behind the icon.
- Redesign the image area as a restrained dark brand surface with one translucent frosted panel and a crisp white subject icon sitting above it.
- Preserve a clearly muted lock treatment for unavailable milestones without adding decorative effects.

## Traffic-light progress

- Introduce one shared progress-colour rule for Learning: red for early progress, amber for work in progress, and green for completed or near-complete progress.
- Apply that rule to the overall Learning path bar, each milestone bar, and the milestone-detail progress indicator so blue no longer represents progress.
- Keep indigo for actions and navigation only; locked progress remains neutral grey.
- Update step indicators and related progress status accents to follow the same traffic-light language where applicable.

## Technical details

- Add semantic Learning progress tokens to the global design system rather than placing new raw colours in components.
- Update the shared progress component to derive its tone from percentage/status, keeping all Learning screens consistent.
- Verify milestone cards and the milestone-detail view at desktop and mobile widths, including locked, partially complete, and completed states.
