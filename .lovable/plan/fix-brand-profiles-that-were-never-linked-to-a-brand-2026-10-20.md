# Fix: brand profiles that were never linked to a brand

## The problem
Some older brand profiles, like Nina's "Dev Usama", were never linked to a brand. Refresh stats reads the Instagram handle without trouble. But it can't save the posts, because every post has to belong to a brand.

## Already in place
Refresh stats now creates the missing brand the first time it runs, links it to the profile, and saves the posts there. Error messages also stay on screen longer.

## What this plan adds
1. **Fix every old profile at once:** a one-time pass finds each brand profile with no brand link. If that person already has a brand with the same name, it links that one. Otherwise it creates a brand they own. This way the fix doesn't wait for someone to press Refresh.
2. **Never create duplicates:** the automatic fix during Refresh also reuses a brand with the same name before it creates a new one.
3. **Clear message if it still can't save:** if the person behind the profile can't be found, the message says "This brand profile isn't linked to an account. Contact support." It no longer gives a vague error.
4. **Check it on Nina:** run Refresh stats for @drninahelps and confirm her posts appear in Posts and on Home.

## Your part
Publish once this is done, so the live site uses the fix.

## Technical details
- `ensureBriefBrand` (brands.server.ts): before creating a brand, look in the owner's Brands for a matching Brand Name and reuse it.
- One-off backfill script run against the DWY Brand brief table (briefs with empty Brand, resolve owner via the Access code → User), with a dry-run listing first.
- `home-refresh-stats.ts`: separate error when the owner can't be resolved.
- Test: reuse of a same-name brand rather than creating one.
