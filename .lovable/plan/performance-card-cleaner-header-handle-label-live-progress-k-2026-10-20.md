# Performance card: cleaner header, handle label, live progress, Kash refresh fix

## What went wrong with Kash
The handle was right. Instagram **blocked our profile reader** on the last two refreshes (@kashsocialmediatips at 03:31, then @kashrofficial at 03:35). Instagram's answer was "Request blocked", not "no posts". The app only saw 0 posts, so it blamed the handle.

## Changes
1. **Remove the line** "102 / 102 posts measured · Collected Oct 19" from the Performance card.
2. **Handle and icon instead of "Instagram"**: the platform switch shows the brand's saved handle with that platform's icon, e.g. [IG icon] @kashsocialmediatips. If no handle is saved yet, it shows the platform name.
3. **Progress % on the refresh button** while stats are collected:
   - Reading profile: 0–40%, moving slowly while we wait for Instagram/TikTok
   - Saving stats: 40–50%
   - Reading copy and topics: 50–100%, based on posts done out of posts to do
   - The button reads "Collecting 63%". It stays disabled until finished.
4. **Fix blocked reads**:
   - When Instagram blocks the reader, the app tries again by itself once using a second Instagram reader.
   - **Why it happens:** our reader looks at Instagram without logging in, the same way a visitor who isn't signed in would. Instagram limits that kind of visitor and sometimes blocks them at random. Your single call didn't cause the block. Instagram blocks visitors who aren't logged in no matter how many calls we make.
   - **Keeping it reliable when many refreshes run at once:**
     - Requests go out through residential connections that change each time, so a block doesn't carry over to the next request.
     - Retries happen automatically after a wait that gets longer each time (about 30s, then 2 min), up to 3 tries in total.
     - Only one refresh runs per profile at a time. A second click joins the refresh that's already running instead of starting a new one.
     - Overall, at most 3 Instagram reads run at once. Others wait in line, and their buttons show "Queued".
   - These steps make blocks rare, but no reader can promise zero blocks. The only permanent fix is reading stats through Instagram's own official connection, where the brand logs in with a Business or Creator account. That would also give us saves and shares. I'd suggest doing it as a separate next step.
   - If every retry gets blocked, the message says: "Instagram temporarily blocked reading this profile. Please try again in a few minutes." It no longer says "Check the handle".
   - "Check the handle" only shows when Instagram really says the profile doesn't exist.
5. **Tests**: a blocked result gives the "temporarily blocked" message, not "Check the handle". A missing-profile result still says "Check the handle".

## Technical details
- `profileBlockReason` in statsRefresh.ts gains a `blocked` kind: profile-only items with `requestErrorMessages` matching /blocked/i. `not-found` is when `error` matches /not found|doesn't exist/i.
- home-refresh-stats "finish": on blocked, start one fallback run (`apify~instagram-post-scraper` with `username:[handle]`, same limit) and return `{status:"running", runId:newId, retried:true}`. A second block returns 503 with the blocked message.
- Progress comes from the client poll loop in HomeMode: time-eased during "running"; during "tag", `1 - remaining/toTag`.
- Handle comes from the selected brief's `Instagram User` / `Tiktok User`, already loaded for refresh. It's shown with the existing platform logo components.
