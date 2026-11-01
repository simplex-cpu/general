import { createFileRoute } from "@tanstack/react-router";
import { cleanSignup } from "@/lib/signup";
import { createTrialAccount, findUserByEmail, notifyGhl } from "@/lib/signup.server";

// Public free-trial sign-up. Creates the trial account, sends the contact to
// GHL (tag creators-trial), and returns the new access code so the screen can
// log the person straight in.
//
// Settings (Lovable Cloud secrets):
//   GHL_SIGNUP_WEBHOOK_URL  GHL inbound webhook that tags the contact and sends email 1
//   SIGNUPS_OPEN            "false" closes sign-ups
//   TRIAL_SCRIPTS, TRIAL_REPORTS  trial credits (default 10 and 1)

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

// Light per-instance limit on repeated sign-ups from one address.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

const credit = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

export const Route = createFileRoute("/api/signup")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (process.env.SIGNUPS_OPEN === "false") return json({ error: "Sign-ups are closed right now." }, 503);
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
        if (tooMany(ip)) return json({ error: "Too many sign-ups from this connection. Try again later." }, 429);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, 400);
        }
        const parsed = cleanSignup(body);
        if (!parsed.ok) return json({ error: parsed.error }, 400);
        const input = parsed.value;

        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return json({ error: "Sign-up isn't available right now." }, 500);
        try {
          if (await findUserByEmail(token, input.email)) {
            return json({ error: "You already have an account. Use the access code from your welcome email to log in." }, 409);
          }
          const { code, clientName } = await createTrialAccount(token, input, {
            scripts: credit(process.env.TRIAL_SCRIPTS, 10),
            reports: credit(process.env.TRIAL_REPORTS, 1),
          });
          await notifyGhl(process.env.GHL_SIGNUP_WEBHOOK_URL, {
            name: input.name,
            email: input.email,
            instagram: input.instagram,
            access_code: code,
            tag: "creators-trial",
            source: "risevoicetools.com sign-up",
          });
          return json({ ok: true, code, clientName, userType: "User" });
        } catch (e) {
          console.error("[signup]", e);
          return json({ error: "Sign-up failed. Please try again in a minute." }, 502);
        }
      },
    },
  },
});
