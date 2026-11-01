import { editingStyleFor, LONG_FORM_POST_TYPES } from "@/lib/slate/longFormTypes";
import { contentScriptFields, editScriptFields, legacyScriptParts } from "@/lib/slate/contentScriptFields";
import { parseCarouselDocument, serializeCarouselCopy } from "@/lib/slate/slideFields";
import { sessionsCtx, updateSession } from "@/lib/writerSessions.server";
import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode, type AccessRecord } from "@/lib/accessCode.server";
import { resolveOwnerId } from "@/lib/owner.server";
import { FORMAT_SPEC, clientBoardStatus, plannerPlacement, slidesToCopyText, type FormatKey } from "@/lib/slate/formatFields";
import { CONTENT_BASE_ID, CONTENT_TABLE_ID } from "@/lib/airtableContent.server";
import { generateLovableText } from "@/lib/lovableResponses.server";
import { completeVideoScript } from "@/lib/slate/scriptCta";
import { EDIT_REQUEST_FIELDS, initialRequestStatus, requestStyleFields, stablePlannerRequestId, type ProductionStyle } from "@/lib/slate/productionRequest";
import { videoBrandStyle } from "@/lib/slate/videoProduction";
import { clipperCtx, getLongForm, getShortForm, linkToBoard } from "@/lib/longForm.server";
import { operationStore } from '@/lib/clipperOperations.server';
import { verifiedPodcastSource } from "@/lib/slate/podcastClipping";
import { cleanPodcastSpeech } from '@/lib/slate/podcastCleanup';
import { parsePostCopy } from '@/lib/slate/longFormClipper';
import { boardScript, canAddToBoard, SHORT_FORMATS, WRITER_FORMAT, type ShortFormat } from "@/lib/slate/longFormClipper";

const AIRTABLE_API = "https://api.airtable.com";
const GATEWAY = "https://connector-gateway.lovable.dev/airtable";
const BASE_ID = CONTENT_BASE_ID;
const TABLE_ID = CONTENT_TABLE_ID; // Content

const DWY_BASE = "appf1QABtQbAENYDz";
const DWY_CONTENT_TABLE = "tblucGgVsDiDGdyyK"; // Client Content
const DWY_USERS_TABLE = "tblO9nM6xTdzJyyax";
const DWY_BRANDS_TABLE = "tblho1mwlIMZfozue";
const DWY_BRIEFS_TABLE = "tblkV5xOB2D1N5dNH";

function dwyPostType(format: string): string | null {
  // Post Type options in Client Content: 🖼️ Carousel, 🖼️ Graphic, 📹 BROLL Video, 📹 Talking Video.
  if (format === "carousel") return "\u{1F5BC}\u{FE0F} Carousel";
  if (format === "graphic") return "\u{1F5BC}\u{FE0F} Graphic";
  if (format === "talkingVideo") return "\u{1F4F9} Talking Video";
  if (
    format === "broll" ||
    format === "podcastClips" ||
    format === "trend" ||
    format === "reactionRepurpose"
  ) {
    return "\u{1F4F9} BROLL Video";
  }
  return null;
}

/** Splits carousel slides into cover / body slides / cta copy for the Airtable columns. */
function carouselParts(script: any): { cover: string; slides: string; cta: string; count: number } {
  const all = Array.isArray(script?.slides) ? script.slides : [];
  const count = Math.max(all.length, 2);
  const edited = typeof script?.slidesCopy === "string" && script.slidesCopy.trim()
    ? parseCarouselDocument(script.slidesCopy, count)
    : all.map((slide: any) => ({
        title: String(slide?.headline || ""),
        subtitle: String(slide?.role === "cta" ? slide?.actionLabel || "" : slide?.subtitle || ""),
        body: String(slide?.body || ""),
      }));
  const copy = serializeCarouselCopy(edited);
  return {
    cover: copy.coverCopy,
    slides: copy.slidesCopy,
    cta: copy.ctaCopy,
    count: edited.length,
  };
}

/**
 * Small AI call that names a post from its actual script copy.
 * Falls back to the topic when the gateway is unavailable.
 */
async function generatePostName(topic: string, script: any, format: string): Promise<string> {
  const fallback = String(topic || "Untitled").slice(0, 120);
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return fallback;
  const body = [
    script?.kind === "video" && completeVideoScript(script) && `Script: ${completeVideoScript(script)}`,
    Array.isArray(script?.slides) && script.slides.length && `Slides: ${slidesToCopyText(script.slides)}`,
    typeof script?.slidesCopy === "string" && script.slidesCopy && `Slides: ${script.slidesCopy}`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 3000);
  if (!body.trim()) return fallback;
  try {
    const generated = await generateLovableText(
      `Name this social post. Return only a short, specific title of 3-8 words. No quotes, emojis, trailing punctuation, or format labels.\n\nFormat: ${format || "post"}\nTopic: ${topic}\n\n${body}`,
      "low",
    );
    const name = String(generated)
      .replace(/^["'\s]+|["'\s.]+$/g, "")
      .split("\n")[0]
      .trim();
    return name ? name.slice(0, 120) : fallback;
  } catch {
    return fallback;
  }
}

/** Resolves a DWY user record id by exact "User name". */
async function findDwyUserIdByName(token: string, name: string): Promise<string | undefined> {
  const safeName = String(name).replace(/'/g, "\\'");
  const res = await fetch(
    `${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_USERS_TABLE}?filterByFormula=${encodeURIComponent(
      `{User name}='${safeName}'`,
    )}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return undefined;
  const data: any = await res.json().catch(() => ({}));
  return data?.records?.[0]?.id;
}

function firstLinkedRecordId(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === "string" && item.startsWith("rec"));
    return found as string | undefined;
  }
  return typeof value === "string" && value.startsWith("rec") ? value : undefined;
}

async function findDwyBrandIdByCode(token: string, code: string): Promise<string | undefined> {
  const safe = String(code || "").replace(/'/g, "\\'");
  if (!safe) return undefined;
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const res = await fetch(
    `${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_BRANDS_TABLE}?filterByFormula=${encodeURIComponent(
      formula,
    )}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return undefined;
  const data: any = await res.json().catch(() => ({}));
  return data?.records?.[0]?.id;
}

async function findDwyBriefIdByCode(token: string, code: string): Promise<string | undefined> {
  const safe = String(code || "").replace(/'/g, "\\'");
  if (!safe) return undefined;
  const formula = `OR(FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','), LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}')`;
  const res = await fetch(
    `${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_BRIEFS_TABLE}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return undefined;
  const data: any = await res.json().catch(() => ({}));
  return data?.records?.[0]?.id;
}

async function getDwyBrief(token: string, id: string | undefined): Promise<Record<string, unknown>> {
  if (!id) return {};
  const res = await fetch(`${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_BRIEFS_TABLE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};
  const data: any = await res.json().catch(() => ({}));
  return data?.fields || {};
}

/** Client (user type = user) scripts land in the DWY "Client Content" table. */
async function sendToDwyContent(body: any, authRecord: AccessRecord): Promise<Response> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });

  const { topic, script, captions, format, assigneeId, assignTo, planner, sessionId } = body || {};
  if (!topic || !script)
    return Response.json({ error: "Missing topic or script" }, { status: 400 });
  // Resolve the linked DWY user record (the client themselves) through the
  // account link on the access code, never by name.
  const userRecordId = await resolveOwnerId(authRecord, token);
  if (!userRecordId) {
    return Response.json(
      {
        error:
          "We could not match your account to a client record, so nothing was sent to production. Ask your strategist to link your account.",
      },
      { status: 400 },
    );
  }
  const brandRecordId =
    firstLinkedRecordId(authRecord.fields?.Brand) ||
    firstLinkedRecordId(authRecord.fields?.Brands) ||
    (await findDwyBrandIdByCode(token, authRecord.code));
  const brandBriefRecordId = await findDwyBriefIdByCode(token, authRecord.code);
  const brandBrief = await getDwyBrief(token, brandBriefRecordId);

  // Resolve the editor/designer this batch is assigned to.
  let assigneeRecordId: string | undefined;
  if (typeof assigneeId === "string" && assigneeId.startsWith("rec")) {
    assigneeRecordId = assigneeId;
  } else if (assignTo === "risevoice") {
    assigneeRecordId = await findDwyUserIdByName(token, "Risevoice");
  }

  const fmt = String(format || "") as FormatKey;
  const spec = FORMAT_SPEC[fmt];
  const placement = planner ? plannerPlacement(fmt, planner) : null;
  if (placement?.error) return Response.json({ error: placement.error }, { status: 400 });
  const selectedCta = String(body?.selectedCta || script?.cta || script?.onScreenCta || "").trim();
  const diyVideo = placement?.requestType === "Do it Myself" && (fmt === "broll" || fmt === "talkingVideo");
  if (diyVideo && (!brandRecordId || !brandBriefRecordId)) {
    return Response.json({ error: "A linked brand and brand brief are required before video editing can start." }, { status: 400 });
  }
  if (placement?.requestType === "Do it Myself" && fmt === "talkingVideo" && (!String(script.visualHook || "").trim() || (!selectedCta && !body.verifiedPodcastSource))) {
    return Response.json({ error: "Talking Video requires a selected visual hook and CTA before editing can start." }, { status: 400 });
  }
  if (placement?.requestType === "Do it Myself" && fmt === "broll" && !completeVideoScript(script).trim()) {
    return Response.json({ error: "BROLL requires text overlay copy before editing can start." }, { status: 400 });
  }
  const stableRequestId = placement?.requestType === "Do it Myself" && typeof body?.requestId === "string"
    ? body.requestId.trim()
    : "";
  if (stableRequestId) {
    const safeRequestId = stableRequestId.replace(/'/g, "\\'");
    const existingRes = await fetch(
      `${AIRTABLE_API}/v0/${DWY_BASE}/tblS69GyGj3tpioTo?filterByFormula=${encodeURIComponent(`{${EDIT_REQUEST_FIELDS.requestId}}='${safeRequestId}'`)}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const existingData: any = await existingRes.json().catch(() => ({}));
    const existing = existingData?.records?.[0];
    const linkedContent = Array.isArray(existing?.fields?.[EDIT_REQUEST_FIELDS.originalRequest])
      ? String(existing.fields[EDIT_REQUEST_FIELDS.originalRequest][0] || "")
      : "";
    if (existing?.id && linkedContent) {
      return Response.json({ ok: true, recordId: linkedContent, diyRecordId: existing.id, requestType: placement?.requestType });
    }
  }

  const cleanParts = legacyScriptParts(script.kind === "video" ? completeVideoScript(script) : "");
  const videoParts = {
    script: fmt === "talkingVideo" ? cleanParts.script : "",
    visualHook: fmt === "talkingVideo" ? String(script.visualHook || cleanParts.visualHook || "").trim() : "",
    textOverlay: fmt === "broll" ? cleanParts.textOverlay || cleanParts.script : "",
    visualCta: fmt === "talkingVideo" ? String(script.onScreenCta || selectedCta || cleanParts.visualCta || "").trim() : "",
    timestamps: "",
    creativeDirection: String(script.creativeInstructions || cleanParts.creativeDirection || "").trim(),
  };
  const designCopy = script.kind === "carousel"
    ? (typeof script.slidesCopy === "string" && script.slidesCopy.trim() ? script.slidesCopy : slidesToCopyText(script.slides || [])) : "";
  const fields: Record<string, any> = {
    Name: (body.shortFormId ? String(topic) : await generatePostName(String(topic), script, fmt)).slice(0, 500),
    Topic: String(topic).slice(0, 200),
    ...contentScriptFields(fmt, videoParts),
    ...((fmt === "carousel" || fmt === "graphic") ? { "Script Text": designCopy } : {}),
    // Videos land in To Film; graphics and carousels land in Production.
    "Client Status": clientBoardStatus(fmt),
    Source: "AI-generated",
  };
  const pt = dwyPostType(fmt);
  // Pieces clipped from a long form use the matching "from long form" post type.
  if (pt) fields["Post Type"] = body.shortFormId ? LONG_FORM_POST_TYPES[fmt === "broll" ? "BROLL" : fmt === "talkingVideo" ? "Talking Video" : fmt === "graphic" ? "Graphic" : "Carousel"] : pt;
  // Carousels get their copy broken out per column so designers see cover / slides / CTA separately.
  if (fmt === "carousel") {
    const cp = carouselParts(script);
    if (cp.cover) fields["Cover Copy"] = cp.cover;
    if (cp.slides) fields["Slides Copy"] = cp.slides;
    if (cp.cta) fields["CTA Copy"] = cp.cta;
    if (cp.count > 0) fields["Number of slides"] = cp.count;
  }
  if (fmt === "graphic" && script.kind === "carousel") {
    const first = script.slides?.[0];
    const copy = [first?.headline, first?.subtitle, first?.body].filter(Boolean).join("\n").trim();
    if (copy) fields["Cover Copy"] = copy;
  }
  if (fmt === "talkingVideo" && selectedCta) fields["CTA Copy"] = selectedCta;

  if (captions?.instagram) fields["IG Captions"] = String(captions.instagram);
  if (captions?.facebook) fields["FB Captions"] = String(captions.facebook);
  if (captions?.tiktok) fields["Tiktok Captions"] = String(captions.tiktok);
  if (captions?.youtube) fields["Youtube Captions"] = String(captions.youtube);
  if (/^https?:\/\//.test(String(script.inspoUrl || ""))) fields["Inspo Link"] = String(script.inspoUrl).slice(0, 1000);
  if (userRecordId) fields["User"] = [userRecordId];
  if (brandRecordId) fields["Brands"] = [brandRecordId];
  if (assigneeRecordId) fields["Assignee"] = [assigneeRecordId];
  if (placement) {
    fields["Client Status"] = placement.status;
    if (placement.requestType) fields["Request type"] = placement.requestType;
    const link = String(planner?.footageLink || "").trim();
    if (/^https?:\/\//.test(link)) fields["Google Drive to RAW Files"] = link.slice(0, 1000);
  }

  if (body.shortFormId) {
    fields['Clipper operation key'] = `shortform:${body.shortFormId}`;
    fields['Short forms'] = [body.shortFormId];
    const ctx = await clipperCtx(authRecord);
    const short = await getShortForm(ctx, body.shortFormId);
    if (short) {
      fields['Long forms'] = short.longFormIds;
      if (short.timestamps) fields['Timestamps'] = short.timestamps;
      if (short.creativeDirection) fields['Creative Direction'] = short.creativeDirection;
    }
  }
  let recoveredId = '';
  const clipperStore = body.shortFormId ? await operationStore(await clipperCtx(authRecord), body._clipperLongId || body.shortFormId, `board:${body.shortFormId}`) : null;
  const clipperState = clipperStore ? (await clipperStore.read())?.payload as any : null;
  if (body.shortFormId) {
    const lookup = await fetch(`${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_CONTENT_TABLE}?filterByFormula=${encodeURIComponent(`{Clipper operation key}='shortform:${body.shortFormId}'`)}&maxRecords=1`, { headers: { Authorization: `Bearer ${token}` } });
    if (!lookup.ok) return Response.json({ error: 'The previous board save could not be checked. Nothing new was created.' }, { status: 502 });
    recoveredId = String((await lookup.json()).records?.[0]?.id || '');
    if (!recoveredId && clipperState?.contentWriting) return Response.json({ error: 'The previous board save is still uncertain. No duplicate was created; check again later.' }, { status: 409 });
    if (!recoveredId && clipperStore) await clipperStore.write({ ...clipperState, contentWriting: true }, body._clipperLease);
  }
  const createRes = recoveredId ? Response.json({ id: recoveredId }) : await fetch(`${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_CONTENT_TABLE}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields, typecast: true }),
  });
  const created: any = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    if (clipperStore && createRes.status >= 400 && createRes.status < 500) await clipperStore.write({ ...clipperState, contentWriting: false }, body._clipperLease);
    console.error(
      `DWY create failed [${createRes.status}]: ${JSON.stringify(created).slice(0, 600)}`,
    );
    const status = createRes.status >= 400 && createRes.status < 500 ? createRes.status : 502;
    const providerMessage =
      typeof created?.error?.message === "string"
        ? created.error.message
        : "The production record could not be created";
    return Response.json({ error: providerMessage }, { status });
  }
  const recordId: string | null = created?.id ?? null;
  // Link the new post to its writer session so History shows what was planned.
  if (recordId && typeof sessionId === "string" && /^rec[A-Za-z0-9]{14}$/.test(sessionId)) {
    try {
      const ctx = await sessionsCtx(authRecord);
      await updateSession(ctx, sessionId, { addContentId: recordId });
    } catch (e) {
      console.error("Session link failed", e);
    }
  }
  // "Do it myself" also opens a request in the Edit Yourself table, separate
  // from the Client Content record.
  let diyRecordId: string | null = null;
  if (recordId && placement?.requestType === "Do it Myself") {
    const clip = body.shortFormId && (fmt === "broll" || fmt === "talkingVideo");
    const base: ProductionStyle = fmt === "broll" ? "BROLL" : fmt === "talkingVideo" ? "Talking Video" : fmt === "graphic" ? "Graphic" : "Carousel";
    const style = base;
    const requestId = stableRequestId
      ? stableRequestId
      : stablePlannerRequestId(recordId);
    const diyFields: Record<string, any> = {
      Status: initialRequestStatus(style as ProductionStyle),
      "Editing style": editingStyleFor(base, Boolean(clip)),
      User: [userRecordId],
      [EDIT_REQUEST_FIELDS.requestId]: requestId,
      [EDIT_REQUEST_FIELDS.originalRequest]: [recordId],
    };
    if (brandRecordId) diyFields[EDIT_REQUEST_FIELDS.brands] = [brandRecordId];
    if (brandBriefRecordId) diyFields[EDIT_REQUEST_FIELDS.brandBrief] = [brandBriefRecordId];
    if (clip) {
      // Clipping requests carry their source moment and direction as separate fields.
      if (fields["Timestamps"]) diyFields["Timestamps"] = fields["Timestamps"];
      if (fields["Creative Direction"]) diyFields["Creative Direction"] = fields["Creative Direction"];
      if (script.visualHook) diyFields["Visual Hook"] = String(script.visualHook);
    } else if (script.creativeInstructions) {
      diyFields[EDIT_REQUEST_FIELDS.instructions] = String(script.creativeInstructions).slice(0, 10000);
    }
    Object.assign(diyFields, editScriptFields(fmt, { ...videoParts, timestamps: String(fields["Timestamps"] || ""), creativeDirection: String(fields["Creative Direction"] || videoParts.creativeDirection) }));
    const link = String(planner?.footageLink || "").trim();
    if (/^https?:\/\//.test(link)) diyFields["Raw clip 1"] = link.slice(0, 1000);
    if (script.kind === "carousel") {
      const slides = (script.slides || []) as any[];
      slides.slice(0, 10).forEach((s, i) => {
        const copy = [s?.headline, s?.subtitle, s?.body, s?.actionLabel].filter(Boolean).join("\n").trim();
        if (copy) diyFields[`Slide copy ${i + 1}`] = copy;
      });
      diyFields["Number of slides"] = slides.length;
    } else if (fmt === "broll") {
      Object.assign(diyFields, requestStyleFields(videoBrandStyle(brandBrief), { talking: false, styleSampleEnabled: true, textPosition: "center" }));
    } else if (fmt === "talkingVideo") {
      if (script.visualHook) diyFields["Visual Hook"] = String(script.visualHook);
      if (selectedCta) diyFields["CTA"] = selectedCta;
      if (body.shortFormId) {
        const ctx = await clipperCtx(authRecord);
        const short = await getShortForm(ctx, body.shortFormId);
        const notes = short ? JSON.parse((short.copy.split(/\n\s*Source notes:\s*\n/i)[1] || '{}')) : {};
        diyFields['Source speech'] = String(notes.cleanup?.cleaned || script.script || '');
        diyFields['Source cuts'] = JSON.stringify(notes.cleanup?.cuts || notes.segments || []);
      }
      Object.assign(diyFields, requestStyleFields(videoBrandStyle(brandBrief), { talking: true, styleSampleEnabled: true, textPosition: "top" }));
    }
    try {
      const safeRequestId = requestId.replace(/'/g, "\\'");
      const existingRes = await fetch(
        `${AIRTABLE_API}/v0/${DWY_BASE}/tblS69GyGj3tpioTo?filterByFormula=${encodeURIComponent(`{${EDIT_REQUEST_FIELDS.requestId}}='${safeRequestId}'`)}&maxRecords=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const existingData: any = await existingRes.json().catch(() => ({}));
      const existingId = String(existingData?.records?.[0]?.id || "");
      const r = await fetch(`${AIRTABLE_API}/v0/${DWY_BASE}/tblS69GyGj3tpioTo${existingId ? `/${existingId}` : ""}`, {
        method: existingId ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: diyFields, typecast: true }),
      });
      const d: any = await r.json().catch(() => ({}));
      if (r.ok) diyRecordId = d?.id ?? null;
      else {
        console.error(`DIY create failed [${r.status}]: ${JSON.stringify(d).slice(0, 400)}`);
        if (!body.shortFormId) await fetch(`${AIRTABLE_API}/v0/${DWY_BASE}/${DWY_CONTENT_TABLE}/${recordId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => undefined);
        return Response.json({ error: "The planner post was created, but its editing request was not. Retry to finish the handoff.", recordId }, { status: 502 });
      }
    } catch (e) {
      console.error("DIY create failed", e);
      return Response.json({ error: "The editing request did not finish. Retry to complete the same board post.", recordId }, { status: 502 });
    }
  }
  // Design inputs so "Produce now" can start the AI design without re-reading the record.
  const design = recordId
    ? {
        id: recordId,
        postType: fields["Post Type"],
        postName: fields.Name,
        script: fields["Script Text"],
        coverCopy: fields["Cover Copy"],
        slidesCopy: fields["Slides Copy"],
        ctaCopy: fields["CTA Copy"],
        brandIds: brandRecordId ? [brandRecordId] : [],
        clientStatus: fields["Client Status"],
      }
    : null;
  return Response.json({ ok: true, recordId, diyRecordId, requestType: placement?.requestType ?? null, design });
}

export const Route = createFileRoute("/api/send-to-production")({
  server: {
    handlers: {
      POST: async ({ request }) => handleProduction(request),
    },
  },
});

async function handleProduction(request: Request, locked = false): Promise<Response> {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const auth = await requireAccessCode(body?.accessCode);
        if (!auth.ok) return auth.response;
        if (body.shortFormId && !locked) {
          const ctx = await clipperCtx(auth.record);
          const short = await getShortForm(ctx, String(body.shortFormId));
          if (!short) return Response.json({ error: 'Source piece not found' }, { status: 404 });
          const store = await operationStore(ctx, short.longFormIds[0] || short.id, `board:${short.id}`);
          try {
            return await store.run(async (token, state) => {
              body._clipperLease = token;
              body._clipperLongId = short.longFormIds[0] || short.id;
              // Stored Drive footage is the default source link for clipped pieces.
              if (body.planner && !String(body.planner.footageLink || '').trim() && short.longFormIds[0]) {
                const parent = await getLongForm(ctx, short.longFormIds[0]);
                if (parent?.footageFile) body.planner = { ...body.planner, footageLink: parent.footageFile };
              }
              if (short.contentIds.length) return Response.json({ ok: true, recordId: short.contentIds[0] });
              if (state.result?.recordId) {
                await linkToBoard(ctx, short, state.result.recordId);
                return Response.json(state.result);
              }
              const response = await handleProduction(new Request(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify(body) }), true);
              const result = await response.clone().json().catch(() => ({}));
              if (response.ok && result.recordId) {
                state.result = result; await store.write(state, token);
                await linkToBoard(ctx, short, result.recordId);
              }
              return response;
            });
          } catch (e: any) { return Response.json({ error: e.message }, { status: e.status || 502 }); }
        }
        // Never trust a browser-supplied exemption from the usual Talking Video CTA rule.
        body.verifiedPodcastSource = false;
        if (body.shortFormId) {
          const ctx = await clipperCtx(auth.record);
          const short = await getShortForm(ctx, String(body.shortFormId));
          if (!short || !canAddToBoard(short) || !SHORT_FORMATS.includes(short.format as ShortFormat))
            return Response.json({ error: "This source piece is unavailable or already on the board." }, { status: 409 });
          const format = short.format as ShortFormat;
          body.script = boardScript(format, short.copy);
          // Clip captions go to their own caption columns, never into the script.
          if ((body.script as any).captions) body.captions = { ...(body.script as any).captions, ...(body.captions || {}) };
          body.format = WRITER_FORMAT[format];
          body.topic = short.name;
          body.selectedCta = body.script.cta || "";
          for (const longId of short.longFormIds) {
            const long = await getLongForm(ctx, longId);
            if (long && verifiedPodcastSource(format, short.copy, long.transcript)) {
              const meta = JSON.parse(parsePostCopy(short.copy)['source notes'] || '{}');
              if (meta.cleanup) {
                const verified = cleanPodcastSpeech(short.copy, long.transcriptDetails.words || []);
                if (JSON.stringify(verified) !== JSON.stringify(meta.cleanup)) return Response.json({ error: 'The saved cleanup does not match original source timing.' }, { status: 400 });
              }
              body.script = { ...body.script, creativeInstructions: boardScript(format, short.copy, long.speakerNames || {}).creativeInstructions };
              body.verifiedPodcastSource = true;
              break;
            }
          }
        }

        const isClient = auth.record.userType.toLowerCase() === "user";
        if (isClient) return sendToDwyContent(body, auth.record);

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        if (!LOVABLE_API_KEY || !AIRTABLE_API_KEY) {
          return Response.json({ error: "Airtable not configured" }, { status: 500 });
        }

        const { topic, scriptNumber, script, captions, clientName, scriptType, format, brandId } =
          body || {};
        if (!topic || !script) {
          return Response.json({ error: "Missing topic or script" }, { status: 400 });
        }

        const aiName = await generatePostName(
          String(topic),
          script,
          String(format || ""),
        );
        const fields: Record<string, any> = {
          "Event/Post Name": aiName.slice(0, 5000),
        };
        if (typeof scriptNumber === "number") fields["Script number"] = scriptNumber;
        if (brandId && typeof brandId === "string") fields["Brand"] = [brandId];

        const fmt = String(format || "") as FormatKey;
        const spec = FORMAT_SPEC[fmt];
        if (spec) {
          fields["Format"] = spec.chip;
          fields["Category"] = spec.category;
          fields["Production Status"] = spec.productionStatus;
          fields["Client Status"] = spec.clientStatus;
        }

        if (script.kind === "video") {
          // Visual Hook only when the format actually uses it.
          if (spec?.fields.includes("visualHook")) {
            fields["Visual Hook"] = script.visualHook || "";
          }
          if (fmt === "broll") {
            // Text overlay lives in the Script field.
            fields["Script"] = completeVideoScript(script);
          } else {
            fields["Script"] = completeVideoScript(script);
          }
        } else if (script.kind === "carousel") {
          // Prefer the edited "Slides copy" textarea; fall back to structured slides.
          fields["Script"] =
            typeof script.slidesCopy === "string" && script.slidesCopy.trim()
              ? script.slidesCopy
              : slidesToCopyText(script.slides || []);
        }

        // Production metadata. "Video to react to" (reactionRepurpose) and
        // "Inspo" share the same Airtable column.
        if (spec?.fields.includes("inspo") && script.inspo) {
          fields["Inspo"] = String(script.inspo);
        }
        if (spec?.fields.includes("filmingInstructions") && script.filmingInstructions) {
          fields["Filming | Special Instructions"] = String(script.filmingInstructions);
        }
        if (spec?.fields.includes("creativeInstructions") && script.creativeInstructions) {
          fields["Creative Instructions"] = String(script.creativeInstructions);
        }
        // "Creative Assigned" is a linked-record field pointing at Team Roster.
        // Airtable expects an array of record IDs (strings).
        if (Array.isArray(script.assignees) && script.assignees.length) {
          const ids = script.assignees
            .map((a: any) => (typeof a?.id === "string" && a.id.startsWith("rec") ? a.id : null))
            .filter(Boolean) as string[];
          if (ids.length) fields["Creative Assigned"] = ids;
        }

        if (captions) {
          if (captions.instagram) fields["IG Captions"] = captions.instagram;
          if (captions.facebook) fields["FB Captions"] = captions.facebook;
          const yt = [
            captions.tiktok && `TikTok:\n${captions.tiktok}`,
            captions.youtube && `YouTube:\n${captions.youtube}`,
          ]
            .filter(Boolean)
            .join("\n\n");
          if (yt) fields["Tiktok | Youtube Captions"] = yt;
        }

        const batchLabel = `${clientName || "Risevoice"} — ${new Date().toISOString().slice(0, 10)}`;
        fields["Scripts Batch"] = batchLabel.slice(0, 255);

        const res = await fetch(`${GATEWAY}/v0/${BASE_ID}/${TABLE_ID}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": AIRTABLE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ records: [{ fields }], typecast: true }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error(
            `Airtable gateway create failed [${res.status}]: ${JSON.stringify(data).slice(0, 600)}`,
          );
          return Response.json(
            { error: `Airtable error [${res.status}]: ${JSON.stringify(data).slice(0, 400)}` },
            { status: 502 },
          );
        }

        return Response.json({ ok: true, recordId: data?.records?.[0]?.id ?? null });

}
