import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appOttHso6hYjBXhw";
const CLIENT_ADMIN_TABLE = "tblPm4VFwe6nTaYj4";
const CLIENT_ADMIN_BRIEFS_FIELD = "fldIBqAr551xuxdev";
const CONTENT_TABLE = "tblQHZQtxSzkeqsCQ";

const MODEL = "google/gemini-3-flash-preview";
const ROUTE_BUDGET_MS = 55000;
const SUMMARY_TIMEOUT_MS = 50000;
const MAX_POSTS_TO_SCAN = 120;

type Attachment = { id?: string; url: string; filename: string; type?: string };
type PostRecord = {
  name: string;
  topic: string;
  format: string;
  visualHook: string;
  script: string;
  captions: string;
  views: string | number | null;
  createdAt: string;
};

function formulaString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAttachments(brandId: string): Promise<Attachment[]> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return [];
  const r = await fetchWithTimeout(
    `${AIRTABLE_API}/v0/${BASE_ID}/${CLIENT_ADMIN_TABLE}/${brandId}?returnFieldsByFieldId=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  , 8000);
  if (!r.ok) return [];
  const data: any = await r.json();
  const arr = data.fields?.[CLIENT_ADMIN_BRIEFS_FIELD];
  if (!Array.isArray(arr)) return [];
  return arr.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }));
}

async function fetchLastPosts(brandId: string, brandName: string): Promise<PostRecord[]> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return [];
  const formula = `OR(FIND(${formulaString(brandName)}, ARRAYJOIN({Brand})), FIND(${formulaString(brandId)}, ARRAYJOIN({Brand})))`;
  const fieldList = [
    "Post name",
    "Brand",
    "Visual Hook",
    "Script",
    "IG Captions",
    "FB Captions",
    "Tiktok | Youtube Captions",
    "Format",
    "Topic",
    "Category",
    "Views",
  ];
  const allRecords: any[] = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ filterByFormula: formula, pageSize: "100", maxRecords: String(MAX_POSTS_TO_SCAN) });
    if (offset) params.set("offset", offset);
    for (const f of fieldList) params.append("fields[]", f);
    const r = await fetchWithTimeout(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }, 8000);
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn("[admin-brand-context] content fetch failed", r.status, t.slice(0, 300));
      return [];
    }
    const data: any = await r.json();
    allRecords.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset && allRecords.length < MAX_POSTS_TO_SCAN);

  const records = allRecords.slice().sort((a: any, b: any) => {
    const ta = a.createdTime ? Date.parse(a.createdTime) : 0;
    const tb = b.createdTime ? Date.parse(b.createdTime) : 0;
    return tb - ta;
  }).slice(0, 30);
  console.log(`[admin-brand-context] fetched ${allRecords.length} posts for ${brandName} (${brandId}), using top ${records.length}`);
  return records.map((rec: any) => {
    const f = rec.fields || {};
    const captions = [
      f["IG Captions"] && `IG: ${f["IG Captions"]}`,
      f["FB Captions"] && `FB: ${f["FB Captions"]}`,
      f["Tiktok | Youtube Captions"] && `TT/YT: ${f["Tiktok | Youtube Captions"]}`,
    ].filter(Boolean).join("\n");
    return {
      name: String(f["Post name"] || f["Event/Post Name"] || ""),
      topic: String(f["Topic"] || f["Category"] || ""),
      format: String(f["Format"] || ""),
      visualHook: String(f["Visual Hook"] || ""),
      script: String(f["Script"] || ""),
      captions,
      views: f["Views"] ?? null,
      createdAt: rec.createdTime || "",
    };
  });
}

const MAX_TEXT_BYTES = 200_000;
const PDF_EXTRACT_TIMEOUT_MS = 30_000;

async function getCachedPdfText(attachmentId: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pdf_extract_cache" as any)
      .select("text")
      .eq("attachment_id", attachmentId)
      .maybeSingle();
    if (error) {
      console.warn("[admin-brand-context] cache lookup failed", error.message);
      return null;
    }
    // Airtable attachment URLs are signed and rotate, but the file behind a
    // stable attachment id does not change. Trust the cache by id.
    return (data as any)?.text || null;
  } catch (e) {
    console.warn("[admin-brand-context] cache lookup threw", e);
    return null;
  }
}

async function setCachedPdfText(attachmentId: string, filename: string, url: string, text: string, byteSize: number) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pdf_extract_cache" as any)
      .upsert({
        attachment_id: attachmentId,
        filename,
        url,
        text,
        byte_size: byteSize,
        updated_at: new Date().toISOString(),
      }, { onConflict: "attachment_id" });
    if (error) console.warn("[admin-brand-context] cache write failed", error.message);
  } catch (e) {
    console.warn("[admin-brand-context] cache write threw", e);
  }
}

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const result = await extractText(pdf, { mergePages: true });
  const text = (result as any).text;
  const raw = typeof text === "string" ? text : Array.isArray(text) ? text.join("\n\n") : "";
  // Postgres TEXT rejects \u0000; strip null bytes and other control chars that
  // commonly appear in PDF text streams.
  return raw.replace(/\u0000/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

async function processAttachments(attachments: Attachment[]) {
  const textContents: string[] = [];
  for (const att of attachments.slice(0, 2)) {
    try {
      const mediaType = att.type || "";
      const lowerName = att.filename.toLowerCase();
      const isPdf = mediaType.includes("pdf") || lowerName.endsWith(".pdf");

      if (isPdf) {
        // 1) Try cache first — avoids re-downloading and re-parsing large PDFs.
        if (att.id) {
          const cached = await getCachedPdfText(att.id);
          if (cached) {
            textContents.push(`--- File: ${att.filename} ---\n${cached}\n--- End of ${att.filename} ---`);
            continue;
          }
        }
        // 2) Cache miss: download, extract text, store.
        const dl = await fetchWithTimeout(att.url, {}, 20000);
        if (!dl.ok) {
          console.warn(`[admin-brand-context] download failed for ${att.filename}: ${dl.status}`);
          continue;
        }
        const buf = await dl.arrayBuffer();
        let text = "";
        try {
          text = await Promise.race([
            extractPdfText(buf),
            new Promise<string>((_, rej) => setTimeout(() => rej(new Error("pdf extract timeout")), PDF_EXTRACT_TIMEOUT_MS)),
          ]);
        } catch (e) {
          console.warn(`[admin-brand-context] PDF extract failed for ${att.filename}`, e);
          continue;
        }
        text = text.trim();
        if (!text) {
          console.warn(`[admin-brand-context] PDF extracted empty text for ${att.filename}`);
          continue;
        }
        if (att.id) {
          await setCachedPdfText(att.id, att.filename, att.url, text, buf.byteLength);
        }
        textContents.push(`--- File: ${att.filename} ---\n${text}\n--- End of ${att.filename} ---`);
        continue;
      }

      const isText = mediaType.startsWith("text/")
        || /\.(txt|md|rst|csv|json|xml|html?)$/i.test(lowerName);
      if (isText) {
        const dl = await fetchWithTimeout(att.url, {}, 8000);
        if (!dl.ok) continue;
        const text = (await dl.text()).slice(0, MAX_TEXT_BYTES);
        textContents.push(`--- File: ${att.filename} ---\n${text}\n--- End of ${att.filename} ---`);
      }
      // Unsupported binary formats are silently skipped
    } catch (e) {
      console.warn(`[admin-brand-context] attachment processing failed for ${att.filename}`, e);
    }
  }
  return { textContents };
}

function postsDigest(posts: PostRecord[]): string {
  if (!posts.length) return "(no prior posts on file)";
  return posts.map((p, i) => {
    const lines = [
      `Post ${i + 1}: ${p.name || "(untitled)"}`,
      p.createdAt ? `  Created: ${p.createdAt.slice(0, 10)}` : null,
      p.format ? `  Format: ${p.format}` : null,
      p.topic ? `  Topic/Category: ${p.topic}` : null,
      p.visualHook ? `  Visual hook: ${p.visualHook.slice(0, 240)}` : null,
      p.script ? `  Script: ${p.script.slice(0, 420)}` : null,
      p.views != null && p.views !== "" ? `  Views: ${p.views}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  }).join("\n\n");
}

async function generateSummary(
  brandName: string,
  briefText: string,
  posts: PostRecord[],
  textContents: string[] = [],
  builderPrompt: string = "",
  analysisReport: any | null = null,
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return "";
  const digest = postsDigest(posts);
  const usablePostCount = posts.filter((p) => {
    const content = `${p.visualHook || ""}${p.script || ""}${p.name || ""}`.trim();
    return content.length >= 12;
  }).length;

  // The system prompt is the admin-controlled "Session Brief Builder" guidelines
  // (Settings section 02). Falls back to a minimal hard-coded reminder if empty.
  const sys = (builderPrompt && builderPrompt.trim())
    ? builderPrompt.trim()
    : `You build ONE editable session brief for a strategist. Treat ALL attached brand brief files as a single combined source. Output markdown only.`;

  const analysisBlock = analysisReport
    ? `\n\nANALYSIS REPORT (treat as an additional brand brief file — it is the highest-signal source for what this brand's audience actually responds to. Reconcile silently with the other files; if it conflicts, prefer the analysis report for voice and topic resonance):\n${JSON.stringify(analysisReport, null, 2)}`
    : "";

  const user = `CLIENT: ${brandName}

BRAND BRIEFS: ${textContents.length} file(s) extracted from the "Brand briefs" field for this one client. Read ALL of them together as a SINGLE combined brief for this brand. Do NOT produce a separate summary per file. Synthesize across every attached file into ONE unified session brief. If two files disagree, reconcile silently and prefer the more specific or more recent guidance.
${briefText ? `Reference: ${briefText}` : ""}
${textContents.length ? `\nExtracted brand brief contents:\n${textContents.join("\n\n")}` : ""}${analysisBlock}

LAST POSTS FOR THIS BRAND (most recent first, up to 30; ${usablePostCount} are usable for the "Topics we've used before" labeling):
${digest}

Build the session brief now, following the structure and rules in your system instructions exactly. Return only the markdown.`;

  const gateway = createOpenAICompatible({
    name: "lovable-ai",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key },
  });

  const { text } = await generateText({
    model: gateway(MODEL),
    system: sys,
    maxOutputTokens: 5000,
    abortSignal: AbortSignal.timeout(SUMMARY_TIMEOUT_MS),
    prompt: user,
  });

  return text.trim();
}

export const Route = createFileRoute("/api/admin-brand-context")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: any;
          try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
          const auth = await requireAccessCode(body?.accessCode, { staffOnly: true });
          if (!auth.ok) return auth.response;
          const brandId = String(body?.brandId || "");
          const brandName = String(body?.brandName || "this brand");
          const builderPrompt = typeof body?.builderPrompt === "string" ? body.builderPrompt : "";
          const analysisReport = body?.analysisReport ?? null;
          if (!brandId) return Response.json({ error: "brandId required" }, { status: 400 });

          const started = Date.now();
          const [attachments, posts] = await Promise.all([
            fetchAttachments(brandId),
            fetchLastPosts(brandId, brandName),
          ]);

          if (attachments.length === 0) {
            return Response.json({
              attachments,
              posts: posts.length,
              briefText: "",
              postsDigest: postsDigest(posts),
              summaryMarkdown: null,
              error: "No brand brief files found on this client record. Upload a brief to generate context.",
            });
          }

          const attachmentsToRead = attachments.slice(0, 2);
          const { textContents } = await processAttachments(attachmentsToRead);
          if (!textContents.length) {
            return Response.json({
              attachments,
              posts: posts.length,
              briefText: "",
              postsDigest: postsDigest(posts),
              summaryMarkdown: null,
              error: "Could not read the attached brand brief file(s). Try again.",
            }, { status: 502 });
          }
          const briefText = `Attached file(s): ${attachmentsToRead.map((a) => a.filename).join(", ")}`;

          const remainingMs = ROUTE_BUDGET_MS - (Date.now() - started);
          if (remainingMs < 4000) {
            return Response.json({
              attachments,
              posts: posts.length,
              briefText,
              postsDigest: postsDigest(posts),
              summaryMarkdown: null,
              error: "Upstream fetches used the full time budget. Retry.",
            }, { status: 504 });
          }

          let summaryMarkdown = "";
          try {
            summaryMarkdown = await generateSummary(brandName, briefText, posts, textContents, builderPrompt, analysisReport);
          } catch (e) {
            console.warn("[admin-brand-context] generateSummary threw", e);
          }

          if (!summaryMarkdown) {
            return Response.json({
              attachments,
              posts: posts.length,
              briefText,
              postsDigest: postsDigest(posts),
              summaryMarkdown: null,
              error: "Brand context generation failed or timed out. Retry — a generic fallback would poison downstream scripts, so none was returned.",
            }, { status: 502 });
          }

          console.log(`[admin-brand-context] completed for ${brandName} in ${Date.now() - started}ms`);

          return Response.json({
            attachments,
            posts: posts.length,
            briefText,
            postsDigest: postsDigest(posts),
            summaryMarkdown,
          });
        } catch (e: any) {
          console.error("[admin-brand-context] failed", e);
          return Response.json({ error: e?.message || "Could not load brand context" }, { status: 500 });
        }
      },
    },
  },
});
