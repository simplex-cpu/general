import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { inspoCtx, listInspo, createInspo, deleteInspo, updateInspo, getOwnedInspo } from "@/lib/inspoBank.server";
import { isMinedInspo } from "@/lib/slate/inspoBank";
import { inspoFields, inspoPatch, postUrl } from "@/lib/slate/inspoValidation";
import { lookupInspoMetadata } from "@/lib/inspoMetadata.server";

async function ctxFrom(request: Request) {
  const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
  if (!auth.ok) return { error: auth.response } as const;
  return { ctx: await inspoCtx(auth.record) } as const;
}
const fail = (e: any) => {
  console.error("/api/inspo-bank", e);
  return Response.json({ error: String(e?.message || e).slice(0, 300) }, { status: 502 });
};

export const Route = createFileRoute("/api/inspo-bank")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const lookup = new URL(request.url).searchParams.get("lookup");
          if (lookup) {
            const value = postUrl.safeParse(lookup);
            if (!value.success)
              return Response.json({ error: "Enter a valid post URL" }, { status: 400 });
            return Response.json({ metadata: await lookupInspoMetadata(value.data) });
          }
          return Response.json({ posts: await listInspo(c.ctx) });
        } catch (e) {
          return fail(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const parsed = inspoFields.safeParse(await request.json().catch(() => ({})));
          if (!parsed.success)
            return Response.json({ error: "Please check the post details" }, { status: 400 });
          return Response.json({ post: await createInspo(c.ctx, parsed.data) });
        } catch (e) {
          return fail(e);
        }
      },
      DELETE: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const id = new URL(request.url).searchParams.get("id") || "";
          if (!(await deleteInspo(c.ctx, id)))
            return Response.json({ error: "Post not found" }, { status: 404 });
          return Response.json({ ok: true });
        } catch (e) {
          return fail(e);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const c = await ctxFrom(request);
          if ("error" in c) return c.error;
          const id = new URL(request.url).searchParams.get("id") || "";
          const parsed = inspoPatch.safeParse(await request.json().catch(() => ({})));
          if (
            !parsed.success ||
            !z
              .string()
              .regex(/^rec[A-Za-z0-9]{14}$/)
              .safeParse(id).success
          )
            return Response.json({ error: "Please check the post details" }, { status: 400 });
          const existing = await getOwnedInspo(c.ctx, id);
          if (!existing) return Response.json({ error: "Post not found" }, { status: 404 });
          const onlyThumb = Object.keys(parsed.data).every((k) => k === "thumbnail");
          if (isMinedInspo(existing) && !onlyThumb) return Response.json({ error: "Found posts can't be edited." }, { status: 403 });
          const post = await updateInspo(c.ctx, id, parsed.data);
          return post
            ? Response.json({ post })
            : Response.json({ error: "Post not found" }, { status: 404 });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});
