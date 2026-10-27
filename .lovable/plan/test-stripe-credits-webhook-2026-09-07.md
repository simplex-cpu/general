# Test Stripe Credits Webhook

## What we need to verify
1. The webhook endpoint is reachable from Stripe.
2. Signature verification rejects invalid payloads and accepts real Stripe events.
3. A successful `checkout.session.completed` event adds 30 credits to both scripts and reports budgets in Airtable.
4. The same session ID is not credited twice (idempotency via `Credit Purchases`).

## Recommended test steps

### 1. Add the Stripe webhook secret
The `STRIPE_WEBHOOK_SECRET` secret must be added to the project so the endpoint can verify Stripe signatures. You can add it via the secure secrets form.

### 2. Configure the webhook in Stripe
In the Stripe dashboard, add this endpoint URL and subscribe to the `checkout.session.completed` event:
```
https://project--62eb060a-e767-43cb-9106-a553f3e4d487.lovable.app/api/public/stripe-credits-webhook
```

### 3. Test with Stripe CLI (preferred)
- Forward Stripe events to the local/preview endpoint using the Stripe CLI.
- Trigger a test `checkout.session.completed` event with the correct `client_reference_id` set to the Airtable access code record ID.
- Check that the Airtable record updates correctly and the session ID is recorded in `Credit Purchases`.

### 4. Test with the live buy link
- Open the payment link in Stripe test mode, appending `?client_reference_id=<ACCESS_CODE_RECORD_ID>`.
- Complete the test checkout.
- Confirm that the Airtable `Scripts Budget` and `Reports Budget` both increase by 30, and the webhook logs a 200 response.

### 5. Verify idempotency
- Send the same Stripe event payload twice (or replay the same session ID).
- Confirm that credits are not added a second time and the response still returns 200.

## What you need from me
- Add `STRIPE_WEBHOOK_SECRET` to the project secrets.
- Let me know whether you want to test with Stripe CLI (local/preview) or with the live payment link in Stripe test mode, so I can prepare the exact commands or URL parameters.
