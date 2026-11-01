import { normalizeTimestamps } from "@/lib/slate/longFormClipper";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { saveShortForms, clipperCtx, deleteShortForm, getShortForm, getLongForm, linkToBoard, patchShortForm } from "@/lib/longForm.server";
import { applyPodcastCleanup } from '@/lib/slate/podcastCleanup';
import { parsePostCopy } from '@/lib/slate/longFormClipper';
import { canAddToBoard, SHORT_FORMATS, MAX_CAROUSEL_SLIDES } from "@/lib/slate/longFormClipper";
import { validatePodcastEdit } from "@/lib/slate/podcastClipping";

const rec = z.string().regex(/^rec[A-Za-z0-9]{14}$/);
const fail = (e: any) => {
  console.error("/api/short-forms", e);
  return Response.json({ error: String(e?.message || e).slice(0, 300) }, { status: 502 });
};
async function owned(request: Request, id: string) {
  const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
  if (!auth.ok) return { error: auth.response } as const;
  if (!rec.safeParse(id).success) return { error: Response.json({ error: "Invalid id" }, { status: 400 }) } as const;
  const ctx = await clipperCtx(auth.record);
  const short = await getShortForm(ctx, id);
  if (!short) return { error: Response.json({ error: "Short form not found" }, { status: 404 }) } as const;
  return { ctx, short } as const;
}

export const Route = createFileRoute("/api/short-forms")({
  server: {
    handlers: {
      // Manual short form written from the format template.
      PUT: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const t = z.string().trim().max(5000).optional();
          const p = z.object({ longFormId: rec, format: z.enum(SHORT_FORMATS), name: z.string().trim().min(1).max(200), timestamps: z.string().trim().max(2000).default(""), creativeDirection: z.string().trim().max(10000).optional(),
            textOverlay: t, visualHook: t, script: z.string().max(20000).optional(), cta: t, coverTitle: t, coverSubtitle: t, coverBody: t, slideDetails: z.array(z.object({ subtitle: t, body: t })).max(MAX_CAROUSEL_SLIDES).optional(), slides: z.array(z.string().max(1000)).max(MAX_CAROUSEL_SLIDES).optional() }).safeParse(await request.json().catch(() => null));
          if (!p.success) return Response.json({ error: p.error.issues[0]?.message || "Invalid short form" }, { status: 400 });
          const ctx = await clipperCtx(auth.record);
          if (!(await getLongForm(ctx, p.data.longFormId))) return Response.json({ error: "Long form not found" }, { status: 404 });
          const { longFormId, format, ...piece } = p.data;
          const [shortForm] = await saveShortForms(ctx, longFormId, format, [{ ...piece, ...(() => { const keep = (piece.slides || []).map((x, i) => [x, piece.slideDetails?.[i]] as const).filter(([x]) => x.trim()); return { slides: keep.map(([x]) => x), slideDetails: keep.map(([, d]) => d || {}) }; })() }]);
          return Response.json({ shortForm });
        } catch (e) {
          return fail(e);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const body: any = await request.json().catch(() => ({}));
          const o = await owned(request, String(body?.id || ""));
          if ("error" in o) return o.error;
          const fields: Record<string, unknown> = {};
          if (body.cleanup !== undefined && body.copy !== undefined) return Response.json({ error: 'Save copy and cleanup separately.' }, { status: 400 });
          if (body.cleanup === true || body.cleanup === false) {
            if (o.short.format !== 'Talking Video') return Response.json({ error: 'Cleanup is for recorded speech only.' }, { status: 400 });
            const long = await getLongForm(o.ctx, o.short.longFormIds[0] || '');
            if (!long) return Response.json({ error: 'Original source not found.' }, { status: 404 });
            try {
              const f = parsePostCopy(o.short.copy);
              const meta = JSON.parse(f['source notes'] || '{}');
              if (body.cleanup) fields['Post copy'] = applyPodcastCleanup(o.short.copy, long.transcriptDetails.words || []);
              else {
                delete meta.cleanup;
                fields['Post copy'] = `Visual hook:\n${f['visual hook'] || ''}\n\nScript:\n${meta.segments.map((s: any) => s.text).join('\n\n')}\n\nSource notes:\n${JSON.stringify(meta)}`;
              }
            } catch (e: any) { return Response.json({ error: e.message }, { status: 400 }); }
          }
          if (typeof body.copy === "string") {
            if (body.copy.length > 100_000) return Response.json({ error: "This post copy is too large; nothing was truncated." }, { status: 400 });
            if (!o.short.copy.includes("\nSource notes:") && /(?:^|\n)Source notes:/i.test(body.copy))
              return Response.json({ error: "Source provenance can only be added by the clipper." }, { status: 400 });
            try { fields["Post copy"] = validatePodcastEdit(o.short.format, o.short.copy, body.copy); }
            catch (e) { return Response.json({ error: e instanceof Error ? e.message : "The source copy could not be verified" }, { status: 400 }); }
          }
          if (typeof body.name === "string") fields["Post name"] = body.name.trim().slice(0, 200);
          // Timestamps and Creative Direction live in their own fields (never in the script) and mirror onto the planner record.
          const meta: Record<string, string> = {};
          if (typeof body.timestamps === "string") meta.Timestamps = normalizeTimestamps(body.timestamps).slice(0, 2000);
          if (typeof body.creativeDirection === "string") meta["Creative Direction"] = body.creativeDirection.trim().slice(0, 10000);
          Object.assign(fields, meta);
          const shortForm = await patchShortForm(o.ctx, o.short.id, fields);
          if (Object.keys(meta).length && process.env.AIRTABLE_TOKEN)
            await Promise.all(o.short.contentIds.map((cid) => fetch(`https://api.airtable.com/v0/appf1QABtQbAENYDz/tblucGgVsDiDGdyyK/${cid}`, {
              method: "PATCH", headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: meta }),
            }).catch(() => undefined)));
          return Response.json({ shortForm });
        } catch (e) {
          return fail(e);
        }
      },
      DELETE: async ({ request }) => {
        try {
          const o = await owned(request, new URL(request.url).searchParams.get("id") || "");
          if ("error" in o) return o.error;
          await deleteShortForm(o.ctx, o.short.id);
          return Response.json({ ok: true });
        } catch (e) {
          return fail(e);
        }
      },
      // Links the board record created by /api/send-to-production to this short form (once).
      POST: async ({ request }) => {
        try {
          const body: any = await request.json().catch(() => ({}));
          const o = await owned(request, String(body?.id || ""));
          if ("error" in o) return o.error;
          if (!rec.safeParse(body?.contentId).success) return Response.json({ error: "Invalid board record" }, { status: 400 });
          const store = await import('@/lib/clipperOperations.server');
          const boardState = await (await store.operationStore(o.ctx, o.short.longFormIds[0] || o.short.id, `board:${o.short.id}`)).read();
          if ((boardState?.payload as any)?.result?.recordId !== body.contentId && !o.short.contentIds.includes(body.contentId)) return Response.json({ error: 'This board record was not created by this source handoff.' }, { status: 403 });
          if (o.short.contentIds.includes(body.contentId)) return Response.json({ ok: true });
          if (!canAddToBoard(o.short)) return Response.json({ error: "This piece is already on the board." }, { status: 409 });
          await linkToBoard(o.ctx, o.short, body.contentId);
          return Response.json({ ok: true });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});
