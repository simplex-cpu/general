import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief } from "@/lib/brands.server";
import { BRAND_BRIEF_FIELDS } from "@/lib/brands";
import { GRAPHIC_STYLE_FIELD } from "@/lib/slate/brandVisualStyle";

const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tblkV5xOB2D1N5dNH"; // Brand brief
const LOGO_FIELD_ID = "fldElWxPJO2XEDkpF"; // Logo (multipleAttachments)

// Editable text fields exposed to the client, in display order.
export const BRIEF_FIELDS = BRAND_BRIEF_FIELDS;

// Visual/style preferences shown at the bottom of the brand brief tab.
export const STYLE_FIELDS = [
  GRAPHIC_STYLE_FIELD,
  "Captions style primary",
  "Captions style secondary",
  "Font color (Primary)",
  "Font color (Secondary)",
  "Font background Color (Primary)",
  "Font background Color (Secondary)",
  "Caption background opacity",
  "Aesthetic preferences",
  "Carousel Cover Background",
  "Carousel Cover Background 2",
  "Carousel Cover Text Align",
  "Carousel Slides Text Align",
  "Carousel Slides Background",
  "Carousel Title Color",
  "Carousel Slides Subtitle Color",
  "Carousel Slides Text Color",
] as const;

const ALL_FIELDS = [...BRIEF_FIELDS, ...STYLE_FIELDS] as readonly string[];

export const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "Youtube", "Tiktok", "Linkedin"] as const;
const STATUSES = ["To Connect", "In Progress", "Connected"];

function headers() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}

function shape(rec: any) {
  const fields: Record<string, string> = {};
  for (const f of ALL_FIELDS) fields[f] = String(rec.fields?.[f] ?? "");
  const logoArr = Array.isArray(rec.fields?.Logo) ? rec.fields.Logo : [];
  const logo = logoArr[0]?.url || "";
  const logoName = logoArr[0]?.filename || "";
  const socials: Record<string, { user: string; password: string; status: string }> = {};
  for (const p of SOCIAL_PLATFORMS) {
    socials[p] = {
      user: String(rec.fields?.[`${p} User`] ?? ""),
      password: "",
      status: String(rec.fields?.[`${p} Connected`] ?? "To Connect"),
    };
  }
  return { id: rec.id, fields, logo, logoName, socials };
}

export const Route = createFileRoute("/api/my-brief")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const code = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(code);
        if (!auth.ok) return auth.response;
        try {
          const rec = await selectedBrief(auth.record, process.env.AIRTABLE_TOKEN || "", new URL(request.url).searchParams.get("brandId") || undefined);
          if (!rec) return Response.json({ brief: null });
          return Response.json({ brief: shape(rec) });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },

      PATCH: async ({ request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const body = (await request.json().catch(() => ({}))) as {
          accessCode?: string;
          brandId?: string;
          fields?: Record<string, string>;
          socials?: Record<string, { user?: string; password?: string; status?: string }>;
          logoBase64?: string;
          logoFilename?: string;
          logoContentType?: string;
          removeLogo?: boolean;
        };
        const auth = await requireAccessCode(body?.accessCode);
        if (!auth.ok) return auth.response;
        try {
          const rec = await selectedBrief(auth.record, process.env.AIRTABLE_TOKEN || "", body.brandId);
          if (!rec) return Response.json({ error: "No brand brief linked to this account" }, { status: 404 });

          // Logo upload (replaces any existing logo).
          if (body.logoBase64 && body.logoFilename) {
            // Upload first so a failed upload cannot erase the current logo.
            const up = await fetch(
              `https://content.airtable.com/v0/${BASE_ID}/${rec.id}/${LOGO_FIELD_ID}/uploadAttachment`,
              {
                method: "POST",
                headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({
                  contentType: body.logoContentType || "image/png",
                  file: body.logoBase64,
                  filename: body.logoFilename,
                }),
              },
            );
            const upData: any = await up.json().catch(() => ({}));
            if (!up.ok) {
              return Response.json(
                { error: `Logo upload failed [${up.status}]: ${JSON.stringify(upData).slice(0, 300)}` },
                { status: 502 },
              );
            }
            const attachments = Array.isArray(upData.fields?.Logo) ? upData.fields.Logo : [];
            const newest = attachments.at(-1);
            if (newest?.id) {
              const keep = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${rec.id}`, {
                method: "PATCH", headers: { ...h, "Content-Type": "application/json" },
                body: JSON.stringify({ fields: { Logo: [{ id: newest.id }] } }),
              });
              if (!keep.ok) throw new Error("Logo uploaded but could not replace the previous logo");
            }
          } else if (body.removeLogo) {
            await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${rec.id}`, {
              method: "PATCH",
              headers: { ...h, "Content-Type": "application/json" },
              body: JSON.stringify({ fields: { Logo: [] } }),
            });
          }

          const patch: Record<string, string> = {};
          for (const f of ALL_FIELDS) {
            const v = body.fields?.[f];
            if (typeof v === "string") patch[f] = v.slice(0, 20000);
          }
          for (const p of SOCIAL_PLATFORMS) {
            const s = body.socials?.[p];
            if (!s) continue;
            if (typeof s.user === "string") patch[`${p} User`] = s.user.slice(0, 500);
            if (typeof s.password === "string") patch[`${p} Password`] = s.password.slice(0, 500);
            if (typeof s.status === "string" && STATUSES.includes(s.status))
              patch[`${p} Connected`] = s.status;
          }

          const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${rec.id}`, {
            method: "PATCH",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: patch, typecast: true }),
          });
          const data: any = await r.json();
          if (!r.ok) {
            return Response.json(
              { error: `Airtable save failed [${r.status}]: ${JSON.stringify(data)}` },
              { status: 502 },
            );
          }
          // Re-read so logo changes are reflected.
          const fresh = await selectedBrief(auth.record, process.env.AIRTABLE_TOKEN || "", body.brandId);
          return Response.json({ ok: true, brief: shape(fresh || data) });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
});
