import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { FORMAT_DOC_LABEL, FORMAT_SPEC, getDocHeading, readExportFieldValue, type FieldKey, type FormatKey } from "@/lib/slate/formatFields";

const DRIVE = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const DOCS = "https://connector-gateway.lovable.dev/google_docs/v1";

type ScriptDoc = any;
type Caption = { instagram: string; facebook: string; tiktok: string; youtube: string };

type ApprovedScript = {
  topic: string;
  scriptNumber: number;
  script: ScriptDoc;
  captions?: Caption;
};

function gatewayHeaders(connectorKey: string) {
  return {
    Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": connectorKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function formatLabel(f: string | undefined | null) {
  return f === "talkingVideo" ? "Talking Video"
    : f === "broll" ? "B-roll"
    : f === "carousel" ? "Carousel"
    : f === "graphic" ? "Graphic"
    : "Scripts";
}

// Body text style — thin weight (300). Headings get bold via paragraph + textStyle.
const THIN = { weightedFontFamily: { fontFamily: "Arial", weight: 300 } } as any;
const BOLD = { bold: true } as any;

/** Build the body of insertText + style requests, in order. */
function buildRequests(
  title: string,
  generatedBy: string,
  scripts: ApprovedScript[],
  hideProdMeta = false,
) {
  let index = 1;
  const requests: any[] = [];

  type StyleArg = "TITLE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "NORMAL_TEXT";

  const push = (
    text: string,
    style?: StyleArg,
    textStyle?: any,
  ) => {
    if (!text) return;
    const start = index;
    requests.push({ insertText: { location: { index: start }, text } });
    index += text.length;
    if (style) {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: start + text.length },
          paragraphStyle: { namedStyleType: style },
          fields: "namedStyleType",
        },
      });
    }
    // Always apply a base text style so body comes out thin, and headings bold.
    const baseStyle: any = style && style !== "NORMAL_TEXT"
      ? { ...BOLD, weightedFontFamily: { fontFamily: "Arial", weight: 700 } }
      : { ...THIN };
    const merged = { ...baseStyle, ...(textStyle || {}) };
    requests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: start + text.length },
        textStyle: merged,
        fields: Object.keys(merged).join(","),
      },
    });
  };

  // Title block — name == document title
  push(`${title}\n`, "TITLE");
  push(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} by ${generatedBy || "—"}\n\n`,
    "NORMAL_TEXT",
    { italic: true, foregroundColor: { color: { rgbColor: { red: 0.55, green: 0.55, blue: 0.6 } } }, weightedFontFamily: { fontFamily: "Arial", weight: 300 } },
  );

  scripts.forEach((s, i) => {
    const idx = String(s.scriptNumber);
    const total = String(scripts.length);
    push(`Script ${idx} of ${total}\n\n`, "HEADING_1");

    const fmt = (s.script?.format as FormatKey) || "talkingVideo";
    // Declare the format the document itself carries, so downstream parsing
    // never has to rely on a manual pick.
    push(
      `Format: ${FORMAT_DOC_LABEL[fmt] || "Talking Video"}\n\n`,
      "NORMAL_TEXT",
      { foregroundColor: { color: { rgbColor: { red: 0.55, green: 0.55, blue: 0.6 } } }, weightedFontFamily: { fontFamily: "Arial", weight: 300 } },
    );

    push(`Title\n`, "HEADING_3");
    push(`${s.topic || "—"}\n\n`, "NORMAL_TEXT");

    const spec = FORMAT_SPEC[fmt];
    const fields: FieldKey[] = spec?.fields ?? [];

    for (const f of fields) {
      if (hideProdMeta && (f === "inspo" || f === "filmingInstructions")) continue;
      const value = readExportFieldValue(f, fmt, s.script || {});
      if (!value && (f === "filmingInstructions" || f === "inspo")) continue;
      push(`${getDocHeading(f, fmt)}\n`, "HEADING_3");
      push(`${value || "—"}\n\n`, "NORMAL_TEXT");
    }

    if (s.script?.assignees?.length) {
      const role = spec?.autoAssignRole === "designer" ? "Designer" : "Editor";
      push(`${role}\n`, "HEADING_3");
      push(`${s.script.assignees.map((a: any) => a.name).join(", ")}\n\n`, "NORMAL_TEXT");
    }

    if (s.captions) {
      push("Captions\n", "HEADING_2");
      push(`Instagram\n`, "NORMAL_TEXT", { bold: true, weightedFontFamily: { fontFamily: "Arial", weight: 700 } });
      push(`${s.captions.instagram || "—"}\n\n`, "NORMAL_TEXT");
      push(`Facebook\n`, "NORMAL_TEXT", { bold: true, weightedFontFamily: { fontFamily: "Arial", weight: 700 } });
      push(`${s.captions.facebook || "—"}\n\n`, "NORMAL_TEXT");
      push(`TikTok\n`, "NORMAL_TEXT", { bold: true, weightedFontFamily: { fontFamily: "Arial", weight: 700 } });
      push(`${s.captions.tiktok || "—"}\n\n`, "NORMAL_TEXT");
      push(`YouTube\n`, "NORMAL_TEXT", { bold: true, weightedFontFamily: { fontFamily: "Arial", weight: 700 } });
      push(`${s.captions.youtube || "—"}\n\n`, "NORMAL_TEXT");
    }

    if (i < scripts.length - 1) {
      push("\n", "NORMAL_TEXT");
    }
  });

  return requests;
}

export const Route = createFileRoute("/api/create-google-doc")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const auth = await requireAccessCode(body?.accessCode, { adminOnly: false });
        if (!auth.ok) return auth.response;

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const GDRIVE = process.env.GOOGLE_DRIVE_API_KEY;
        const GDOCS = process.env.GOOGLE_DOCS_API_KEY;
        if (!LOVABLE_API_KEY || !GDRIVE || !GDOCS) {
          return Response.json({ error: "Google Docs not configured" }, { status: 500 });
        }

        const { clientName, brandName, scripts, format } = body || {};
        if (!Array.isArray(scripts) || scripts.length === 0) {
          return Response.json({ error: "No scripts provided" }, { status: 400 });
        }

        const todayLong = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        const brandLabel = brandName || clientName || "Risevoice";
        const title = `${brandLabel} — ${formatLabel(format)} — ${todayLong}`;
        const sharedFolderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID;

        // 1. Create the doc via Drive so we can place it in a shared drive folder.
        const createBody: any = {
          name: title,
          mimeType: "application/vnd.google-apps.document",
        };
        if (sharedFolderId) createBody.parents = [sharedFolderId];

        const createUrl = new URL(`${DRIVE}/files`);
        createUrl.searchParams.set("supportsAllDrives", "true");
        createUrl.searchParams.set("fields", "id,name,webViewLink,parents");

        const createRes = await fetch(createUrl.toString(), {
          method: "POST",
          headers: gatewayHeaders(GDRIVE),
          body: JSON.stringify(createBody),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok || !createData?.id) {
          return Response.json(
            { error: `Drive create failed [${createRes.status}]: ${JSON.stringify(createData)}` },
            { status: 502 }
          );
        }
        const docId = createData.id as string;
        const webViewLink: string = createData.webViewLink || `https://docs.google.com/document/d/${docId}/edit`;

        // 2. Insert all the content via Docs batchUpdate.
        const requests = buildRequests(title, clientName || "", scripts as ApprovedScript[], auth.record.userType.toLowerCase() === "user");
        if (requests.length) {
          const batchRes = await fetch(`${DOCS}/documents/${docId}:batchUpdate`, {
            method: "POST",
            headers: gatewayHeaders(GDOCS),
            body: JSON.stringify({ requests }),
          });
          if (!batchRes.ok) {
            const errData = await batchRes.json().catch(() => ({}));
            return Response.json(
              {
                error: `Docs batchUpdate failed [${batchRes.status}]: ${JSON.stringify(errData)}`,
                webViewLink,
              },
              { status: 502 }
            );
          }
        }

        // 3. Make link-shareable inside the workspace (anyone with link can edit).
        try {
          await fetch(`${DRIVE}/files/${docId}/permissions?supportsAllDrives=true`, {
            method: "POST",
            headers: gatewayHeaders(GDRIVE),
            body: JSON.stringify({ role: "writer", type: "anyone" }),
          });
        } catch {
          // Non-fatal — domain policy may block "anyone" links.
        }

        return Response.json({ ok: true, docId, webViewLink, title });
      },
    },
  },
});
