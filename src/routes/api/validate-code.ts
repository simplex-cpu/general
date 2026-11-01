import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const AIRTABLE_BASE = "appf1QABtQbAENYDz";
const AIRTABLE_TABLE = "tbl1Sc1qn5MhXc0Ta";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

export const Route = createFileRoute("/api/validate-code")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }: { request: Request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) {
          return json({ valid: false, reason: "server" }, 500);
        }

        let payload: { code?: unknown };
        try {
          payload = await request.json();
        } catch {
          return json({ valid: false, reason: "invalid" }, 400);
        }

        const code = typeof payload.code === "string" ? payload.code.trim() : "";
        if (!code || code.length > 200) {
          return json({ valid: false, reason: "invalid" }, 400);
        }

        const safeCode = code.replace(/'/g, "\\'");
        const formula = `{Code}='${safeCode}'`;
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(
          formula
        )}&maxRecords=1`;

        try {
          const lookup = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!lookup.ok) {
            console.error("Airtable lookup failed:", lookup.status, await lookup.text());
            return json({ valid: false, reason: "server" }, 502);
          }

          const data = (await lookup.json()) as { records?: AirtableRecord[] };
          const record = data.records?.[0];

          if (!record) {
            return json({ valid: false, reason: "invalid" });
          }

          const fields = record.fields || {};
          if (fields.Active !== true) {
            return json({ valid: false, reason: "deactivated" });
          }

          const clientName = (fields["Client Name"] as string) || "";
          const userType = ((fields["User type"] as string) || "User").trim();
          const scriptsLeft = Number(fields["Scripts left"] ?? 0);
          const reportsLeft = Number(fields["Reports left"] ?? 0);
          const scriptsBudget = Number(fields["Scripts Budget"] ?? 0);
          const reportsBudget = Number(fields["Reports Budget"] ?? 0);
          const pic = fields["Profile Picture"];
          const avatarUrl = Array.isArray(pic) && pic.length
            ? String(((pic[0] as any)?.thumbnails?.large?.url) || (pic[0] as any)?.url || "")
            : "";

          // Touch record to update lastModifiedTime
          try {
            await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${record.id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fields: { "Client Name": clientName },
                }),
              }
            );
          } catch (err) {
            console.error("Airtable touch failed (non-fatal):", err);
          }

          return json({
            valid: true,
            clientName,
            userType,
            scriptsLeft,
            reportsLeft,
            scriptsBudget,
            reportsBudget,
            avatarUrl,
          });
        } catch (err) {
          console.error("validate-code error:", err);
          return json({ valid: false, reason: "server" }, 502);
        }
      },
    },
  },
} as any);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
