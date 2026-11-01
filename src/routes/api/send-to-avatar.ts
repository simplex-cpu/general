import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { ownsRecord, resolveOwnerIdentity } from "@/lib/owner.server";
import { AVATAR_STATUS, avatarBlocker } from "@/lib/slate/avatar";

// Hands a talking video to the AI avatar by setting its Client Status to
// "To Avatar". The n8n avatar workflow picks that up, HeyGen renders the video,
// and the finished video comes back to the post as "To Approve". Only the
// post's owner can send it.

const BASE = "appf1QABtQbAENYDz";
const CONTENT = "tblucGgVsDiDGdyyK"; // Client Content

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/send-to-avatar")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return json({ error: "AIRTABLE_TOKEN not configured" }, 500);
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const auth = await requireAccessCode(body?.accessCode || request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const id = String(body?.id || "");
        if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return json({ error: "id required" }, 400);

        const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        const [owner, r] = await Promise.all([
          resolveOwnerIdentity(auth.record, token),
          fetch(`https://api.airtable.com/v0/${BASE}/${CONTENT}/${id}`, { headers: h }),
        ]);
        const rec: any = await r.json().catch(() => ({}));
        if (!owner?.id || !r.ok || !ownsRecord(rec?.fields?.["User"], owner.id)) return json({ error: "Post not found" }, 404);
        const blocker = avatarBlocker(rec.fields || {});
        if (blocker) return json({ error: blocker }, 400);

        const res = await fetch(`https://api.airtable.com/v0/${BASE}/${CONTENT}/${id}`, {
          method: "PATCH",
          headers: h,
          body: JSON.stringify({ fields: { "Client Status": AVATAR_STATUS } }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          console.error("[send-to-avatar]", res.status, detail.slice(0, 300));
          if (/INVALID_MULTIPLE_CHOICE_OPTIONS|select option/i.test(detail))
            return json({ error: `Avatar videos aren't switched on yet: add the "${AVATAR_STATUS}" status to Client Status in Airtable.` }, 409);
          return json({ error: "Couldn't send this to the avatar. Try again in a minute." }, 502);
        }
        return json({ ok: true, status: AVATAR_STATUS });
      },
    },
  },
});
