# Fix: "Couldn't find any posts" for @drninahelps

## What's actually happening
The handle is correct, and the Instagram reader did reach @drninahelps on all 4 tries tonight. But Instagram answered: **"Restricted profile: You must be 18 years old or over to see this profile."** Nina's account has an age limit turned on. Because of that, Instagram hides her posts from anyone who isn't logged in, including our reader. So it came back with 0 posts, and the app showed a message that blamed the handle.

## Changes
1. **Say the real reason.** When Instagram reports a restricted or private profile, show this instead: "Instagram is hiding this profile's posts (age-restricted or private). Remove the age limit in Instagram settings, then refresh." Nothing gets saved, and the handle isn't blamed.
2. **The same check for TikTok:** private or unavailable profiles get their own clear message.
3. **Test:** a restricted-profile result gives the new message, not "Check the handle."

## What Nina needs to do (the only way to get her stats right now)
In Instagram: **Settings → Account → Age restriction** (in Meta Business Suite it's under Settings → Age restriction). Set it to **No restriction**, then press Refresh stats again.

Reading age-restricted profiles would mean logging the reader in with a real Instagram account. That breaks Instagram's rules and risks getting the account banned, so this plan doesn't do it.

## Technical details
- In the refresh route's "finish" step: if the dataset only holds a profile item with `error: "Restricted profile"`, `private: true` or `isRestrictedProfile: true`, return `{ status: "done", restricted: reason }`. HomeMode then shows the specific toast.
- Pure helper `profileBlockReason(platform, items)` in statsRefresh.ts, plus a test.
