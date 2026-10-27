/**
 * Manually fire a signed fake Stripe `checkout.session.completed` event at the
 * credit top-up webhook, so you can verify it without the Stripe CLI.
 *
 * Usage:
 *   bun scripts/test-stripe-credits-webhook.ts <ACCESS_CODE> [--url <base>] [--bad-signature] [--unpaid]
 *
 * Examples:
 *   bun scripts/test-stripe-credits-webhook.ts ABC123
 *   bun scripts/test-stripe-credits-webhook.ts ABC123 --url https://risevoice.lovable.app
 *   bun scripts/test-stripe-credits-webhook.ts ABC123 --bad-signature
 */
import { createHmac } from "crypto";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const code = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--url");
const base = opt("url") || "http://localhost:8080";
const secret = process.env.STRIPE_WEBHOOK_SECRET;

if (!code) {
  console.error("Missing access code. Usage: bun scripts/test-stripe-credits-webhook.ts <ACCESS_CODE>");
  process.exit(1);
}
if (!secret) {
  console.error("STRIPE_WEBHOOK_SECRET is not set in this environment.");
  process.exit(1);
}

const sessionId = `cs_test_${Date.now()}`;
const payload = JSON.stringify({
  id: `evt_test_${Date.now()}`,
  type: "checkout.session.completed",
  data: {
    object: {
      id: sessionId,
      object: "checkout.session",
      payment_status: flag("unpaid") ? "unpaid" : "paid",
      client_reference_id: code,
      amount_total: 3000,
      currency: "usd",
    },
  },
});

const ts = Math.floor(Date.now() / 1000);
const sig = flag("bad-signature")
  ? "0".repeat(64)
  : createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");

const url = `${base.replace(/\/$/, "")}/api/public/stripe-credits-webhook`;
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "stripe-signature": `t=${ts},v1=${sig}` },
  body: payload,
});

console.log(`POST ${url}`);
console.log(`session: ${sessionId}`);
console.log(`status:  ${res.status}`);
console.log(`body:    ${await res.text()}`);
