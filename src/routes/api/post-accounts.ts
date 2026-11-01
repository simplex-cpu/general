import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { brandPostAccounts, canUseBrand } from "@/lib/postAccounts.server";

// Lists the connected posting accounts of a brand the caller owns.
export const Route = createFileRoute("/api/post-accounts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const brandId = new URL(request.url).searchParams.get("brandId") || "";
        try {
          if (!(await canUseBrand(auth.record, token, brandId))) return Response.json({ error: "Not allowed" }, { status: 403 });
          return Response.json({ accounts: await brandPostAccounts(token, brandId) });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Could not load accounts" }, { status: 502 });
        }
      },
    },
  },
});
