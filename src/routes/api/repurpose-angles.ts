import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAccessCode } from "@/lib/accessCode.server";
import { selectedBrief } from "@/lib/brands.server";
import { inspoCtx, getOwnedInspo } from "@/lib/inspoBank.server";
import { generateLovableText, LovableTextError } from "@/lib/lovableResponses.server";
import { brandRealityBlock } from "@/lib/slate/brandContext";
import { ANTI_SLOP_RULES } from "@/lib/slate/envelope";
import { parseViralAngles, viralAnglePrompt, VIRAL_ANGLES_JSON_SCHEMA } from "@/lib/slate/repurposeAngles";
import { prepareViralSource } from "@/lib/slate/viralRepurposePrompt";

const Id = z.string().regex(/^rec[A-Za-z0-9]{14}$/);
const Body = z.object({
  source: z.literal("viral"),
  id: Id.optional(),
  brandId: Id.optional(),
  format: z.string().max(60).default(""),
  sourceText: z.string().max(12000).default(""),
});


export const Route = createFileRoute("/api/repurpose-angles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const parsed = Body.safeParse(await request.json().catch(() => ({})));
          if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
          const d = parsed.data;
          const token = process.env.AIRTABLE_TOKEN || "";
          if (!d.id) return Response.json({ error: "Invalid request" }, { status: 400 });
          const ctx = await inspoCtx(auth.record);
          const post = await getOwnedInspo(ctx, d.id);
          if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
          const source = prepareViralSource(post);
          if (!source.copy.trim()) return Response.json({ error: "This post needs its original copy before suitable angles can be suggested." }, { status: 400 });
          const brief = await selectedBrief(auth.record, token, d.brandId);
          if (!brief) return Response.json({ error: "Add your brand brief first" }, { status: 404 });
          const b = brief.fields || {};
          const reality = brandRealityBlock(b);
          const prompt = `${ANTI_SLOP_RULES}\n\n${viralAnglePrompt({ ...source, title: post.title }, reality)}`;
          const raw = await generateLovableText(prompt, "low", VIRAL_ANGLES_JSON_SCHEMA);
          let angles;
          try { angles = parseViralAngles(raw, source.framework); }
          catch { return Response.json({ error: "The suggested angles didn't fulfill this post's story and payoff. No unsuitable suggestions were shown. Try regenerating or write your own angle." }, { status: 422 }); }
          return Response.json({ angles });
        } catch (e) {
          if (e instanceof LovableTextError) return Response.json({ error: e.message }, { status: e.status });
          console.error("/api/repurpose-angles", e);
          return Response.json({ error: "Angles couldn't be suggested right now." }, { status: 502 });
        }
      },
    },
  },
});
