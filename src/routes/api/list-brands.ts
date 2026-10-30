import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

const GATEWAY = "https://connector-gateway.lovable.dev/airtable";
const BASE_ID = "appOttHso6hYjBXhw";
const TABLE_ID = "tblPm4VFwe6nTaYj4"; // Client Admin

export const Route = createFileRoute("/api/list-brands")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        if (!LOVABLE_API_KEY || !AIRTABLE_API_KEY) {
          return Response.json({ error: "Airtable not configured" }, { status: 500 });
        }


        const brands: { id: string; name: string; status: string }[] = [];
        let offset: string | undefined = undefined;
        const formula = `OR({Status}='Active',{Status}='Onboarding',{Status}='Offboarding')`;

        try {
          do {
            const params = new URLSearchParams({
              filterByFormula: formula,
              "fields[]": "Client Name",
              pageSize: "100",
            });
            params.append("fields[]", "Status");
            if (offset) params.set("offset", offset);

            const r = await fetch(`${GATEWAY}/v0/${BASE_ID}/${TABLE_ID}?${params.toString()}`, {
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": AIRTABLE_API_KEY,
              },
            });
            const data: any = await r.json();
            if (!r.ok) {
              return Response.json(
                { error: `Airtable error [${r.status}]: ${JSON.stringify(data)}` },
                { status: 502 }
              );
            }
            for (const rec of data.records || []) {
              const name = rec.fields?.["Client Name"];
              if (name) brands.push({ id: rec.id, name: String(name), status: rec.fields?.Status || "" });
            }
            offset = data.offset;
          } while (offset);

          brands.sort((a, b) => a.name.localeCompare(b.name));
          return Response.json({ brands });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Fetch failed" }, { status: 500 });
        }
      },
    },
  },
});
