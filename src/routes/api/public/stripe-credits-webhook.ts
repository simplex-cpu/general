import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tbl1Sc1qn5MhXc0Ta";
const TOP_UP = 30;

function verify(payload: string, header: string, secret: string): boolean {
  const parts = header.split(",").reduce<Record<string, string[]>>((acc, p) => {
    const [k, v] = p.split("=");
    if (!k || !v) return acc;
    (acc[k] ||= []).push(v);
    return acc;
  }, {});
  const ts = parts["t"]?.[0];
  const sigs = parts["v1"] || [];
  if (!ts || !sigs.length) return false;
  // 5 minute tolerance
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  const exp = Buffer.from(expected);
  return sigs.some((s) => {
    const got = Buffer.from(s);
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
}

async function findRecord(code: string, h: Record<string, string>) {
  const safe = code.replace(/'/g, "\\'");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent(
    `{Code}='${safe}'`,
  )}&maxRecords=1`;
  const r = await fetch(url, { headers: h });
  if (!r.ok) return null;
  const data: any = await r.json();
  return data.records?.[0] || null;
}

export const Route = createFileRoute("/api/public/stripe-credits-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const token = process.env.AIRTABLE_TOKEN;
        if (!secret || !token) return new Response("Server misconfigured", { status: 500 });

        const raw = await request.text();
        const sigHeader = request.headers.get("stripe-signature") || "";
        if (!verify(raw, sigHeader, secret)) {
          return new Response("Invalid signature", { status: 400 });
        }

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        if (event?.type !== "checkout.session.completed") {
          return new Response("ignored", { status: 200 });
        }
        const session = event.data?.object || {};
        if (session.payment_status !== "paid") {
          return new Response("unpaid", { status: 200 });
        }

        const code = String(session.client_reference_id || "").trim();
        if (!code) {
          console.error("[stripe-credits] no client_reference_id on session", session.id);
          return new Response("no account reference", { status: 200 });
        }

        const h = { Authorization: `Bearer ${token}` };
        const rec = await findRecord(code, h);
        if (!rec) {
          console.error("[stripe-credits] unknown access code for session", session.id);
          return new Response("unknown account", { status: 200 });
        }

        const log = String(rec.fields?.["Credit Purchases"] || "");
        if (session.id && log.includes(String(session.id))) {
          return new Response("already applied", { status: 200 });
        }

        const scriptsBudget = Number(rec.fields?.["Scripts Budget"] ?? 0) + TOP_UP;
        const reportsBudget = Number(rec.fields?.["Reports Budget"] ?? 0) + TOP_UP;
        const entry = `${new Date().toISOString()} +${TOP_UP} scripts/+${TOP_UP} reports ${session.id}`;

        const patch = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${rec.id}`, {
          method: "PATCH",
          headers: { ...h, "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              "Scripts Budget": scriptsBudget,
              "Reports Budget": reportsBudget,
              "Credit Purchases": log ? `${log}\n${entry}` : entry,
            },
          }),
        });
        if (!patch.ok) {
          console.error("[stripe-credits] airtable patch failed", patch.status, await patch.text());
          return new Response("retry", { status: 500 });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
