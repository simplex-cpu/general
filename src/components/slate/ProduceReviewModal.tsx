import { editingStyleFor, isLongFormType } from "@/lib/slate/longFormTypes";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Paperclip,
  Trash2,
  X,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PhonePreviewStyle } from "./StylePhonePreview";
import { VideoProductionWorkspace, type PreviewClip } from "./VideoProductionWorkspace";
import { videoBrandStyle, initialVideoHook, videoScriptParts, videoRequestText, videoFootageReady, createProductionSubmission } from "@/lib/slate/videoProduction";
import { requestStyleFields, graphicRequestStyleFields, stablePlannerRequestId } from "@/lib/slate/productionRequest";
import { graphicFrameStyle } from "@/lib/slate/brandVisualStyle";
import DesignPreview from "./DesignPreview";
import { designSlide, svgToPngFile } from "@/lib/slate/aiDesignClient";
import {
  buildCarouselFrames,
  buildGraphicFrame,
  normalizeVerticalAlign,
  renderFramesToFiles,
  renderFrameToFile,
  type DesignFrame,
  type FrameStyle,
} from "@/lib/slate/designFrames";
import { uploadDirectToDrive } from "@/lib/driveDirectUpload";
import { AttachBox } from "./post/AttachBox";
import { checkAttachments, limitFor } from "@/lib/slate/attachLimits";
import { CollapsibleField } from "./post/CollapsibleField";
import type { DesignSubtype } from "@/lib/slate/designTemplates";
import {
  FIELD_LABELS,
  fieldsToStructured,
  parseCarouselCopy,
  serializeCarouselCopy,
  slideHasCopy,
  serializeSlide,
  slideKind,
  slideFieldOrder,
  type SlideFields,
} from "@/lib/slate/slideFields";
import type { HorizontalAlign, VerticalAlign } from "@/lib/slate/designFrames";

export type ReviewPost = {
  id: string;
  postName: string;
  postType: string;
  postingDate: string;
  script?: string;
  slidesCopy?: string;
  coverCopy?: string;
  ctaCopy?: string;
  visualHook?: string;
  textOverlay?: string;
  visualCta?: string;
  timestamps?: string;
  creativeDirection?: string;
  longFormIds?: string[];
  rawFilesLink: string;
  producedFiles?: { url: string; filename: string }[];
};

type ProductionStyle = "BROLL" | "Talking Video" | "Graphic" | "Carousel";
type ProductionScreen = "choice" | "dwy" | "risevoice";

/** The editing / design style that matches this post's format. */
export function styleForPost(postType: string, visualHook?: string): ProductionStyle {
  const t = postType || "";
  if (/carousel/i.test(t)) return "Carousel";
  if (/graphic/i.test(t)) return "Graphic";
  if (/talking/i.test(t) || (visualHook || "").trim()) return "Talking Video";
  return "BROLL";
}

const STYLE_LABEL: Record<ProductionStyle, string> = {
  BROLL: "BROLL video edit",
  "Talking Video": "Talking video edit",
  Graphic: "Graphic design",
  Carousel: "Carousel design",
};

/** The words already written for the post, split into what this style needs. */
function splitSlides(script: string): string[] {
  const parts = (script || "")
    .split(/\n\s*\n/)
    .map((s) => s.replace(/^\s*(slide\s*\d+|cover)\s*[:\-]?\s*/i, "").trim())
    .filter(Boolean);
  return parts.length ? parts.slice(0, 10) : [""];
}

type Uploaded = { fileId: string; filename: string; contentType: string };

const FALLBACK_PREVIEW_STYLE: PhonePreviewStyle = {
  hookFont: "Poppins, weight 700",
  captionFont: "Poppins, weight 600",
  hookColor: "#FFFFFF",
  captionColor: "#FFFFFF",
  hookBacking: "transparent",
  captionBacking: "transparent",
};

export function ProduceReviewModal({
  accessCode,
  post,
  initialHandler,
  onClose,
  onDone,
  onDiyDesign,
}: {
  /** Designs: hand DIY off to the planner's Template / AI design choice. */
  onDiyDesign?: () => void;
  accessCode: string;
  post: ReviewPost;
  initialHandler?: "risevoice" | "myself";
  onClose: () => void;
  /** Called after the post has moved on, so the planner can refresh. */
  onDone: (patch?: { clientStatus?: string; requestType?: string }) => void;
}) {
  const style = styleForPost(post.postType, post.visualHook);
  const isDesign = style === "Graphic" || style === "Carousel";
  const isCarousel = style === "Carousel";
  const isTalking = style === "Talking Video";

  // Designs start from the post's slide/cover copy, never the spoken script.
  const savedVideo = isDesign ? null : videoScriptParts(post.script || "");
  const initialScript = (
    isDesign ? post.slidesCopy || post.coverCopy || post.script || "" : isTalking ? post.script || "" : post.textOverlay ?? savedVideo?.body ?? ""
  ).trim();
  const [script, setScript] = useState(
    initialScript,
  );
  const [videoHook, setVideoHook] = useState(() =>
    post.visualHook !== undefined ? post.visualHook : initialVideoHook(initialScript, savedVideo?.hook),
  );
  const [ctaText, setCtaText] = useState(() => post.visualCta?.trim() || post.ctaCopy?.trim() || "");
  const submission = useRef(createProductionSubmission());
  const actionLock = useRef(false);
  const [requestSaved, setRequestSaved] = useState(false);
  const [previewClips, setPreviewClips] = useState<PreviewClip[]>([]);
  const clipUrls = useRef(new Set<string>());
  useEffect(() => () => { clipUrls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const initialParts = isCarousel
    ? splitSlides([post.coverCopy, post.slidesCopy, post.ctaCopy].filter(Boolean).join("\n\n"))
    : [];
  const subtypeMarker = /design type:\s*(quote|insightful)/i.exec(post.script || "")?.[1]?.toLowerCase();
  const inferredSubtype: DesignSubtype = subtypeMarker === "insightful" || (!subtypeMarker && (isCarousel
    ? initialParts.length >= 8
    : initialScript.split(/\n+/).filter(Boolean).length > 1)) ? "insightful" : "quote";
  const fixedSlideCount = isCarousel ? (inferredSubtype === "insightful" ? 10 : 6) : 1;
  const [slides, setSlides] = useState<SlideFields[]>(() =>
    isCarousel ? parseCarouselCopy(post, fixedSlideCount) : [],
  );
  const updateSlide = (i: number, key: keyof SlideFields, value: string) =>
    setSlides((prev) => prev.map((v, idx) => (idx === i ? { ...v, [key]: value } : v)));
  // Open the chosen route immediately; Back from DWY returns to a clean choice screen.
  const [activeSlide, setActiveSlide] = useState(0);
  const [inspector, setInspector] = useState<"copy" | "settings">("copy");
  const [screen, setScreen] = useState<ProductionScreen>(
    initialHandler === "myself" ? "dwy" : initialHandler === "risevoice" ? "risevoice" : "choice",
  );
  // Backdrop photo vs brand background, and per-design layout overrides.
  const [backdrop, setBackdrop] = useState<"brand" | "photo">("brand");
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);
  const [layout, setLayout] = useState<{
    coverAlign?: VerticalAlign;
    slidesAlign?: VerticalAlign;
    horizontalAlign?: HorizontalAlign;
    coverBackground?: string;
    coverBackgroundEnd?: string;
    slidesBackground?: string;
  }>({});
  const [footageLink, setFootageLink] = useState(post.rawFilesLink || "");
  const [footageOpen, setFootageOpen] = useState(false);
  // Is the pasted folder actually readable, and does it hold any files?
  const [linkCheck, setLinkCheck] = useState<{
    status: "" | "ok" | "empty" | "unreachable" | "unknown" | "invalid";
    fileCount: number;
  }>({ status: "", fileCount: 0 });
  const [checkingLink, setCheckingLink] = useState(false);

  const [files, setFiles] = useState<Uploaded[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [brandStyle, setBrandStyle] = useState<FrameStyle | null>(null);
  const [brandStyleReady, setBrandStyleReady] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<PhonePreviewStyle>(FALLBACK_PREVIEW_STYLE);
  const styleDirty = useRef(false);

  const [busy, setBusy] = useState<"" | "risevoice" | "myself">("");
  const [progress, setProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<"" | "risevoice" | "myself">("");
  /** DIY video submit progress: 0 idle, 1 saving request, 2 updating card, -1 failed. */
  const [submitStep, setSubmitStep] = useState(0);
  // Editorial AI designs: one SVG per slide, tied to the copy it was made from.
  const [aiOn, setAiOn] = useState(false);
  const [aiSlides, setAiSlides] = useState<Record<number, { svg: string | null; sig: string }>>({});
  const [aiWorking, setAiWorking] = useState<number | null>(null);
  const [aiError, setAiError] = useState("");

  // Brand look, so the preview matches what will be produced.
  useEffect(() => {
    if (!accessCode) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/my-brief", { headers: { "x-access-code": accessCode } });
        const j: any = await r.json().catch(() => ({}));
        const f = j?.brief?.fields;
        if (!alive || !r.ok || !f) return;
        setBrandStyle(graphicFrameStyle(f, !isCarousel));
        if (!styleDirty.current) setPreviewStyle(videoBrandStyle(f));
      } catch {
        /* the neutral look is fine */
      } finally {
        if (alive) setBrandStyleReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessCode, isCarousel]);

  const frames: DesignFrame[] | null = useMemo(() => {
    if (!isDesign) return null;
    const fs: FrameStyle =
      brandStyle ||
      ({
        titleFont: "",
        bodyFont: "",
        coverBackground: "",
        slidesBackground: "",
        titleColor: "",
        subtitleColor: "",
        textColor: "",
      } as FrameStyle);
    const merged: FrameStyle = { ...fs };
    (Object.keys(layout) as (keyof typeof layout)[]).forEach((k) => {
      if (layout[k]) (merged as any)[k] = layout[k];
    });
    const photoUrl = backdrop === "photo" ? photo?.url : undefined;
    if (isCarousel) {
      return buildCarouselFrames(fieldsToStructured(slides), merged, inferredSubtype, photoUrl);
    }
    return [buildGraphicFrame(script, merged, photoUrl, inferredSubtype)];
  }, [isDesign, isCarousel, slides, script, brandStyle, inferredSubtype, layout, backdrop, photo]);
  const frameSig = (f: DesignFrame) => JSON.stringify([f.background, f.backgroundEnd, f.blocks.map((b) => [b.text, b.font, b.color])]);
  const aiFor = (i: number) => {
    const entry = aiSlides[i];
    return aiOn && entry?.svg && frames?.[i] && entry.sig === frameSig(frames[i]) ? entry.svg : null;
  };
  async function runAiDesign(only?: number) {
    if (!frames?.length || aiWorking !== null) return;
    setAiOn(true);
    setAiError("");
    const targets = only !== undefined ? [only] : frames.map((_, i) => i);
    for (const i of targets) {
      setAiWorking(i);
      try {
        const svg = await designSlide(frames, i, accessCode);
        setAiSlides((prev) => ({ ...prev, [i]: { svg, sig: frameSig(frames[i]) } }));
        if (!svg) setAiError(`Slide ${i + 1} kept the standard layout because the AI design didn't fit cleanly.`);
      } catch (e: any) {
        // Credit, permission and refusal errors stop the run; nothing is retried automatically.
        setAiError(e?.message || "The design could not be created right now.");
        break;
      }
    }
    setAiWorking(null);
  }
  const effective = {
    coverAlign: layout.coverAlign || brandStyle?.coverAlign || "center",
    slidesAlign: layout.slidesAlign || brandStyle?.slidesAlign || "center",
    horizontalAlign: layout.horizontalAlign || frames?.[0]?.align || "center",
    coverBackground: layout.coverBackground || frames?.[0]?.background || "#1A1A1D",
    coverBackgroundEnd: layout.coverBackgroundEnd ?? brandStyle?.coverBackgroundEnd ?? "",
    slidesBackground: layout.slidesBackground || frames?.[1]?.background || "#F6F6F7",
  };

  // Check the footage folder whenever the link changes (videos only).
  useEffect(() => {
    const link = footageLink.trim();
    if (isDesign || !link) {
      setLinkCheck({ status: "", fileCount: 0 });
      setCheckingLink(false);
      return;
    }
    let alive = true;
    setCheckingLink(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/check-footage-link", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({ link }),
        });
        const j: any = await r.json().catch(() => ({}));
        if (!alive) return;
        setLinkCheck({
          status: (j?.status as any) || "unknown",
          fileCount: Number(j?.fileCount) || 0,
        });
      } catch {
        if (alive) setLinkCheck({ status: "unknown", fileCount: 0 });
      } finally {
        if (alive) setCheckingLink(false);
      }
    }, 500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [footageLink, isDesign, accessCode]);


  const hasFootage = isDesign ? !!footageLink.trim() || files.length > 0 : videoFootageReady(files.length, footageLink, linkCheck.status, checkingLink);
  const scriptReady = isCarousel ? slides.some(slideHasCopy) : isTalking ? !!videoHook.trim() : !!script.trim();
  const linkBlocked = linkCheck.status === "unreachable" || linkCheck.status === "empty" || linkCheck.status === "invalid";
  const canSubmit =
    scriptReady && (isDesign || (hasFootage && brandStyleReady && (!isTalking || (!!videoHook.trim() && !!ctaText.trim())))) && !busy && (files.length > 0 || (!checkingLink && !linkBlocked));


  /** The words as one readable block, stored back on the post. */
  function scriptText() {
    if (isCarousel) {
      const c = serializeCarouselCopy(slides);
      return [c.coverCopy && `Cover\n${c.coverCopy}`, c.slidesCopy, c.ctaCopy && `Slide ${slides.length}\n${c.ctaCopy}`].filter(Boolean).join("\n\n");
    }
    return script.trim();
  }

  async function pickFiles(picked: FileList | null) {
    if (actionLock.current) return;
    const list = picked ? Array.from(picked) : [];
    if (fileRef.current) fileRef.current.value = "";
    if (!list.length) return;
    if (!isDesign && list.some(file => !file.type.startsWith("video/"))) { setError("Please attach video files."); return; }
    { const limErr = checkAttachments(post.postType, [...files, ...list]); if (limErr) { setError(limErr); return; } }
    actionLock.current = true;
    const localClips = isDesign ? [] : list.map(file => { const url = URL.createObjectURL(file); clipUrls.current.add(url); return { id: crypto.randomUUID(), url, name: file.name, state: "uploading" as const }; });
    setPreviewClips(prev => [...prev, ...localClips]);
    setError("");
    setBusy("myself");
    setProgressNote("Uploading your footage…");
    try {
      for (let i = 0; i < list.length; i++) {
        const up = await uploadDirectToDrive(list[i], accessCode, (p) =>
          setProgress(Math.round(((i + p / 100) / list.length) * 100)),
        );
        setFiles(prev => [...prev, { fileId: up.fileId, filename: up.filename, contentType: up.contentType }]);
        const clip = localClips[i];
        if (clip) setPreviewClips(prev => prev.map(c => c.id === clip.id ? { ...c, state: "ready", fileId: up.fileId } : c));
      }
    } catch (e: any) {
      setPreviewClips(prev => prev.map(c => c.state === "uploading" ? { ...c, state: "failed" } : c));
      setError(e?.message || "That upload did not go through. Please try again.");
    } finally {
      actionLock.current = false;
      setBusy("");
      setProgress(0);
      setProgressNote("");
    }
  }

  /** Hand the post to Risevoice: it moves to Production. */
  async function requestRisevoice() {
    if (actionLock.current || !canSubmit) return;
    actionLock.current = true;
    setBusy("risevoice");
    setError("");
    try {
      if (photo) {
        setProgressNote("Attaching your backdrop photo…");
        const uploaded = await uploadDirectToDrive(photo.file, accessCode, setProgress);
        const attachment = await fetch("/api/dwy-content-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({ recordId: post.id, field: "Thumbnail", fileId: uploaded.fileId, filename: uploaded.filename, multiple: false }),
        });
        if (!attachment.ok) throw new Error("We could not attach your backdrop photo.");
      }
      // Designs save their words into the slide/cover copy fields they were
      // loaded from — writing them back as `script` would lose the edits.
      const fields: Record<string, any> = {
        clientStatus: "In Progress",
        requestType: "Risevoice Request",
      };
      if (isDesign) {
        if (isCarousel) {
          Object.assign(fields, serializeCarouselCopy(slides));
        } else {
          fields.coverCopy = script.trim();
        }
      } else {
        Object.assign(fields, { script: isTalking ? script.trim() : "", visualHook: isTalking ? videoHook.trim() : "", textOverlay: isTalking ? "" : script.trim(), visualCta: isTalking ? ctaText.trim() : "", timestamps: post.timestamps || "", creativeDirection: post.creativeDirection || "" });
      }
      if (footageLink.trim()) fields.rawFilesLink = footageLink.trim();
      const res = await fetch("/api/dwy-client-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ id: post.id, fields }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "We could not send your request.");
      setDone("risevoice");
      onDone({ clientStatus: "In Progress", requestType: "Risevoice Request" });
    } catch (e: any) {
      setError(e?.message || "We could not send your request. Please try again.");
    } finally {
      actionLock.current = false;
      setBusy("");
    }
  }

  /** Produce it yourself: creates the do-it-myself request for this post. */
  async function doItMyself() {
    if (actionLock.current || (!canSubmit && !requestSaved)) return;
    actionLock.current = true;
    setBusy("myself");
    setError("");
    setProgress(0);
    if (!isDesign) setSubmitStep(requestSaved ? 2 : 1);
    try {
      await submission.current.run(async () => {
      // Style choices are request-specific. Do not overwrite the brand-wide defaults.
      const payload: Record<string, any> = {
        accessCode,
        contentId: post.id,
        requestId: stablePlannerRequestId(post.id),
        requestType: isDesign ? "Design" : "Video Edit",
        editingStyle: editingStyleFor(style as ProductionStyle, Boolean(post.longFormIds?.length) || isLongFormType(post.postType || "")),
        videoFormat: style,
        script: isTalking ? script.trim() : "",
        timestamps: post.timestamps || "",
        creativeDirection: post.creativeDirection || "",
        designSubtype: isDesign ? inferredSubtype : "",
        ...(isDesign ? { textOverlay: "", visualHook: "" } : videoRequestText(isTalking ? "Talking Video" : "BROLL", script, videoHook)),
        copy: style === "Graphic" ? script.trim() : "",
        cta: isCarousel ? slides.at(-1)?.subtitle.trim() || "" : isTalking ? ctaText.trim() : post.ctaCopy?.trim() || "",
        slideCount: isCarousel ? fixedSlideCount : 0,
        slideCopy: isCarousel
          ? slides.map((s, i) => serializeSlide(s, slideKind(i, slides.length)))
          : [],
        aestheticsApproved: true,
        requestStyle: !isDesign
          ? requestStyleFields(previewStyle, {
              talking: isTalking,
              styleSampleEnabled: true,
              textPosition: isTalking ? "top" : "center",
            })
          : graphicRequestStyleFields({ ...(brandStyle || graphicFrameStyle({})), ...Object.fromEntries(Object.entries(layout).filter(([, value]) => value !== undefined && value !== "")) }),
      };

      if (files.length) {
        payload.files = files;
        payload.fileId = files[0].fileId;
        payload.filename = files[0].filename;
        payload.contentType = files[0].contentType;
      } else if (footageLink.trim()) {
        payload.driveLink = footageLink.trim();
        payload.rawClips = [footageLink.trim()];
      }

      // Designs are produced in the browser and uploaded as finished images.
      if (frames?.length) {
        setProgressNote("Creating your images…");
        const keep = frames.map((_, i) => i).filter((i) => !isCarousel || (slides[i] && slideHasCopy(slides[i])));
        const prefix = isCarousel ? "carousel" : "graphic";
        const rendered = aiOn
          ? await Promise.all(keep.map((i, n) => {
              const name = keep.length === 1 ? `${prefix}.png` : `${prefix}-${String(n + 1).padStart(2, "0")}.png`;
              const svg = aiFor(i);
              return svg ? svgToPngFile(svg, frames, name) : renderFrameToFile(frames[i], name);
            }))
          : await renderFramesToFiles(keep.map((i) => frames[i]), prefix);
        const out: Uploaded[] = [];
        for (let i = 0; i < rendered.length; i++) {
          const up = await uploadDirectToDrive(rendered[i], accessCode, (p) =>
            setProgress(Math.round(((i + p / 100) / rendered.length) * 100)),
          );
          out.push({ fileId: up.fileId, filename: up.filename, contentType: up.contentType });
        }
        payload.renderedFiles = out;
        payload.files = [...(payload.files || []), ...out];
        payload.fileId = payload.fileId || out[0]?.fileId;
        payload.filename = payload.filename || out[0]?.filename;
        payload.contentType = payload.contentType || out[0]?.contentType;
      }

      setProgressNote("Saving your request…");
      const res = await fetch("/api/dwy-edit-yourself", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify(payload),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "We could not save your request.");
      setRequestSaved(true);
      }, async () => {
      if (!isDesign) setSubmitStep(2);
      // Retry only this synchronization if request creation succeeded.
      const sync = await fetch("/api/dwy-client-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        // Designs are finished here, so they go straight to approval.
        body: JSON.stringify({
          id: post.id,
          fields: {
            clientStatus: isDesign ? "Approve" : "In Progress",
            requestType: "Do it Myself",
            ...(isCarousel
              ? serializeCarouselCopy(slides)
              : isDesign
                ? { coverCopy: script.trim() }
                : { script: isTalking ? script.trim() : "", visualHook: isTalking ? videoHook.trim() : "", textOverlay: isTalking ? "" : script.trim(), visualCta: isTalking ? ctaText.trim() : "", timestamps: post.timestamps || "", creativeDirection: post.creativeDirection || "" }),
          },
        }),
      });
      if (!sync.ok) throw new Error("Your request is saved, but the planner could not refresh. Retry to finish saving; no second request will be created.");
      });
      setSubmitStep(0);
      setDone("myself");
      onDone({ clientStatus: isDesign ? "Approve" : "In Progress", requestType: "Do it Myself" });
    } catch (e: any) {
      if (!isDesign) setSubmitStep(-1);
      setError(e?.message || "We could not save your request. Please try again.");
    } finally {
      actionLock.current = false;
      setBusy("");
      setProgress(0);
      setProgressNote("");
    }
  }

  const scriptLabel = isCarousel
    ? "Slide copy"
    : style === "Graphic"
      ? "Copy"
      : isTalking
        ? "Visual hook"
        : "Text overlay";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#0B0B0F]/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog" aria-modal="true" aria-label={post.postName || "Production editor"}
        className={`my-2 flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-2xl border border-brand-line bg-brand-surface text-brand-ink shadow-xl ${screen === "dwy" ? "h-[calc(100dvh-1rem)] max-w-[1080px]" : "max-w-[680px]"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
              <Check size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {done === "risevoice" ? "Your request is in" : "All set"}
            </h3>
            <p className="mt-2 text-sm text-brand-ink-soft">
              {done === "risevoice"
                ? "Risevoice is on it. You'll find this post under Production, and we'll post any questions in its comments."
                : isDesign
                  ? "Your design is ready and waiting for you under To Approve."
                  : "Your video is now Editing. The AI editor is working on it — you’ll review the finished video under To Approve."}
            </p>
            <Button variant="outline"
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-surface hover:bg-brand-blue-mid"
            >
              Close
            </Button>
          </div>
        ) : submitStep !== 0 ? (
          <div className="p-8">
            <h3 className="text-center text-lg font-semibold">{submitStep === -1 ? "Something went wrong" : "Sending your video to editing"}</h3>
            <ol className="mx-auto mt-6 max-w-xs space-y-3">
              {[["Footage uploaded", 1], ["Saving your request", 1], ["Moving your card to Editing", 2]].map(([label, at], i) => {
                const failedAt = submitStep === -1 ? (requestSaved ? 2 : 1) : 0;
                const doneStep = i === 0 || (submitStep === -1 ? (at as number) < failedAt : (at as number) < submitStep);
                const active = !doneStep && (submitStep === -1 ? at === failedAt : at === submitStep);
                return <li key={i} className="flex items-center gap-3 text-sm">
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${doneStep ? "border-brand-accent bg-brand-accent text-brand-surface" : active && submitStep === -1 ? "border-destructive text-destructive" : "border-brand-line text-brand-ink-soft"}`}>
                    {doneStep ? <Check size={13} /> : active && submitStep !== -1 ? <Loader2 size={13} className="animate-spin" /> : active ? <X size={13} /> : i + 1}
                  </span>
                  <span className={doneStep || active ? "text-brand-ink" : "text-brand-ink-soft"}>{label as string}</span>
                </li>;
              })}
            </ol>
            {submitStep === -1 && <>
              {error && <p role="alert" className="mt-5 text-center text-sm text-destructive">{error}</p>}
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" type="button" onClick={() => setSubmitStep(0)} className="border-brand-line bg-brand-surface text-brand-ink">Back</Button>
                <Button type="button" onClick={() => void doItMyself()} className="bg-brand-accent text-brand-surface hover:bg-brand-blue-mid">Retry</Button>
              </div>
            </>}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-brand-line px-4 py-2">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold">{post.postName || "Untitled"}</h3>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-brand-ink-soft">
                  <span className="rounded-full bg-brand-wash px-2 py-0.5 font-medium text-brand-blue-mid">
                    {STYLE_LABEL[style]}
                  </span>
                  <span className="rounded-full bg-brand-wash px-2 py-0.5 text-brand-ink-mid">
                    1 post
                  </span>
                  {post.postingDate && <span>{post.postingDate.slice(0, 10)}</span>}
                </div>
              </div>
              <Button variant="outline"
                onClick={onClose}
                disabled={!!busy}
                className="border-brand-line bg-brand-surface text-brand-ink-soft hover:bg-brand-wash hover:text-brand-ink"
                aria-label="Close"
              >
                <X size={18} />
              </Button>
            </div>

            {screen === "choice" ? (
              <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center">
                <div>
                  <h4 className="text-lg font-semibold text-brand-ink">Choose who will produce this post</h4>
                  <p className="mt-2 text-sm text-brand-ink-soft">Select one path to continue.</p>
                </div>
                <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button type="button" onClick={() => (isDesign && onDiyDesign ? onDiyDesign() : setScreen("dwy"))} className="h-12 rounded-lg bg-brand-accent font-semibold text-brand-surface hover:bg-brand-blue-mid">
                    {isDesign ? "DIY Design" : "DIY Edit"}
                  </Button>
                  <Button variant="outline" type="button" onClick={() => setScreen("risevoice")} className="h-12 rounded-lg border-brand-line bg-brand-surface font-semibold text-brand-accent hover:bg-brand-wash">
                    Assign to Risevoice
                  </Button>
                </div>
              </div>
            ) : screen === "risevoice" ? (
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-ink-soft">Confirm the copy</div>
                  {isCarousel ? (
                    <div className="space-y-2">
                      {slides.map((slide, index) => {
                        const kind = slideKind(index, slides.length);
                        return (
                          <CollapsibleField key={index} title={kind === "cover" ? "Cover" : kind === "cta" ? "Closing" : `Slide ${index}`} preview={slide.title}>
                            <div className="whitespace-pre-wrap text-sm text-brand-ink">{serializeSlide(slide, kind)}</div>
                          </CollapsibleField>
                        );
                      })}
                    </div>
                  ) : (
                    isTalking ? (
                    <div className="space-y-3">
                      <label className="block text-[12px] font-medium text-brand-ink">Visual hook<textarea value={videoHook} onChange={(e) => setVideoHook(e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-brand-line p-3 text-sm outline-none focus:border-brand-accent" /></label>
                      <label className="block text-[12px] font-medium text-brand-ink">Visual CTA<input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="mt-1.5 h-9 w-full rounded-xl border border-brand-line px-3 text-sm outline-none focus:border-brand-accent" /></label>
                    </div>
                    ) : (
                    <label className="block text-[12px] font-medium text-brand-ink">{isDesign ? "Copy" : "Text overlay"}<textarea value={script} onChange={(e) => setScript(e.target.value)} rows={isDesign ? 8 : 5} className="mt-1.5 w-full rounded-xl border border-brand-line p-3 text-sm outline-none focus:border-brand-accent" /></label>
                    )
                  )}
                  {!isDesign && !!post.timestamps?.trim() && (
                    <div className="mt-3 rounded-xl border border-brand-line bg-brand-wash/40 p-3">
                      <div className="text-[12px] font-medium text-brand-ink">Clip seconds to use</div>
                      <ul className="mt-1.5 space-y-0.5">{post.timestamps.split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t, i) => <li key={i} className="font-mono text-xs tabular-nums text-brand-ink-mid">{t}</li>)}</ul>
                    </div>
                  )}
                </div>
                {isDesign && (
                  <div className="rounded-xl border border-brand-line p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-ink-soft">Optional backdrop photo</div>
                    <p className="mt-2 text-[12px] leading-relaxed text-brand-ink-soft">{isCarousel ? "Use one natural, everyday photo with plenty of clear space for text. Avoid close-ups; a headshot also works well." : "Use a clear supporting or brand image with enough open space for the design copy."}</p>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (photoRef.current) photoRef.current.value = ""; if (f) { setPhoto({ file: f, url: URL.createObjectURL(f) }); setBackdrop("photo"); } }} />
                    <Button variant="outline" type="button" onClick={() => photoRef.current?.click()} className="mt-3 border-brand-line bg-brand-surface text-brand-accent hover:bg-brand-wash"><Paperclip size={14} />{photo ? `Change ${photo.file.name}` : "Attach backdrop photo"}</Button>
                  </div>
                )}
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-ink-soft">Raw footage</div>
                    <AttachBox accept={limitFor(post.postType)?.accept} multiple={(limitFor(post.postType)?.max ?? 2) > 1} disabled={!!busy} uploading={busy === "myself"} pct={progress} onFiles={(f) => void pickFiles(f)} link={footageLink} onLink={setFootageLink}
                      items={files.map((f) => ({ key: f.fileId, name: f.filename, onRemove: () => setFiles((prev) => prev.filter((x) => x.fileId !== f.fileId)) }))} />
                    {!hasFootage && <p className="mt-2 text-[12px] text-[#8A5B12]">Add footage before sending this request.</p>}
                  </div>
                {error && <p className="text-sm text-[#B42318]">{error}</p>}
              </div>
            ) : !isDesign ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <VideoProductionWorkspace clips={previewClips} onRemove={clip => { setPreviewClips(prev => prev.filter(c => c.id !== clip.id)); setFiles(prev => prev.filter(f => f.fileId !== clip.fileId)); URL.revokeObjectURL(clip.url); clipUrls.current.delete(clip.url); }} onFiles={picked => void pickFiles(picked)} link={footageLink} onLink={setFootageLink} checking={checkingLink} linkStatus={linkCheck.status} script={script} onScript={setScript} hook={videoHook} onHook={setVideoHook} cta={ctaText} onCta={setCtaText} timestamps={post.timestamps || ""} talking={isTalking} style={previewStyle} onStyle={next => { styleDirty.current = true; setPreviewStyle(next); }} brandReady={brandStyleReady} busy={!!busy} frozen={requestSaved} />
                {progressNote && <p role="status" className="px-6 py-3 text-sm text-brand-ink-soft">{progressNote}{progress > 0 ? ` ${progress}%` : ""}</p>}
                {error && <p role="alert" className="px-6 py-3 text-sm text-destructive">{error}</p>}
              </div>
            ) : (
            <div className={`min-h-0 overflow-y-auto ${isDesign ? "grid lg:grid-cols-[minmax(0,1fr)_400px]" : "space-y-5 px-6 py-5"}`}>
              {/* Live preview of what will be produced */}
              <div className={isDesign ? "flex min-w-0 items-center justify-center bg-brand-wash px-6 py-8 lg:sticky lg:top-0 lg:self-start" : "flex justify-center rounded-xl border border-brand-line bg-brand-wash py-4"}>
                {isDesign && !brandStyleReady ? (
                  <div className="flex min-h-[520px] w-full items-center justify-center text-sm text-brand-ink-soft"><Loader2 className="mr-2 animate-spin" />Loading your brand design…</div>
                ) : isDesign && frames?.length ? (
                  <div className="flex flex-col items-center gap-3">
                    {aiOn && <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-accent">AI design</div>}
                    {aiOn && !aiSlides[activeSlide]?.svg && aiWorking !== null ? (
                      <div className="flex items-center justify-center rounded-md border border-dashed border-brand-line bg-brand-surface text-sm text-brand-ink-soft" style={{ width: 360, height: 450 }}>
                        <Loader2 size={16} className="mr-2 animate-spin" />Designing slide {activeSlide + 1}…
                      </div>
                    ) : aiOn && aiSlides[activeSlide]?.svg ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="overflow-hidden rounded-md shadow-lg [&>svg]:h-full [&>svg]:w-full" style={{ width: 360, height: 450 }} dangerouslySetInnerHTML={{ __html: aiSlides[activeSlide]!.svg! }} />
                        {frames.length > 1 && (
                          <div className="flex items-center gap-2 text-xs text-brand-ink-soft">
                            <Button type="button" size="sm" variant="outline" disabled={activeSlide === 0} onClick={() => setActiveSlide(activeSlide - 1)}>Previous</Button>
                            <span className="tabular-nums">{activeSlide + 1} / {frames.length}</span>
                            <Button type="button" size="sm" variant="outline" disabled={activeSlide >= frames.length - 1} onClick={() => setActiveSlide(activeSlide + 1)}>Next</Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <DesignPreview frames={frames} width={360} index={activeSlide} onIndexChange={setActiveSlide} />
                    )}
                    {aiWorking !== null && <p role="status" className="flex items-center gap-2 text-xs text-brand-ink-soft"><Loader2 size={12} className="animate-spin" />Designing slide {aiWorking + 1} of {frames.length}…</p>}
                    {aiOn && aiWorking === null && aiSlides[activeSlide]?.svg && !aiFor(activeSlide) && <p className="rounded-md bg-[#FFFBF2] px-2 py-1 text-xs text-[#8A5A00]">Out of date — redesign this slide to match the new copy.</p>}
                    {aiError && <p role="alert" className="max-w-[360px] text-center text-xs text-destructive">{aiError}</p>}
                  </div>
                ) : (
                  <Loader2 className="animate-spin text-brand-ink-soft" />
                )}
              </div>

              <div className={isDesign ? "min-w-0 border-brand-line p-5 lg:border-l" : "space-y-5"}>
              {isDesign && !aiOn && (
                <div className="mb-5 flex gap-2 border-b border-brand-line pb-4" role="tablist" aria-label="Design controls">
                  <Button variant="outline" role="tab" aria-selected={inspector === "copy"} onClick={() => setInspector("copy")} className={`h-8 flex-1 rounded-none border-0 border-b-2 bg-transparent text-[12px] font-medium shadow-none hover:bg-transparent ${inspector === "copy" ? "border-brand-accent text-brand-ink" : "border-transparent text-brand-ink-soft"}`}><Type /> Copy</Button>
                  <Button variant="outline" role="tab" aria-selected={inspector === "settings"} onClick={() => setInspector("settings")} className={`h-8 flex-1 rounded-none border-0 border-b-2 bg-transparent text-[12px] font-medium shadow-none hover:bg-transparent ${inspector === "settings" ? "border-brand-accent text-brand-ink" : "border-transparent text-brand-ink-soft"}`}><SlidersHorizontal /> Photo & layout</Button>
                </div>
              )}
              {/* The words — editable, straight from the post */}
              {(!isDesign || aiOn || inspector === "copy") && <div>
                <div className="mb-2 text-[11px] font-semibold tracking-wide text-brand-ink-soft uppercase">
                  {scriptLabel}
                </div>
                {isCarousel ? (
                  <div className="space-y-3">
                    {slides.slice(activeSlide, activeSlide + 1).map((s) => {
                      const i = activeSlide;
                      const kind = slideKind(i, slides.length);
                      const labels = FIELD_LABELS[kind];
                      const order = slideFieldOrder(kind);
                      return (
                        <div key={i} className="rounded-xl border border-brand-line p-3">
                          <div className="mb-2 text-[12px] font-semibold text-brand-ink">
                            {kind === "cover" ? "Cover" : kind === "cta" ? `Slide ${i + 1} · Closing` : `Slide ${i + 1}`}
                          </div>
                          <div className="space-y-2">
                            {order.map((key) => (
                              <label key={key} className="block">
                                <span className="mb-1 block text-[11px] text-brand-ink-soft">{labels[key]}</span>
                                {key === "body" ? (
                                  <textarea
                                    value={s[key]}
                                    rows={2}
                                    onChange={(e) => updateSlide(i, key, e.target.value)}
                                    className="w-full rounded-lg border border-brand-line p-2.5 text-sm outline-none focus:border-brand-accent"
                                  />
                                ) : (
                                  <input
                                    value={s[key]}
                                    onChange={(e) => updateSlide(i, key, e.target.value)}
                                    className="w-full rounded-lg border border-brand-line p-2.5 text-sm outline-none focus:border-brand-accent"
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-brand-ink-soft">{fixedSlideCount} fixed slides</p>
                  </div>
                ) : (
                  <textarea
                    value={script}
                    rows={4}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder={`Add the ${scriptLabel.toLowerCase()}…`}
                    className="w-full rounded-xl border border-brand-line p-3 text-sm outline-none focus:border-brand-accent"
                  />
                )}
              </div>}

              {isDesign && inspector === "settings" && (
                <div className="space-y-3 pb-5">
                  <div className="text-[11px] font-semibold tracking-wide text-brand-ink-soft uppercase">
                    Add a backdrop photo?
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["brand", "photo"] as const).map((v) => (
                      <Button variant="outline"
                        key={v}
                        type="button"
                        onClick={() => {
                          setBackdrop(v);
                          if (v === "photo" && !photo) photoRef.current?.click();
                        }}
                        className={`h-auto min-h-10 whitespace-normal rounded-lg border bg-brand-surface px-3 py-2 text-[13px] font-medium ${backdrop === v ? "border-brand-accent bg-brand-wash text-brand-blue-mid" : "border-brand-line text-brand-ink-mid hover:bg-brand-wash"}`}
                      >
                        {v === "brand" ? "No, use brand background" : "Yes, add a photo"}
                      </Button>
                    ))}
                  </div>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (photoRef.current) photoRef.current.value = "";
                      if (!f) return;
                      setPhoto({ file: f, url: URL.createObjectURL(f) });
                      setBackdrop("photo");
                    }}
                  />
                  {backdrop === "photo" && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-brand-ink-mid">
                      {photo ? (
                        <>
                          <Paperclip size={13} />
                          <span className="truncate">{photo.file.name}</span>
                          <Button variant="outline" type="button" onClick={() => photoRef.current?.click()} className="text-[12px] font-semibold text-brand-accent hover:underline">
                            Change
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" type="button" onClick={() => photoRef.current?.click()} className="text-[12px] font-semibold text-brand-accent hover:underline">
                          Choose a photo
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-[12px] leading-relaxed text-brand-ink-soft">
                    {isCarousel
                      ? "Use one natural, everyday photo with plenty of clear space for text. Avoid close-ups; a headshot also works well."
                      : "Use a clear supporting or brand image with enough open space for the design copy."}
                  </p>
                </div>
              )}

              {isDesign && inspector === "settings" && (
                <div className="space-y-4 border-t border-brand-line pt-5">
                  <div className="text-[11px] font-semibold tracking-wide text-brand-ink-soft uppercase">Layout</div>
                  {([
                    ["coverAlign", isCarousel ? "Cover text position" : "Text position"],
                    ...(isCarousel ? [["slidesAlign", "Slides text position"]] : []),
                  ] as ["coverAlign" | "slidesAlign", string][]).map(([key, label]) => (
                    <div key={key} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] text-brand-ink-mid">{label}</span>
                      <div className="flex gap-1">
                        {(["top", "center", "bottom"] as const).map((v) => (
                          <Button variant="outline"
                            key={v}
                            type="button"
                            onClick={() => setLayout((l) => ({ ...l, [key]: v }))}
                            className={`rounded-md border bg-brand-surface px-2.5 py-1 text-[12px] capitalize ${effective[key] === v ? "border-brand-accent bg-brand-wash text-brand-blue-mid" : "border-brand-line text-brand-ink-mid"}`}
                          >
                            {v}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] text-brand-ink-mid">Text alignment</span>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((v) => (
                        <Button variant="outline"
                          key={v}
                          type="button"
                          onClick={() => setLayout((l) => ({ ...l, horizontalAlign: v }))}
                          className={`rounded-md border bg-brand-surface px-2.5 py-1 text-[12px] capitalize ${effective.horizontalAlign === v ? "border-brand-accent bg-brand-wash text-brand-blue-mid" : "border-brand-line text-brand-ink-mid"}`}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {backdrop === "brand" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-[13px] text-brand-ink-mid">
                          <input
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(effective.coverBackground) ? effective.coverBackground : "#1A1A1D"}
                            onChange={(e) => setLayout((l) => ({ ...l, coverBackground: e.target.value }))}
                            className="h-7 w-9 cursor-pointer rounded border border-brand-line"
                          />
                          {isCarousel ? "Cover colour 1" : "Background colour 1"}
                        </label>
                        <label className="flex items-center gap-2 text-[13px] text-brand-ink-mid">
                          <input type="color" value={/^#[0-9a-f]{6}$/i.test(effective.coverBackgroundEnd) ? effective.coverBackgroundEnd : effective.coverBackground} onChange={(e) => setLayout((l) => ({ ...l, coverBackgroundEnd: e.target.value }))} className="h-7 w-9 cursor-pointer rounded border border-brand-line" />
                          Colour 2
                        </label>
                        {effective.coverBackgroundEnd && <Button variant="outline" type="button" onClick={() => setLayout((l) => ({ ...l, coverBackgroundEnd: "" }))} className="h-8 border-brand-line bg-brand-surface px-2.5 text-[11px] text-brand-accent hover:bg-brand-wash">Remove gradient</Button>}
                        {isCarousel && <label className="flex items-center gap-2 text-[13px] text-brand-ink-mid"><input type="color" value={/^#[0-9a-f]{6}$/i.test(effective.slidesBackground) ? effective.slidesBackground : "#F6F6F7"} onChange={(e) => setLayout((l) => ({ ...l, slidesBackground: e.target.value }))} className="h-7 w-9 cursor-pointer rounded border border-brand-line" />Slides background</label>}
                      </div>
                      {(layout.coverBackground || layout.coverBackgroundEnd !== undefined || layout.slidesBackground) && (
                        <Button variant="outline"
                          type="button"
                          onClick={() => setLayout((l) => ({ ...l, coverBackground: undefined, coverBackgroundEnd: undefined, slidesBackground: undefined }))}
                          className="text-[12px] font-semibold text-brand-accent hover:underline"
                        >
                          Reset to brand colors
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              </div>
              {/* Source material — required for video. */}
              {isDesign && (
                <div
                  className={`rounded-xl border p-4 ${!isDesign && !hasFootage ? "border-[#F5C26B] bg-[#FFFBF2]" : "border-brand-line"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold tracking-wide text-brand-ink-soft uppercase">
                      Raw footage
                    </div>
                    <Button variant="outline"
                      type="button"
                      onClick={() => setFootageOpen((v) => !v)}
                      className="text-[12px] font-semibold text-brand-accent hover:underline"
                    >
                      {footageOpen ? "Done" : "Change"}
                    </Button>
                  </div>

                  <div className="mt-2 space-y-2">
                    {footageLink.trim() && !footageOpen && (
                      <a
                        href={footageLink.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
                      >
                        <ExternalLink size={14} /> Open your footage
                      </a>
                    )}
                    {files.map((f) => (
                      <div
                        key={f.fileId}
                        className="flex items-center gap-2 text-sm text-brand-ink-mid"
                      >
                        <Paperclip size={13} />
                        <span className="truncate">{f.filename}</span>
                        <Button variant="outline"
                          type="button"
                          aria-label={`Remove ${f.filename}`}
                          onClick={() => setFiles((prev) => prev.filter((x) => x.fileId !== f.fileId))}
                          className="text-[#C4322A] hover:opacity-70"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ))}
                    {!hasFootage && !footageOpen && !isDesign && (
                      <p className="text-sm text-[#8A5B12]">
                        Add your filmed material before handing this post over.
                      </p>
                    )}

                    <p className="text-[12px] leading-relaxed text-brand-ink-soft">
                      Link a folder containing every raw clip needed for the edit, with access enabled for anyone with the link.
                    </p>

                    {/* Is the folder we were given actually usable? */}
                    {!!footageLink.trim() && (
                      <>
                        {checkingLink && (
                          <p className="flex items-center gap-1.5 text-[12px] text-brand-ink-soft">
                            <Loader2 size={12} className="animate-spin" /> Checking your footage…
                          </p>
                        )}
                        {!checkingLink && linkCheck.status === "ok" && (
                          <p className="text-[12px] font-medium text-[#15803D]">
                            Folder found{linkCheck.fileCount ? ` · ${linkCheck.fileCount} file${linkCheck.fileCount === 1 ? "" : "s"}` : ""}.
                          </p>
                        )}
                        {!checkingLink && linkCheck.status === "empty" && (
                          <p className="text-[12px] font-medium text-[#B42318]">
                            That folder has no files in it yet.
                          </p>
                        )}
                        {!checkingLink && (linkCheck.status === "unreachable" || linkCheck.status === "invalid") && (
                          <p className="text-[12px] font-medium text-[#B42318]">
                            We can't open that link. Set sharing to anyone with the link.
                          </p>
                        )}
                        {!checkingLink && linkCheck.status === "unknown" && (
                          <p className="text-[12px] text-[#8A5B12]">
                            We can't check that link automatically — make sure it opens for us.
                          </p>
                        )}
                      </>
                    )}

                    {(footageOpen || (isDesign && !hasFootage)) && (
                      <AttachBox accept={limitFor(post.postType)?.accept} multiple={(limitFor(post.postType)?.max ?? 2) > 1} disabled={!!busy} uploading={busy === "myself"} pct={progress} onFiles={(f) => void pickFiles(f)} link={footageLink} onLink={setFootageLink}
                        items={files.map((f) => ({ key: f.fileId, name: f.filename, onRemove: () => setFiles((prev) => prev.filter((x) => x.fileId !== f.fileId)) }))} />
                    )}
                  </div>
                </div>
              )}

              {busy === "myself" && (progressNote || progress > 0) && (
                <div>
                  <p className="text-[12px] text-brand-ink-soft">{progressNote || "Working…"}</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EDEDF0]">
                    <div
                      className="h-full rounded-full bg-brand-accent transition-all"
                      style={{ width: `${Math.max(6, progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-[#B42318]">{error}</p>}
            </div>
            )}

            {screen !== "choice" && <div className="flex items-center justify-end gap-2 border-t border-brand-line bg-brand-wash px-4 py-2">
              {screen === "dwy" ? (
                <>
                  <Button variant="outline"
                    type="button"
                    disabled={!!busy || requestSaved}
                    onClick={() => setScreen("choice")}
                    className="rounded-lg border border-brand-line bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-accent hover:bg-brand-wash disabled:opacity-50"
                  >
                    Back
                  </Button>
                  <Button variant="outline"
                    type="button"
                    disabled={!!busy || (!requestSaved && (!canSubmit || (backdrop === "photo" && !photo)))}
                    onClick={() => void doItMyself()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2.5 text-sm font-semibold text-brand-surface shadow-sm hover:bg-[#166534] disabled:opacity-50"
                  >
                    {busy === "myself" && <Loader2 size={14} className="animate-spin" />}
                    {busy === "myself" ? "Working…" : checkingLink ? "Checking your footage…" : requestSaved ? "Retry planner update" : isDesign ? "Send for approval" : "Submit video edit"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline"
                    type="button"
                    disabled={!!busy || requestSaved}
                    onClick={() => setScreen("choice")}
                    className="rounded-lg border border-brand-line bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-accent hover:bg-brand-wash disabled:opacity-50"
                  >
                    Back
                  </Button>
                  <Button variant="outline"
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => void requestRisevoice()}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-surface shadow-sm hover:bg-brand-blue-mid disabled:opacity-50"
                  >
                    {(busy === "risevoice" || checkingLink) && <Loader2 size={14} className="animate-spin" />}
                    {checkingLink ? "Checking your footage…" : "Send for approval"}
                  </Button>
                </>
              )}
            </div>}
          </>
        )}
      </div>
    </div>
  );
}
