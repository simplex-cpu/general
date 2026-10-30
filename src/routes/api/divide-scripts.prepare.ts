import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import {
  detectSectionFormat,
  gdocStructuralElementsToText,
  splitIntoSections,
} from "@/lib/divideScripts.shared";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

// Pass 1 of the divide-scripts pipeline:
//  - PDF: extract text with unpdf (pure JS, Cloudflare-safe).
//  - Google Doc: fetch via connector and flatten to markdown-ish text.
//  - Split on "Script NN of MM" headers and return the sections.
// Pass 2 (one Claude call per section) lives in /api/divide-scripts/section.
export const Route = createFileRoute("/api/divide-scripts/prepare")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const headerCode = request.headers.get("x-access-code") || undefined;
          if (headerCode) {
            const pre = await requireAccessCode(headerCode, { staffOnly: true });
            if (!pre.ok) return pre.response;
          }

          const { base64, filename, gdocUrl, accessCode, expectedCount } = (await request.json()) as {
            base64?: string;
            filename?: string;
            gdocUrl?: string;
            accessCode?: string;
            expectedCount?: number;
          };

          if (!headerCode) {
            const auth = await requireAccessCode(accessCode, { staffOnly: true });
            if (!auth.ok) return auth.response;
          }
          if (!base64 && !gdocUrl) return json({ error: "Provide a PDF or a Google Doc link" }, 400);

          let text = "";
          let resolvedFilename = filename || "document";

          if (base64) {
            // Decode base64 → Uint8Array.
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const { extractText } = await import("unpdf");
            const result: any = await extractText(bytes, { mergePages: true });
            text = Array.isArray(result?.text) ? result.text.join("\n") : String(result?.text || "");
            if (!text.trim()) return json({ error: "Could not extract text from the PDF." }, 400);
          } else if (gdocUrl) {
            const m = gdocUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
            if (!m) return json({ error: "Invalid Google Doc link" }, 400);
            const docId = m[1];
            const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
            const GOOGLE_DOCS_API_KEY = process.env.GOOGLE_DOCS_API_KEY;
            if (!LOVABLE_API_KEY || !GOOGLE_DOCS_API_KEY) {
              return json({ error: "Google Docs connector not configured" }, 500);
            }
            const dres = await fetch(
              `https://connector-gateway.lovable.dev/google_docs/v1/documents/${docId}`,
              {
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "X-Connection-Api-Key": GOOGLE_DOCS_API_KEY,
                },
              }
            );
            const ddata: any = await dres.json().catch(() => ({}));
            if (!dres.ok) {
              return json(
                { error: `Google Docs error [${dres.status}]: ${ddata?.error?.message || JSON.stringify(ddata).slice(0, 200)}` },
                502
              );
            }
            text = gdocStructuralElementsToText(ddata?.body?.content || []).trim();
            if (!text) return json({ error: "Google Doc appears to be empty" }, 400);
            resolvedFilename = ddata?.title || `Google Doc ${docId}`;
          }

          const sections = splitIntoSections(text);
          const detected = sections.map((s) => detectSectionFormat(s));
          return json({
            sections,
            // What each section says it is: its "Format:" line, or an inference
            // from its field labels for documents written before that line existed.
            sectionFormats: detected.map((d) => d?.format ?? null),
            sectionFormatSources: detected.map((d) => d?.source ?? null),
            // Fields present that belong to a different format.
            sectionConflicts: detected.map((d) => d?.conflicts ?? []),
            detectedCount: sections.length,
            expectedCount: expectedCount ?? null,
            filename: resolvedFilename,
          });
        } catch (e: any) {
          console.error("/api/divide-scripts/prepare", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
