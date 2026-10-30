import type { AccessRecord } from "./accessCode.server";
import { resolveOwnerId, linkedRecordIds } from "./owner.server";
import { BRAND_PLATFORMS, averageStats, performanceStatus, briefCompletion, brandLinkOwned, type BrandSummary } from "./brands";

const BASE = "appf1QABtQbAENYDz";
const BRANDS = "tblho1mwlIMZfozue";
const BRIEFS = "tblkV5xOB2D1N5dNH";
type Row = { id: string; fields: Record<string, any> };
export async function brandRequest(token: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
    ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Brand request failed [${response.status}]: ${detail}`);
    throw new Error(`Brand request failed [${response.status}]`);
  }
  return response.json();
}
export async function legacyBrief(access: AccessRecord, token: string): Promise<Row | null> {
  const safe = access.code.replace(/'/g, "\\'");
  const formula = `OR(FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','), LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}')`;
  const data = await brandRequest(token, `${BRIEFS}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`);
  return data.records?.[0] || null;
}
export async function ownedBrandIds(access: AccessRecord, token: string) {
  const ownerId = await resolveOwnerId(access, token);
  if (!ownerId) throw new Error("Unable to resolve this account's brand ownership");
  const user = await brandRequest(token, `tblO9nM6xTdzJyyax/${ownerId}`);
  const ids = linkedRecordIds(user.fields?.Brands);
  // Verify the reverse ownership link rather than trusting names or lookups.
  const owned: string[] = [];
  for (const id of ids) {
    const brand = await brandRequest(token, `${BRANDS}/${id}`);
    if (linkedRecordIds(brand.fields?.Users).includes(ownerId)) owned.push(id);
  }
  return { ownerId, ids: owned };
}
export async function selectedBrief(access: AccessRecord, token: string, id?: string): Promise<Row | null> {
  if (!id) return legacyBrief(access, token);
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return null;
  const legacy = await legacyBrief(access, token);
  if (legacy?.id === id) return legacy;
  const { ids } = await ownedBrandIds(access, token);
  const rec = await brandRequest(token, `${BRIEFS}/${id}`);
  return brandLinkOwned(rec.fields?.Brand, ids) ? rec : null;
}
export function summarizeBrief(rec: Row): BrandSummary {
  return { id: rec.id, name: String(rec.fields["Brand Name"] || "Untitled brand"), logo: rec.fields.Logo?.[0]?.url || "",
    completion: briefCompletion(rec.fields), connected: BRAND_PLATFORMS.filter((p) => rec.fields[`${p} Connected`] === "Connected"),
    brandIds: Array.isArray(rec.fields.Brand) ? rec.fields.Brand.filter((v: unknown): v is string => typeof v === "string") : [],
    handles: Object.fromEntries(BRAND_PLATFORMS.map((p) => [p, String(rec.fields[`${p} User`] || "").trim().replace(/^@+/, "").replace(/^(https?:\/\/)?(www\.)?(instagram|tiktok)\.com\//i, "").replace(/[/?#].*$/, "")]).filter(([, v]) => v)) };
}
export async function listOwnedBriefs(access: AccessRecord, token: string) {
  const { ids } = await ownedBrandIds(access, token);
  const legacy = await legacyBrief(access, token);
  const records: Row[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const page = await brandRequest(token, `${BRIEFS}?${params}`);
    for (const rec of page.records || []) {
      if (rec.id === legacy?.id || brandLinkOwned(rec.fields?.Brand, ids)) records.push(rec);
    }
    offset = page.offset;
  } while (offset);
  const summaries = records.map(summarizeBrief);
  let items: import("./slate/postMetrics").MetricsPost[] = [];
  try { items = await (await import("./home.server")).readHomeContent(access); } catch (e) { console.warn("[brands] stats", e); }
  return summaries.map((b) => {
    const mine = (b.brandIds || []);
    const rows = items.filter((i) => (i.brandIds || []).some((id) => mine.includes(id))).flatMap((i) => Object.values(i.metrics).filter((m) => m.views != null).map((m) => ({ views: m.views || 0, likes: m.likes || 0, comments: m.comments || 0, date: m.publishedAt || i.postingDate || "" })));
    return { ...b, stats: { ...averageStats(rows), status: performanceStatus(rows) } };
  });
}
export async function createOwnedBrand(access: AccessRecord, token: string, name: string) {
  const { ownerId } = await ownedBrandIds(access, token);
  const brand = await brandRequest(token, BRANDS, { method: "POST", body: JSON.stringify({ fields: { "Brand Name": name, Users: [ownerId] } }) });
  try {
    // Do not add the User link to new briefs: its Access code lookup would
    // change legacy single-brand lookups across Script/Planner/Home.
    const brief = await brandRequest(token, BRIEFS, { method: "POST", body: JSON.stringify({ fields: { "Brand Name": name, Brand: [brand.id] } }) });
    return summarizeBrief(brief);
  } catch (error) {
    await brandRequest(token, `${BRANDS}/${brand.id}`, { method: "DELETE" }).catch(() => {});
    throw error;
  }
}
export class BriefOwnerMissing extends Error { constructor() { super("This brand profile isn't linked to an account. Contact support."); } }
export { sameBrandName } from "./brands";
import { sameBrandName } from "./brands";
/** Legacy briefs may predate Brand records; link the owner's same-name brand, or create one. */
export async function ensureBriefBrand(access: AccessRecord, token: string, brief: Row): Promise<string> {
  const linked = linkedRecordIds(brief.fields?.Brand);
  if (linked.length) return linked[0];
  let owned: { ownerId: string; ids: string[] };
  try { owned = await ownedBrandIds(access, token); } catch { throw new BriefOwnerMissing(); }
  const name = String(brief.fields?.["Brand Name"] || "My brand");
  let brand: { id: string } | null = null;
  for (const id of owned.ids) {
    const rec = await brandRequest(token, `${BRANDS}/${id}`);
    if (sameBrandName(rec.fields?.["Brand Name"], name)) { brand = rec; break; }
  }
  if (!brand) brand = await brandRequest(token, BRANDS, { method: "POST", body: JSON.stringify({ fields: { "Brand Name": name, Users: [owned.ownerId] } }) });
  if (!brand) throw new BriefOwnerMissing();
  await brandRequest(token, `${BRIEFS}/${brief.id}`, { method: "PATCH", body: JSON.stringify({ fields: { Brand: [brand.id] } }) });
  brief.fields = { ...brief.fields, Brand: [brand.id] };
  return brand.id;
}
