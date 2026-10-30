import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief } from "@/lib/brands.server";
import { connectLink, createProfile, listAccounts, removeAccount } from "@/lib/zernio.server";
import { ZERNIO_PLATFORMS, planAccountWrites, platformStates, safeReturnUrl, type AccountRow, type BrandPlatform } from "@/lib/slate/zernioAccounts";

const BASE_ID = "appf1QABtQbAENYDz";
const BRIEFS = "tblkV5xOB2D1N5dNH";
const ACCOUNTS = "tbly1ju4qzYWSjgKb"; // Connected Accounts
const PLATFORMS = Object.keys(ZERNIO_PLATFORMS) as BrandPlatform[];
type Row = { id: string; fields: Record<string, any> };

async function at(path: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, { ...init, headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json", ...init.headers } });
  if (!r.ok) { const t = await r.text(); console.error(`Airtable [${r.status}]: ${t}`); throw new Error(`Airtable request failed [${r.status}]`); }
  return r.json();
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function linkedRows(brief: Row): Promise<Row[]> {
  const ids: string[] = (brief.fields["Connected Accounts"] || []).filter((v: unknown) => typeof v === "string");
  const out: Row[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const f = `OR(${ids.slice(i, i + 50).map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const data = await at(`${ACCOUNTS}?filterByFormula=${encodeURIComponent(f)}`);
    out.push(...(data.records || []));
  }
  return out;
}

const toFields = (r: AccountRow, briefId: string) => ({ "Zernio Account ID": r.zernioId, Platform: r.platform, Handle: r.handle, "Profile URL": r.profileUrl || null, Followers: r.followers, Status: r.status, "Connected through": r.via, Brief: [briefId] });
const view = (r: AccountRow, recordId?: string) => ({ recordId, zernioId: r.zernioId, platform: r.platform, handle: r.handle, followers: r.followers, status: r.status, via: r.via });

// One sync per brief at a time; concurrent syncs would create duplicate (double-billed) rows.
const inflight = new Map<string, Promise<unknown>>();
function syncOnce(brief: Row) {
  const running = inflight.get(brief.id);
  if (running) return running;
  const p = sync(brief).finally(() => inflight.delete(brief.id));
  inflight.set(brief.id, p);
  return p;
}

async function sync(brief: Row) {
  const profileId = String(brief.fields["Zernio Profile ID"] || "");
  if (!profileId) return { accounts: [] };
  const accounts = await listAccounts(profileId);
  const existing = await linkedRows(brief);
  const plan = planAccountWrites(accounts, existing.map((e) => ({ id: e.id, zernioId: String(e.fields["Zernio Account ID"] || "") })));
  const created: Row[] = [];
  for (let i = 0; i < plan.create.length; i += 10) {
    const data = await at(ACCOUNTS, { method: "PATCH", body: JSON.stringify({ performUpsert: { fieldsToMergeOn: ["Zernio Account ID"] }, typecast: true, records: plan.create.slice(i, i + 10).map((r) => ({ fields: toFields(r, brief.id) })) }) });
    created.push(...(data.records || [])); await sleep(250);
  }
  for (let i = 0; i < plan.update.length; i += 10) {
    await at(ACCOUNTS, { method: "PATCH", body: JSON.stringify({ typecast: true, records: plan.update.slice(i, i + 10).map((u) => ({ id: u.recordId, fields: toFields(u.row, brief.id) })) }) }); await sleep(250);
  }
  for (let i = 0; i < plan.remove.length; i += 10) {
    await at(`${ACCOUNTS}?${plan.remove.slice(i, i + 10).map((id) => `records[]=${id}`).join("&")}`, { method: "DELETE" });
  }
  // Keep the brief's per-platform status and handle in step for the rest of the app.
  const states = platformStates(plan.rows);
  const fields: Record<string, string> = {};
  for (const p of PLATFORMS) {
    const s = states[p];
    if (s) { fields[`${p} Connected`] = s.status === "Active" ? "Connected" : "Signed out"; if (s.handle) fields[`${p} User`] = s.handle; }
    else if (brief.fields[`${p} Connected`] === "Connected" || brief.fields[`${p} Connected`] === "Signed out") fields[`${p} Connected`] = "To Connect";
  }
  if (Object.keys(fields).length) await at(`${BRIEFS}/${brief.id}`, { method: "PATCH", body: JSON.stringify({ fields, typecast: true }) });
  const ids = new Map([...existing.map((e) => [String(e.fields["Zernio Account ID"]), e.id] as const), ...created.map((c) => [String(c.fields["Zernio Account ID"]), c.id] as const)]);
  return { accounts: plan.rows.map((r) => view(r, ids.get(r.zernioId))) };
}

const PostBody = z.object({
  accessCode: z.string().min(1).max(200), brandId: z.string().max(40).optional(),
  action: z.enum(["link", "disconnect"]), platform: z.enum(PLATFORMS as [BrandPlatform, ...BrandPlatform[]]).optional(),
  facebook: z.boolean().optional(), reconnectId: z.string().max(80).optional(), returnPath: z.string().max(300).optional(), zernioId: z.string().max(80).optional(),
});

export const Route = createFileRoute("/api/social-connect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        try {
          const brandId = new URL(request.url).searchParams.get("brandId") || undefined;
          const brief = await selectedBrief(auth.record, process.env.AIRTABLE_TOKEN || "", brandId);
          if (!brief) return Response.json({ error: "No brand brief linked to this account" }, { status: 404 });
          const result = await syncOnce(brief);
          return Response.json({ ok: true, configured: true, ...(result as object) });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
      POST: async ({ request }) => {
        const parsed = PostBody.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
        const body = parsed.data;
        const auth = await requireAccessCode(body.accessCode);
        if (!auth.ok) return auth.response;
        try {
          const brief = await selectedBrief(auth.record, process.env.AIRTABLE_TOKEN || "", body.brandId);
          if (!brief) return Response.json({ error: "No brand brief linked to this account" }, { status: 404 });
          if (body.action === "disconnect") {
            const row = (await linkedRows(brief)).find((r) => r.fields["Zernio Account ID"] === body.zernioId);
            if (!row) return Response.json({ error: "That account isn't on this brand" }, { status: 404 });
            await removeAccount(String(body.zernioId));
            await at(`${ACCOUNTS}/${row.id}`, { method: "DELETE" });
            return Response.json({ ok: true, ...(await syncOnce(brief) as object) });
          }
          if (!body.platform) return Response.json({ error: "Unknown platform" }, { status: 400 });
          if (body.facebook && body.platform !== "Instagram") return Response.json({ error: "Facebook sign-in is only for Instagram" }, { status: 400 });
          if (body.reconnectId && !(await linkedRows(brief)).some((r) => r.fields["Zernio Account ID"] === body.reconnectId)) return Response.json({ error: "That account isn't on this brand" }, { status: 404 });
          const origin = new URL(request.url).origin.replace(/^http:/, "https:");
          const returnUrl = safeReturnUrl(origin, body.returnPath || "/connected");
          if (!returnUrl) return Response.json({ error: "Invalid return address" }, { status: 400 });
          let profileId = String(brief.fields["Zernio Profile ID"] || "");
          if (!profileId) {
            profileId = await createProfile(brief.id, String(brief.fields["Brand Name"] || ""));
            await at(`${BRIEFS}/${brief.id}`, { method: "PATCH", body: JSON.stringify({ fields: { "Zernio Profile ID": profileId } }) });
          }
          const authUrl = await connectLink(ZERNIO_PLATFORMS[body.platform], profileId, returnUrl, { facebook: body.facebook, reconnectId: body.reconnectId });
          return Response.json({ ok: true, authUrl });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
});
