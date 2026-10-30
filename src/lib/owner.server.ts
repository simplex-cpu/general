// Server-only helpers that resolve "who is the caller" through the Airtable
// account link instead of matching on the client's display name.
//
// The Access codes row links to the client's Brands row and carries the
// "Users (from Brand)" lookup. That linked Users record id is the single
// source of truth for ownership: it is stable, unique, and never blank-matches
// the way a name comparison can.
import type { AccessRecord } from "./accessCode.server";

export const OWNER_BASE = "appf1QABtQbAENYDz";
export const OWNER_BRANDS_TABLE = "tblho1mwlIMZfozue"; // Brands

/** Resolve the Users record id linked to the caller's access code. */
export async function resolveUserRecordId(
  access: AccessRecord,
  h: Record<string, string>,
): Promise<string | null> {
  const direct = access.fields?.["Users (from Brand)"];
  if (Array.isArray(direct) && typeof direct[0] === "string" && direct[0].startsWith("rec")) {
    return direct[0];
  }
  const brand = access.fields?.["Brand"] ?? access.fields?.["Brands"];
  const brandId = Array.isArray(brand) ? brand[0] : typeof brand === "string" ? brand : null;
  if (!brandId || typeof brandId !== "string" || !brandId.startsWith("rec")) return null;
  try {
    const r = await fetch(`https://api.airtable.com/v0/${OWNER_BASE}/${OWNER_BRANDS_TABLE}/${brandId}`, {
      headers: h,
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    const users = data?.fields?.Users;
    if (Array.isArray(users) && typeof users[0] === "string" && users[0].startsWith("rec")) {
      return users[0];
    }
  } catch {
    // fall through
  }
  return null;
}

/** Convenience wrapper: resolve the caller's Users record id from a token. */
export async function resolveOwnerId(
  access: AccessRecord,
  token: string,
): Promise<string | null> {
  return resolveUserRecordId(access, { Authorization: `Bearer ${token}` });
}

/** Formula matching records whose linked-record field contains the given record id. */
export function linkContainsId(field: string, recordId: string): string {
  return `FIND('${recordId}', ARRAYJOIN({${field}}, ',')) > 0`;
}

/** Record ids present in an Airtable linked-record field value. */
export function linkedRecordIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((x: any) => (typeof x === "string" ? x : x && typeof x === "object" ? x.id : ""))
    .filter((id: any): id is string => typeof id === "string" && id.startsWith("rec"));
}

/**
 * True only when the record's linked user field contains the caller's id.
 * Deny by default: an empty field or an unresolved id is never a match.
 */
export function ownsRecord(linkValue: unknown, ownerId: string | null): boolean {
  if (!ownerId) return false;
  return linkedRecordIds(linkValue).includes(ownerId);
}

/**
 * Airtable formula caveat: ARRAYJOIN({Link}) returns the linked records'
 * PRIMARY FIELD values, never their record ids. Filtering with a record id
 * therefore matches nothing. So we prefilter on the linked user's display name
 * (cheap, server-side) and then verify ownership by record id in code, which
 * keeps the deny-by-default guarantee.
 */
export function linkContainsName(field: string, name: string): string {
  const safe = name.replace(/'/g, "\\'");
  return `FIND('${safe}', ARRAYJOIN({${field}}, ',')) > 0`;
}

export type OwnerIdentity = { id: string; name: string };

/** Resolve the caller's Users record id plus the display name used in links. */
export async function resolveOwnerIdentity(
  access: AccessRecord,
  token: string,
): Promise<OwnerIdentity | null> {
  const id = await resolveUserRecordId(access, { Authorization: `Bearer ${token}` });
  if (!id) return null;
  let name = String(access.fields?.["Client Name"] || access.clientName || "").trim();
  try {
    const r = await fetch(`https://api.airtable.com/v0/${OWNER_BASE}/tblO9nM6xTdzJyyax/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const data: any = await r.json();
      const n = String(data?.fields?.["User name"] || "").trim();
      if (n) name = n;
    }
  } catch {
    // keep access-code name
  }
  return { id, name };
}
