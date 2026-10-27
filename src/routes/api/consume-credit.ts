import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";


const AIRTABLE_BASE = "appf1QABtQbAENYDz";
const AIRTABLE_TABLE = "tbl1Sc1qn5MhXc0Ta";

const F_CODE = "Code";
const F_SCRIPTS_LEFT = "Scripts left";
const F_SCRIPTS_USED = "Scripts generated (This month)";
const F_REPORTS_LEFT = "Reports left";
const F_REPORTS_USED = "Reports generated (This month)";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function findUserByCode(code: string, token: string) {
  const safe = code.replace(/'/g, "\\'");
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(
    `{${F_CODE}}='${safe}'`
  )}&maxRecords=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Airtable lookup failed: ${res.status}`);
  const data = await res.json();
  return data.records?.[0] || null;
}

async function patchRecord(recordId: string, fields: Record<string, unknown>, token: string) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable patch failed: ${res.status} ${txt.slice(0, 200)}`);
  }
}

export const Route = createFileRoute("/api/consume-credit")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return json({ ok: false, error: "server" }, 500);

        let body: { code?: string; kind?: string };
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "invalid" }, 400);
        }
        const code = (body.code || "").trim();
        const kind = body.kind === "report" ? "report" : "script";
        if (!code) return json({ ok: false, error: "code_required" }, 400);

        try {
          // Validate access code (rejects deactivated codes before spending credits).
          const auth = await requireAccessCode(code);
          if (!auth.ok) return json({ ok: false, error: "invalid_code" }, 401);
          const rec = { id: auth.record.id, fields: auth.record.fields };

          if (kind === "script") {
            const left = Number(rec.fields[F_SCRIPTS_LEFT] ?? 0);
            if (left <= 0) {
              return json({ ok: false, error: "no_credits", message: "Running out of credits. Contact admin" }, 402);
            }
            const used = Number(rec.fields[F_SCRIPTS_USED] ?? 0);
            await patchRecord(rec.id, { [F_SCRIPTS_USED]: used + 1 }, token);
            return json({ ok: true, left: left - 1 });
          } else {
            const left = Number(rec.fields[F_REPORTS_LEFT] ?? 0);
            if (left <= 0) {
              return json({ ok: false, error: "no_credits", message: "Running out of credits. Contact admin" }, 402);
            }
            // "Reports left" is a computed field in Airtable; increment the writable counter instead.
            const used = Number(rec.fields[F_REPORTS_USED] ?? 0);
            try {
              await patchRecord(rec.id, { [F_REPORTS_USED]: used + 1 }, token);
            } catch (err) {
              console.warn("[consume-credit] Add a 'Reports generated (This month)' number field in Airtable to enable report-credit tracking.", err);
            }
            return json({ ok: true, left: left - 1 });
          }
        } catch (e: any) {
          console.error("consume-credit error:", e);
          return json({ ok: false, error: String(e?.message || e) }, 500);
        }
      },
    },
  },
} as any);
