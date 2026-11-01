import { POSTS_TABLE } from "./slate/postsTable";

const BASE = "appf1QABtQbAENYDz";
export type PostRow = { id: string; fields: Record<string, unknown> };
const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Posts rows linked to any of the given brands; ownership is decided by the caller's verified brand ids. */
export async function readBrandPosts(token: string, brandIds: string[], platform?: string): Promise<PostRow[]> {
  if (!brandIds.length) return [];
  const rows: PostRow[] = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (platform) params.set("filterByFormula", `{Platform}='${platform}'`);
    if (offset) params.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${POSTS_TABLE}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) { console.error("[posts] read", r.status, (await r.text()).slice(0, 300)); throw new Error("Posts could not be loaded."); }
    const data = (await r.json()) as { records: PostRow[]; offset?: string };
    for (const rec of data.records || []) if (ids(rec.fields.Brand).some((id) => brandIds.includes(id))) rows.push(rec);
    offset = data.offset || "";
  } while (offset);
  return rows;
}
export const linkIds = ids;

/** Creates or patches Posts rows in batches of 10. */
export async function writePosts(token: string, method: "POST" | "PATCH", records: { id?: string; fields: Record<string, unknown> }[]) {
  for (let i = 0; i < records.length; i += 10) {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${POSTS_TABLE}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ records: records.slice(i, i + 10), typecast: true }) });
    if (!r.ok) { console.error("[posts] write", r.status, (await r.text()).slice(0, 300)); return false; }
  }
  return true;
}

/** One Posts row by id, or null. */
export async function readPost(token: string, id: string): Promise<PostRow | null> {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${POSTS_TABLE}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? ((await r.json()) as PostRow) : null;
}
