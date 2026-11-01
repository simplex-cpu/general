import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

// Streams an Airtable attachment so the browser can render it inline.
// Looks the file up server-side from short IDs so the request URL contains
// nothing that ad blockers can pattern-match (no embedded external URLs).
const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appOttHso6hYjBXhw";
const TABLE_ID = "tblPm4VFwe6nTaYj4"; // Client Admin
const FIELD_ID = "fldIBqAr551xuxdev"; // Brand briefs

export const Route = createFileRoute("/api/brief-file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const brandId = url.searchParams.get("b");
        const attId = url.searchParams.get("f");
        const name = url.searchParams.get("n");
        if (!brandId || (!attId && !name)) return new Response("b and f or n required", { status: 400 });

        // Require a valid, active access code. Brand briefs are confidential
        // client documents; never serve them to unauthenticated callers.
        const auth = await requireAccessCode(request.headers.get("x-access-code"));
        if (!auth.ok) return auth.response;

        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return new Response("not configured", { status: 500 });

        const rec = await fetch(
          `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${encodeURIComponent(brandId)}?returnFieldsByFieldId=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!rec.ok) return new Response(`lookup failed: ${rec.status}`, { status: 502 });
        const data: any = await rec.json();
        const atts: any[] = Array.isArray(data.fields?.[FIELD_ID]) ? data.fields[FIELD_ID] : [];
        const att =
          (attId ? atts.find((a) => a.id === attId) : undefined) ||
          (name ? atts.find((a) => a.filename === name) : undefined);
        if (!att?.url) return new Response("file not found", { status: 404 });

        const r = await fetch(att.url);
        if (!r.ok) return new Response(`fetch failed: ${r.status}`, { status: 502 });
        const buf = await r.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": r.headers.get("content-type") || att.type || "application/pdf",
            "Cache-Control": "private, max-age=60",
            "Content-Disposition": "inline",
          },
        });
      },
    },
  },
});
