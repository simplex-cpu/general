import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

// Returns the Team Roster table as { id, name, role, todoCount } records
// used to populate the "Creative Assigned" linked-record picker on script cards.
const GATEWAY = "https://connector-gateway.lovable.dev/airtable";
const BASE_ID = "appOttHso6hYjBXhw";
const TEAM_ROSTER_TABLE_ID = "tblu7ZGCkLPA9x1cp";

export const Route = createFileRoute("/api/list-airtable-collaborators")({
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

        try {
          const people: { id: string; name: string; role: string; todoCount: number }[] = [];
          let offset: string | undefined;
          do {
            const qs = new URLSearchParams();
            qs.set("pageSize", "100");
            qs.append("fields[]", "Full Name");
            qs.append("fields[]", "Role");
            qs.append("fields[]", "To do");
            if (offset) qs.set("offset", offset);
            const r = await fetch(
              `${GATEWAY}/v0/${BASE_ID}/${TEAM_ROSTER_TABLE_ID}?${qs.toString()}`,
              {
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "X-Connection-Api-Key": AIRTABLE_API_KEY,
                },
              }
            );
            const data: any = await r.json();
            if (!r.ok) {
              return Response.json(
                { error: `Airtable error [${r.status}]: ${JSON.stringify(data).slice(0, 300)}` },
                { status: 502 }
              );
            }
            for (const rec of data?.records || []) {
              const name = rec?.fields?.["Full Name"];
              if (rec?.id && typeof name === "string" && name.trim()) {
                const role = typeof rec.fields?.Role === "string" ? rec.fields.Role : "";
                const raw = rec.fields?.["To do"];
                const todoCount = typeof raw === "number" ? raw : 0;
                people.push({ id: rec.id, name: name.trim(), role, todoCount });
              }
            }
            offset = data?.offset;
          } while (offset);

          people.sort((a, b) => a.name.localeCompare(b.name));
          return Response.json({ people });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Fetch failed" }, { status: 500 });
        }
      },
    },
  },
});
