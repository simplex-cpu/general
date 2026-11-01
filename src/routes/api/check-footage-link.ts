import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { inspectDriveLink } from "@/lib/googleDrive.server";

export const Route = createFileRoute("/api/check-footage-link")({
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
        const link = typeof body?.link === "string" ? body.link.trim().slice(0, 2000) : "";
        if (!/^https?:\/\//i.test(link)) {
          return Response.json({ status: "invalid", fileCount: 0 });
        }

        try {
          const result = await inspectDriveLink(link);
          return Response.json(result);
        } catch {
          return Response.json({ status: "unknown", fileCount: 0 });
        }
      },
    },
  },
});
