import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { contentTableUrl } from "@/lib/airtableContent.server";

// Sends one Slack notification per batch when scripts are added to production
// in the "To Edit | Design" status. Channel is the private DFY editing channel.
const SLACK_API = "https://slack.com/api";
const CHANNEL_ID = "C096V9G8DFD";

export const Route = createFileRoute("/api/notify-edit-design")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const auth = await requireAccessCode(body?.accessCode, { staffOnly: true });
        if (!auth.ok) return auth.response;

        const brandName = String(body?.brandName || "").trim() || "this client";
        const count = Number(body?.count || 0);
        if (!count) return Response.json({ ok: true, skipped: "no count" });

        const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
        if (!SLACK_BOT_TOKEN) {
          return Response.json({ ok: false, error: "Slack not configured" }, { status: 200 });
        }

        const contentUrl = contentTableUrl();
        const text =
          `<!channel>\n\n` +
          `We have received a new DFY editing request from *${brandName}* — ${count} editing task${count === 1 ? "" : "s"} ${count === 1 ? "has" : "have"} been added to Airtable.\n\n` +
          `<@U07TZA0RT44> Please make sure this is assigned to the right editor ASAP ${contentUrl}`;

        try {
          const r = await fetch(`${SLACK_API}/chat.postMessage`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
              channel: CHANNEL_ID,
              text,
              link_names: true,
            }),
          });
          const data: any = await r.json().catch(() => ({}));
          if (!r.ok || !data?.ok) {
            return Response.json(
              { ok: false, error: `Slack error: ${data?.error || r.status}` },
              { status: 200 }
            );
          }
          return Response.json({ ok: true, ts: data?.ts });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message || "Slack send failed" }, { status: 200 });
        }
      },
    },
  },
});
