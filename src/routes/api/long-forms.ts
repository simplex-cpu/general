import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { checkLongTranscription, startLongTranscription } from "@/lib/inspoRead.server";
import { advanceShortForms, clipperCtx, completedLongFormName, createLongForm, deleteLongForm, getLongForm, listLongForms, listShortForms, patchLongForm } from "@/lib/longForm.server";
import { advanceFootage, footageState, startFootageCopy } from "@/lib/longFormFootage.server";
import { CONTENT_BASE_ID, CONTENT_TABLE_ID } from "@/lib/airtableContent.server";
import { listFootageFolder, resolveTranscriptionUrl, FootageListError } from "@/lib/footageSource.server";
import { isFolderLink, pickTranscriptionFile } from "@/lib/slate/footageSource";
import { sourceSegments } from '@/lib/slate/podcastClipping';
import { assertTranscriptReadback } from '@/lib/slate/podcastTranscript';
import { newLongForm, shortFormCounts, pendingClipCounts, SHORT_FORMATS, type ShortFormCounts } from "@/lib/slate/longFormClipper";

/** Starts the long-video transcriber and stores the run reference + pending counts on the record. */
async function handOffLongTranscription(ctx: any, longId: string, url: string, counts?: ShortFormCounts, source?: { url: string; name?: string }) {
  let runRef: string;
  const existing = source ? null : await getLongForm(ctx, longId);
  if (!source && existing?.transcriptionSource) { try { source = JSON.parse(existing.transcriptionSource); } catch { /* use footage link */ } }
  if (isFolderLink(url) && !source?.url) { await patchLongForm(ctx, longId, { Status: "Failed" }); throw new Error("Add the link to the mixed audio file inside this folder."); }
  try { runRef = await startLongTranscription(resolveTranscriptionUrl(source?.url || url), true); }
  catch (e) { await patchLongForm(ctx, longId, { Status: "Failed" }); throw e; }
  await patchLongForm(ctx, longId, {
    Status: "Transcribing",
    "Apify Run ID": runRef,
    "Pending Counts": counts ? JSON.stringify(counts) : "",
    ...(source?.url ? { "Transcription source": JSON.stringify(source) } : {}),
  });
  const long = await getLongForm(ctx, longId);
  if (long) await startFootageCopy(ctx, long).catch((e) => console.error("footage start", e));
}

/** Client Status of each linked board record, read with the server token (short forms are already owned). */
async function contentStatuses(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const unique = [...new Set(ids)].filter((id) => /^rec[A-Za-z0-9]{14}$/.test(id));
  for (let i = 0; i < unique.length; i += 50) {
    const formula = `OR(${unique.slice(i, i + 50).map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const qs = new URLSearchParams({ filterByFormula: formula });
    qs.append("fields[]", "Client Status");
    const r = await fetch(`https://api.airtable.com/v0/${CONTENT_BASE_ID}/${CONTENT_TABLE_ID}?${qs}`, { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } });
    const d: any = await r.json().catch(() => ({}));
    for (const rec of d.records || []) out[rec.id] = String(rec.fields?.["Client Status"] || "");
  }
  return out;
}

const fail = (e: any) => {
  console.error("/api/long-forms", e);
  return Response.json({ error: String(e?.message || e).slice(0, 300) }, { status: 502 });
};

function stream(run: (emit: (e: unknown) => void) => Promise<void>) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(c) {
        const emit = (e: unknown) => c.enqueue(enc.encode(JSON.stringify(e) + "\n"));
        try {
          await run(emit);
        } catch (e: any) {
          emit({ step: "error", status: "error", message: e?.message || "Something went wrong" });
        }
        c.close();
      },
    }),
    { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform" } },
  );
}

export const Route = createFileRoute("/api/long-forms")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
          if (!auth.ok) return auth.response;
          const ctx = await clipperCtx(auth.record);
          const url = new URL(request.url);
          const inspect = url.searchParams.get("inspect");
          if (inspect) {
            // Lists a shared folder and suggests the file to transcribe; the folder stays the stored footage.
            if (!isFolderLink(inspect)) return Response.json({ folder: false });
            try {
              const files = await listFootageFolder(inspect);
              const pick = pickTranscriptionFile(files);
              return Response.json({ folder: true, files, pick: pick.file, warning: pick.warning });
            } catch (e) {
              if (e instanceof FootageListError) return Response.json({ folder: true, files: [], needsFile: true, warning: e.message });
              throw e;
            }
          }
          const id = url.searchParams.get("id");
          if (id && url.searchParams.get("refresh") === "1") {
            // Polls a long-video transcription; finishes it and any pending short forms when ready.
            const long = await getLongForm(ctx, id);
            if (!long) return Response.json({ error: "Long form not found" }, { status: 404 });
            if (long.status !== "Transcribing" || !long.apifyRun) return Response.json({ status: long.status });
            const result = await checkLongTranscription(long.apifyRun, true);
            if (result.state === "running") return Response.json({ status: "Transcribing", progress: result.message || "" });
            if (result.state === "failed") {
              // Retain the service reference and existing source for inspection/recovery.
              await patchLongForm(ctx, id, { Status: "Failed" });
              return Response.json({ status: "Failed", error: result.message });
            }
            // Save the complete source before the title call; a naming failure never loses the transcript.
            await patchLongForm(ctx, id, { Transcript: result.text, 'Transcript details': JSON.stringify({ ...result.details, source: 'automatic' }) });
            const saved = await getLongForm(ctx, id);
            try {
              assertTranscriptReadback(result.text, saved?.transcript || '', saved?.transcriptDetails?.coverage || {});
              if (JSON.stringify(saved?.transcriptDetails?.words) !== JSON.stringify(result.details?.words)) throw new Error('Full word timing could not be read back. Nothing was marked complete.');
            } catch (error) {
              await patchLongForm(ctx, id, { Status: 'Failed' });
              return Response.json({ status: 'Failed', error: error instanceof Error ? error.message : 'Recording coverage could not be verified.' });
            }
            await patchLongForm(ctx, id, { Status: 'Ready', 'Apify Run ID': '' });
            const name = await completedLongFormName(long.url, result.text, result.title);
            await patchLongForm(ctx, id, { Name: name });
            return Response.json({ status: "Ready" });
          }
          if (id) {
            let long = await getLongForm(ctx, id);
            if (!long) return Response.json({ error: "Long form not found" }, { status: 404 });
            const base = long;
            // Run the slow steps side by side instead of one after another.
            const naming = base.transcript && (!base.name.trim() || /^https?:\/\//i.test(base.name))
              ? completedLongFormName(base.url, base.transcript).then((name) => name !== base.url ? patchLongForm(ctx, id, { Name: name }).then((l) => l.name) : "").catch(() => "")
              : Promise.resolve("");
            // Footage must be saved for every long form, including uploaded-transcript ones and older records.
            const footage = (async () => {
              let l = base;
              if (!l.footageFile && !l.footageJob && l.url) l = await startFootageCopy(ctx, l).catch(() => l);
              return advanceFootage(ctx, l).catch(() => l);
            })();
            const shortsAndStatuses = listShortForms(ctx, id, base.shortFormIds).then(async (shortForms) => ({
              shortForms,
              statuses: await contentStatuses(shortForms.flatMap((s) => s.contentIds)).catch(() => ({} as Record<string, string>)),
            }));
            const [name, advanced, { shortForms, statuses }] = await Promise.all([naming, footage, shortsAndStatuses]);
            long = name ? { ...advanced, name } : advanced;
            return Response.json({ longForm: { ...long, footageJob: undefined }, footage: footageState(long), shortForms: shortForms.map((s) => ({ ...s, contentStatus: statuses[s.contentIds[0]] || "" })) });
          }
          let all = await listLongForms(ctx);
          // Keep in-flight footage copies moving even when nobody opens the detail view (one step each, at most two).
          const moving = all.filter((l) => !l.footageFile && l.footageJob && !/"error"/.test(l.footageJob)).slice(0, 2);
          if (moving.length) {
            const next = await Promise.all(moving.map((l) => advanceFootage(ctx, l).catch(() => l)));
            all = all.map((l) => next.find((n) => n.id === l.id) || l);
          }
          // Live service status for rows still transcribing, so the list can show a percentage.
          const progress = await Promise.all(all.map((l) => l.status === "Transcribing" && l.apifyRun ? checkLongTranscription(l.apifyRun, true).then((r) => r.state === "running" ? r.message || "" : "").catch(() => "") : Promise.resolve("")));
          return Response.json({ longForms: all.map((l, i) => ({ ...l, transcript: undefined, footageJob: undefined, progress: progress[i] })) });
        } catch (e) {
          return fail(e);
        }
      },
      // Creates a long form (optional transcription), then optionally generates short forms. Streams progress.
      POST: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const parsed = newLongForm.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Check the details" }, { status: 400 });
        const body = parsed.data;
        return stream(async (emit) => {
          const ctx = await clipperCtx(auth.record);
          const name = body.name || body.url;
          const transcript = (body.transcript || "").trim();
          let long = await createLongForm(ctx, { name, url: body.url, transcript, status: transcript ? "Ready" : "Transcribing" });
          const extra: Record<string, string> = {};
          if (body.counts) extra["Pending Counts"] = JSON.stringify(body.counts);
          if (body.speakers?.length) extra["Speaker bios"] = body.speakers.map((sp) => `${sp.name}${sp.bio ? `: ${sp.bio}` : ""}`).join("\n");
          if (body.cta) extra["Clip CTA"] = body.cta;
          if (Object.keys(extra).length) long = await patchLongForm(ctx, long.id, extra);
          emit({ step: "saved", status: "done", id: long.id });
          if (!transcript) {
            // Every clipper video needs timed source speech, even a small direct file.
            if (isFolderLink(body.url)) await patchLongForm(ctx, long.id, { "Footage file": body.url });
            await handOffLongTranscription(ctx, long.id, body.url, body.counts, body.audioUrl ? { url: body.audioUrl, name: body.audioName || body.audioUrl } : undefined);
            emit({ step: "transcript", status: "running", message: "LONG" });
            emit({ step: "complete", status: "done", id: long.id });
            return;
          }
          if (transcript) {
            await startFootageCopy(ctx, long).catch((e) => console.error("footage start", e));
            await patchLongForm(ctx, long.id, { 'Transcript details': JSON.stringify({ source: 'uploaded', coverage: { verified: false } }) });
            const stored = await getLongForm(ctx, long.id);
            if (stored?.transcript !== transcript) { await patchLongForm(ctx, long.id, { Status: 'Failed' }); throw new Error('The uploaded transcript could not be saved in full.'); }
            const title = await completedLongFormName(body.url, transcript);
            await patchLongForm(ctx, long.id, { Name: title });
          }
          emit({ step: "complete", status: "done", id: long.id });
        });
      },
      // Generate more short forms for an existing long form.
      PUT: async ({ request }) => {
        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;
        const body: any = await request.json().catch(() => ({}));
        const counts = shortFormCounts.safeParse(body?.counts);
        if (!body.resume && !counts.success) return Response.json({ error: "Ask for at least one short form." }, { status: 400 });
        return stream(async (emit) => {
          const ctx = await clipperCtx(auth.record);
          let long = await getLongForm(ctx, String(body?.id || ""));
          if (!long) throw new Error("Long form not found");
          if (!long.transcript.trim()) throw new Error("This long form has no transcript yet.");
          await advanceShortForms(ctx, long.id, counts.success ? counts.data : undefined, !!body.resume, !!body.explicit, emit);
        });
      },
      PATCH: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get('x-access-code') || '');
          if (!auth.ok) return auth.response;
          const ctx = await clipperCtx(auth.record);
          const body = await request.json();
          const long = await getLongForm(ctx, String(body.id || ''));
          if (!long) return Response.json({ error: 'Long form not found' }, { status: 404 });
          if (body.retry === 'transcription') {
            const [runId] = long.apifyRun.split(':');
            if (runId && process.env.APIFY_API_TOKEN) await fetch(`https://api.apify.com/v2/actor-runs/${runId}/abort`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIFY_API_TOKEN}` } }).catch(() => null);
            await handOffLongTranscription(ctx, long.id, long.url, long.pendingCounts ? JSON.parse(long.pendingCounts) : undefined);
            return Response.json({ ok: true });
          }
          if (body.footage === 'start') { const next = await startFootageCopy(ctx, { ...long, footageJob: '' }); return Response.json({ footage: footageState(next) }); }
          const known = new Set(sourceSegments(long.transcript).map(s => s.speaker));
          const names: Record<string, string> = {};
          if (!body.speakerNames || typeof body.speakerNames !== 'object' || Array.isArray(body.speakerNames)) return Response.json({ error: 'Check speaker names.' }, { status: 400 });
          for (const [speaker, name] of Object.entries(body.speakerNames)) {
            if (!known.has(speaker) || typeof name !== 'string' || name.length > 80 || /[\r\n]/.test(name)) return Response.json({ error: 'Use a name for an existing source speaker, up to 80 characters.' }, { status: 400 });
            if (name.trim()) names[speaker] = name.trim();
          }
          const fields: Record<string, string> = { 'Speaker names': JSON.stringify(names) };
          if (body.speakerBios !== undefined) {
            const list = body.speakerBios;
            if (!Array.isArray(list) || list.length > 20 || list.some((s: any) => typeof s?.name !== 'string' || typeof s?.bio !== 'string' || !s.name.trim() || s.name.length > 80 || s.bio.length > 400 || /[\r\n:]/.test(s.name) || /[\r\n]/.test(s.bio)))
              return Response.json({ error: 'Use a name (up to 80 characters) and a one-line bio (up to 400) for each speaker.' }, { status: 400 });
            fields['Speaker bios'] = list.map((s: any) => `${s.name.trim()}${s.bio.trim() ? `: ${s.bio.trim()}` : ''}`).join('\n');
          }
          return Response.json({ longForm: await patchLongForm(ctx, long.id, fields) });
        } catch (e) { return fail(e); }
      },
      DELETE: async ({ request }) => {
        try {
          const auth = await requireAccessCode(request.headers.get('x-access-code') || '');
          if (!auth.ok) return auth.response;
          const ctx = await clipperCtx(auth.record);
          const id = new URL(request.url).searchParams.get('id') || '';
          if (!(await deleteLongForm(ctx, id))) return Response.json({ error: 'Long form not found' }, { status: 404 });
          return Response.json({ ok: true });
        } catch (e) { return fail(e); }
      },
    },
  },
});
