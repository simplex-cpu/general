// Server-only Zernio client through the connector gateway. The key never reaches the browser.
import type { ZernioAccount } from "./slate/zernioAccounts";

const GATEWAY = "https://connector-gateway.lovable.dev/udc_zernio";

export async function zernio<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const lovable = process.env.LOVABLE_API_KEY, key = process.env.UDC_ZERNIO_API_KEY;
  if (!lovable || !key) throw new Error("Zernio is not configured");
  const r = await fetch(`${GATEWAY}${path}`, { ...init, headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": key, "Content-Type": "application/json", ...init.headers } });
  const text = await r.text();
  if (!r.ok) { console.error(`Zernio request failed [${r.status}]: ${text}`); const e = new Error(`Zernio request failed [${r.status}]: ${text.slice(0, 300)}`) as Error & { status?: number }; e.status = r.status; throw e; }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function createProfile(briefId: string, name: string) {
  const data = await zernio<{ profile?: { _id: string }; _id?: string }>("/profiles", { method: "POST", headers: { "Idempotency-Key": `brand-${briefId}` }, body: JSON.stringify({ name: name || "Brand", description: `Risevoice brand ${briefId}` }) });
  const id = data.profile?._id || data._id;
  if (!id) throw new Error("Zernio did not return a profile");
  return id;
}

export async function connectLink(slug: string, profileId: string, redirectUrl: string, opts: { facebook?: boolean; reconnectId?: string }) {
  const q = new URLSearchParams({ profileId, redirect_url: redirectUrl });
  if (opts.facebook) q.set("loginMethod", "facebook_login");
  if (opts.reconnectId) q.set("reconnectAccountId", opts.reconnectId);
  const data = await zernio<{ authUrl?: string; url?: string }>(`/connect/${slug}?${q}`);
  const url = data.authUrl || data.url;
  if (!url || !url.startsWith("https://")) throw new Error("Zernio did not return a sign-in link");
  return url;
}

export async function listAccounts(profileId: string) {
  const data = await zernio<{ accounts?: ZernioAccount[] }>(`/accounts?profileId=${encodeURIComponent(profileId)}`);
  return data.accounts || [];
}

export async function removeAccount(accountId: string) {
  try { await zernio(`/accounts/${encodeURIComponent(accountId)}`, { method: "DELETE" }); }
  catch (e) { if ((e as { status?: number }).status !== 404) throw e; }
}
