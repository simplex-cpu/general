import type { AccessRecord } from "./accessCode.server";
import { brandRequest, ownedBrandIds } from "./brands.server";
import { linkedRecordIds } from "./owner.server";
import { postingPlatform } from "./slate/postTargets";

const BRANDS = "tblho1mwlIMZfozue";
const ACCOUNTS = "tbly1ju4qzYWSjgKb";

export type PostAccount = { id: string; platform: string; handle: string; status: string };

export async function canUseBrand(access: AccessRecord, token: string, brandId: string) {
  if (!/^rec[A-Za-z0-9]{14}$/.test(brandId)) return false;
  if (access.userType.toLowerCase() === "admin") return true;
  const { ids } = await ownedBrandIds(access, token);
  return ids.includes(brandId);
}

/** Connected Instagram/TikTok/Facebook accounts of one brand (through its briefs). */
export async function brandPostAccounts(token: string, brandId: string): Promise<PostAccount[]> {
  const brand = await brandRequest(token, `${BRANDS}/${brandId}`);
  const briefIds = linkedRecordIds(brand.fields?.["Brand brief"]);
  if (!briefIds.length) return [];
  const briefs = await Promise.all(briefIds.map((id) => brandRequest(token, `tblkV5xOB2D1N5dNH/${id}`)));
  const accountIds = [...new Set(briefs.flatMap((b: any) => linkedRecordIds(b.fields?.["Connected Accounts"])))];
  const out: PostAccount[] = [];
  for (let i = 0; i < accountIds.length; i += 50) {
    const f = `OR(${accountIds.slice(i, i + 50).map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const data = await brandRequest(token, `${ACCOUNTS}?filterByFormula=${encodeURIComponent(f)}`);
    for (const r of data.records || []) {
      const platform = postingPlatform(r.fields?.Platform);
      if (!platform) continue;
      out.push({ id: r.id, platform, handle: String(r.fields?.Handle || ""), status: String(r.fields?.Status || "") });
    }
  }
  return out;
}
