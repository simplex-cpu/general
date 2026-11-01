# Home tweaks (round 1)

## Changes
1. **Remove "No statistics yet."** — the line under the totals disappears when there are no statistics. The measured-posts count and "pending" message still show when they apply, and the info button stays.
2. **Top performing topic hierarchy**
   - The label "Your top performing topic" uses the same small, soft style as Views / Likes labels.
   - The topic name becomes the prominent text (about the size of the Likes/Comments numbers, semibold).
   - Avg views, post count and runner-up stay underneath in small soft text.

## Technical details
- `HomeMode.tsx` only: drop the `"No statistics yet."` fallback (render nothing), change the topic `h3` to `text-[11px] font-medium text-brand-ink-soft`, render topic as `text-[22px] font-semibold` block with details on a separate line.
