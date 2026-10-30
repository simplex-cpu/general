// Server-only helpers for the Learning section (milestones -> missions -> courses).
// All reads go against the client-facing Airtable base.
import type { AccessRecord } from "./accessCode.server";

export const LEARNING_BASE = "appf1QABtQbAENYDz";
export const T_MILESTONES = "tbllbW1O2vKSuDte9"; // Client Milestones
export const T_MISSIONS = "tblwoAevAwDzLOFe7"; // Client Missions
export const T_MODULES = "tblWhRzSz1Ieiy3tF"; // Client Modules
export const T_BRANDS = "tblho1mwlIMZfozue"; // Brands
export const T_USERS = "tblO9nM6xTdzJyyax"; // Users
export const T_TEMPLATES = "tblsrerLkCsKUKmVO"; // Module Templates

export function airtableHeaders(): Record<string, string> | null {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

// Ownership resolution lives in one shared place now.
export { resolveUserRecordId } from "./owner.server";

type Rec = { id: string; fields: Record<string, any> };

/** Paginated select against the learning base. */
export async function selectAll(
  table: string,
  h: Record<string, string>,
  opts: { filterByFormula?: string; sort?: { field: string; direction?: "asc" | "desc" }[]; maxRecords?: number } = {},
): Promise<Rec[]> {
  const out: Rec[] = [];
  let offset: string | undefined;
  do {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    if (opts.filterByFormula) p.set("filterByFormula", opts.filterByFormula);
    if (opts.maxRecords) p.set("maxRecords", String(opts.maxRecords));
    (opts.sort || []).forEach((s, i) => {
      p.append(`sort[${i}][field]`, s.field);
      p.append(`sort[${i}][direction]`, s.direction || "asc");
    });
    if (offset) p.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${LEARNING_BASE}/${table}?${p.toString()}`, { headers: h });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Airtable [${r.status}] ${JSON.stringify(data).slice(0, 300)}`);
    for (const rec of data.records || []) out.push({ id: rec.id, fields: rec.fields || {} });
    offset = data.offset;
  } while (offset);
  return out;
}

/** Formula matching records whose linked-record field contains the given record id. */
export function linkContains(field: string, recordId: string) {
  return `FIND('${recordId}', ARRAYJOIN({${field}}, ',')) > 0`;
}

export function firstAttachmentUrl(v: unknown): string {
  if (Array.isArray(v)) {
    for (const a of v) {
      if (a && typeof a === "object" && typeof (a as any).url === "string") return (a as any).url;
      if (typeof a === "string" && /^https?:/.test(a)) return a;
    }
  }
  return "";
}

export function attachments(v: unknown): { url: string; filename: string; type?: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a) => a && typeof a === "object" && typeof (a as any).url === "string")
    .map((a: any) => ({ url: a.url, filename: String(a.filename || "file"), type: a.type }));
}

export function firstUrl(v: unknown): string {
  if (typeof v === "string" && /^https?:/.test(v)) return v;
  if (Array.isArray(v)) {
    for (const x of v) if (typeof x === "string" && /^https?:/.test(x)) return x;
  }
  return "";
}

export function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as any;
    if (typeof o.value === "string") return o.value;
    if (typeof o.name === "string") return o.name;
    return "";
  }
  return "";
}

export function num(v: unknown): number {
  if (typeof v === "number") return v;
  const s = str(v).replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export const isCompleted = (s: string) => /^completed$/i.test((s || "").trim());
export const isLocked = (s: string) => /^locked$/i.test((s || "").trim());

export type LearningModule = {
  id: string;
  name: string;
  status: string;
  type: string;
  instructions: string;
  videoUrl: string;
  thumbnail: string;
  resources: { url: string; filename: string; type?: string }[];
  locked: boolean;
  sortKey?: number;
};

export type LearningMission = {
  id: string;
  name: string;
  order: number;
  status: string;
  notes: string;
  locked: boolean;
  modules: LearningModule[];
};

export type LearningMilestone = {
  id: string;
  name: string;
  order: number;
  overview: string;
  description: string;
  goal: string;
  dueDate: string;
  thumbnail: string;
  locked: boolean;
  completionPercent: number;
  missionsTotal: number;
  missionsCompleted: number;
  missions: LearningMission[];
};

/** Fetch records by explicit ids (linked-record fields give ids, not names). */
export async function fetchByIds(
  table: string,
  ids: string[],
  h: Record<string, string>,
): Promise<Rec[]> {
  const clean = Array.from(new Set(ids.filter((i) => typeof i === "string" && i.startsWith("rec"))));
  const out: Rec[] = [];
  for (let i = 0; i < clean.length; i += 40) {
    const chunk = clean.slice(i, i + 40);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const recs = await selectAll(table, h, { filterByFormula: formula });
    out.push(...recs);
  }
  return out;
}

/** Read the Users record for the caller, returning its raw fields. */
export async function fetchUserRecord(userId: string, h: Record<string, string>): Promise<Record<string, any> | null> {
  const r = await fetch(`https://api.airtable.com/v0/${LEARNING_BASE}/${T_USERS}/${userId}`, { headers: h });
  if (!r.ok) return null;
  const data: any = await r.json();
  return data?.fields || null;
}
