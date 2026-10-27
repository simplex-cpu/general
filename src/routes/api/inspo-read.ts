import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { postUrl } from "@/lib/slate/inspoValidation";
import { readInspo } from "@/lib/inspoRead.server";

export const Route = createFileRoute("/api/inspo-read")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const body: any = await request.json().catch(() => ({}));
        const url = postUrl.safeParse(body?.url);
        if (!url.success)
          return Response.json({ error: "Enter a valid post URL" }, { status: 400 });
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(c) {
            const emit = (e: unknown) => c.enqueue(enc.encode(JSON.stringify(e) + "\n"));
            try {
              await readInspo(url.data, emit);
            } catch (e: any) {
              emit({ step: "basics", status: "error", message: e?.message || "Reading failed" });
            }
            c.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
