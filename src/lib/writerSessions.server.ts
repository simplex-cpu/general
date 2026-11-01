// Writer Sessions = the Airtable "Chat sessions" table in the DWY base.
// Every scriptwriter session (single script or batch) is one row there.
import type { AccessRecord } from "./accessCode.server";
import {
  resolveOwnerIdentity,
  linkContainsName,
  ownsRecord,
  linkedRecordIds,
} from "./owner.server";
import { serializeSessionArray } from "./slate/writerTranscript";

export const SESSIONS_BASE = "appf1QABtQbAENYDz";
export const SESSIONS_TABLE = "tblaPsRyOuniu1iYb"; // Chat sessions
const API = "https://api.airtable.com";
const MAX_TEXT = 95_000; // Airtable long text caps at 100k chars.

export type SessionType = "Single" | "Batch";
export type SessionFormat = "B-roll" | "Talking Video" | "Carousel" | "Graphic";

export type WriterSession = {
  id: string;
  title: string;
  type?: SessionType;
  format?: SessionFormat;
  status: "In progress" | "Done";
  topics: unknown[];
  scripts: unknown[];
  transcript: unknown[];
  contentIds: string[];
  brandIds?: string[];
  repurposedFrom?: string;
  createdAt?: string;
  updatedAt?: string;
};

const FORMAT_LABEL: Record<string, SessionFormat> = {
  broll: "B-roll",
  talkingVideo: "Talking Video",
  carousel: "Carousel",
  graphic: "Graphic",
};
export const toSessionFormat = (f?: string): SessionFormat | undefined =>
  f ? FORMAT_LABEL[f] : undefined;

const parse = (s: unknown): unknown[] => {
  if (typeof s !== "string" || !s.trim()) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const dump = (v: unknown): string => {
  return serializeSessionArray(v, MAX_TEXT);
};

function toSession(rec: any, full: boolean): WriterSession {
  const f = rec.fields || {};
  const topics = parse(f["Topics JSON"]);
  return {
    id: rec.id,
    title: String(f.Name || "Untitled session"),
    type: f["Session Type"],
    format: f.Format,
    status: f.Status === "Done" ? "Done" : "In progress",
    topics,
    scripts: full ? parse(f["Scripts JSON"]) : [],
    transcript: full ? parse(f["Transcript JSON"]) : [],
    ...(full ? { briefSnapshot: String(f["Brief Snapshot"] || "") } : {}),
    contentIds: linkedRecordIds(f["Client Content"]),
    brandIds: linkedRecordIds(f.Brands),
    repurposedFrom: f["Repurposed From"] || undefined,
    createdAt: rec.createdTime,
    updatedAt: f["Updated At"],
  };
}

export type SessionPatch = {
  title?: string;
  type?: SessionType;
  format?: string;
  status?: "In progress" | "Done";
  topics?: unknown[];
  scripts?: unknown[];
  transcript?: unknown[];
  briefSnapshot?: string;
  addContentId?: string;
  repurposedFrom?: string;
};

function patchToFields(p: SessionPatch, existingContent: string[] = []): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (p.title !== undefined) fields.Name = p.title.slice(0, 200);
  if (p.type) fields["Session Type"] = p.type;
  const fmt = toSessionFormat(p.format);
  if (fmt) fields.Format = fmt;
  if (p.status) fields.Status = p.status;
  if (p.topics) fields["Topics JSON"] = dump(p.topics);
  if (p.scripts) fields["Scripts JSON"] = dump(p.scripts);
  if (p.transcript) fields["Transcript JSON"] = dump(p.transcript);
  if (p.briefSnapshot !== undefined) fields["Brief Snapshot"] = p.briefSnapshot.slice(0, MAX_TEXT);
  if (p.repurposedFrom && /^rec[A-Za-z0-9]{14}$/.test(p.repurposedFrom))
    fields["Repurposed From"] = p.repurposedFrom;
  if (p.addContentId && /^rec[A-Za-z0-9]{14}$/.test(p.addContentId)) {
    fields["Client Content"] = Array.from(new Set([...existingContent, p.addContentId]));
  }
  return fields;
}

export async function sessionsCtx(access: AccessRecord) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN not configured");
  const owner = await resolveOwnerIdentity(access, token);
  if (!owner) throw new Error("No user is linked to this access code");
  const brand = access.fields?.Brands ?? access.fields?.Brand;
  const brandId = Array.isArray(brand) ? brand[0] : typeof brand === "string" ? brand : undefined;
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  return { token, owner, brandId, h };
}

type Ctx = Awaited<ReturnType<typeof sessionsCtx>>;
const url = (id = "") => `${API}/v0/${SESSIONS_BASE}/${SESSIONS_TABLE}${id ? `/${id}` : ""}`;

export async function listSessions(ctx: Ctx): Promise<WriterSession[]> {
  const qs = new URLSearchParams();
  qs.set("filterByFormula", linkContainsName("User", ctx.owner.name));
  qs.set("pageSize", "50");
  qs.append("sort[0][field]", "Updated At");
  qs.append("sort[0][direction]", "desc");
  for (const f of [
    "Name",
    "Session Type",
    "Format",
    "Status",
    "User",
    "Client Content",
    "Topics JSON",
    "Repurposed From",
    "Updated At",
    "Brands",
  ]) {
    qs.append("fields[]", f);
  }
  const r = await fetch(`${url()}?${qs}`, { headers: ctx.h });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Airtable [${r.status}]: ${JSON.stringify(data).slice(0, 200)}`);
  return (data.records || [])
    .filter((rec: any) => ownsRecord(rec.fields?.User, ctx.owner.id))
    .map((rec: any) => toSession(rec, false));
}

async function getOwned(ctx: Ctx, id: string): Promise<any | null> {
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return null;
  const r = await fetch(url(id), { headers: ctx.h });
  if (!r.ok) return null;
  const rec: any = await r.json();
  return ownsRecord(rec.fields?.User, ctx.owner.id) ? rec : null;
}

export async function getSession(ctx: Ctx, id: string): Promise<WriterSession | null> {
  const rec = await getOwned(ctx, id);
  return rec ? toSession(rec, true) : null;
}

export async function createSession(
  ctx: Ctx,
  p: SessionPatch,
  brandId?: string,
): Promise<WriterSession> {
  const fields = patchToFields({ status: "In progress", ...p });
  fields.User = [ctx.owner.id];
  const link = brandId || ctx.brandId;
  if (link) fields.Brands = [link];
  const r = await fetch(url(), {
    method: "POST",
    headers: ctx.h,
    body: JSON.stringify({ fields, typecast: true }),
  });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Airtable [${r.status}]: ${JSON.stringify(data).slice(0, 200)}`);
  return toSession(data, true);
}

export async function updateSession(
  ctx: Ctx,
  id: string,
  p: SessionPatch,
): Promise<WriterSession | null> {
  const rec = await getOwned(ctx, id);
  if (!rec) return null;
  const fields = patchToFields(p, linkedRecordIds(rec.fields?.["Client Content"]));
  const r = await fetch(url(id), {
    method: "PATCH",
    headers: ctx.h,
    body: JSON.stringify({ fields, typecast: true }),
  });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Airtable [${r.status}]: ${JSON.stringify(data).slice(0, 200)}`);
  return toSession(data, true);
}

/** Delete one session the caller owns. Returns false when it isn't theirs. */
export async function deleteSession(ctx: Ctx, id: string): Promise<boolean> {
  const rec = await getOwned(ctx, id);
  if (!rec) return false;
  const r = await fetch(url(id), { method: "DELETE", headers: ctx.h });
  if (!r.ok) throw new Error(`Airtable [${r.status}]`);
  return true;
}
