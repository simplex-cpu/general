import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { callbackBody, callbackProblems, saveCallbackPieces } from "@/lib/podcastJobs.server";
import { clipperCtxByOwnerId } from "@/lib/longForm.server";

// n8n posts finished B-roll / Talking Clip scripts here. Public prefix, so the shared
// X-Scripting-Callback-Key is the only credential: verify it before touching anything.
function tokenOk(provided: string, expected: string) {
  const a = createHmac("sha256", "podcast-callback").update(provided).digest();
  const b = createHmac("sha256", "podcast-callback").update(expected).digest();
  return timingSafeEqual(a, b);
}

const TERMINAL = ["completed", "partial", "needs_review", "failed", "cancelled"];

export const Route = createFileRoute("/api/public/podcast-scripts-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.N8N_SCRIPTING_KEY;
        if (!expected) return new Response("Not configured", { status: 503 });
        const provided = request.headers.get("x-scripting-callback-key") || "";
        if (!provided || !tokenOk(provided, expected)) return new Response("Invalid token", { status: 401 });
        const parsed = callbackBody.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return Response.json({ error: "Check the callback payload." }, { status: 400 });
        const body = parsed.data;
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();

        if (body.event === "execution.failed") {
          // No job_id in this event: match the saved execution id of the active attempt.
          const { data: job } = await db.from("podcast_script_jobs").select("id, status").eq("execution_id", body.execution_id).maybeSingle();
          if (!job) {
            console.error("podcast-scripts-callback: unmatched execution.failed", body.execution_id, body.failed_node);
            await db.from("podcast_unmatched_events").insert({ execution_id: body.execution_id, event: body.event, payload: body as any });
            return Response.json({ ok: true, unmatched: true });
          }
          if (TERMINAL.includes(job.status)) return Response.json({ ok: true, already: true });
          await db.from("podcast_script_jobs").update({ status: "failed", error: body.error.message.slice(0, 500), updated_at: now }).eq("id", job.id).neq("status", "completed");
          return Response.json({ ok: true });
        }

        const { data: job } = await db.from("podcast_script_jobs").select("*").eq("id", body.job_id).maybeSingle();
        if (!job) return Response.json({ error: "Unknown job." }, { status: 404 });
        if (String(job.long_form_id) !== body.source_id) return Response.json({ error: "Source mismatch." }, { status: 409 });
        // A different execution must never replace the attempt that delivered first.
        if (job.execution_id && job.execution_id !== body.execution_id) return Response.json({ ok: true, stale: true });
        if (TERMINAL.includes(job.status) && job.status !== "failed") return Response.json({ ok: true, already: true });
        const problems = callbackProblems(body, (job.counts || {}) as any);
        if (problems.length) {
          console.error("podcast-scripts-callback: inconsistent result", job.id, problems);
          return Response.json({ error: problems.join(" ") }, { status: 409 });
        }
        // Callback arrived before the 202 was saved: bind this execution id once.
        if (!job.execution_id) await db.from("podcast_script_jobs").update({ execution_id: body.execution_id }).eq("id", job.id).is("execution_id", null);
        try {
          const ctx = await clipperCtxByOwnerId(String(job.owner_id));
          const saved = await saveCallbackPieces(ctx, String(job.long_form_id), job.id, body);
          await db
            .from("podcast_script_jobs")
            .update({
              status: body.status,
              result: {
                saved,
                broll: body.results.broll.delivered_count,
                talkingClip: body.results.talking_clip.delivered_count,
                formatStatus: { broll: body.results.broll.status, talkingClip: body.results.talking_clip.status },
                shortfall: { broll: body.results.broll.shortfall_reason, talkingClip: body.results.talking_clip.shortfall_reason },
                qa: { broll: body.results.broll.automated_qa ?? null, talkingClip: body.results.talking_clip.automated_qa ?? null },
              } as any,
              updated_at: now,
            })
            .eq("id", job.id);
          return Response.json({ ok: true, saved });
        } catch (e: any) {
          console.error("podcast-scripts-callback", e);
          await db.from("podcast_script_jobs").update({ status: "failed", error: String(e?.message || e).slice(0, 500), updated_at: now }).eq("id", job.id);
          return Response.json({ error: "The scripts could not be saved." }, { status: 502 });
        }
      },
    },
  },
});
