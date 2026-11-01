import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import {
  airtableHeaders,
  LEARNING_BASE,
  resolveUserRecordId,
  T_MODULES,
} from "@/lib/learning.server";

const ALLOWED = ["In progress", "Completed"];

export const Route = createFileRoute("/api/learning/module-status")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const h = airtableHeaders();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });

        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;

        const body = (await request.json().catch(() => ({}))) as { moduleId?: string; status?: string };
        const moduleId = String(body.moduleId || "");
        const status = String(body.status || "");
        if (!moduleId.startsWith("rec") || !ALLOWED.includes(status)) {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }

        try {
          const userId = await resolveUserRecordId(auth.record, h);
          if (!userId) return Response.json({ error: "No learning profile" }, { status: 403 });

          const read = await fetch(`https://api.airtable.com/v0/${LEARNING_BASE}/${T_MODULES}/${moduleId}`, {
            headers: h,
          });
          if (!read.ok) return Response.json({ error: "Course not found" }, { status: 404 });
          const rec: any = await read.json();
          const owners: string[] = Array.isArray(rec?.fields?.User) ? rec.fields.User : [];
          if (!owners.includes(userId)) return Response.json({ error: "Not allowed" }, { status: 403 });
          if (/^locked$/i.test(String(rec?.fields?.Status || "").trim())) {
            return Response.json({ error: "Course is locked" }, { status: 403 });
          }

          const patch = await fetch(`https://api.airtable.com/v0/${LEARNING_BASE}/${T_MODULES}/${moduleId}`, {
            method: "PATCH",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: { Status: status } }),
          });
          const data: any = await patch.json().catch(() => ({}));
          if (!patch.ok) {
            console.error("[learning] status patch failed", data);
            return Response.json({ error: `Update failed [${patch.status}]` }, { status: 502 });
          }
          return Response.json({ ok: true, status: String(data?.fields?.Status || status) });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
} as any);
