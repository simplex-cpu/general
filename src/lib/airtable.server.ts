// Shared helper for Airtable connector-gateway reads from server routes.
const GATEWAY = "https://connector-gateway.lovable.dev/airtable";
export const SIMPLEX_BASE = "appOttHso6hYjBXhw";

export type AirtableQuery = {
  baseId?: string;
  tableId: string;
  filterByFormula?: string;
  fields?: string[];
  sort?: { field: string; direction?: "asc" | "desc" }[];
  maxRecords?: number;
  pageSize?: number;
};

export async function airtableSelect<T = any>(
  q: AirtableQuery,
): Promise<{ ok: true; records: { id: string; fields: T }[] } | { ok: false; status: number; error: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  if (!LOVABLE_API_KEY || !AIRTABLE_API_KEY) {
    return { ok: false, status: 500, error: "Airtable not configured" };
  }
  const baseId = q.baseId || SIMPLEX_BASE;
  const records: { id: string; fields: T }[] = [];
  let offset: string | undefined;
  try {
    do {
      const params = new URLSearchParams();
      if (q.filterByFormula) params.set("filterByFormula", q.filterByFormula);
      params.set("pageSize", String(q.pageSize ?? 100));
      if (q.maxRecords) params.set("maxRecords", String(q.maxRecords));
      for (const f of q.fields || []) params.append("fields[]", f);
      (q.sort || []).forEach((s, i) => {
        params.append(`sort[${i}][field]`, s.field);
        params.append(`sort[${i}][direction]`, s.direction || "asc");
      });
      if (offset) params.set("offset", offset);

      const r = await fetch(`${GATEWAY}/v0/${baseId}/${q.tableId}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": AIRTABLE_API_KEY,
        },
      });
      const data: any = await r.json();
      if (!r.ok) {
        return { ok: false, status: 502, error: `Airtable [${r.status}]: ${JSON.stringify(data)}` };
      }
      for (const rec of data.records || []) records.push({ id: rec.id, fields: rec.fields as T });
      offset = data.offset;
      if (q.maxRecords && records.length >= q.maxRecords) break;
    } while (offset);
    return { ok: true, records };
  } catch (e: any) {
    return { ok: false, status: 500, error: e?.message || "Airtable fetch failed" };
  }
}

export function readAccessCode(request: Request): string {
  // Access codes must be sent via header to avoid leaking into server logs,
  // browser history, and Referer headers.
  return request.headers.get("x-access-code") || "";
}


const REC_ID = /^rec[A-Za-z0-9]{14}$/;

/**
 * Coerce any Airtable cell value into a clean string.
 * - Formula errors (`{specialValue:"NaN"}`, `{error:"#ERROR!"}`) → ""
 * - Linked-record arrays of `rec...` IDs → "" (we don't resolve names here)
 * - Arrays of strings → joined with ", "
 * - Numbers/booleans → String(...)
 * - Plain objects → "" (never `[object Object]`)
 */
export function toText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return REC_ID.test(v) ? "" : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    const parts = v.map(toText).filter(Boolean);
    return parts.join(", ");
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    // Airtable formula error / special-value shapes
    if ("error" in o || "specialValue" in o) return "";
    // AI-generated field shape: { state, value, isStale }
    if (typeof o.value === "string") return o.value;
    // Attachment, collaborator, or other rich shapes — try common name fields
    if (typeof o.name === "string") return o.name;
    if (typeof o.text === "string") return o.text;
    return "";
  }
  return "";
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

