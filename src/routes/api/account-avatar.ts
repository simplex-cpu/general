import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tbl1Sc1qn5MhXc0Ta";
const PIC_FIELD_ID = "fldnal9U0X3zNbubj"; // Profile Picture

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export const Route = createFileRoute("/api/account-avatar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const h = { Authorization: `Bearer ${token}` };

        const body = (await request.json().catch(() => ({}))) as {
          accessCode?: string;
          base64?: string;
          filename?: string;
          contentType?: string;
          clear?: boolean;
        };
        const auth = await requireAccessCode(body?.accessCode);
        if (!auth.ok) return auth.response;
        const recordId = auth.record.id;

        try {
          if (body.clear) {
            await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
              method: "PATCH",
              headers: { ...h, "Content-Type": "application/json" },
              body: JSON.stringify({ fields: { "Profile Picture": [] } }),
            });
            return Response.json({ ok: true, avatarUrl: "" });
          }

          if (!body.base64 || !body.filename) {
            return Response.json({ error: "No image provided" }, { status: 400 });
          }
          const contentType = (body.contentType || "image/png").toLowerCase();
          if (!ALLOWED.includes(contentType)) {
            return Response.json({ error: "Please use a PNG, JPG, WEBP or GIF image." }, { status: 400 });
          }
          // base64 length ~ 4/3 of bytes; cap around 5MB.
          if (body.base64.length > 7_200_000) {
            return Response.json({ error: "That image is too large (max 5MB)." }, { status: 400 });
          }

          // Replace: clear then upload so only one picture is kept.
          await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
            method: "PATCH",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: { "Profile Picture": [] } }),
          });

          const up = await fetch(
            `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${PIC_FIELD_ID}/uploadAttachment`,
            {
              method: "POST",
              headers: { ...h, "Content-Type": "application/json" },
              body: JSON.stringify({
                contentType,
                file: body.base64,
                filename: body.filename.slice(0, 120),
              }),
            },
          );
          const upData: any = await up.json().catch(() => ({}));
          if (!up.ok) {
            return Response.json(
              { error: `Upload failed [${up.status}]: ${JSON.stringify(upData).slice(0, 200)}` },
              { status: 502 },
            );
          }

          const read = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`,
            { headers: h },
          );
          const rec: any = await read.json().catch(() => ({}));
          const pic = rec?.fields?.["Profile Picture"];
          const avatarUrl =
            Array.isArray(pic) && pic.length
              ? String(pic[0]?.thumbnails?.large?.url || pic[0]?.url || "")
              : "";
          return Response.json({ ok: true, avatarUrl });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
});
