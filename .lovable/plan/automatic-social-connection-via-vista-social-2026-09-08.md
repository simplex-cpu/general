# Automatic social connection via Vista Social

## The short answer

You cannot automate "log in with their email and password" — the platforms block it (2FA, bot checks) and holding client passwords is a liability. What can be automated is the other direction: the client authorizes their own profile from inside your app, Vista Social receives the connection, and your app reads the status back. No password ever changes hands.

## What changes for the client

1. In Connected socials, each platform card loses the email/password fields and the "turn off 2FA" warning.
2. Instead each card has a **Connect** button. Clicking it opens Vista Social's own authorization screen for that platform, where the client logs in directly with Instagram/TikTok/YouTube/Facebook/LinkedIn.
3. When they come back, the card updates itself: Connecting while the profile is being attached, Connected once Vista Social confirms it, with the real handle Vista Social reports.
4. Nothing manual left for your team: no shared credentials, no separate connecting step, no 24-hour verification note.
5. A "Reconnect" action appears when Vista Social reports a profile as expired or disconnected, which is the normal reason posting silently stops.

## Rollout in two steps

**Step 1 — verify the API supports it.** Before building the UI, confirm against your live Vista Social key that the API exposes (a) a way to create a connection/authorization link for a given profile group, and (b) a way to list connected profiles with their state. These endpoints and their exact names differ by Vista Social plan, so the build follows what the account actually returns. If connection links are not exposed on your plan, the fallback is the same UI wired to a Vista Social invite link you paste per client — the client experience is identical, only the status is not read back automatically.

**Step 2 — build.** Wire the tab to whatever step 1 confirms.

## Technical notes

- Store the key as `VISTASOCIAL_API_KEY` via the secrets form. It stays server-only.
- New `src/lib/vistasocial.server.ts`: base URL, auth headers, thin `vsFetch` helper that surfaces the provider's status and body verbatim, plus typed helpers `listProfiles(groupId)` and `createConnectLink(groupId, platform, returnUrl)`.
- New `src/routes/api/social-connect.ts` (access-code protected, same `requireAccessCode` pattern as `my-brief.ts`):
  - `GET` — resolves the client's Vista Social profile-group id from Airtable, calls `listProfiles`, and returns a normalized map keyed by the existing `SOCIAL_PLATFORMS` names: `{ status: "Connected" | "In Progress" | "To Connect" | "Expired", handle, profileId }`.
  - `POST { platform }` — returns a fresh authorization URL for that platform and marks the Airtable row `In Progress`.
- Airtable Brand brief gains one field, `Vistasocial Group ID`, so each client maps to their Vista Social profile group. `my-brief.ts` reads it (never exposes it to the browser). The per-platform `{Platform} User` field becomes the handle Vista Social reports; `{Platform} Password` stops being written and its input is removed.
- `BriefMode.tsx` / `SocialCard`: drop the user/password inputs, the reveal toggle and the 2FA modal; add the Connect / Reconnect button, open the returned URL in a new tab, and poll `GET /api/social-connect` every few seconds while a connection is in flight (and once on tab open) so status is live rather than typed by hand.
- Existing rows keep working: any platform already marked Connected in Airtable stays Connected until Vista Social reports otherwise, so no client loses their current state.
- Stored passwords: after the switch, the `{Platform} Password` fields are no longer read or written by the app. Clearing the historical values in Airtable is a separate call once you're happy with the new flow.
