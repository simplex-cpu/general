import { buildVideoEdit, mergeEditingPreferences, videoEditFormat } from "@/lib/slate/videoEditInput";
import { LONG_FORM_POST_TYPES, baseStyle, isLongFormType } from "@/lib/slate/longFormTypes";
import { contentScriptFields, readContentScript, editScriptFields } from "@/lib/slate/contentScriptFields";
import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import { linkContainsName, ownsRecord, resolveOwnerId, resolveOwnerIdentity } from "@/lib/owner.server";
import { uploadToDrive, finalizeDriveFile } from "@/lib/googleDrive.server";
import {
  EDIT_REQUEST_FIELDS,
  completeRequestStatus,
  initialRequestStatus,
  safeRequestStyleFields,
  workingRequestStatus,
  type ProductionStyle,
} from "@/lib/slate/productionRequest";
import { validateDesignCopy, type DesignSubtype, type StructuredDesignSlide } from "@/lib/slate/designTemplates";
import { parseSlideBlock, slideKind } from "@/lib/slate/slideFields";

const AIRTABLE_API = "https://api.airtable.com";
const BASE_ID = "appf1QABtQbAENYDz";
const TABLE_ID = "tblS69GyGj3tpioTo"; // Edit Yourself
const USERS_TABLE = "tblO9nM6xTdzJyyax";
const DRIVE_FOLDER_ID = "1DEi1mjTz4y01Idhdx0UyeVfIOVjA7k3o";

const FIELD_STATUS = "Status";
const FIELD_EDITING_STYLE = "Editing style";
const FIELD_USER = "User";
const FIELD_FOOTAGE = "Raw Footage to Edit";
const FIELD_TEXT_OVERLAY = "Text Overlay";
const FIELD_RAW_CLIPS = ["Raw clip 1", "Raw clip 2", "Raw clip 3"] as const;
const FIELD_VISUAL_HOOK = "Visual Hook";
const FIELD_CTA = "CTA";
const FIELD_MUSIC = "Music reference";
const FIELD_MUSIC_FILE = "Music"; // attachment: the extracted audio track

const FIELD_COPY = "Copy";
const FIELD_SLIDES = "Number of slides";
const FIELD_SLIDE_COPY = Array.from({ length: 10 }, (_, i) => `Slide copy ${i + 1}`);
const ALLOWED_STYLES = ["BROLL", "Talking Video", "Graphic", "Carousel", "BROLL from long form", "Talking from long form", "B-roll from long form", "Talking video from long form"];
const DESIGN_STYLES = ["Graphic", "Carousel"];

const CONTENT_TABLE = "tblucGgVsDiDGdyyK"; // Client Content (editing | designing board)
const BRANDS_TABLE = "tblho1mwlIMZfozue";
const BRIEFS_TABLE = "tblkV5xOB2D1N5dNH";
const POST_TYPE_BY_STYLE: Record<string, string> = {
  Carousel: "\u{1F5BC}\u{FE0F} Carousel",
  Graphic: "\u{1F5BC}\u{FE0F} Graphic",
  BROLL: "\u{1F4F9} BROLL Video",
  "Talking Video": "\u{1F4F9} Talking Video",
};

async function findBrandIdByCode(token: string, code: string): Promise<string | undefined> {
  const safe = String(code || "").replace(/'/g, "\\'");
  if (!safe) return undefined;
  const formula = `OR(
    FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','),
    LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}'
  )`;
  const res = await fetch(
    `${AIRTABLE_API}/v0/${BASE_ID}/${BRANDS_TABLE}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return undefined;
  const data: any = await res.json().catch(() => ({}));
  return data?.records?.[0]?.id;
}

async function findBriefIdByCode(token: string, code: string): Promise<string | undefined> {
  const safe = String(code || "").replace(/'/g, "\\'");
  if (!safe) return undefined;
  const formula = `OR(FIND(',${safe},', ',' & ARRAYJOIN({Access code}, ',') & ','), LOWER(TRIM(ARRAYJOIN({Access code}, ','))) = '${safe.toLowerCase()}')`;
  const res = await fetch(
    `${AIRTABLE_API}/v0/${BASE_ID}/${BRIEFS_TABLE}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return undefined;
  const data: any = await res.json().catch(() => ({}));
  return data?.records?.[0]?.id;
}




export const Route = createFileRoute("/api/dwy-edit-yourself")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const accessCode = request.headers.get("x-access-code") || new URL(request.url).searchParams.get("accessCode") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const owner = await resolveOwnerIdentity(auth.record, token);
        const ownerId = owner?.id || null;
        if (!ownerId) {
          return Response.json({
            items: [],
            ownerUnresolved: true,
            error: "We could not match your account to a client record.",
          });
        }
        const url = owner?.name
          ? `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent(
              linkContainsName("User", owner.name),
            )}&pageSize=100`
          : `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) return Response.json({ error: `List failed [${res.status}]` }, { status: 502 });
        // Airtable can return a single select as a string or a multiple select as
        // an array — always surface the most recent (last) value.
        const latest = (v: any): string => {
          if (Array.isArray(v)) {
            const vals = v.map((x) => (typeof x === "object" ? x?.name : x)).filter(Boolean);
            return String(vals[vals.length - 1] || "");
          }
          return String(v || "");
        };
        const items = (data.records || [])
          .filter((r: any) => ownsRecord(r?.fields?.[FIELD_USER], ownerId))
          .map((r: any) => {
          const f = r.fields || {};
          const foot = Array.isArray(f[FIELD_FOOTAGE]) ? f[FIELD_FOOTAGE] : [];
          return {
            id: r.id,
            createdTime: r.createdTime || "",
            editingStyle: latest(f[FIELD_EDITING_STYLE]),
            status: latest(f[FIELD_STATUS]),
            textOverlay: f[FIELD_TEXT_OVERLAY] || "",
            visualHook: f[FIELD_VISUAL_HOOK] || "",
            cta: f[FIELD_CTA] || "",
            music: f[FIELD_MUSIC] || "",
            copy: f[FIELD_COPY] || "",
            slideCount: Number(f[FIELD_SLIDES] || 0) || 0,
            slideCopy: FIELD_SLIDE_COPY.map((k) => String(f[k] || "")),
            files: foot.map((a: any) => ({
              id: String(a?.id || ""),
              url: String(a?.url || ""),
              filename: String(a?.filename || "file"),
              type: String(a?.type || "application/octet-stream"),
            })),
          };
        });

        items.sort(
          (a: any, b: any) =>
            new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime(),
        );

        const completed = (data.records || []).filter((record: any) => {
          const fields = record?.fields || {};
          return String(fields[FIELD_STATUS] || "").toLowerCase() === "edited"
            && Array.isArray(fields[EDIT_REQUEST_FIELDS.originalRequest])
            && fields[EDIT_REQUEST_FIELDS.originalRequest].length === 1
            && ownsRecord(fields[FIELD_USER], ownerId);
        });
        await Promise.all(completed.map(async (record: any) => {
          const contentId = String(record.fields[EDIT_REQUEST_FIELDS.originalRequest][0] || "");
          if (!/^rec[A-Za-z0-9]{14}$/.test(contentId)) return;
          const contentRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const content: any = await contentRes.json().catch(() => ({}));
          if (!contentRes.ok || !ownsRecord(content?.fields?.User, ownerId)) return;
          if (String(content?.fields?.["Client Status"] || "").toLowerCase() === "approve") return;
          const produced = Array.isArray(content?.fields?.["Produced Files"])
            ? content.fields["Produced Files"]
            : [];
          if (!produced.some((file: any) => file?.url)) return;
          await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentId}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: { "Client Status": "Approve" }, typecast: true }),
          });
        }));

        return Response.json({ items });
      },
      POST: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) {
          return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        }

        const url = new URL(request.url);
        const q = url.searchParams;
        const isJson = (request.headers.get("content-type") || "").includes("application/json");
        let body: any = null;
        if (isJson) {
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }
        }

        const accessCode =
          request.headers.get("x-access-code") || String(body?.accessCode || q.get("accessCode") || "");
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        const pick = (k: string) => String((isJson ? body?.[k] : q.get(k)) || "").trim();
        // Long-form styles trigger their own automation; validation uses the base format.
        const askedStyle = pick("editingStyle");
        // Old long form labels map to the exact tags the editors read.
        const requestedStyle = isLongFormType(askedStyle) ? videoEditFormat(askedStyle) || askedStyle : askedStyle;
        const fromLongForm = isLongFormType(requestedStyle);
        const editingStyle = fromLongForm ? baseStyle(requestedStyle) : requestedStyle;
        const textOverlay = pick("textOverlay");
        const visualHook = pick("visualHook");
        const cta = pick("cta");
        const requestId = pick("requestId");
        const productionInstructions = pick("productionInstructions");
        const music = pick("music");
        const musicFileId = pick("musicFileId");
        const musicFilename = pick("musicFilename") || "music.mp3";

        const copy = pick("copy");
        const designSubtype: DesignSubtype = pick("designSubtype") === "insightful" ? "insightful" : "quote";
        const slideCount = Number((isJson ? body?.slideCount : q.get("slideCount")) || 0) || 0;
        const slideCopy: string[] = (isJson && Array.isArray(body?.slideCopy) ? body.slideCopy : [])
          .map((c: unknown) => String(c || "").trim())
          .slice(0, 10);

        // Designs are generated in the browser and uploaded first, so the leading
        // N assets are the finished images.
        const renderedCount = isJson && Array.isArray(body?.renderedFiles)
          ? body.renderedFiles.length
          : 0;

        const rawClips: string[] = (isJson && Array.isArray(body?.rawClips) ? body.rawClips : [])
          .map((c: unknown) => String(c || "").trim())
          .filter((c: string) => /^https?:\/\//i.test(c))
          .slice(0, 3);
        const driveLink = pick("driveLink") || rawClips[0] || "";
        const fileId = pick("fileId");
        let filename = pick("filename");
        const contentType = pick("contentType") || "application/octet-stream";

        if (!requestedStyle) return Response.json({ error: "Editing style required" }, { status: 400 });
        if (!ALLOWED_STYLES.includes(requestedStyle)) {
          return Response.json({ error: `Editing style must be one of: ${ALLOWED_STYLES.join(", ")}` }, { status: 400 });
        }
        if (!requestId) {
          return Response.json({ error: "Request ID required" }, { status: 400 });
        }


        let drive: { id: string; url: string; filename: string } | null = null;
        let extraDrive: { id: string; url: string; filename: string }[] = [];

        const multi = isJson && Array.isArray(body?.files) ? body.files : null;

        if (multi && multi.length) {
          const finalized: { id: string; url: string; filename: string }[] = [];
          for (const item of multi) {
            const fid = String(item?.fileId || "").trim();
            if (!/^[A-Za-z0-9_-]{10,}$/.test(fid)) {
              return Response.json({ error: "Valid fileId required for every asset" }, { status: 400 });
            }
            try {
              const f = await finalizeDriveFile(fid);
              finalized.push({ id: f.id, url: f.url, filename: String(item?.filename || f.filename) });
            } catch (e: any) {
              return Response.json({ error: e?.message || "Drive finalize failed" }, { status: 502 });
            }
          }
          drive = finalized[0];
          extraDrive = finalized;
        } else if (isJson && fileId) {
          // Browser uploaded straight to Drive — just publish the file.
          if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
            return Response.json({ error: "Valid fileId required" }, { status: 400 });
          }
          try {
            const f = await finalizeDriveFile(fileId);
            drive = { id: f.id, url: f.url, filename: filename || f.filename };
            extraDrive = [drive];
          } catch (e: any) {
            return Response.json({ error: e?.message || "Drive finalize failed" }, { status: 502 });
          }
        } else if (isJson && driveLink) {
          if (!/^https?:\/\//i.test(driveLink)) {
            return Response.json({ error: "Please provide a valid link (https://…)" }, { status: 400 });
          }
        } else if (isJson && DESIGN_STYLES.includes(editingStyle)) {
          // Graphics and carousels can be submitted with copy only — assets are optional.
        } else {

          if (!filename) return Response.json({ error: "Filename required" }, { status: 400 });
          // Read raw binary body (legacy / small-file path).
          let bytes: Uint8Array;
          try {
            const buf = await request.arrayBuffer();
            bytes = new Uint8Array(buf);
          } catch (e: any) {
            return Response.json({ error: `Failed to read upload: ${e?.message || e}` }, { status: 400 });
          }
          if (bytes.byteLength === 0) return Response.json({ error: "Empty file" }, { status: 400 });

          try {
            drive = await uploadToDrive({ bytes, filename, contentType, folderId: DRIVE_FOLDER_ID });
            extraDrive = [drive];
          } catch (e: any) {
            return Response.json({ error: e?.message || "Drive upload failed" }, { status: 502 });
          }
        }

        const isDesignStyle = DESIGN_STYLES.includes(editingStyle);
        if (!drive && !driveLink && !isDesignStyle) {
          return Response.json({ error: "Attach a file or provide a Drive link" }, { status: 400 });
        }
        if (isDesignStyle) {
          const staticCopy = editingStyle === "Carousel" ? slideCopy : [copy];
          const staticSlides: StructuredDesignSlide[] = staticCopy.map((value, index) => {
                const kind = editingStyle === "Graphic" ? "content" : slideKind(index, staticCopy.length);
                const fields = parseSlideBlock(value, kind);
                return {
                  position: index + 1,
                  role: editingStyle === "Graphic" ? "content" : kind === "cover" ? "hook" : kind,
                  headline: fields.title,
                  subtitle: kind === "cta" ? undefined : fields.subtitle,
                  body: fields.body,
                  actionLabel: kind === "cta" ? fields.subtitle : undefined,
                };
              });
          const staticError = validateDesignCopy(editingStyle === "Graphic" ? "graphic" : "carousel", designSubtype, staticSlides);
          if (staticError) return Response.json({ error: staticError }, { status: 400 });
        }



        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

        // The account linked to this access code owns the request.
        const userRecordId = await resolveOwnerId(auth.record, token);
        if (!userRecordId) {
          return Response.json(
            { error: "We could not match your account to a client record." },
            { status: 400 },
          );
        }

        const safeRequestId = requestId.replace(/'/g, "\\'");
        const lookupRes = await fetch(
          `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent(`{${EDIT_REQUEST_FIELDS.requestId}}='${safeRequestId}'`)}&maxRecords=10`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const lookupData: any = await lookupRes.json().catch(() => ({}));
        const existingRequest = (lookupData?.records || []).find((record: any) =>
          ownsRecord(record?.fields?.[FIELD_USER], userRecordId),
        );
        const existingRequestId = String(existingRequest?.id || "");

        // Finished design images (already rendered in the browser) come first in
        // the uploaded list.
        const designImages =
          isDesignStyle && renderedCount > 0 ? extraDrive.slice(0, renderedCount) : [];

        const existingContentId = String((isJson ? body?.contentId : "") || "").trim();
        let ownedContent: any = null;
        if (existingContentId) {
          if (!/^rec[A-Za-z0-9]{14}$/.test(existingContentId)) {
            return Response.json({ error: "Valid original Content ID required" }, { status: 400 });
          }
          const checkRes = await fetch(
            `${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${existingContentId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const checkData: any = await checkRes.json().catch(() => ({}));
          if (!checkRes.ok || (auth.record.userType.toLowerCase() !== "admin" && !ownsRecord(checkData?.fields?.User, userRecordId))) {
            return Response.json({ error: "Original Content record not found" }, { status: 404 });
          }
          ownedContent = checkData;
        }
        const linkedBrand = Array.isArray(ownedContent?.fields?.Brands)
          ? ownedContent.fields.Brands.find((id: unknown) => typeof id === "string")
          : undefined;
        const brandRecordId = linkedBrand || await findBrandIdByCode(token, auth.record.code);
        const brandBriefId = await findBriefIdByCode(token, auth.record.code);
        const isVideoStyle = !isDesignStyle;
        if (isVideoStyle && !brandRecordId) {
          return Response.json({ error: "A linked brand is required for video editing." }, { status: 400 });
        }
        if (isVideoStyle && !brandBriefId) {
          return Response.json({ error: "A linked brand brief is required for video editing." }, { status: 400 });
        }
        if (editingStyle === "BROLL" && !textOverlay) {
          return Response.json({ error: "Text overlay is required for BROLL." }, { status: 400 });
        }
        if (editingStyle === "Talking Video" && (!visualHook || !cta)) {
          return Response.json({ error: "Visual Hook and CTA are required for Talking Video." }, { status: 400 });
        }
        let requestStyle: Record<string, string | number | boolean>;
        try {
          requestStyle = safeRequestStyleFields(body?.requestStyle, editingStyle as ProductionStyle);
        } catch (error: any) {
          return Response.json({ error: error?.message || "Invalid editing preferences" }, { status: 400 });
        }

        const contentFormat = editingStyle;
        const savedParts = readContentScript(ownedContent?.fields || {}, contentFormat);
        const supplied = (key: string, fallback: string) => (isJson ? typeof body?.[key] === "string" : q.has(key)) ? pick(key) : fallback;
        const scriptParts = {
          ...savedParts,
          script: supplied("script", savedParts.script),
          visualHook: supplied("visualHook", savedParts.visualHook),
          textOverlay: supplied("textOverlay", savedParts.textOverlay),
          visualCta: supplied("cta", savedParts.visualCta),
          timestamps: supplied("timestamps", savedParts.timestamps),
          creativeDirection: supplied("creativeDirection", savedParts.creativeDirection),
        };
        const firstLine = (textOverlay || visualHook || copy || slideCopy.find((s) => s) || "")
          .split("\n")[0]
          .trim();
        const datePart = new Date().toISOString().slice(0, 10);
        const initialContentFields: Record<string, any> = {
          Name: (firstLine || `${datePart} — ${editingStyle}`).slice(0, 500),
          "Client Status": "In Progress",
          "Post Type": fromLongForm ? LONG_FORM_POST_TYPES[editingStyle as ProductionStyle] : POST_TYPE_BY_STYLE[editingStyle] || editingStyle,
          Source: "Self-edit",
          User: [userRecordId],
        };
        Object.assign(initialContentFields, contentScriptFields(contentFormat, scriptParts));
        if (isDesignStyle) initialContentFields["Script Text"] = copy || slideCopy.filter(Boolean).join("\n\n");
        if (cta && editingStyle === "Talking Video") initialContentFields["CTA Copy"] = cta;
        if (brandRecordId) initialContentFields["Brands"] = [brandRecordId];
        const rawLink = (drive ? `https://drive.google.com/file/d/${drive.id}/view` : "") || driveLink || "";
        if (rawLink) initialContentFields["Google Drive to RAW Files"] = rawLink;
        if (slideCount > 0) initialContentFields["Number of slides"] = slideCount;

        let musicAttachment: { url: string; filename: string } | null = null;
        if (musicFileId) {
          if (!/^[A-Za-z0-9_-]{10,}$/.test(musicFileId)) {
            return Response.json({ error: "Valid music fileId required" }, { status: 400 });
          }
          try {
            const finalizedMusic = await finalizeDriveFile(musicFileId);
            musicAttachment = {
              url: finalizedMusic.url,
              filename: musicFilename || finalizedMusic.filename,
            };
          } catch (error: any) {
            return Response.json(
              { error: error?.message || "Could not attach the music file" },
              { status: 502 },
            );
          }
        }

        const linkedExistingContentId = Array.isArray(existingRequest?.fields?.[EDIT_REQUEST_FIELDS.originalRequest])
          ? String(existingRequest.fields[EDIT_REQUEST_FIELDS.originalRequest][0] || "")
          : "";
        let contentRecordId: string | null = existingContentId || linkedExistingContentId || null;
        let createdContentThisRequest = false;
        let contentWarning: string | undefined;
        if (!contentRecordId) {
          const contentRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ fields: initialContentFields, typecast: true }),
          });
          const contentData: any = await contentRes.json().catch(() => ({}));
          if (!contentRes.ok || !contentData?.id) {
            return Response.json({ error: `Content record failed [${contentRes.status}]: ${JSON.stringify(contentData).slice(0, 200)}` }, { status: 502 });
          }
          contentRecordId = contentData.id;
          createdContentThisRequest = true;
        }

        // Create record with attachment-by-URL (Airtable downloads from the Drive URL).
        // Designs are already produced, so they skip the editing queue.
        const createFields: Record<string, any> = {
          [FIELD_STATUS]: isDesignStyle
            ? workingRequestStatus(editingStyle as ProductionStyle)
            : initialRequestStatus(editingStyle as ProductionStyle),
          [FIELD_EDITING_STYLE]: requestedStyle,
          [FIELD_USER]: [userRecordId],
        };
        createFields[EDIT_REQUEST_FIELDS.requestId] = requestId.slice(0, 255);
        if (brandRecordId) createFields[EDIT_REQUEST_FIELDS.brands] = [brandRecordId];
        if (brandBriefId) createFields[EDIT_REQUEST_FIELDS.brandBrief] = [brandBriefId];
        if (/^rec[A-Za-z0-9]{14}$/.test(contentRecordId || "")) {
          createFields[EDIT_REQUEST_FIELDS.originalRequest] = [contentRecordId];
        }
        if (productionInstructions) {
          createFields[EDIT_REQUEST_FIELDS.instructions] = productionInstructions.slice(0, 10000);
        }
        Object.assign(createFields, requestStyle);
        if (!isDesignStyle) Object.assign(createFields, editScriptFields(contentFormat, scriptParts));
        if (!isDesignStyle) {
          // Full submission snapshot for the "To Edit" dispatcher; replaces any older video_edit.
          const format = videoEditFormat(requestedStyle);
          if (!format) return Response.json({ error: `The editing style "${requestedStyle}" is not set up for video editing.` }, { status: 400 });
          const clipUrls = drive ? (extraDrive.length ? extraDrive : [drive]).map((d) => d.url) : rawClips;
          const posKey = Object.keys(requestStyle).find((k) => /text position/i.test(k));
          let videoEdit: Record<string, unknown>;
          try {
            videoEdit = buildVideoEdit({
              format,
              clips: clipUrls.map((url) => ({ url })),
              visualHook: textOverlay || visualHook,
              visualCta: cta,
              timestamps: scriptParts.timestamps,
              textPosition: posKey ? String(requestStyle[posKey]) : undefined,
              musicUrl: musicAttachment?.url || (music ? (/^https?:\/\//i.test(music) ? music : `https://${music.replace(/^\/+/, "")}`) : undefined),
            });
          } catch (e: any) {
            return Response.json({ error: e?.message || "Check the editing details." }, { status: 400 });
          }
          createFields[EDIT_REQUEST_FIELDS.preferences] = mergeEditingPreferences(requestStyle[EDIT_REQUEST_FIELDS.preferences] ?? existingRequest?.fields?.[EDIT_REQUEST_FIELDS.preferences], videoEdit);
        }
        if (drive) {
          const list = extraDrive.length ? extraDrive : [drive];
          createFields[FIELD_FOOTAGE] = list.map((d) => ({ url: d.url, filename: d.filename }));
          list.slice(0, 3).forEach((d, i) => {
            createFields[FIELD_RAW_CLIPS[i]] = `https://drive.google.com/file/d/${d.id}/view`;
          });
        } else {
          rawClips.slice(0, 3).forEach((c, i) => {
            createFields[FIELD_RAW_CLIPS[i]] = c;
          });
        }

        if (textOverlay) createFields[FIELD_TEXT_OVERLAY] = textOverlay;
        if (visualHook) createFields[FIELD_VISUAL_HOOK] = visualHook;
        if (cta) createFields[FIELD_CTA] = cta;
        // Accept bare links too (spotify.com/…, open.spotify.com/… without a scheme).
        if (music) createFields[FIELD_MUSIC] = /^https?:\/\//i.test(music) ? music : `https://${music.replace(/^\/+/, "")}`;
        // The extracted audio track is attached in this same create call, so the
        // editing automation fires with the file already on the record.
        if (musicAttachment) createFields[FIELD_MUSIC_FILE] = [musicAttachment];

        if (copy) createFields[FIELD_COPY] = copy;
        if (slideCount > 0) createFields[FIELD_SLIDES] = slideCount;
        slideCopy.forEach((s, i) => {
          if (s) createFields[FIELD_SLIDE_COPY[i]] = s;
        });


        const requestUrl = existingRequestId
          ? `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${existingRequestId}`
          : `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}`;
        const createRes = await fetch(requestUrl, {
          method: existingRequestId ? "PATCH" : "POST",
          headers,
          body: JSON.stringify({ fields: createFields, typecast: true }),
        });
        const created: any = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          if (createdContentThisRequest && contentRecordId) {
            await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentRecordId}`, {
              method: "DELETE",
              headers,
            }).catch(() => undefined);
          }
          return Response.json(
            {
              error: `Airtable create failed [${createRes.status}]: ${JSON.stringify(created).slice(0, 400)}`,
              driveUrl: drive?.url,
            },
            { status: 502 }
          );
        }

        // Mirror the request onto the content board right away so it shows up in
        // "To Edit | Design"; the status flips to "To Approve" once it's done.
        try {
          const contentFields: Record<string, any> = { ...initialContentFields };

          // Finished designs land straight on the approval board with the images
          // attached, so nothing else has to be produced.
          if (designImages.length) {
            contentFields["Produced Files"] = designImages.map((d) => ({
              url: d.url,
              filename: d.filename,
            }));
            // Finished graphics and carousel slides belong in Produced Files.
            // They are post media, not separate thumbnails.
            if (copy) contentFields["Cover Copy"] = copy;
            if (editingStyle === "Carousel") {
              const filled = slideCopy.filter((s) => s);
              if (filled.length) {
                contentFields["Cover Copy"] = filled[0];
                if (filled.length > 2) {
                  contentFields["Slides Copy"] = filled
                    .slice(1, -1)
                    .map((s, i) => `Slide ${i + 2}\n${s}`)
                    .join("\n\n");
                }
                if (filled.length > 1) contentFields["CTA Copy"] = filled.at(-1);
              }
            }
            if (cta) contentFields["CTA Copy"] = cta;
          }

          // When the request starts from an existing planner post, update that
          // post instead of creating a second one.
          const ownsExisting = Boolean(contentRecordId);

          if (ownsExisting) {
            delete contentFields.Name;
            delete contentFields.User;
            delete contentFields.Brands;
            const patchRes = await fetch(
              `${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentRecordId}`,
              {
                method: "PATCH",
                headers,
                body: JSON.stringify({ fields: contentFields, typecast: true }),
              },
            );
            const patchData: any = await patchRes.json().catch(() => ({}));
            if (!patchRes.ok) {
              contentWarning = `Content record failed [${patchRes.status}]: ${JSON.stringify(patchData).slice(0, 200)}`;
              console.error(contentWarning);
            } else {
              contentRecordId = contentRecordId || existingContentId;
            }
          }

          // Airtable pulls each image from its Drive link in the background, and
          // an occasional pull is dropped, which leaves a slide missing. Check
          // the record and re-send the full set until every slide is there.
          let allDesignImagesReady = designImages.length === 0;
          if (contentRecordId && designImages.length) {
            const recordUrl = `${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentRecordId}`;
            for (let attempt = 1; attempt <= 3; attempt++) {
              await new Promise((r) => setTimeout(r, attempt * 1500));
              const checkRes = await fetch(recordUrl, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const checkData: any = await checkRes.json().catch(() => ({}));
              if (!checkRes.ok) break;
              const got: any[] = checkData?.fields?.["Produced Files"] || [];
              const ready = got.filter((a) => a?.url && (a?.size ?? 1) > 0);
              if (ready.length >= designImages.length) {
                allDesignImagesReady = true;
                break;
              }
              if (attempt === 3) {
                contentWarning = `Only ${ready.length} of ${designImages.length} slide images attached`;
                console.error(contentWarning);
                break;
              }
              await fetch(recordUrl, {
                method: "PATCH",
                headers,
                body: JSON.stringify({
                  fields: {
                    "Produced Files": designImages.map((d) => ({
                      url: d.url,
                      filename: d.filename,
                    })),
                  },
                  typecast: true,
                }),
              }).catch(() => undefined);
            }
          }
          if (contentRecordId && designImages.length && allDesignImagesReady) {
            await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${CONTENT_TABLE}/${contentRecordId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ fields: { "Client Status": "Approve" }, typecast: true }),
            });
            await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${created?.id || existingRequestId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ fields: { [FIELD_STATUS]: completeRequestStatus(editingStyle as ProductionStyle) }, typecast: true }),
            });
          } else if (contentRecordId && designImages.length && !allDesignImagesReady) {
            await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${created?.id || existingRequestId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ fields: { [FIELD_STATUS]: "Error" }, typecast: true }),
            });
          }
        } catch (e: any) {
          contentWarning = e?.message || "Content record failed";
          console.error(contentWarning);
        }

        return Response.json({
          ok: true,
          recordId: created?.id || existingRequestId,
          contentRecordId,
          warning: contentWarning,
          driveUrl: drive?.url || driveLink,
        });
      },

      PATCH: async ({ request }) => {
        const token = process.env.AIRTABLE_TOKEN;
        if (!token) return Response.json({ error: "AIRTABLE_TOKEN not configured" }, { status: 500 });
        const accessCode = request.headers.get("x-access-code") || "";
        const auth = await requireAccessCode(accessCode);
        if (!auth.ok) return auth.response;

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
        const id = String(body?.id || "");
        const status = String(body?.status || "");
        if (!id || !status) return Response.json({ error: "id and status required" }, { status: 400 });
        const allowedStatuses = ["To Edit", "To Design", "Editing", "Designing", "Edited", "Designed", "Error", "Re-do", "Deleted"];
        if (!allowedStatuses.includes(status)) {
          return Response.json({ error: "Invalid production status" }, { status: 400 });
        }

        // Ownership check.
        const getRes = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const existing: any = await getRes.json().catch(() => ({}));
        if (!getRes.ok) return Response.json({ error: `Airtable [${getRes.status}]` }, { status: 502 });
        if (auth.record.userType.toLowerCase() !== "admin") {
          const ownerId = await resolveOwnerId(auth.record, token);
          if (!ownsRecord(existing?.fields?.[FIELD_USER], ownerId)) {
            return Response.json({ error: "Not allowed" }, { status: 403 });
          }
        }

        const res = await fetch(`${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}/${id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { [FIELD_STATUS]: status }, typecast: true }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          return Response.json({ error: `Update failed [${res.status}]: ${JSON.stringify(data).slice(0, 300)}` }, { status: 502 });
        }
        return Response.json({ ok: true, status });
      },

    },
  },
});

