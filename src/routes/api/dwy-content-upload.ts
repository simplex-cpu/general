import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { ownsRecord, resolveOwnerId } from "@/lib/owner.server";
import { uploadToDrive, finalizeDriveFile } from "@/lib/googleDrive.server";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tblucGgVsDiDGdyyK";
const DRIVE_FOLDER_ID = "1DEi1mjTz4y01Idhdx0UyeVfIOVjA7k3o";

const FIELD_NAMES = new Set(["Produced Files", "Thumbnail"]);

export const Route = createFileRoute("/api/dwy-content-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });

        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const url = new URL(request.url);
        const q = url.searchParams;
        const isAttachMode = (request.headers.get("content-type") || "").includes("application/json");

        let recordId = String(q.get("recordId") || "");
        let fieldName = String(q.get("field") || "");
        let filename = String(q.get("filename") || "").trim();
        let contentType = String(q.get("contentType") || "application/octet-stream");
        let allowMultiple = q.get("multiple") === "1";
        let attachBody: any = null;

        if (isAttachMode) {
          try {
            attachBody = await request.json();
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }
          recordId = String(attachBody?.recordId || "");
          fieldName = String(attachBody?.field || "");
          filename = String(attachBody?.filename || "").trim();
          allowMultiple = !!attachBody?.multiple;
        }

        if (!recordId || !FIELD_NAMES.has(fieldName)) {
          return Response.json({ error: "recordId and valid field required" }, { status: 400 });
        }
        if (!isAttachMode && !filename) return Response.json({ error: "Filename required" }, { status: 400 });

        // Ownership check
        const getRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const existing: any = await getRes.json().catch(() => ({}));
        if (!getRes.ok) return Response.json({ error: `Airtable [${getRes.status}]` }, { status: 502 });
        // Ownership is the linked Users record id. Checked before any upload runs.
        if (auth.record.userType.toLowerCase() !== "admin") {
          const ownerId = await resolveOwnerId(auth.record, token);
          if (!ownsRecord(existing?.fields?.["User"], ownerId)) {
            return Response.json({ error: "Not allowed" }, { status: 403 });
          }
        }

        let drive: { url: string; filename: string };

        if (isAttachMode) {
          // File was uploaded straight from the browser to Drive; just publish it.
          const fileId = String(attachBody?.fileId || "");
          if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
            return Response.json({ error: "Valid fileId required" }, { status: 400 });
          }
          try {
            const f = await finalizeDriveFile(fileId);
            drive = { url: f.url, filename: filename || f.filename };
          } catch (e: any) {
            return Response.json({ error: e?.message || "Drive finalize failed" }, { status: 502 });
          }
        } else {
          // Read binary (legacy / small-file path)
          let bytes: Uint8Array;
          try {
            bytes = new Uint8Array(await request.arrayBuffer());
          } catch (e: any) {
            return Response.json({ error: `Failed to read upload: ${e?.message || e}` }, { status: 400 });
          }
          if (bytes.byteLength === 0) return Response.json({ error: "Empty file" }, { status: 400 });

          try {
            drive = await uploadToDrive({ bytes, filename, contentType, folderId: DRIVE_FOLDER_ID });
          } catch (e: any) {
            return Response.json({ error: e?.message || "Drive upload failed" }, { status: 502 });
          }
        }

        // Attachment fields hold a single file unless explicitly multiple (carousels).
        const currentAttachments: any[] = Array.isArray(existing?.fields?.[fieldName])
          ? existing.fields[fieldName]
          : [];
        const nextAttachments = allowMultiple
          ? [
              // Keep existing files by id: re-sending their expiring URLs makes Airtable re-download them and some fail.
              ...currentAttachments.map((a: any) => (a.id ? { id: a.id } : { url: a.url, filename: a.filename })),
              { url: drive.url, filename: drive.filename },
            ]
          : [{ url: drive.url, filename: drive.filename }];

        const patchRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { [fieldName]: nextAttachments }, typecast: true }),
        });
        const patched: any = await patchRes.json().catch(() => ({}));
        if (!patchRes.ok) {
          return Response.json(
            {
              error: `Airtable update failed [${patchRes.status}]: ${JSON.stringify(patched).slice(0, 400)}`,
              driveUrl: drive.url,
            },
            { status: 502 }
          );
        }

        return Response.json({ ok: true, fields: patched?.fields || {}, driveUrl: drive.url });
      },
    },
  },
});

