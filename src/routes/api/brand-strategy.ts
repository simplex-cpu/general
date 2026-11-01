import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

const BASE_ID = "appf1QABtQbAENYDz";
const BRANDS_TABLE = "tblho1mwlIMZfozue"; // Brands
const MODEL = "claude-opus-4-8";

function headers() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}

function esc(v: string) {
  return v.replace(/'/g, "\\'");
}

async function findBrand(code: string, h: Record<string, string>) {
  const safe = esc(code);
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${BRANDS_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(
    formula,
  )}`;
  const r = await fetch(url, { headers: h });
  const data: any = await r.json();
  if (!r.ok) throw new Error(`Airtable lookup failed [${r.status}]: ${JSON.stringify(data)}`);
  return data.records?.[0] || null;
}

const TOOL = {
  name: "save_strategy",
  description: "Save the recommended content strategy for this brand.",
  input_schema: {
    type: "object",
    properties: {
      recommendedStrategy: {
        type: "string",
        description:
          "Structured plain text with real line breaks. Four labelled sections, each label on its own line ending with a colon ('Topics to double down on:', 'Hooks to test:', 'Words and phrases to use:', \"Don'ts:\"), each followed by short '- ' items on their own lines. Grounded in the report. Never one paragraph.",
      },
      recommendedBroll: { type: "number", description: "How many of the next 24 posts should be b-roll videos." },
      recommendedTalking: { type: "number", description: "How many of the next 24 posts should be talking videos." },
      recommendedGraphic: {
        type: "number",
        description:
          "How many of the next 24 posts should be single-slide graphics (one image with text overlay, no swiping).",
      },
      recommendedCarousel: {
        type: "number",
        description:
          "How many of the next 24 posts should be carousels (multi-slide posts: cover slide, several copy slides, CTA slide).",
      },
    },
    required: [
      "recommendedStrategy",
      "recommendedBroll",
      "recommendedTalking",
      "recommendedGraphic",
      "recommendedCarousel",
    ],
  },
};



export const Route = createFileRoute("/api/brand-strategy")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const h = headers();
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!h || !apiKey) return Response.json({ error: "Server misconfigured" }, { status: 500 });

        const body = (await request.json().catch(() => ({}))) as {
          accessCode?: string;
          reportMarkdown?: string;
          platform?: string;
        };
        const auth = await requireAccessCode(body?.accessCode);
        if (!auth.ok) return auth.response;

        const platformLabel = String(body.platform || "").toLowerCase() === "tiktok" ? "TikTok" : "Instagram";
        const md = String(body.reportMarkdown || "").slice(0, 60000);
        if (md.length < 50) return Response.json({ error: "No report to analyze." }, { status: 400 });

        try {
          const brand = await findBrand(auth.record.code, h);
          if (!brand) return Response.json({ error: "No brand linked to this account." }, { status: 404 });

          const upstream = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 2000,
              system:
                `You are a short-form content strategist. The report you are reading covers this brand's ${platformLabel} account. Read the performance report and decide the next content strategy. ` +
                "The recommendedStrategy paragraph will be fed directly into a scripting bot that writes hooks and scripts for this brand. " +
                "Therefore it must be precise, actionable, and grounded ONLY in repeatable patterns from the report. Do not use vague jargon, generic advice, or theory that cannot be translated into a script. " +
                "FORMAT OF recommendedStrategy (strict): plain text with real line breaks, never one running paragraph. " +
                "Write exactly these four labelled sections, each label on its own line ending with a colon, followed by items each on their own line starting with '- ':\n" +
                "Topics to double down on:\nHooks to test:\nWords and phrases to use:\nDon'ts:\n" +
                "Two to four items per section, one idea per item, max ~20 words each. Never merge sections into a sentence, never use ' / ' as a separator between items, and never use the literal characters \\n. " +
                "Include only concrete guidance: " +
                "(1) Topics to double down on — the specific territories that outperformed; " +
                "(2) Hook formulas to test during scripting — e.g. 'open with a polarizing yes/no question', 'start with a number + outcome', 'use a before/after visual reveal'; " +
                "(3) Words and phrases to incorporate when applicable — the exact language patterns that correlated with better engagement; " +
                "(4) Clear DON'Ts tied to repeatable behaviors — things the bot should avoid doing in any hook or script (e.g. 'never start with a logo', 'don't use phrases like X'). " +
                "Only label something a 'DO' or 'DON'T' if the data clearly supports it. If you are unsure, leave it out rather than risk misleading the scripting bot. " +
                "The plan covers exactly 24 posts a month, split freely across the four formats: b-roll, talking video, graphic and carousel. " +
                "recommendedBroll + recommendedTalking + recommendedGraphic + recommendedCarousel must add up to exactly 24. " +
                "A graphic is ONE single image slide with a text overlay. A carousel is a multi-slide post with a cover slide, several copy slides and a CTA slide — treat them as genuinely different formats when allocating. " +
                "Every format should get at least 2 posts unless the report clearly shows the format fails for this brand. " +
                "If the report contains no data on graphics or carousels, allocate 8 b-roll, 6 talking, 4 graphic and 6 carousel. " +

                "Always answer by calling the save_strategy tool.",
              tools: [TOOL],
              tool_choice: { type: "tool", name: "save_strategy" },
              messages: [{ role: "user", content: `Platform: ${platformLabel}\n\nPerformance report:\n\n${md}` }],
            }),
          });
          const data: any = await upstream.json();
          if (!upstream.ok) {
            return Response.json(
              { error: `AI request failed [${upstream.status}]: ${JSON.stringify(data).slice(0, 300)}` },
              { status: 502 },
            );
          }
          const block = (data.content || []).find((b: any) => b.type === "tool_use");
          if (!block?.input) return Response.json({ error: "AI did not return a strategy." }, { status: 502 });

          const strategy = String(block.input.recommendedStrategy || "").slice(0, 4000);
          const clamp = (v: any) => Math.max(0, Math.min(24, Math.round(Number(v) || 0)));
          let counts = {
            broll: clamp(block.input.recommendedBroll),
            talking: clamp(block.input.recommendedTalking),
            graphic: clamp(block.input.recommendedGraphic),
            carousel: clamp(block.input.recommendedCarousel),
          };
          const keys = ["broll", "talking", "graphic", "carousel"] as const;
          let total = keys.reduce((s, k) => s + counts[k], 0);
          if (total === 0) counts = { broll: 8, talking: 6, graphic: 4, carousel: 6 };
          else if (total !== 24) {
            // Rescale proportionally, then fix the rounding drift on the biggest bucket.
            const scaled = keys.map((k) => ({ k, v: (counts[k] * 24) / total }));
            let sum = 0;
            for (const s of scaled) {
              counts[s.k] = Math.max(0, Math.round(s.v));
              sum += counts[s.k];
            }
            let drift = 24 - sum;
            while (drift !== 0) {
              const target = keys.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
              counts[target] = Math.max(0, counts[target] + (drift > 0 ? 1 : -1));
              drift += drift > 0 ? -1 : 1;
            }
          }
          const { broll, talking, graphic, carousel } = counts;

          // Nothing is persisted here — the user reviews and approves the strategy first.

          return Response.json({ ok: true, strategy, broll, talking, graphic, carousel, platform: platformLabel });

        } catch (e: any) {
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
} as any);
