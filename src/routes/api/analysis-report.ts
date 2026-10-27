import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

const BASE_ID = "appf1QABtQbAENYDz";
const REPORTS_TABLE = "Analysis Reports"; // table name; Airtable accepts names in the Records API URL

function headers() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}

function esc(v: string) {
  return v.replace(/'/g, "\\'");
}

async function findLatestByCode(table: string, code: string, h: Record<string, string>) {
  const safe = esc(code);
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${table}?maxRecords=1&sort%5B0%5D%5Bfield%5D=Created%20At&sort%5B0%5D%5Bdirection%5D=desc&filterByFormula=${encodeURIComponent(
    formula,
  )}`;
  const r = await fetch(url, { headers: h });
  const data: any = await r.json();
  if (!r.ok) return null;
  return data.records?.[0] || null;
}

async function listByCode(table: string, code: string, h: Record<string, string>) {
  const safe = esc(code);
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${table}?pageSize=20&maxRecords=20&sort%5B0%5D%5Bfield%5D=Created%20At&sort%5B0%5D%5Bdirection%5D=desc&filterByFormula=${encodeURIComponent(
    formula,
  )}`;
  const r = await fetch(url, { headers: h });
  const data: any = await r.json();
  if (!r.ok) return [];
  return (data.records || []) as any[];
}

/**
 * Marks one report as the linked ("used for findings") one and clears the flag
 * on every other report for the same access code, so only one is ever linked.
 */
async function setLinked(
  table: string,
  code: string,
  id: string,
  h: Record<string, string>,
  known?: any[],
) {
  const records = known ?? (await listByCode(table, code, h));
  const updates = [
    { id, fields: { Linked: true } },
    ...records
      .filter((r: any) => r.id !== id && r.fields?.["Linked"])
      .map((r: any) => ({ id: r.id, fields: { Linked: false } })),
  ];
  for (let i = 0; i < updates.length; i += 10) {
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ records: updates.slice(i, i + 10) }),
    });
  }
  return records;
}


function safeJsonStringify(value: unknown, maxChars = 95000): string {
  const compact = JSON.stringify(value);
  if (compact.length <= maxChars) return compact;

  // Try removing heavy arrays first.
  let pruned = JSON.stringify(value, (key, val) => {
    if (["samplePosts", "postUrls", "top5", "bottom5", "allPosts", "rawPosts"].includes(key)) return undefined;
    return val;
  });
  if (pruned.length <= maxChars) return pruned;

  // Progressive string truncation until it fits.
  let limit = 2000;
  while (limit > 50) {
    pruned = JSON.stringify(value, (_k, v) => {
      if (typeof v === "string" && v.length > limit) return v.slice(0, limit) + "…";
      return v;
    });
    if (pruned.length <= maxChars) return pruned;
    limit = Math.floor(limit / 2);
  }

  // Absolute fallback: drop the heaviest free-text fields entirely.
  return JSON.stringify(value, (key, val) => {
    if (["caption", "transcript", "body", "text", "hook", "rationale", "reasoning"].includes(key)) return undefined;
    if (typeof val === "string" && val.length > 200) return val.slice(0, 200) + "…";
    return val;
  });
}

export const Route = createFileRoute("/api/analysis-report")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const code = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(code);
        if (!auth.ok) return auth.response;

        const url = new URL(request.url);
        const wantsList = url.searchParams.get("list") === "1";
        const wantedId = url.searchParams.get("id") || "";

        const shape = (record: any) => ({
          id: record.id,
          report: record.fields["Report JSON"] ? JSON.parse(String(record.fields["Report JSON"])) : null,
          summary: record.fields["Summary JSON"] ? JSON.parse(String(record.fields["Summary JSON"])) : null,
          profile: String(record.fields["Profile"] || ""),
          platform: String(record.fields["Platform"] || ""),
          postsAnalysed: Number(record.fields["Posts Analysed"] || 0),
          createdAt: record.fields["Created At"] || null,
          linked: Boolean(record.fields["Linked"]),
        });

        try {
          if (wantsList || wantedId) {
            const records = await listByCode(REPORTS_TABLE, auth.record.code, h);
            if (wantedId) {
              const one = records.find((r: any) => r.id === wantedId);
              if (!one) return Response.json({ error: "Not found" }, { status: 404 });
              return Response.json(shape(one));
            }
            return Response.json({
              audits: records.map((r: any) => ({
                id: r.id,
                profile: String(r.fields["Profile"] || ""),
                platform: String(r.fields["Platform"] || ""),
                postsAnalysed: Number(r.fields["Posts Analysed"] || 0),
                createdAt: r.fields["Created At"] || null,
                linked: Boolean(r.fields["Linked"]),
              })),
            });
          }

          // Default: the report the user linked to the strategy.
          const records = await listByCode(REPORTS_TABLE, auth.record.code, h);
          // Only the audit the user chose ("Use"); never auto-pick the newest.
          const record = records.find((r: any) => r.fields?.["Linked"]);
          if (!record) return Response.json({ report: null });
          return Response.json(shape(record));
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const code = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(code);
        if (!auth.ok) return auth.response;

        const body = (await request.json().catch(() => ({}))) as {
          report?: unknown;
          summary?: { total?: number; fmtAvgViews?: string; fmtMaxViews?: string; fmtMedianViews?: string; profileName?: string; platform?: string };
          profile?: string;
          platform?: string;
          postsAnalysed?: number;
          brandName?: string;
        };

        if (!body.report || typeof body.report !== "object") {
          return Response.json({ error: "Missing report" }, { status: 400 });
        }

        const summary = body.summary || {};
        const summaryPayload = {
          total: summary.total ?? null,
          avgViews: summary.fmtAvgViews ?? null,
          maxViews: summary.fmtMaxViews ?? null,
          medianViews: summary.fmtMedianViews ?? null,
          profileName: summary.profileName ?? body.profile ?? null,
          platform: summary.platform ?? body.platform ?? null,
        };

        const fields: Record<string, any> = {
          "Access code": auth.record.code,
          "Brand Name": String(body.brandName || "").slice(0, 120),
          Profile: String(body.profile || summary.profileName || "").slice(0, 120),
          Platform: String(body.platform || summary.platform || "").slice(0, 40),
          "Posts Analysed": Number(body.postsAnalysed || summary.total || 0),
          "Report JSON": safeJsonStringify(body.report),
          "Summary JSON": JSON.stringify(summaryPayload),
          "Created At": new Date().toISOString(),
        };

        try {
          const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${REPORTS_TABLE}`, {
            method: "POST",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: { ...fields, Linked: false } }),
          });
          const data: any = await r.json().catch(() => ({}));
          if (!r.ok) {
            console.error("[analysis-report] Airtable create failed", data);
            return Response.json({ error: `Airtable create failed [${r.status}]` }, { status: 502 });
          }
          // New audits stay unlinked: the user decides which one to use.
          return Response.json({ ok: true, id: data.id });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
      /** Link one stored report to the strategy; clears the flag on all others. */
      PATCH: async ({ request }: { request: Request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const code = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(code);
        if (!auth.ok) return auth.response;

        const body = (await request.json().catch(() => ({}))) as { id?: string };
        const id = String(body.id || "");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        try {
          const records = await listByCode(REPORTS_TABLE, auth.record.code, h);
          const target = records.find((r: any) => r.id === id);
          if (!target) return Response.json({ error: "Not found" }, { status: 404 });
          await setLinked(REPORTS_TABLE, auth.record.code, id, h, records);
          return Response.json({
            ok: true,
            id,
            report: target.fields["Report JSON"] ? JSON.parse(String(target.fields["Report JSON"])) : null,
            summary: target.fields["Summary JSON"] ? JSON.parse(String(target.fields["Summary JSON"])) : null,
            profile: String(target.fields["Profile"] || ""),
            platform: String(target.fields["Platform"] || ""),
            createdAt: target.fields["Created At"] || null,
          });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
} as any);
