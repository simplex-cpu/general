import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { linkContainsName, ownsRecord, resolveOwnerId, resolveOwnerIdentity } from "@/lib/owner.server";
import { createDriveFolder, finalizeDriveFile, moveDriveFile } from "@/lib/googleDrive.server";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tblg9GFFeGNrRvDQN"; // Video requests (creative requests)
const USERS_TABLE = "tblO9nM6xTdzJyyax";

const FIELD_STATUS = "Status";
const FIELD_TYPE = "Type of Request";
const FIELD_POSTS = "Number of Posts";
const FIELD_FORMAT = "Format";
const FIELD_FOOTAGE = "To Edit";
const FIELD_FOOTAGE_LINKS = "Footage links";
const FIELD_SCRIPTS = "Scripts";
const FIELD_USER = "Users";
const FIELD_EDITED = "Edited";

const CONTENT_TABLE = "tblucGgVsDiDGdyyK"; // Client Content (editing | designing board)
const BRANDS_TABLE = "tblho1mwlIMZfozue";
const DRIVE_PARENT_FOLDER = "1DEi1mjTz4y01Idhdx0UyeVfIOVjA7k3o";

const POST_TYPE_BY_FORMAT: Record<string, string> = {
  Carousel: "\u{1F5BC}\u{FE0F} Carousel",
  Graphic: "\u{1F5BC}\u{FE0F} Graphic",
  BROLL: "\u{1F4F9} BROLL Video",
  "Talking Video": "\u{1F4F9} Talking Video",
};

async function findBrandIdByCode(token: string, code: string): Promise<string | undefined> {
  const safe = String(code || "").replace(/'/g, "\\'");
  if (!safe) return undefined;
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const res = await fetch(
    `${AIRTABLE_API}/v0/${BASE_ID}/${BRANDS_TABLE}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return undefined;
  const data: any = await res.json().catch(() => ({}));
  return data?.records?.[0]?.id;
}

const ALLOWED_TYPES = ["Edit", "Design"];
const ALLOWED_FORMATS_BY_TYPE: Record<string, string[]> = {
  Edit: ["Talking Video", "BROLL"],
  Design: ["Graphic", "Carousel"],
};

type DriveRef = { fileId?: string; filename?: string };

async function finalizeAll(items: DriveRef[]) {
  const out: { id: string; url: string; filename: string }[] = [];
  for (const item of items) {
    const fid = String(item?.fileId || "").trim();
    if (!/^[A-Za-z0-9_-]{10,}$/.test(fid)) throw new Error("Valid fileId required for every file");
    const f = await finalizeDriveFile(fid);
    out.push({ id: f.id, url: f.url, filename: String(item?.filename || f.filename) });
  }
  return out;
}

export const Route = createFileRoute("/api/creative-requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token)
          return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const accessCode =
          request.headers.get("x-access-code") ||
          new URL(request.url).searchParams.get("accessCode") ||
          "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const owner = await resolveOwnerIdentity(auth.record, token);
        const ownerId = owner?.id || null;
        if (!ownerId) {
          return Response.json({
            items: [],
            ownerUnresolved: true,
            error: "We could not match your account to a client record.",
          });
        }
        const url = owner?.name
          ? `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent(
              linkContainsName("Users", owner.name),
            )}&pageSize=100`
          : `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok)
          return Response.json({ error: `List failed [${res.status}]` }, { status: 502 });

        const one = (v: any): string => {
          if (Array.isArray(v)) {
            const vals = v.map((x) => (typeof x === "object" ? x?.name : x)).filter(Boolean);
            return String(vals[vals.length - 1] || "");
          }
          return String(v || "");
        };

        const items = (data.records || [])
          .filter((r: any) => ownsRecord(r?.fields?.["Users"], ownerId))
          .map((r: any) => {
          const f = r.fields || {};
          const att = (key: string) => (Array.isArray(f[key]) ? f[key] : []);
          return {
            id: r.id,
            createdTime: r.createdTime || "",
            requestType: one(f[FIELD_TYPE]),
            format: one(f[FIELD_FORMAT]),
            status: one(f[FIELD_STATUS]),
            posts: Number(f[FIELD_POSTS] || 0) || 0,
            footageLinks: String(f[FIELD_FOOTAGE_LINKS] || ""),
            editedUrl: String(f[FIELD_EDITED] || ""),
            footage: att(FIELD_FOOTAGE).map((a: any) => ({
              id: a.id,
              url: a.url,
              filename: a.filename,
            })),
            scripts: att(FIELD_SCRIPTS).map((a: any) => ({
              id: a.id,
              url: a.url,
              filename: a.filename,
            })),
          };
        });

        items.sort(
          (a: any, b: any) =>
            new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime(),
        );
        return Response.json({ items });
      },

      POST: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token)
          return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const accessCode = request.headers.get("x-access-code") || String(body?.accessCode || "");
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const requestType = String(body?.requestType || "").trim();
        const format = String(body?.format || "").trim();
        const posts = Number(body?.posts || 0) || 0;
        const footageLinksRaw = String(body?.footageLinks || "").trim();

        if (!ALLOWED_TYPES.includes(requestType)) {
          return Response.json({ error: "Pick a request type: Edit or Design" }, { status: 400 });
        }
        if (!ALLOWED_FORMATS_BY_TYPE[requestType]?.includes(format)) {
          return Response.json(
            {
              error: `Pick a valid format for ${requestType}: ${ALLOWED_FORMATS_BY_TYPE[requestType].join(" or ")}`,
            },
            { status: 400 },
          );
        }
        if (posts < 1)
          return Response.json({ error: "Number of posts must be at least 1" }, { status: 400 });

        const footageRefs: DriveRef[] = Array.isArray(body?.footage) ? body.footage : [];
        const scriptRefs: DriveRef[] = Array.isArray(body?.scripts) ? body.scripts : [];

        if (!footageRefs.length && !footageLinksRaw) {
          return Response.json(
            { error: "Attach your footage or paste a Drive link" },
            { status: 400 },
          );
        }
        if (!scriptRefs.length) {
          return Response.json({ error: "Attach the scripts for this request" }, { status: 400 });
        }

        let footage: { id: string; url: string; filename: string }[] = [];
        let scripts: { id: string; url: string; filename: string }[] = [];
        let folderUrl = "";
        const requestedAt = new Date();
        try {
          footage = await finalizeAll(footageRefs);
          scripts = await finalizeAll(scriptRefs);

          // All uploads (footage + scripts) live in one shared folder per request.
          const stamp = requestedAt.toISOString().slice(0, 16).replace("T", " ");
          const folder = await createDriveFolder(
            `${auth.record.clientName} — ${requestType} request ${stamp} UTC`,
            DRIVE_PARENT_FOLDER,
          );
          folderUrl = folder.url;
          for (const f of [...footage, ...scripts]) await moveDriveFile(f.id, folder.id);
        } catch (e: any) {
          return Response.json({ error: e?.message || "Drive finalize failed" }, { status: 502 });
        }

        // Link the request to the account on this access code.
        const userRecordId = await resolveOwnerId(auth.record, token);
        if (!userRecordId) {
          return Response.json(
            { error: "We could not match your account to a client record." },
            { status: 400 },
          );
        }

        const fields: Record<string, any> = {
          [FIELD_STATUS]: "To Edit",
          [FIELD_TYPE]: requestType,
          [FIELD_FORMAT]: format,
          [FIELD_POSTS]: posts,
          [FIELD_USER]: [userRecordId],
        };
        if (footage.length)
          fields[FIELD_FOOTAGE] = footage.map((d) => ({ url: d.url, filename: d.filename }));
        if (scripts.length)
          fields[FIELD_SCRIPTS] = scripts.map((d) => ({ url: d.url, filename: d.filename }));
        const links = [
          ...(folderUrl ? [folderUrl] : []),
          ...(footageLinksRaw ? [footageLinksRaw] : []),
        ];
        if (links.length) fields[FIELD_FOOTAGE_LINKS] = links.join("\n");

        const createRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields, typecast: true }),
        });
        const created: any = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          return Response.json(
            {
              error: `Create failed [${createRes.status}]: ${JSON.stringify(created).slice(0, 300)}`,
            },
            { status: 502 },
          );
        }

        // One Client Content record per requested post, all pointing at the same
        // Drive folder and landing on the "To Edit | To Design" board.
        const brandRecordId = await findBrandIdByCode(token, auth.record.code);
        const datePart = requestedAt.toISOString().slice(0, 10);
        const contentFields = Array.from({ length: posts }, (_, i) => ({
          fields: {
            Name: `${datePart} - ${i + 1}`,
            "Client Status": "To Edit | To Design",
            "Post Type": POST_TYPE_BY_FORMAT[format] || format,
            "Google Drive to RAW Files": folderUrl || undefined,
            Source: "Team",
            User: [userRecordId],
            ...(brandRecordId ? { Brands: [brandRecordId] } : {}),
          },
        }));

        const contentIds: string[] = [];
        const contentErrors: string[] = [];
        for (let i = 0; i < contentFields.length; i += 10) {
          const chunk = contentFields.slice(i, i + 10);
          const res = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ records: chunk, typecast: true }),
          });
          const data: any = await res.json().catch(() => ({}));
          if (!res.ok) {
            contentErrors.push(`[${res.status}] ${JSON.stringify(data).slice(0, 200)}`);
          } else {
            for (const r of data.records || []) contentIds.push(r.id);
          }
        }
        if (contentErrors.length && !contentIds.length) {
          return Response.json(
            { error: `Post records failed: ${contentErrors[0]}` },
            { status: 502 },
          );
        }

        return Response.json({
          ok: true,
          recordId: created?.id,
          folderUrl,
          postRecordIds: contentIds,
          warning: contentErrors.length
            ? `Some post records failed: ${contentErrors[0]}`
            : undefined,
        });
      },
    },
  },
});
