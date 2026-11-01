import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";


const AIRTABLE_API = "https://api.airtable.com";
const CONTENT_API = "https://content.airtable.com";
const BASE_ID = "appOttHso6hYjBXhw";
const TABLE_ID = "tblPm4VFwe6nTaYj4"; // Client Admin
const FIELD_ID = "fldIBqAr551xuxdev"; // Brand briefs

type Attachment = { id?: string; url: string; filename: string; type?: string };

function patHeaders() {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  if (!AIRTABLE_TOKEN) return null;
  return { Authorization: `Bearer ${AIRTABLE_TOKEN}` } as Record<string, string>;
}

async function fetchBrief(recordId: string) {
  const headers = patHeaders();
  if (!headers) return { error: "AIRTABLE_TOKEN not configured", status: 500 as const };
  const r = await fetch(
    `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${recordId}?returnFieldsByFieldId=true`,
    { headers }
  );
  const data: any = await r.json();
  if (!r.ok) return { error: `Airtable error [${r.status}]: ${JSON.stringify(data)}`, status: 502 as const };
  const att = data.fields?.[FIELD_ID];
  const attachments: Attachment[] = Array.isArray(att)
    ? att.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }))
    : [];
  return {
    attachments,
    // Legacy single-attachment alias for callers that haven't migrated.
    attachment: attachments[0] || null,
  };
}

export const Route = createFileRoute("/api/brand-brief")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;
        const brandId = url.searchParams.get("brandId");
        if (!brandId) return Response.json({ error: "brandId required" }, { status: 400 });
        const result = await fetchBrief(brandId);
        if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
        return Response.json(result);
      },


      POST: async ({ request }) => {
        const pat = patHeaders();
        if (!pat) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const body = (await request.json()) as {
          brandId: string;
          base64: string;
          filename: string;
          contentType?: string;
          accessCode?: string;
        };
        const auth = await requireAccessCode(body?.accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;
        if (!body?.brandId || !body?.base64 || !body?.filename) {
          return Response.json({ error: "brandId, base64, and filename required" }, { status: 400 });
        }
        const contentType = body.contentType || "application/pdf";


        const r = await fetch(
          `${CONTENT_API}/v0/${BASE_ID}/${body.brandId}/${FIELD_ID}/uploadAttachment`,
          {
            method: "POST",
            headers: { ...pat, "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType,
              file: body.base64,
              filename: body.filename,
            }),
          }
        );
        const data: any = await r.json().catch(() => ({}));
        if (!r.ok) {
          return Response.json(
            { error: `Airtable upload failed [${r.status}]: ${JSON.stringify(data)}` },
            { status: 502 }
          );
        }
        const attArr = data.fields?.[FIELD_ID];
        const attachments: Attachment[] = Array.isArray(attArr)
          ? attArr.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }))
          : [];
        const last = attachments[attachments.length - 1] || null;
        return Response.json({
          ok: true,
          attachments,
          attachment: last || { url: "", filename: body.filename },
        });
      },

      DELETE: async ({ request }) => {
        const headers = patHeaders();
        if (!headers) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const body = (await request.json()) as { brandId: string; attachmentId?: string; accessCode?: string };
        const auth = await requireAccessCode(body?.accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;
        if (!body?.brandId) return Response.json({ error: "brandId required" }, { status: 400 });

        // If attachmentId provided: remove only that attachment, keep the rest.
        let nextAttachments: { id: string }[] = [];
        if (body.attachmentId) {
          const current = await fetchBrief(body.brandId);
          if ("error" in current) {
            return Response.json({ error: current.error }, { status: current.status });
          }
          nextAttachments = (current.attachments || [])
            .filter((a) => a.id && a.id !== body.attachmentId)
            .map((a) => ({ id: a.id! }));
        }

        const r = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${body.brandId}`, {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: { [FIELD_ID]: nextAttachments },
            returnFieldsByFieldId: true,
          }),
        });
        const data: any = await r.json().catch(() => ({}));
        if (!r.ok) {
          return Response.json(
            { error: `Airtable clear failed [${r.status}]: ${JSON.stringify(data)}` },
            { status: 502 }
          );
        }
        const attArr = data.fields?.[FIELD_ID];
        const attachments: Attachment[] = Array.isArray(attArr)
          ? attArr.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }))
          : [];
        return Response.json({ ok: true, attachments });
      },

      PATCH: async ({ request }) => {
        const headers = patHeaders();
        if (!headers) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const body = (await request.json()) as {
          brandId: string;
          attachmentId: string;
          filename: string;
          accessCode?: string;
        };
        const auth = await requireAccessCode(body?.accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;
        if (!body?.brandId || !body?.attachmentId || !body?.filename?.trim()) {
          return Response.json({ error: "brandId, attachmentId, and filename required" }, { status: 400 });
        }

        const current = await fetchBrief(body.brandId);
        if ("error" in current) {
          return Response.json({ error: current.error }, { status: current.status });
        }
        const nextAttachments = (current.attachments || []).map((a) =>
          a.id === body.attachmentId
            ? { id: a.id!, filename: body.filename.trim() }
            : { id: a.id! }
        );

        const r = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${body.brandId}`, {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: { [FIELD_ID]: nextAttachments },
            returnFieldsByFieldId: true,
          }),
        });
        const data: any = await r.json().catch(() => ({}));
        if (!r.ok) {
          return Response.json(
            { error: `Airtable rename failed [${r.status}]: ${JSON.stringify(data)}` },
            { status: 502 }
          );
        }
        const attArr = data.fields?.[FIELD_ID];
        const attachments: Attachment[] = Array.isArray(attArr)
          ? attArr.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }))
          : [];
        return Response.json({ ok: true, attachments });
      },
    },
  },
});
