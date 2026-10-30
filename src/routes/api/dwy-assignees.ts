import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

const AIRTABLE_API = "https://api.airtable.com";
const DWY_BASE = "appf1QABtQbAENYDz";
const DWY_USERS_TABLE = "tblO9nM6xTdzJyyax";

/**
 * Lists the DWY users that share the caller's access code, so a client can pick
 * who should edit/design the content they just sent to production.
 */
export const Route = createFileRoute("/api/dwy-assignees")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });

        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const safeCode = accessCode.replace(/'/g, "\\'");
        const formula = `OR(FIND('${safeCode}', ARRAYJOIN({Access code (from Brands)}, ',')) > 0, FIND('${safeCode}', ARRAYJOIN({Access code user (from Brands)}, ',')) > 0)`;

        const people: { id: string; name: string; email?: string }[] = [];
        let offset: string | undefined;
        try {
          do {
            const qs = new URLSearchParams();
            qs.set("pageSize", "100");
            qs.set("filterByFormula", formula);
            qs.append("fields[]", "User name");
            qs.append("fields[]", "Email");
            if (offset) qs.set("offset", offset);
            const r = await fetch(`${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_USERS_TABLE}?${qs.toString()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data: any = await r.json().catch(() => ({}));
            if (!r.ok) return Response.json({ error: `Airtable [${r.status}]` }, { status: 502 });
            for (const rec of data.records || []) {
              const name = typeof rec?.fields?.["User name"] === "string" ? rec.fields["User name"].trim() : "";
              if (name) people.push({ id: rec.id, name, email: rec?.fields?.["Email"] });
            }
            offset = data.offset;
          } while (offset);
        } catch (e: any) {
          return Response.json({ error: e?.message || "Fetch failed" }, { status: 500 });
        }

        people.sort((a, b) => a.name.localeCompare(b.name));
        return Response.json({ people });
      },
    },
  },
});
