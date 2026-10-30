# My account: profile picture + buy credits

## What changes for you

1. In the "My account" panel, the round picture at the top becomes changeable: hover/click it to pick an image from your device. It uploads, then the header and panel show the new picture right away. A small "Remove" option clears it back to the initial letter.
2. Below the two credit cards, a new "Buy more credits" button opens the Stripe payment page in a new tab.
3. When the payment succeeds, Stripe tells the app and 30 is added to both scripts and reports (budget and remaining) for that account. The panel refreshes the numbers when you come back, so the new totals appear without logging out.
4. Nothing is added unless Stripe confirms the payment, so the button can't be used to grant free credits.

## Technical notes

- New `POST /api/account-avatar` (`src/routes/api/account-avatar.ts`): `requireAccessCode` on the caller's own code, accepts `{ base64, filename, contentType }` (image types only, ~5MB cap) or `{ clear: true }`, and PATCHes the access-code record's `Profile Picture` attachment via the existing Airtable upload approach used for `Logo` in `my-brief.ts` (clear then upload). Returns the new `avatarUrl` (thumbnail large, same shape as `validate-code`).
- `AccountRail.tsx`: hidden file input over the avatar with a camera overlay, upload state + error text, `onAvatarChange(url)` callback so the header updates. New "Buy more credits" button (indigo `#4F6BFF`) that opens the Stripe link with `?client_reference_id=<accessCode>` appended so the webhook can identify the account, and starts a short poll/refresh of credits on window focus.
- `SlateApp.tsx`: pass `onAvatarChange` (sets `credits.avatarUrl`) and `onCreditsRefresh={refreshCredits}`; call `refreshCredits()` on window focus while the rail is open.
- New `POST /api/public/stripe-credits-webhook` (`src/routes/api/public/stripe-credits-webhook.ts`): verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` (HMAC-SHA256 over `timestamp.payload`, timing-safe compare, 5-minute tolerance), handles `checkout.session.completed` with `payment_status === "paid"`, resolves the account from `client_reference_id` (fallback: customer email match on the access-code table), and PATCHes `Scripts Budget`, `Scripts left`, `Reports Budget`, `Reports left` each +30. Idempotency: store the Stripe session id in a `Credit Purchases` field/table check so a replayed event does not double-credit.
- Secrets to add: `STRIPE_WEBHOOK_SECRET` (and `STRIPE_SECRET_KEY` if we choose to re-fetch the session for verification). You then point a Stripe webhook at `https://project--62eb060a-e767-43cb-9106-a553f3e4d487.lovable.app/api/public/stripe-credits-webhook` for the `checkout.session.completed` event.
