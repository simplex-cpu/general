import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { createResumableSession } from "@/lib/googleDrive.server";

const DRIVE_FOLDER_ID = "1DEi1mjTz4y01Idhdx0UyeVfIOVjA7k3o";

export const Route = createFileRoute("/api/drive-upload-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const filename = String(body?.filename || "").trim();
        const contentType = String(body?.contentType || "application/octet-stream");
        if (!filename) return Response.json({ error: "Filename required" }, { status: 400 });

        try {
          const origin = request.headers.get("origin") || undefined;
          const sessionUrl = await createResumableSession({ filename, contentType, folderId: DRIVE_FOLDER_ID, origin });
          return Response.json({ sessionUrl });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Failed to start upload" }, { status: 502 });
        }
      },
    },
  },
});
