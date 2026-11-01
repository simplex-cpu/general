# Real "Connect account" links through Zernio

## What the user will see
In My Brand > Connected Accounts, each platform card (Instagram, TikTok, YouTube, Facebook, LinkedIn) gets a working button:
- **Connect account** opens the platform's own sign-in page. On a computer it opens in a new tab. On a phone it opens in the same window, because new tabs break Instagram sign-in on iPhone.
- After signing in, the person comes back to the app. That page says "Connected, you can close this tab". On a phone it shows the result with a "Back to my brand" button.
- The original tab checks every 4 seconds and switches the card to **Connected** once the account appears, showing the handle and follower count. It stops checking after 4 minutes and tells the user if nothing arrived.
- If a platform later signs the brand out (TikTok does this often), the card shows **Signed out** with a **Sign back in** button.
- A **Disconnect** option removes the account. Each connected account is billed, so this matters.
- Instagram asks once: "Continue with Facebook" (recommended, it unlocks music) or "Instagram only".

## How it works
1. **One Zernio profile per brand.** The first time a brand connects anything, the app creates its Zernio profile once and saves the profile ID on the brand. A retry never creates a second profile.
2. **Connect link.** The app asks Zernio for a sign-in link for that platform and sends a return address back to the app. It checks that the person owns the brand first.
3. **Sync.** The app reads the brand's Zernio accounts and saves one row per account. Each row stores the handle, followers, status (Active / Signed out), how it was connected, and its Zernio account ID. Only one sync per brand runs at a time, so accounts are never duplicated, and therefore never billed twice.
4. **Handles fill themselves in.** Once an account connects, its handle is written to the brand's handle field. Refresh stats and the Zernio stats plan then use the real account.
5. **Vista Social placeholder retired.** The old Vista Social link and statuses stop driving this screen. Existing "Connected" labels stay until the first sync replaces them.

## What I'll do differently from the playbook
- The playbook sends everything through n8n. Here the app calls Zernio directly from the server, using the Zernio connection you already saved. This keeps your n8n flows untouched and the key out of the browser.
- Posting and scheduling through Zernio are not part of this step.

## Needs from you
- A **Connected Accounts** table in the DWY base. I'll add it with the fields listed below if the Airtable connection allows it. Otherwise I'll give you the exact list to add by hand.
- After publishing, connect one real test account. Kash's Instagram is a good choice, and that one account confirms the whole loop.

## Technical details
- Zernio access goes through the linked custom connector via the gateway (`/profiles` with `Idempotency-Key: brand-<briefId>`, `/connect/{slug}?profileId&redirect_url[&loginMethod=facebook_login][&reconnectAccountId]`, `/accounts?profileId`, `DELETE /accounts/{id}`). These live in new `src/lib/zernio.server.ts`.
- `src/routes/api/social-connect.ts` is rewritten. GET = sync (single-flight per brief, plus an upsert keyed on Zernio Account ID). POST `{action: link|disconnect}`. Every action checks ownership with `selectedBrief`, an https `redirect_url` on the app origin, and a known platform.
- Brief gets a `Zernio Profile ID` field. The Connected Accounts table gets Zernio Account ID, Platform, Handle, Profile URL, Followers, Status, Connected through, and a link to Brand/Brief.
- New return route `/connected` reads `?connected=` / `?error=`.
- `BriefMode.tsx`: the connect click opens a tab synchronously on desktop and navigates the same window on mobile. It also adds polling with a 4-minute cap, plus Sign back in and Disconnect.
- A pure helper for status mapping (needsReconnection / isActive / platformStatus → Signed out) and the sync plan, with tests.
- Rule in AGENTS.md: Zernio calls stay server-side through the connector, with one profile per brand and an upsert on the account ID.
