import type { AccessRecord } from "./accessCode.server";
import { ownsRecord, resolveOwnerIdentity } from "./owner.server";
import { linkIds, type PostRow } from "./posts.server";
import { plannerPostCopy, type PostCopy } from "./slate/postCopy";

/** Linked planner copy is reusable only after owner and brand checks. */
export async function readLinkedPlannerCopy(access: AccessRecord, token: string, row: PostRow): Promise<Partial<PostCopy>> {
  const owner = await resolveOwnerIdentity(access, token);
  if (!owner) return {};
  for (const id of linkIds(row.fields.Content)) {
    const r = await fetch(`https://api.airtable.com/v0/appf1QABtQbAENYDz/tblucGgVsDiDGdyyK/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) continue;
    const record = await r.json() as PostRow;
    const brands = linkIds(record.fields.Brands);
    if (!ownsRecord(record.fields.User, owner.id) || (brands.length && !brands.some((id) => linkIds(row.fields.Brand).includes(id)))) continue;
    return plannerPostCopy(record.fields, String(row.fields.Platform || "Instagram"), String(row.fields.Format || record.fields["Post Type"] || ""));
  }
  return {};
}