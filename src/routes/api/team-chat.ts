import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { airtableHeaders, resolveUserRecordId } from "@/lib/learning.server";
import {
  CHAT_BASE,
  F_MESSAGE,
  F_REACTIONS,
  F_REPLY,
  F_SENDER,
  F_USER,
  T_CHAT,
  mapChatRecord,
  type ChatMessage,
} from "@/lib/teamChat.server";

const API = `https://api.airtable.com/v0/${CHAT_BASE}/${T_CHAT}`;

async function listAll(h: Record<string, string>): Promise<ChatMessage[]> {
  const out: ChatMessage[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const r = await fetch(`${API}?${params.toString()}`, { headers: h });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Airtable list failed [${r.status}]`);
    for (const rec of data.records || []) out.push(mapChatRecord(rec));
    offset = data.offset;
  } while (offset);
  return out;
}

async function listForUser(userId: string, h: Record<string, string>): Promise<ChatMessage[]> {
  const all = await listAll(h);
  return all
    .filter((m) => m.text && m.userIds.includes(userId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function getRecord(id: string, h: Record<string, string>): Promise<ChatMessage | null> {
  const r = await fetch(`${API}/${id}`, { headers: h });
  if (!r.ok) return null;
  return mapChatRecord(await r.json());
}

export const Route = createFileRoute("/api/team-chat")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const h = airtableHeaders();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        try {
          const userId = await resolveUserRecordId(auth.record, h);
          if (!userId) return Response.json({ items: [] });
          return Response.json({ items: await listForUser(userId, h) });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Could not load messages" }, { status: 502 });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const h = airtableHeaders();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;

        const body: any = await request.json().catch(() => ({}));
        const text = String(body?.text || "").trim().slice(0, 4000);
        const replyTo = typeof body?.replyTo === "string" && body.replyTo.startsWith("rec") ? body.replyTo : null;
        if (!text) return Response.json({ error: "Message is empty" }, { status: 400 });

        try {
          const userId = await resolveUserRecordId(auth.record, h);
          if (!userId) return Response.json({ error: "No account linked to this code" }, { status: 400 });
          const fields: Record<string, unknown> = {
            [F_MESSAGE]: text,
            [F_SENDER]: "Client",
            [F_USER]: [userId],
          };
          if (replyTo) fields[F_REPLY] = [replyTo];
          const r = await fetch(API, {
            method: "POST",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ records: [{ fields }] }),
          });
          const data: any = await r.json().catch(() => ({}));
          if (!r.ok) {
            return Response.json(
              { error: `Could not send [${r.status}]: ${JSON.stringify(data).slice(0, 200)}` },
              { status: 502 },
            );
          }
          return Response.json({ item: mapChatRecord(data.records?.[0]) });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Could not send message" }, { status: 502 });
        }
      },
      PATCH: async ({ request }: { request: Request }) => {
        const h = airtableHeaders();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;

        const body: any = await request.json().catch(() => ({}));
        const id = String(body?.id || "");
        const emoji = String(body?.emoji || "").slice(0, 8);
        if (!id.startsWith("rec") || !emoji) return Response.json({ error: "Bad request" }, { status: 400 });

        try {
          const userId = await resolveUserRecordId(auth.record, h);
          const current = await getRecord(id, h);
          if (!current || !userId || !current.userIds.includes(userId)) {
            return Response.json({ error: "Message not found" }, { status: 404 });
          }
          const reactions = { ...current.reactions };
          const list = reactions[emoji] || [];
          reactions[emoji] = list.includes("me") ? list.filter((v) => v !== "me") : [...list, "me"];
          if (!reactions[emoji].length) delete reactions[emoji];

          const r = await fetch(`${API}/${id}`, {
            method: "PATCH",
            headers: { ...h, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: { [F_REACTIONS]: JSON.stringify(reactions) } }),
          });
          const data: any = await r.json().catch(() => ({}));
          if (!r.ok) return Response.json({ error: `Could not react [${r.status}]` }, { status: 502 });
          return Response.json({ item: mapChatRecord(data) });
        } catch (e: any) {
          return Response.json({ error: e?.message || "Could not react" }, { status: 502 });
        }
      },
    },
  },
});
