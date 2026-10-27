import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { extractOneScript } from "@/lib/divideScripts.shared";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

// Pass 2: extract ONE structured script from a single text section.
// Called once per script by the client with bounded concurrency.
export const Route = createFileRoute("/api/divide-scripts/section")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const anthropicKey = process.env.ANTHROPIC_API_KEY;
          if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

          const headerCode = request.headers.get("x-access-code") || undefined;
          if (headerCode) {
            const pre = await requireAccessCode(headerCode, { staffOnly: true });
            if (!pre.ok) return pre.response;
          }

          const { section, format, accessCode, trustSectionFormat } = (await request.json()) as {
            section?: string;
            format?: string;
            accessCode?: string;
            trustSectionFormat?: boolean;
          };

          if (!headerCode) {
            const auth = await requireAccessCode(accessCode, { staffOnly: true });
            if (!auth.ok) return auth.response;
          }

          if (!section || !section.trim()) return json({ error: "Missing section text" }, 400);
          if (!format) return json({ error: "Missing format" }, 400);

          const result = await extractOneScript({
            section,
            format,
            anthropicKey,
            trustSectionFormat: trustSectionFormat !== false,
          });
          if (!result.ok) {
            return json({ error: result.error, stopReason: result.stopReason }, 502);
          }
          return json({ script: result.script });
        } catch (e: any) {
          console.error("/api/divide-scripts/section", e);
          return json({ error: e?.message || String(e) }, 500);
        }
      },
    },
  },
} as any);
