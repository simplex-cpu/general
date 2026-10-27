// Pure Zernio account helpers shared by the connect route and its tests.
export const ZERNIO_PLATFORMS = { Instagram: "instagram", Tiktok: "tiktok", Youtube: "youtube", Facebook: "facebook", Linkedin: "linkedin" } as const;
export type BrandPlatform = keyof typeof ZERNIO_PLATFORMS;

export type ZernioAccount = {
  _id?: string; id?: string; platform?: string; username?: string; displayName?: string; profileUrl?: string;
  followersCount?: number; followers?: number; isActive?: boolean; needsReconnection?: boolean; platformStatus?: string;
  metadata?: { loginMethod?: string } & Record<string, unknown>;
};
export type AccountRow = { zernioId: string; platform: BrandPlatform; handle: string; profileUrl: string; followers: number | null; status: "Active" | "Signed out"; via: string };

export function brandPlatform(slug?: string): BrandPlatform | null {
  const entry = Object.entries(ZERNIO_PLATFORMS).find(([, s]) => s === String(slug || "").toLowerCase());
  return entry ? (entry[0] as BrandPlatform) : null;
}

export function accountRow(a: ZernioAccount): AccountRow | null {
  const zernioId = String(a._id || a.id || "");
  const platform = brandPlatform(a.platform);
  if (!zernioId || !platform) return null;
  const signedOut = a.needsReconnection === true || a.isActive === false || (!!a.platformStatus && a.platformStatus.toLowerCase() !== "active");
  const followers = typeof a.followersCount === "number" ? a.followersCount : typeof a.followers === "number" ? a.followers : null;
  return { zernioId, platform, handle: String(a.username || a.displayName || "").replace(/^@+/, ""), profileUrl: String(a.profileUrl || ""), followers, status: signedOut ? "Signed out" : "Active",
    via: platform === "Instagram" ? (a.metadata?.loginMethod === "facebook_login" ? "Facebook" : "Instagram") : "" };
}

/** Plan row writes: create unseen accounts, update known ones, delete rows whose account vanished. */
export function planAccountWrites(accounts: ZernioAccount[], existing: { id: string; zernioId: string }[]) {
  const rows = accounts.map(accountRow).filter((r): r is AccountRow => !!r);
  const byId = new Map(existing.map((e) => [e.zernioId, e.id]));
  const seen = new Set(rows.map((r) => r.zernioId));
  return {
    rows,
    create: rows.filter((r) => !byId.has(r.zernioId)),
    update: rows.filter((r) => byId.has(r.zernioId)).map((r) => ({ recordId: byId.get(r.zernioId)!, row: r })),
    remove: existing.filter((e) => !seen.has(e.zernioId)).map((e) => e.id),
  };
}

/** Best account per platform for the brief summary: an active one beats a signed-out one. */
export function platformStates(rows: AccountRow[]) {
  const out: Partial<Record<BrandPlatform, AccountRow>> = {};
  for (const r of rows) if (!out[r.platform] || (out[r.platform]!.status !== "Active" && r.status === "Active")) out[r.platform] = r;
  return out;
}

export function safeReturnUrl(origin: string, raw?: string) {
  try { const u = new URL(raw || "/connected", origin); return u.origin === origin && u.protocol === "https:" ? u.href : null; } catch { return null; }
}
