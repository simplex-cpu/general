import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief } from "@/lib/brands.server";
import {
  sessionsCtx,
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from "@/lib/writerSessions.server";

const Patch = z.object({
  title: z.string().max(200).optional(),
  type: z.enum(["Single", "Batch"]).optional(),
  format: z.enum(["broll", "talkingVideo", "carousel", "graphic"]).optional(),
  status: z.enum(["In progress", "Done"]).optional(),
  topics: z.array(z.any()).optional(),
  scripts: z.array(z.any()).optional(),
  transcript: z.array(z.any()).optional(),
  briefSnapshot: z.string().optional(),
  addContentId: z.string().regex(/^rec[A-Za-z0-9]{14}$/).optional(),
  repurposedFrom: z.string().regex(/^rec[A-Za-z0-9]{14}$/).optional(),
  briefId: z.string().regex(/^rec[A-Za-z0-9]{14}$/).optional(),
});

async function ctxFrom(request: Request) {
  const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
  if (!auth.ok) return { error: auth.response } as const;
  return { ctx: await sessionsCtx(auth.record), record: auth.record } as const;
}

const fail = (e: any) => Response.json({ error: String(e?.message || e).slice(0, 300) }, { status: 502 });

/** Writer sessions: list (GET), read one (GET ?id=), create (POST), update (PATCH ?id=). */
export const Route = createFileRoute("/api/writer-sessions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const id = new URL(request.url).searchParams.get("id");
          if (id) {
            const s = await getSession(c.ctx, id);
            return s ? Response.json({ session: s }) : Response.json({ error: "Not found" }, { status: 404 });
          }
          return Response.json({ sessions: await listSessions(c.ctx) });
        } catch (e) {
          return fail(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const p = Patch.safeParse(await request.json().catch(() => ({})));
          if (!p.success) return Response.json({ error: "Invalid session data" }, { status: 400 });
          const { briefId, ...patch } = p.data;
          let brandId: string | undefined;
          if (briefId) {
            // Link the session to the chosen brand only after verifying ownership.
            const brief = await selectedBrief(c.record, process.env.AIRTABLE_TOKEN!, briefId);
            if (!brief) return Response.json({ error: "Brand not found" }, { status: 404 });
            brandId = Array.isArray(brief.fields?.Brand) ? brief.fields.Brand[0] : undefined;
          }
          return Response.json({ session: await createSession(c.ctx, patch, brandId) });
        } catch (e) {
          return fail(e);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const id = new URL(request.url).searchParams.get("id") || "";
          const p = Patch.safeParse(await request.json().catch(() => ({})));
          if (!p.success) return Response.json({ error: "Invalid session data" }, { status: 400 });
          const { briefId: _ignored, ...patch } = p.data;
          const s = await updateSession(c.ctx, id, patch);
          return s ? Response.json({ session: s }) : Response.json({ error: "Not found" }, { status: 404 });
        } catch (e) {
          return fail(e);
        }
      },
      DELETE: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const id = new URL(request.url).searchParams.get("id") || "";
          return (await deleteSession(c.ctx, id))
            ? Response.json({ ok: true })
            : Response.json({ error: "Not found" }, { status: 404 });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});
