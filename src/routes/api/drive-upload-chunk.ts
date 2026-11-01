import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";

// Server-side relay for one chunk of a Google Drive resumable upload.
// Used when the browser can't PUT to Google directly (CORS / network blocks).
export const Route = createFileRoute("/api/drive-upload-chunk")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;

        const sessionUrl = request.headers.get("x-session-url") || "";
        const range = request.headers.get("x-content-range") || "";
        const contentType = request.headers.get("x-file-content-type") || "application/octet-stream";
        if (!/^https:\/\/[a-z0-9.-]*googleapis\.com\//i.test(sessionUrl)) {
          return Response.json({ error: "Invalid session URL" }, { status: 400 });
        }
        if (!/^bytes \d+-\d+\/\d+$/.test(range)) {
          return Response.json({ error: "Invalid range" }, { status: 400 });
        }

        const bytes = new Uint8Array(await request.arrayBuffer());
        let res: Response | null = null;
        let lastError = "Network connection failed";
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            res = await fetch(sessionUrl, {
              method: "PUT",
              headers: { "Content-Type": contentType, "Content-Range": range },
              body: bytes,
            });
            if ((res.status < 500 && res.status !== 429) || attempt === 3) break;
            await res.arrayBuffer().catch(() => undefined);
          } catch (error) {
            lastError = error instanceof Error ? error.message : "Network connection failed";
            if (attempt === 3) break;
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 750));
        }

        if (!res) return Response.json({ error: `Drive relay failed after three attempts: ${lastError}` }, { status: 502 });

        if (res.status === 308) return Response.json({ done: false });
        const text = await res.text();
        if (!res.ok) {
          return Response.json({ error: `Drive chunk failed [${res.status}]: ${text.slice(0, 300)}` }, { status: 502 });
        }
        let id = "";
        try {
          id = JSON.parse(text || "{}")?.id || "";
        } catch {
          /* ignore */
        }
        if (!id) return Response.json({ error: "Drive did not return a file id" }, { status: 502 });
        return Response.json({ done: true, fileId: id });
      },
    },
  },
});
