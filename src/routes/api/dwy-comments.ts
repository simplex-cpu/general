import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { linkedRecordIds, ownsRecord, resolveOwnerId } from "@/lib/owner.server";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appf1QABtQbAENYDz";
const COMMENTS_TABLE = "tblYoXhOiVQpqc9tX";
const CONTENT_TABLE = "tblucGgVsDiDGdyyK";
const USERS_TABLE = "tblO9nM6xTdzJyyax";

const FIELD_COMMENT = "Comment";
const FIELD_CONTENT_LINK = "Content";
const FIELD_USER = "User";
const CONTENT_COMMENTS_LINK = "Comments";

const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

type Auth = { token: string; ownerId: string | null; isAdmin: boolean };

/**
 * Loads the post and refuses unless the caller's Users record is linked to it.
 * Returns the post record so callers can read its Comments link field.
 */
async function loadOwnedContent(contentId: string, auth: Auth) {
  const res = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentId}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) return { ok: false as const, status: res.status === 404 ? 404 : 502 };
  const rec: any = await res.json().catch(() => null);
  if (!rec?.id) return { ok: false as const, status: 502 };
  if (!auth.isAdmin && !ownsRecord(rec?.fields?.[FIELD_USER], auth.ownerId)) {
    return { ok: false as const, status: 403 };
  }
  return { ok: true as const, record: rec };
}

/** Resolves linked Users record ids to their "User name" values. */
async function resolveUserNames(ids: string[], token: string): Promise<Record<string, string>> {
  const unique = [...new Set(ids)].filter((id) => RECORD_ID.test(id));
  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (id) => {
      try {
        const r = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${USERS_TABLE}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const d: any = await r.json();
        const name = String(d?.fields?.["User name"] || "").trim();
        if (name) out[id] = name;
      } catch {
        // leave unresolved
      }
    }),
  );
  return out;
}

/** Fetches the given Comments rows in one request, oldest first. */
async function fetchComments(ids: string[], token: string) {
  const wanted = ids.filter((id) => RECORD_ID.test(id));
  if (wanted.length === 0) return { ok: true as const, records: [] as any[] };
  const records: any[] = [];
  // Airtable formulas have a length ceiling, so batch the OR() conditions.
  for (let i = 0; i < wanted.length; i += 50) {
    const batch = wanted.slice(i, i + 50);
    const formula = `OR(${batch.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const qs = new URLSearchParams();
    qs.set("filterByFormula", formula);
    qs.set("pageSize", "100");
    const r = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${COMMENTS_TABLE}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false as const, status: r.status, data };
    for (const rec of data.records || []) records.push(rec);
  }
  records.sort((a, b) => String(a.createdTime || "").localeCompare(String(b.createdTime || "")));
  return { ok: true as const, records };
}

export const Route = createFileRoute("/api/dwy-comments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const contentId = new URL(request.url).searchParams.get("contentId") || "";
        if (!RECORD_ID.test(contentId)) {
          return Response.json({ error: "contentId required" }, { status: 400 });
        }

        const isAdmin = auth.record.userType.toLowerCase() === "admin";
        const ownerId = await resolveOwnerId(auth.record, token);
        const owned = await loadOwnedContent(contentId, { token, ownerId, isAdmin });
        if (!owned.ok) {
          return Response.json(
            { error: owned.status === 403 ? "Not allowed" : "Post not found" },
            { status: owned.status },
          );
        }

        const commentIds = linkedRecordIds(owned.record?.fields?.[CONTENT_COMMENTS_LINK]);
        const list = await fetchComments(commentIds, token);
        if (!list.ok) {
          return Response.json(
            { error: `List failed [${list.status}]: ${JSON.stringify(list.data).slice(0, 300)}` },
            { status: 502 },
          );
        }

        const names = await resolveUserNames(
          list.records.flatMap((r) => linkedRecordIds(r.fields?.[FIELD_USER])),
          token,
        );

        const items = list.records.map((r) => {
          const authorIds = linkedRecordIds(r.fields?.[FIELD_USER]);
          return {
            id: r.id,
            createdTime: r.createdTime || "",
            comment: String(r.fields?.[FIELD_COMMENT] ?? ""),
            author: authorIds.map((id) => names[id]).filter(Boolean).join(", "),
          };
        });

        return Response.json({ items });
      },

      POST: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
        const contentId = String(body?.contentId || "");
        const comment = String(body?.comment || "").trim();
        if (!RECORD_ID.test(contentId) || !comment) {
          return Response.json({ error: "contentId and comment required" }, { status: 400 });
        }

        const isAdmin = auth.record.userType.toLowerCase() === "admin";
        const ownerId = await resolveOwnerId(auth.record, token);
        const owned = await loadOwnedContent(contentId, { token, ownerId, isAdmin });
        if (!owned.ok) {
          return Response.json(
            { error: owned.status === 403 ? "Not allowed" : "Post not found" },
            { status: owned.status },
          );
        }

        const fields: Record<string, any> = {
          [FIELD_COMMENT]: comment,
          [FIELD_CONTENT_LINK]: [contentId],
        };
        if (ownerId) fields[FIELD_USER] = [ownerId];

        const createRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${COMMENTS_TABLE}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields, typecast: true }),
        });
        const created: any = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          return Response.json({ error: `Create failed [${createRes.status}]: ${JSON.stringify(created).slice(0, 400)}` }, { status: 502 });
        }

        const names = ownerId ? await resolveUserNames([ownerId], token) : {};
        return Response.json({
          item: {
            id: created.id,
            createdTime: created.createdTime || new Date().toISOString(),
            comment,
            author: (ownerId && names[ownerId]) || auth.record.clientName,
          },
        });
      },
    },
  },
});
