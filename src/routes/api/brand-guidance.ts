import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief } from "@/lib/brands.server";

const BASE_ID = "appf1QABtQbAENYDz";
const BRANDS_TABLE = "tblho1mwlIMZfozue"; // Brands
const BRIEF_TABLE = "tblkV5xOB2D1N5dNH"; // Brand brief

// Fields that must be filled for the brand info to count as submitted.
const REQUIRED_BRIEF_FIELDS = [
  "Brand Name",
  "My Brand in Nutshell",
  "My Niche/Industry",
  "My Target Audience",
];

function headers() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}

function esc(v: string) {
  return v.replace(/'/g, "\\'");
}

async function findByCode(table: string, code: string, h: Record<string, string>) {
  const safe = esc(code);
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${table}?maxRecords=1&filterByFormula=${encodeURIComponent(
    formula,
  )}`;
  const r = await fetch(url, { headers: h });
  const data: any = await r.json();
  if (!r.ok) return null;
  return data.records?.[0] || null;
}

export const Route = createFileRoute("/api/brand-guidance")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const code = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(code);
        if (!auth.ok) return auth.response;

        try {
          const briefId = new URL(request.url).searchParams.get("brief") || "";
          let brand: any;
          let brief: any;
          if (briefId) {
            // Only briefs this account owns can be read; never trust the id alone.
            brief = await selectedBrief(auth.record, process.env.AIRTABLE_TOKEN!, briefId);
            if (!brief) return Response.json({ error: "Brand not found" }, { status: 404 });
            const linked = Array.isArray(brief.fields?.Brand) ? brief.fields.Brand[0] : "";
            brand = linked
              ? await fetch(`https://api.airtable.com/v0/${BASE_ID}/${BRANDS_TABLE}/${linked}`, { headers: h }).then((r) => (r.ok ? r.json() : null))
              : await findByCode(BRANDS_TABLE, auth.record.code, h);
          } else {
            [brand, brief] = await Promise.all([
              findByCode(BRANDS_TABLE, auth.record.code, h),
              findByCode(BRIEF_TABLE, auth.record.code, h),
            ]);
          }

          const missing = REQUIRED_BRIEF_FIELDS.filter(
            (f) => !String(brief?.fields?.[f] ?? "").trim(),
          );

          const BRIEF_TEXT_FIELDS = [
            "My Brand in Nutshell",
            "My Niche/Industry",
            "My Target Audience",
            "Pain Points",
            "Topics",
            "My Competitive Edge",
            "My Tone of Voice",
          ];
          const briefFields: Record<string, string> = {};
          for (const f of BRIEF_TEXT_FIELDS) briefFields[f] = String(brief?.fields?.[f] ?? "").trim();

          const num = (...values: any[]) => {
            const found = values.find((v) => v !== undefined && v !== null && v !== "");
            return found === undefined ? null : Number(found);
          };
          const num0 = (v: any) => Math.max(0, Math.round(Number(v) || 0));
          return Response.json({
            briefSubmitted: Boolean(brief) && missing.length === 0,
            missingFields: brief ? missing : REQUIRED_BRIEF_FIELDS,
            brandName: String(brief?.fields?.["Brand Name"] ?? "").trim(),
            briefFields,

            strategy: String(brand?.fields?.["Recommended strategy"] ?? "").trim(),
            strategyPlatform: String(brand?.fields?.["Strategy platform"] ?? "").trim(),
            broll: num(brand?.fields?.["Recommended BROLL"]),
            talking: num(brand?.fields?.["Recommended Talking"]),
            graphic: num(brand?.fields?.["Recommended Graphic"]),
            carousel: num(brand?.fields?.["Recommended Carousels"], brand?.fields?.["Recommended Carousel"]),
            formatMetrics: {
              broll: {
                posted: num0(brand?.fields?.["Posted BROLL MTD"]),
                pipeline: num0(brand?.fields?.["Pipeline BROLL"]),
              },
              talkingVideo: {
                posted: num0(brand?.fields?.["Posted Talking MTD"]),
                pipeline: num0(brand?.fields?.["Pipeline Talking"]),
              },
              graphic: {
                posted: num0(brand?.fields?.["Posted Graphic MTD"]),
                pipeline: num0(brand?.fields?.["Pipeline Graphic"]),
              },
              carousel: {
                posted: num0(brand?.fields?.["Posted Carousel MTD"]),
                pipeline: num0(brand?.fields?.["Pipeline Carousel"]),
              },
            },
          });
        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
      PATCH: async ({ request }: { request: Request }) => {
        const h = headers();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const code = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(code);
        if (!auth.ok) return auth.response;
        const body = (await request.json().catch(() => ({}))) as {
          strategy?: string;
          broll?: number;
          talking?: number;
          graphic?: number;
          carousel?: number;
          platform?: string;
        };
        const strategy = String(body.strategy || "").trim().slice(0, 4000);
        if (!strategy) return Response.json({ error: "Strategy cannot be empty." }, { status: 400 });
        const clamp = (v: any) =>
          v === undefined || v === null || v === "" ? null : Math.max(0, Math.min(24, Math.round(Number(v) || 0)));
        try {
          const brand = await findByCode(BRANDS_TABLE, auth.record.code, h);
          if (!brand?.id) return Response.json({ error: "No brand linked to this account." }, { status: 404 });
          const fields: Record<string, any> = { "Recommended strategy": strategy };
          const map: Array<[string, any]> = [
            ["Recommended BROLL", clamp(body.broll)],
            ["Recommended Talking", clamp(body.talking)],
            ["Recommended Graphic", clamp(body.graphic)],
            ["Recommended Carousel", clamp(body.carousel)],
            ["Recommended Carousels", clamp(body.carousel)],
          ];
          for (const [name, value] of map) if (value !== null) fields[name] = value;
          const platform = String(body.platform || "").toLowerCase();
          if (platform === "tiktok") fields["Strategy platform"] = "TikTok";
          else if (platform === "instagram") fields["Strategy platform"] = "Instagram";

          const saved = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${BRANDS_TABLE}/${brand.id}`, {
            method: "PATCH",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ fields }),
          });
          const result = await saved.json().catch(() => ({}));
          if (!saved.ok) return Response.json({ error: `Strategy save failed [${saved.status}]` }, { status: 502 });
          return Response.json({ ok: true, strategy: String((result as any)?.fields?.["Recommended strategy"] || strategy) });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Could not save strategy." }, { status: 502 });
        }
      },

    },
  },
} as any);
