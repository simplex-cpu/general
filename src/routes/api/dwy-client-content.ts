import { CONTENT_SCRIPT_FIELDS, readContentScript, contentScriptFields, legacyScriptParts } from "@/lib/slate/contentScriptFields";
import { normalizeTimestamps } from "@/lib/slate/longFormClipper";
import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { linkContainsName, ownsRecord, resolveOwnerId, resolveOwnerIdentity } from "@/lib/owner.server";
import { METRIC_PLATFORMS, metricFields, readPostMetrics } from "@/lib/slate/postMetrics";
import { brandPostAccounts, canUseBrand } from "@/lib/postAccounts.server";
import { validFormats } from "@/lib/slate/postTargets";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tblucGgVsDiDGdyyK"; // Client Content
const USERS_TABLE = "tblO9nM6xTdzJyyax";

const FIELDS = [
  "Name",
  "Brands",
  "Post Type",
  "Client Status",
  "IG Captions",
  "FB Captions",
  "Tiktok Captions",
  "Youtube Captions",
  "Produced Files",
  "Thumbnail",
  "Platform",
  "Posting date",
  "User",
  "Edited File",
  "Google Drive to RAW Files",
  ...Object.values(CONTENT_SCRIPT_FIELDS),
  "Long forms",
  "Inspo Link",
  "Cover Copy",
  "Slides Copy",
  "CTA Copy",
  "Request type",
  "Post to accounts",
  "Post formats",
  ...METRIC_PLATFORMS.flatMap((platform) => Object.values(metricFields(platform)).filter((field) => !field.endsWith("Stats Error"))),
];

// Who is producing the post: the Risevoice team, or the client themselves.
const REQUEST_TYPES = ["Risevoice Request", "Do it Myself"];

// Mirrors Airtable single-select choices for Client Status. Keep in sync with
// the base if new statuses are added.
const CLIENT_STATUS_CHOICES = [
  { name: "To Edit | To Design", color: "#ef4444" },
  { name: "To Edit | Design", color: "#ef4444" },
  { name: "Scripting", color: "#a02929" },
  { name: "Film", color: "#ef4444" },
  { name: "Produce", color: "#f97316" },
  { name: "Re-do", color: "#f97316" },
  { name: "AI Redo", color: "#f97316" },
  { name: "Risevoice Redo", color: "#fb923c" },
  { name: "To Post", color: "#4ade80" },
  { name: "In Progress", color: "#eab308" },
  { name: "Internal Approval", color: "#facc15" },
  { name: "Approve", color: "#fde68a" },
  { name: "Approved", color: "#86efac" },
  { name: "Do not Post", color: "#9ca3af" },
  { name: "Posting", color: "#22c55e" },
  { name: "Posted", color: "#15803d" },
  { name: "Deleted", color: "#6b7280" },
];


// The only statuses a client login may write. Internal statuses (Film,
// Scripting, Produce, To Edit | Design, Do not Post, ...) are staff-only, so a
// client can never move a post onto a status no screen shows.
// "To Post" is the posting flow and "Deleted" is the explicit delete action.
const CLIENT_WRITABLE_STATUSES = [
  "Film",
  "To Edit | Design",
  "In Progress",
  "Approve",
  "Approved",
  "AI Redo",
  "Risevoice Redo",
  "Re-do",
  "To Post",
  "Posted",
  "Deleted",
];

function isClientWritableStatus(s: string) {
  return CLIENT_WRITABLE_STATUSES.some((v) => v.toLowerCase() === s.trim().toLowerCase());
}

const POST_TYPE_CHOICES = ["🖼️ Carousel", "🖼️ Graphic", "📹 BROLL Video", "📹 Talking Video", "📹 Talking from long form", "📹 BROLL from long form", "🖼️ Graphic from long form", "🖼️ Carousel from long form"];
const PLATFORM_CHOICES = ["Facebook", "Instagram", "Youtube", "Tiktok"];

type Attachment = { id?: string; url: string; filename: string; type?: string };

function coerceAttachments(v: unknown): Attachment[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a: any) => a && typeof a.url === "string")
    .map((a: any) => ({
      id: a.id,
      url: a.url,
      filename: a.filename || "file",
      type: a.type,
    }));
}

function coerceText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(coerceText).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as any;
    if (typeof o.value === "string") return o.value;
    if (typeof o.name === "string") return o.name;
  }
  return "";
}

function coerceStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => coerceText(x)).filter(Boolean);
  const s = coerceText(v);
  return s ? [s] : [];
}

const CAPTION_FIELD_MAP: Record<string, string> = {
  captionsInstagram: "IG Captions",
  captionsFacebook: "FB Captions",
  captionsTiktok: "Tiktok Captions",
  captionsYoutube: "Youtube Captions",
};

/**
 * Maps per-platform caption keys onto their Airtable columns. Falls back to the
 * legacy single `captions` key (mirrored to every platform) for older clients.
 */
function applyCaptionFields(fields: Record<string, any>, patch: any) {
  let touched = false;
  for (const [key, column] of Object.entries(CAPTION_FIELD_MAP)) {
    if (typeof patch?.[key] === "string") {
      fields[column] = patch[key];
      touched = true;
    }
  }
  if (!touched && typeof patch?.captions === "string") {
    for (const column of Object.values(CAPTION_FIELD_MAP)) fields[column] = patch.captions;
  }
}

function serializeRecord(rec: any) {
  const f = rec.fields || {};
  return {
    id: rec.id,
    createdTime: rec.createdTime || "",
    postName: coerceText(f["Name"]),
    brandIds: Array.isArray(f["Brands"]) ? f["Brands"].filter((v: unknown): v is string => typeof v === "string") : [],
    postType: coerceText(f["Post Type"]),
    clientStatus: coerceText(f["Client Status"]),
    captions:
      coerceText(f["IG Captions"]) ||
      coerceText(f["FB Captions"]) ||
      coerceText(f["Tiktok Captions"]) ||
      coerceText(f["Youtube Captions"]),
    captionsInstagram: coerceText(f["IG Captions"]),
    captionsFacebook: coerceText(f["FB Captions"]),
    captionsTiktok: coerceText(f["Tiktok Captions"]),
    captionsYoutube: coerceText(f["Youtube Captions"]),
    platforms: coerceStringArray(f["Platform"]),
    postingDate: coerceText(f["Posting date"]),
    producedFiles: coerceAttachments(f["Produced Files"]),
    thumbnail: coerceAttachments(f["Thumbnail"]),
    editedFile: coerceText(f["Edited File"]),
    rawFilesLink: coerceText(f["Google Drive to RAW Files"]),
    ...readContentScript(f, coerceText(f["Post Type"])),
    longFormIds: Array.isArray(f["Long forms"]) ? f["Long forms"].filter((v: unknown): v is string => typeof v === "string") : [],
    inspoUrl: coerceText(f["Inspo Link"]),
    // Designed copy, kept separate so graphics and carousels read cleanly.
    coverCopy: coerceText(f["Cover Copy"]),
    slidesCopy: coerceText(f["Slides Copy"]),
    ctaCopy: coerceText(f["CTA Copy"]),
    requestType: coerceText(f["Request type"]),
    postAccountIds: Array.isArray(f["Post to accounts"]) ? f["Post to accounts"].filter((v: unknown): v is string => typeof v === "string") : [],
    postFormats: coerceStringArray(f["Post formats"]),
    metrics: readPostMetrics(f),
  };
}

export const Route = createFileRoute("/api/dwy-client-content")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) {
          return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        }
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        // Single card (Home board): read the record and the owner at the same time, so opening is one round trip.
        const singleId = new URL(request.url).searchParams.get("id") || "";
        if (singleId) {
          if (!/^rec[A-Za-z0-9]{14}$/.test(singleId)) return Response.json({ error: "Invalid id" }, { status: 400 });
          // Airtable's single-record read rejects a fields[] filter (422), so read the whole record.
          const [ownerOne, r] = await Promise.all([
            resolveOwnerIdentity(auth.record, token),
            fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${singleId}`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const rec: any = await r.json().catch(() => ({}));
          if (!ownerOne?.id || !r.ok || !ownsRecord(rec?.fields?.["User"], ownerOne.id)) return Response.json({ error: r.status === 429 ? "Airtable is busy. Try again in a moment." : "Post not found" }, { status: r.status === 429 ? 503 : 404 });
          return Response.json({ items: [serializeRecord(rec)], statusChoices: CLIENT_STATUS_CHOICES, postTypeChoices: POST_TYPE_CHOICES, platformChoices: PLATFORM_CHOICES });
        }
        const owner = await resolveOwnerIdentity(auth.record, token);
        const ownerId = owner?.id || null;
        if (!ownerId) {
          return Response.json({
            items: [],
            ownerUnresolved: true,
            error: "We could not match your account to a client record.",
            statusChoices: CLIENT_STATUS_CHOICES,
            postTypeChoices: POST_TYPE_CHOICES,
            platformChoices: PLATFORM_CHOICES,
          });
        }
        const formula = owner?.name ? linkContainsName("User", owner.name) : "";

        const records: any[] = [];
        let offset: string | undefined;
        try {
          do {
            const qs = new URLSearchParams();
            qs.set("pageSize", "100");
            if (formula) qs.set("filterByFormula", formula);
            for (const f of FIELDS) qs.append("fields[]", f);
            if (offset) qs.set("offset", offset);
            const r = await fetch(
              `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?${qs.toString()}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data: any = await r.json().catch(() => ({}));
            if (!r.ok) {
              return Response.json(
                { error: `Airtable [${r.status}]: ${JSON.stringify(data).slice(0, 400)}` },
                { status: 502 }
              );
            }
            for (const rec of data.records || []) records.push(rec);
            offset = data.offset;
          } while (offset);
        } catch (e: any) {
          return Response.json({ error: e?.message || "Fetch failed" }, { status: 500 });
        }

        const items = records
          .filter((rec) => ownsRecord(rec?.fields?.["User"], ownerId))
          .map(serializeRecord);
        items.sort((a, b) => {
          if (a.postingDate && b.postingDate) return b.postingDate.localeCompare(a.postingDate);
          if (a.postingDate) return -1;
          if (b.postingDate) return 1;
          return a.postName.localeCompare(b.postName);
        });

        return Response.json({
          items,
          statusChoices: CLIENT_STATUS_CHOICES,
          postTypeChoices: POST_TYPE_CHOICES,
          platformChoices: PLATFORM_CHOICES,
        });
      },

      PATCH: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });

        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const recordId = String(body?.id || "");
        const patch = body?.fields || {};
        if (!recordId) return Response.json({ error: "id required" }, { status: 400 });

        // Whitelist editable fields.
        const fields: Record<string, any> = {};
        if (typeof patch.postName === "string") fields["Name"] = patch.postName;
        if (typeof patch.postType === "string") fields["Post Type"] = patch.postType || null;
        const isAdmin = auth.record.userType.toLowerCase() === "admin";
        if (typeof patch.clientStatus === "string" && patch.clientStatus) {
          if (!isAdmin && !isClientWritableStatus(patch.clientStatus)) {
            return Response.json({ error: "That status is not available." }, { status: 400 });
          }
          fields["Client Status"] = patch.clientStatus;
        } else if (typeof patch.clientStatus === "string") {
          if (!isAdmin) {
            return Response.json({ error: "That status is not available." }, { status: 400 });
          }
          fields["Client Status"] = null;
        }

        applyCaptionFields(fields, patch);
        if (typeof patch.postingDate === "string") fields["Posting date"] = patch.postingDate || null;
        if (Array.isArray(patch.platforms)) fields["Platform"] = patch.platforms;
        if (typeof patch.brandId === "string") {
          if (patch.brandId && !(await canUseBrand(auth.record, token, patch.brandId))) return Response.json({ error: "That brand is not available." }, { status: 403 });
          fields["Brands"] = patch.brandId ? [patch.brandId] : [];
          // Accounts belong to a brand; switching brands clears them.
          if (!Array.isArray(patch.postAccountIds)) { fields["Post to accounts"] = []; fields["Post formats"] = []; }
        }
        // The review screen lets the client polish the words and point at the
        // footage folder before handing the post over.

        if (typeof patch.coverCopy === "string") fields["Cover Copy"] = patch.coverCopy;
        if (typeof patch.timestamps === "string") fields["Timestamps"] = normalizeTimestamps(patch.timestamps).slice(0, 2000);
        if (typeof patch.creativeDirection === "string") fields["Creative Direction"] = patch.creativeDirection.slice(0, 10000);
        if (typeof patch.slidesCopy === "string") fields["Slides Copy"] = patch.slidesCopy;
        if (typeof patch.ctaCopy === "string") fields["CTA Copy"] = patch.ctaCopy;
        // Only the two real production lanes may be written here.
        if (typeof patch.requestType === "string") {
          const rt = REQUEST_TYPES.find((v) => v.toLowerCase() === patch.requestType.trim().toLowerCase());
          if (patch.requestType.trim() && !rt) {
            return Response.json({ error: "That request type is not available." }, { status: 400 });
          }
          fields["Request type"] = rt || null;
        }
        if (typeof patch.rawFilesLink === "string") {
          fields["Google Drive to RAW Files"] = patch.rawFilesLink || null;
        }
        // A pasted link never destroys existing attachments: it is stored as the
        // delivered link instead of replacing the "Produced Files" list.
        if (typeof patch.producedFileUrl === "string" && /^https?:\/\//i.test(patch.producedFileUrl)) {
          fields["Edited File"] = patch.producedFileUrl;
        }
        if (Array.isArray(patch.producedFiles)) {
          fields["Produced Files"] = patch.producedFiles
            .filter((a: any) => a && a.id)
            .map((a: any) => ({ id: a.id }));
        }
        if (typeof patch.thumbnailUrl === "string" && /^https?:\/\//i.test(patch.thumbnailUrl)) {
          fields["Thumbnail"] = [
            { url: patch.thumbnailUrl, filename: String(patch.thumbnailName || "thumbnail") },
          ];
        } else if (Array.isArray(patch.thumbnail)) {
          fields["Thumbnail"] = patch.thumbnail
            .filter((a: any) => a && a.id)
            .map((a: any) => ({ id: a.id }));
        }


        // Verify ownership before mutating.
        const getRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const existing: any = await getRes.json().catch(() => ({}));
        if (!getRes.ok) {
          return Response.json({ error: `Airtable [${getRes.status}]` }, { status: 502 });
        }
        if (auth.record.userType.toLowerCase() !== "admin") {
          // Ownership is the linked Users record id, never a name comparison.
          const ownerId = await resolveOwnerId(auth.record, token);
          if (!ownsRecord(existing?.fields?.["User"], ownerId)) {
            return Response.json({ error: "Not allowed" }, { status: 403 });
          }
        }

        // Posting targets must be connected accounts of this card's own brand.
        if (Array.isArray(patch.postAccountIds) || Array.isArray(patch.postFormats)) {
          const brandId = typeof patch.brandId === "string" ? patch.brandId : (existing.fields?.["Brands"] || [])[0];
          const accounts = brandId ? await brandPostAccounts(token, brandId).catch(() => []) : [];
          const ids = Array.isArray(patch.postAccountIds) ? patch.postAccountIds.map(String) : (existing.fields?.["Post to accounts"] || []);
          const chosen = accounts.filter((a) => ids.includes(a.id));
          if (Array.isArray(patch.postAccountIds) && chosen.length !== new Set(ids).size) {
            return Response.json({ error: "Pick accounts connected to this card's brand." }, { status: 400 });
          }
          const platforms = [...new Set(chosen.map((a) => a.platform))];
          fields["Post to accounts"] = chosen.map((a) => a.id);
          fields["Platform"] = platforms;
          const formats = Array.isArray(patch.postFormats) ? patch.postFormats.map(String) : coerceStringArray(existing.fields?.["Post formats"]);
          fields["Post formats"] = validFormats(formats, platforms);
        }

        // Normalize legacy client payloads only at the compatibility boundary. Explicit fields win.
        const format = typeof patch.postType === "string" ? patch.postType : coerceText(existing.fields?.["Post Type"]);
        const touched = Object.keys(CONTENT_SCRIPT_FIELDS).some((key) => typeof patch[key] === "string");
        if (touched) {
          const current = readContentScript(existing.fields || {}, format);
          const explicitCopy = ["visualHook", "textOverlay", "visualCta"].some((key) => typeof patch[key] === "string");
          const legacy = !explicitCopy && typeof patch.script === "string" && /talking|broll|b-roll/i.test(format) ? legacyScriptParts(patch.script) : null;
          const next = { ...current, ...(legacy ? { script: legacy.script, ...(legacy.visualHook ? { visualHook: legacy.visualHook } : {}), ...(legacy.textOverlay ? { textOverlay: legacy.textOverlay } : {}), ...(legacy.visualCta ? { visualCta: legacy.visualCta } : {}), ...(legacy.creativeDirection ? { creativeDirection: legacy.creativeDirection } : {}) } : {}) };
          for (const key of Object.keys(CONTENT_SCRIPT_FIELDS) as (keyof typeof next)[]) {
            if (typeof patch[key] === "string" && key !== "script") next[key] = patch[key];
          }
          if (!legacy && typeof patch.script === "string") next.script = patch.script;
          if (/broll|b-roll/i.test(format) && legacy && patch.textOverlay === undefined) next.textOverlay = legacy.textOverlay || legacy.script;
          Object.assign(fields, contentScriptFields(format, next));
        }

        const patchRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields, typecast: true }),
        });
        const patched: any = await patchRes.json().catch(() => ({}));
        if (!patchRes.ok) {
          return Response.json(
            { error: `Airtable update [${patchRes.status}]: ${JSON.stringify(patched).slice(0, 400)}` },
            { status: 502 }
          );
        }
        return Response.json({ item: serializeRecord(patched) });
      },

      POST: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });

        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
        const p = body?.fields || {};

        // The linked account on the access code is the owner of anything created here.
        const userRecordId = await resolveOwnerId(auth.record, token);
        if (!userRecordId) {
          return Response.json(
            { error: "We could not match your account to a client record." },
            { status: 400 },
          );
        }

        const fields: Record<string, any> = { User: [userRecordId] };
        if (typeof p.postName === "string") fields["Name"] = p.postName;
        if (typeof p.postType === "string" && p.postType) fields["Post Type"] = p.postType;
        // The client picks the stage on the form; anything else falls back to
        // To Approve so a post can never start on a status no screen shows.
        const requestedStatus = typeof p.clientStatus === "string" ? p.clientStatus.trim() : "";
        const isAdminCreate = auth.record.userType.toLowerCase() === "admin";
        fields["Client Status"] =
          requestedStatus && (isAdminCreate || isClientWritableStatus(requestedStatus))
            ? requestedStatus
            : "Approve";


        applyCaptionFields(fields, p);
        const initialCopy = readContentScript({ ...contentScriptFields(p.postType || "", p) }, p.postType || "");
        Object.assign(fields, contentScriptFields(p.postType || "", initialCopy));
        if (typeof p.postingDate === "string" && p.postingDate) fields["Posting date"] = p.postingDate;
        if (Array.isArray(p.platforms) && p.platforms.length) fields["Platform"] = p.platforms;

        const createRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields, typecast: true }),
        });
        const created: any = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          return Response.json(
            { error: `Airtable create [${createRes.status}]: ${JSON.stringify(created).slice(0, 400)}` },
            { status: 502 }
          );
        }
        return Response.json({ item: serializeRecord(created) });
      },
    },
  },
});
