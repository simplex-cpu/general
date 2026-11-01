import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DISMISSABLE, isStale } from "@/lib/slate/studioJobs";
import { requireAccessCode } from "@/lib/accessCode.server";
import { clipperCtx, getLongForm } from "@/lib/longForm.server";
import { selectedBrief } from "@/lib/brands.server";
import { transcriptionComplete } from "@/lib/slate/clipperPresentation";
import { buildJobRequest, n8nScriptCounts, requestProblems, submitToN8n, N8nSubmitError } from "@/lib/podcastJobs.server";

const submitBody = z.object({
  longFormId: z.string().regex(/^rec[A-Za-z0-9]{14}$/),
  counts: n8nScriptCounts,
  cta: z.string().trim().max(300).optional(),
});

const fail = (e: any) => {
  console.error("/api/podcast-script-jobs", e);
  return Response.json({ error: String(e?.message || e).slice(0, 300) }, { status: 502 });
};

// Jobs still open after this long are flagged for reconciliation instead of assumed lost.

const ACTIVE = ["submitting", "processing", "submission_uncertain"];

export const Route = createFileRoute("/api/podcast-script-jobs")({
  server: {
    handlers: {
      // Status of the newest jobs for one long form (or one job by id).
      GET: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const ctx = await clipperCtx(auth.record);
          const url = new URL(request.url);
          const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
          let q = db.from("podcast_script_jobs").select("id, long_form_id, counts, status, error, result, request, created_at, updated_at").eq("owner_id", ctx.owner.id).order("created_at", { ascending: false }).limit(10);
          const jobId = url.searchParams.get("jobId");
          const longFormId = url.searchParams.get("longFormId");
          if (jobId) q = q.eq("id", jobId);
          else if (longFormId) q = q.eq("long_form_id", longFormId);
          else return Response.json({ error: "Pass a long form or job id." }, { status: 400 });
          const { data, error } = await q;
          if (error) throw new Error("The job status could not be read.");
          const jobs = data || [];
          // Watchdog: a stale active job is needs_attention, never silently failed.
          const stale = jobs.filter((j) => isStale(j.status, j.updated_at));
          for (const j of stale) {
            await db.from("podcast_script_jobs").update({ status: "needs_attention", error: "The AI studio didn't respond for 10 minutes. It may have failed. It may still finish; check again before resubmitting.", updated_at: new Date().toISOString() }).eq("id", j.id).in("status", ACTIVE);
            j.status = "needs_attention";
          }
          return Response.json({ jobs });
        } catch (e) {
          return fail(e);
        }
      },
      // Dismiss a failed / stalled / unconfirmed job so the user can try again.
      PATCH: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const body = z.object({ jobId: z.string().uuid(), action: z.literal("dismiss") }).safeParse(await request.json().catch(() => ({})));
          if (!body.success) return Response.json({ error: "Check the request" }, { status: 400 });
          const ctx = await clipperCtx(auth.record);
          const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
          const { data } = await db.from("podcast_script_jobs").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", body.data.jobId).eq("owner_id", ctx.owner.id).in("status", DISMISSABLE).select("id");
          if (!data?.length) return Response.json({ error: "Only a failed or stalled job can be dismissed." }, { status: 409 });
          return Response.json({ ok: true });
        } catch (e) {
          return fail(e);
        }
      },
      // Creates a persistent job and submits it to the n8n webhook (expects HTTP 202 + execution_id).
      POST: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const parsed = submitBody.safeParse(await request.json().catch(() => ({})));
          if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Check the request" }, { status: 400 });
          const webhookUrl = process.env.N8N_PODCAST_WEBHOOK_URL;
          const scriptingKey = process.env.N8N_SCRIPTING_KEY;
          if (!webhookUrl || !scriptingKey)
            return Response.json({ error: "The scripting service is not connected yet. Add its webhook address and scripting key in the project secrets." }, { status: 503 });
          const ctx = await clipperCtx(auth.record);
          const long = await getLongForm(ctx, parsed.data.longFormId);
          if (!long) return Response.json({ error: "Long form not found" }, { status: 404 });
          if (!long.transcript.trim() || !transcriptionComplete(long))
            return Response.json({ error: "This long form needs a complete, verified transcript first." }, { status: 409 });
          const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
          // One active dispatch per long form: a duplicate click returns the running job.
          const { data: active } = await db
            .from("podcast_script_jobs")
            .select("id, status")
            .eq("owner_id", ctx.owner.id)
            .eq("long_form_id", long.id)
            .in("status", ACTIVE)
            .order("created_at", { ascending: false })
            .limit(1);
          if (active?.length) return Response.json({ job: { id: active[0].id, status: active[0].status }, already: true }, { status: 200 });
          // Build and validate before claiming a job, so a fixable problem never leaves a stuck job.
          const jobId = crypto.randomUUID();
          let payload: ReturnType<typeof buildJobRequest>;
          try {
            const brief = await selectedBrief(ctx.access, ctx.token).catch(() => null);
            const audience = String(brief?.fields?.["My Target Audience"] || "").trim() || undefined;
            payload = buildJobRequest(long, parsed.data.counts, { jobId, audience, cta: parsed.data.cta });
          } catch (e: any) {
            return Response.json({ error: String(e?.message || e) }, { status: 409 });
          }
          const problems = requestProblems(payload);
          if (problems.length) return Response.json({ error: problems.join(" ") }, { status: 409 });
          const { data: job, error } = await db
            .from("podcast_script_jobs")
            .insert({ id: jobId, owner_id: ctx.owner.id, long_form_id: long.id, counts: parsed.data.counts, status: "submitting" })
            .select("id")
            .single();
          if (error?.code === "23505") {
            // Another tab/click claimed the single active slot first.
            const { data: running } = await db.from("podcast_script_jobs").select("id, status").eq("owner_id", ctx.owner.id).eq("long_form_id", long.id).in("status", ACTIVE).limit(1);
            return Response.json({ job: running?.[0] || null, already: true }, { status: 200 });
          }
          if (error || !job) throw new Error("The job could not be saved. Nothing was sent.");
          try {
            const ack = await submitToN8n(webhookUrl, scriptingKey, payload);
            // Move to processing only if still submitting; a fast callback may already have finished it.
            await db
              .from("podcast_script_jobs")
              .update({ status: "processing", execution_id: ack.execution_id, request: { counts: payload.counts, cta: parsed.data.cta || null }, updated_at: new Date().toISOString() })
              .eq("id", job.id)
              .eq("status", "submitting");
            // If the callback already bound a different state, still ensure the execution id is stored once.
            await db.from("podcast_script_jobs").update({ execution_id: ack.execution_id }).eq("id", job.id).is("execution_id", null);
          } catch (e: any) {
            const uncertain = e instanceof N8nSubmitError && e.uncertain;
            await db
              .from("podcast_script_jobs")
              .update({ status: uncertain ? "submission_uncertain" : "failed", error: String(e?.message || e).slice(0, 500), updated_at: new Date().toISOString() })
              .eq("id", job.id)
              .eq("status", "submitting");
            throw e;
          }
          return Response.json({ job: { id: job.id, status: "processing" } }, { status: 202 });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});
