# Connect Zernio for Performance stats

## Good news first
Zernio's API also returns posts that were published outside Zernio. It keeps about the last 12 months of history for each connected account. So a newly connected brand can get its past stats from Zernio straight away. Apify stays only as a backup.

## Steps
1. **Save the key securely.** A Zernio connection card opens and asks for your API key once. It checks the key with a harmless read of your Zernio profiles, then saves it. The key never appears in chat or in the code.
2. **Match each brand to its Zernio account.** We read your Zernio profiles and accounts, then match each one to a brand by its Instagram or TikTok handle. Accounts that don't match are listed so you can link them by hand.
3. **Refresh stats picks a source for each brand and platform:**
   - Connected in Zernio: read the post history (up to 12 months) and each post's views, likes, comments, saves and shares from Zernio. These are official numbers, so saves and shares are filled in too.
   - Not connected, or Zernio has no history yet: use the current Apify read as a one-time backfill.
   - After 90 days with a Zernio connection, Apify is turned off for that brand.
4. **Posts stay the same.** Zernio results go into the same Posts rows, matched by post link, so nothing is duplicated. Copy mining (transcript, slides, hook, topic) stays exactly as it works now.
5. **The card shows the source.** A small "via Zernio" or "via public read" note appears next to the last update. Progress % works for both sources.

## Technical details
- Custom connector: base `https://zernio.com/api/v1`, Bearer auth, verify `GET /profiles`.
- Endpoints: `GET /accounts`, `GET /posts?source=external&accountId=…` (paged), `GET /analytics?accountId=…&fromDate=…`.
- New server helper `zernio.server.ts`. The refresh route branches before calling Apify. A pure source-selection helper with tests covers the 90-day and no-history rules.
- The brand↔account link is stored on the brief (Zernio Account ID per platform), and ownership is checked before every read.
- A 202 "sync pending" reply from Zernio falls back to Apify for that run.
