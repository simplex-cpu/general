import { useEffect, useMemo, useRef, useState } from "react";
import { AttachBox } from "./post/AttachBox";
import { CollapsibleField } from "./post/CollapsibleField";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileVideo,
  FileImage,
  FileText,
  Link2,
  Sparkles,
  Info,
  Type,
  Palette,
  ChevronDown,
  Settings,
} from "lucide-react";
import { uploadDirectToDrive } from "@/lib/driveDirectUpload";
import { extractAudioFromLink } from "@/lib/audioExtract";

import { LaneTabs } from "./DesignAndEditMode";
import StylePhonePreview, { type PhonePreviewStyle } from "./StylePhonePreview";
import DesignPreview from "./DesignPreview";
import {
  buildCarouselFrames,
  buildGraphicFrame,
  normalizeVerticalAlign,
  renderFramesToFiles,
  type DesignFrame,
  type FrameStyle,
} from "@/lib/slate/designFrames";
import { validateDesignCopy, type DesignSubtype, type StructuredDesignSlide } from "@/lib/slate/designTemplates";
import { requestStyleFields, graphicRequestStyleFields } from "@/lib/slate/productionRequest";
import { graphicFrameStyle } from "@/lib/slate/brandVisualStyle";
import { createProductionSubmission, videoFootageReady } from "@/lib/slate/videoProduction";

const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB — bytes go straight to Drive

/** Trending audio pulled from a TikTok/Instagram link and turned into an mp3. */
type MusicAudio = {
  status: "idle" | "working" | "ready" | "error";
  filename?: string;
  fileId?: string;
  previewUrl?: string;
  error?: string;
};

const STYLE_BROLL = "BROLL";
const STYLE_TALKING = "Talking Video";

const VIDEO_STYLES = [STYLE_BROLL, STYLE_TALKING] as const;
const DESIGN_STYLES = ["Graphic", "Carousel"] as const;

const STYLE_DESCRIPTIONS: Record<string, string> = {
  Graphic: "A single designed image built from your script and brand look.",
  Carousel: "A multi-slide design built from your script and brand look.",
};

type BriefStyle = {
  brandName: string;
  captionsPrimary: string;
  captionsSecondary: string;
  fontPrimary: string;
  fontSecondary: string;
  bgPrimary: string;
  bgSecondary: string;
  bgOpacity: string;
  aesthetic: string;
  coverBackground: string;
  coverBackground2: string;
  coverAlign: string;
  slidesAlign: string;
  slidesBackground: string;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  graphicFields?: Record<string, unknown>;
};

const EMPTY_BRIEF_STYLE: BriefStyle = {
  brandName: "",
  captionsPrimary: "",
  captionsSecondary: "",
  fontPrimary: "",
  fontSecondary: "",
  bgPrimary: "",
  bgSecondary: "",
  bgOpacity: "",
  aesthetic: "",
  coverBackground: "",
  coverBackground2: "",
  coverAlign: "",
  slidesAlign: "",
  slidesBackground: "",
  titleColor: "",
  subtitleColor: "",
  textColor: "",
};

/** One carousel slide (or the single graphic) as the client is building it. */
type SlideInput = { copy: string; photo: File | null; photoUrl: string };

const emptySlide = (): SlideInput => ({ copy: "", photo: null, photoUrl: "" });

type RequestItem = {
  id: string;
  createdTime: string;
  editingStyle: string;
  status: string;
  textOverlay: string;
  visualHook: string;
  cta: string;
  music: string;
  copy: string;
  slideCount: number;
  slideCopy: string[];
  files: { id: string; url: string; filename: string; type: string }[];
};

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Delivery = { id: string; kind: "edit" | "design"; at: number };

const DELIVERY_WINDOW_MS = 15 * 60 * 1000;

function deliveryKey(accessCode: string) {
  return `slate.delivered.${accessCode || "anon"}`;
}

function readDeliveries(accessCode: string): Delivery[] {
  try {
    const raw = window.localStorage.getItem(deliveryKey(accessCode));
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list
      .filter((d: any) => d && typeof d.id === "string" && typeof d.at === "number")
      .filter((d: any) => Date.now() - d.at < DELIVERY_WINDOW_MS)
      .map((d: any) => ({ id: d.id, kind: d.kind === "design" ? "design" : "edit", at: d.at }));
  } catch {
    return [];
  }
}

function writeDeliveries(accessCode: string, list: Delivery[]) {
  try {
    window.localStorage.setItem(
      deliveryKey(accessCode),
      JSON.stringify(list.filter((d) => Date.now() - d.at < DELIVERY_WINDOW_MS)),
    );
  } catch {}
}


function statusClasses(status: string) {
  const s = (status || "").toLowerCase();
  if (
    s.includes("edited") ||
    s.includes("designed") ||
    s.includes("done") ||
    s.includes("complete")
  )
    return "bg-[#DCFCE7] text-[#15803D]";
  if (s.includes("progress") || s.includes("editing") || s.includes("designing"))
    return "bg-[#FEF3C7] text-[#B45309]";
  return "bg-[#FEE2E2] text-[#B91C1C]";
}

function iconFor(file: File) {
  if (file.type.startsWith("video/")) return <FileVideo size={22} />;
  if (file.type.startsWith("image/")) return <FileImage size={22} />;
  return <FileText size={22} />;
}


function toPreviewStyle(style: BriefStyle): PhonePreviewStyle {
  return {
    hookFont: style.captionsPrimary,
    captionFont: style.captionsSecondary || style.captionsPrimary,
    hookColor: style.fontPrimary,
    captionColor: style.fontSecondary,
    hookBacking: style.bgPrimary,
    captionBacking: style.bgSecondary,
  };
}

/** One optional photo behind a graphic or a carousel slide. */
function PhotoSlot({
  label,
  slot,
  onPick,
}: {
  label: string;
  slot: SlideInput;
  onPick: (file: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
      {slot.photoUrl ? (
        <>
          <img
            src={slot.photoUrl}
            alt=""
            className="h-11 w-11 rounded-lg border border-[#E5E5E8] object-cover"
          />
          <span className="max-w-[130px] truncate text-[12px] text-[#6A6A72]">
            {slot.photo?.name}
          </span>
          <button
            type="button"
            onClick={() => {
              onPick(null);
              if (ref.current) ref.current.value = "";
            }}
            className="text-[12px] text-[#C4322A] hover:underline"
          >
            Remove
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E8] px-3.5 py-2 text-[12px] text-[#5A5860] transition hover:border-[#4F6BFF]/50 hover:text-[#1A1A1D]"
        >
          <FileImage size={13} /> {label}
        </button>
      )}
    </div>
  );
}

/** Saved brand style mapped onto the shared design frame style. */
function toFrameStyle(style: BriefStyle | null, still = false): FrameStyle {
  const s = style || EMPTY_BRIEF_STYLE;
  return graphicFrameStyle(s.graphicFields || {
    "Captions style primary": s.captionsPrimary, "Captions style secondary": s.captionsSecondary,
    "Carousel Cover Background": s.coverBackground, "Carousel Cover Background 2": s.coverBackground2,
    "Carousel Cover Text Align": s.coverAlign, "Carousel Slides Text Align": s.slidesAlign,
    "Carousel Slides Background": s.slidesBackground, "Carousel Title Color": s.titleColor,
    "Carousel Slides Subtitle Color": s.subtitleColor, "Carousel Slides Text Color": s.textColor,
  }, still);
}

export function Dropdown({
  value,
  options,
  placeholder,
  onChange,
  descriptions,
}: {
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (v: string) => void;
  descriptions?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 bg-white border rounded-xl px-3 py-2.5 text-[13px] text-left outline-none transition ${
          open ? "border-[#4F6BFF]" : "border-[#E5E5E8] hover:border-[#4F6BFF]/50"
        }`}
      >
        <span className={value ? "text-[#1A1A1D]" : "text-[#9A9AA2]"}>{value || placeholder}</span>
        <ChevronDown
          size={16}
          className={`text-[#6A6A72] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-[#E5E5E8] bg-white shadow-xl overflow-hidden">
          {options.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              className={`w-full flex items-start justify-between gap-2 px-3 py-2 text-left text-[13px] transition ${
                value === name
                  ? "bg-[#4F6BFF]/10 text-[#1A1A1D]"
                  : "text-[#3A3A44] hover:bg-[#F6F6F7]"
              }`}
            >
              <span className="min-w-0">
                <span className="block">{name}</span>
                {descriptions?.[name] && (
                  <span className="block text-[11px] leading-snug text-[#6A6A72] mt-0.5">
                    {descriptions[name]}
                  </span>
                )}
              </span>
              {value === name && (
                <CheckCircle2 size={14} className="text-[#4F6BFF] mt-0.5 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AestheticsPanel({
  style,
  loading,
  error,
  onRetry,
  onModifyBranding,
  requestStyle,
  hookText,
  captionText,
  designFrames,
}: {
  style: BriefStyle | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onModifyBranding?: () => void;
  requestStyle: string;
  hookText: string;
  captionText: string;
  designFrames?: DesignFrame[];
}) {
  const current = style || EMPTY_BRIEF_STYLE;
  const isDesignPreview = !!designFrames;
  const empty = isDesignPreview
    ? false
    : ![
        current.captionsPrimary,
        current.captionsSecondary,
        current.fontPrimary,
        current.fontSecondary,
        current.bgPrimary,
        current.bgSecondary,
      ].some((v) => v.trim());
  const previewModes =
    requestStyle === STYLE_BROLL ? ["captions" as const] : ["hook" as const, "captions" as const];

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E5E5E8] bg-white p-3 text-[#1A1A1D] md:p-4">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-[#4F6BFF]/10 blur-[90px]" />
      {onModifyBranding && (
        <button
          type="button"
          onClick={onModifyBranding}
          aria-label="Modify visual style"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E8] bg-[#F6F6F7] text-[#1A1A1D] transition hover:bg-[#E5E5E8]"
        >
          <Settings size={15} />
        </button>
      )}
      <div className="relative">
        {loading ? (
          <div className="inline-flex items-center gap-2 text-[12px] text-[#6A6A72]">
            <Loader2 size={13} className="animate-spin" /> Loading your visual style…
          </div>
        ) : error ? (
          <div>
            <p className="text-[12.5px] text-[#B91C1C]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F6F6F7] px-3.5 py-1.5 text-[12px] text-[#1A1A1D] hover:bg-[#E5E5E8]"
            >
              <Loader2 size={12} /> Try again
            </button>
          </div>
        ) : (!style && !isDesignPreview) || empty ? (
          <div>
            <p className="text-[12.5px] text-[#6A6A72]">
              Your visual style is still empty. Add your fonts and colours in Brand info, then
              refresh here.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {onModifyBranding && (
                <button
                  type="button"
                  onClick={onModifyBranding}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#4F6BFF] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#8878ea]"
                >
                  <Palette size={14} /> Modify visual style
                </button>
              )}
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full bg-[#F6F6F7] px-3.5 py-2 text-[12px] text-[#1A1A1D] hover:bg-[#E5E5E8]"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          designFrames ? (
            <DesignPreview frames={designFrames} width={230} />
          ) : (
            <StylePhonePreview
              editableSample={false}
              style={toPreviewStyle(current)}
              allowedModes={previewModes}
              hookText={hookText}
              captionText={captionText}
              captionPlacement={requestStyle === STYLE_BROLL ? "center" : "bottom"}
              backingOpacity={100}
              compact
            />
          )
        )}
      </div>
    </div>
  );
}

/** Words already written for a post, so the form opens filled in. */
export type EditYourselfPrefill = {
  /** Identity of the source post; changing it re-applies the copy. */
  key: string;
  mode: "video" | "design";
  style?: string;
  textOverlay?: string;
  visualHook?: string;
  copy?: string;
  slides?: string[];
};

export function EditYourselfMode({
  accessCode,
  lanes,
  activeLane,
  onLaneChange,
  onGoToApprovals,
  onGoToBranding,
  prefill,
}: {
  accessCode: string;
  lanes: { value: "risevoice" | "myself"; label: string }[];
  activeLane: "risevoice" | "myself";
  onLaneChange: (lane: "risevoice" | "myself") => void;
  onGoToBranding?: () => void;
  onGoToApprovals?: () => void;
  prefill?: EditYourselfPrefill;
}) {
  const [mode, setMode] = useState<"video" | "design">(prefill?.mode || "video");
  const [files, setFiles] = useState<File[]>([]);
  const [clips, setClips] = useState<string[]>(["", "", ""]);
  const [useLink, setUseLink] = useState(false);
  const [clipDraft, setClipDraft] = useState("");
  const [progress, setProgress] = useState(0);
  const [style, setStyle] = useState("");
  const [textOverlay, setTextOverlay] = useState("");
  const [visualHook, setVisualHook] = useState("");
  const [cta, setCta] = useState("");
  const [music, setMusic] = useState("");
  const [musicAudio, setMusicAudio] = useState<MusicAudio>({ status: "idle" });
  const musicRunRef = useRef(0);

  const [copy, setCopy] = useState("");
  const [designSubtype, setDesignSubtype] = useState<DesignSubtype>("quote");
  const [graphicPhoto, setGraphicPhoto] = useState<SlideInput>(emptySlide());
  const [slideCount, setSlideCount] = useState(3);
  const [slides, setSlides] = useState<SlideInput[]>(() =>
    Array.from({ length: 10 }, () => emptySlide()),
  );
  const [rendering, setRendering] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [fyiOpen, setFyiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptStatus, setScriptStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [scriptError, setScriptError] = useState("");
  const [brief, setBrief] = useState<BriefStyle | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState("");
  const [briefNonce, setBriefNonce] = useState(0);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsNonce, setRequestsNonce] = useState(0);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryDismissed, setDeliveryDismissed] = useState(false);
  const [deliveryTick, setDeliveryTick] = useState(0);
  const deliveredSeenRef = useRef<Map<string, string> | null>(null);
  const submissionRef = useRef(createProductionSubmission());
  const requestIdRef = useRef("");
  const [linkCheck, setLinkCheck] = useState<{ status: "" | "ok" | "empty" | "unreachable" | "unknown" | "invalid"; fileCount: number }>({ status: "", fileCount: 0 });
  const [checkingLink, setCheckingLink] = useState(false);

  const isDesign = mode === "design";

  const isBroll = !isDesign && style === STYLE_BROLL;
  const isTalking = !isDesign && style === STYLE_TALKING;
  const isGraphic = isDesign && style === "Graphic";
  const isCarousel = isDesign && style === "Carousel";
  const requiredSlideCount = designSubtype === "insightful" ? 10 : 6;
  const styleOptions = isDesign ? DESIGN_STYLES : VIDEO_STYLES;
  const showScript = isDesign || isBroll || isTalking;
  const showOverlay = isBroll;
  const showHook = isTalking;
  const needsAesthetics = isBroll || isTalking || isGraphic || isCarousel;
  const showMusic = isBroll || isTalking;
  const assetsOptional = isGraphic || isCarousel;
  const filledClips = clips.map((c) => c.trim()).filter(Boolean);
  const activeSlides = useMemo(() => slides.slice(0, slideCount), [slides, slideCount]);
  const copyValid = isGraphic
    ? !!copy.trim()
    : isCarousel
      ? activeSlides.some((s) => s.copy.trim())
      : true;

  useEffect(() => {
    if (!accessCode) return;
    const key = `slate.video-request.${accessCode}`;
    const stored = window.sessionStorage.getItem(key);
    requestIdRef.current = stored || `editor:${crypto.randomUUID()}`;
    if (!stored) window.sessionStorage.setItem(key, requestIdRef.current);
  }, [accessCode]);

  useEffect(() => {
    const link = filledClips[0] || "";
    if (isDesign || !useLink || !link) {
      setLinkCheck({ status: "", fileCount: 0 });
      setCheckingLink(false);
      return;
    }
    let alive = true;
    setCheckingLink(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/check-footage-link", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({ link }),
        });
        const data: any = await response.json().catch(() => ({}));
        if (alive) setLinkCheck({ status: data?.status || "unknown", fileCount: Number(data?.fileCount) || 0 });
      } catch {
        if (alive) setLinkCheck({ status: "unknown", fileCount: 0 });
      } finally {
        if (alive) setCheckingLink(false);
      }
    }, 500);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [accessCode, isDesign, useLink, filledClips[0]]);

  const setSlideAt = (i: number, patch: Partial<SlideInput>) =>
    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  // Open already filled in with the words written for the post.
  useEffect(() => {
    if (!prefill) return;
    setMode(prefill.mode);
    if (prefill.style) setStyle(prefill.style);
    if (prefill.textOverlay) setTextOverlay(prefill.textOverlay);
    if (prefill.visualHook) setVisualHook(prefill.visualHook);
    if (prefill.copy) setCopy(prefill.copy);
    const next = (prefill.slides || []).filter((s) => s.trim()).slice(0, 10);
    if (next.length) {
      setSlides((prev) =>
        prev.map((s, i) => (i < next.length ? { ...s, copy: next[i] } : { ...s, copy: "" })),
      );
      setSlideCount(Math.max(1, next.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.key]);



  const attachSlidePhoto = (i: number | "graphic", file: File | null) => {
    const url = file ? URL.createObjectURL(file) : "";
    if (i === "graphic") {
      setGraphicPhoto((prev) => {
        if (prev.photoUrl) URL.revokeObjectURL(prev.photoUrl);
        return { ...prev, photo: file, photoUrl: url };
      });
      return;
    }
    setSlides((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s;
        if (s.photoUrl) URL.revokeObjectURL(s.photoUrl);
        return { ...s, photo: file, photoUrl: url };
      }),
    );
  };

  // Frames shown in the preview and exported as finished images.
  const frameStyle = useMemo(() => toFrameStyle(brief, isGraphic), [brief, isGraphic]);
  const designFrames: DesignFrame[] | undefined = useMemo(() => isGraphic
    ? [buildGraphicFrame(copy, frameStyle, graphicPhoto.photoUrl || undefined, designSubtype)]
    : isCarousel
      ? buildCarouselFrames(
          activeSlides.map((s, index): StructuredDesignSlide => {
            const lines = s.copy.split(/\n+/).map((line) => line.trim()).filter(Boolean);
            const role = index === 0 ? "hook" : index === activeSlides.length - 1 ? "cta" : "content";
            const actionLabel = role === "cta" ? lines.at(-1) || "Share" : undefined;
            const body = role === "hook" ? undefined : role === "cta"
              ? lines.slice(1, -1).join("\n")
              : designSubtype === "insightful"
                ? lines.slice(1).join("\n")
                : undefined;
            return { position: index + 1, role, headline: lines[0] || "", body, actionLabel };
          }),
          frameStyle,
          designSubtype,
          slides.find((slide) => slide.photoUrl)?.photoUrl || undefined,
        )
      : undefined, [isGraphic, isCarousel, copy, frameStyle, graphicPhoto.photoUrl, designSubtype, activeSlides, slides]);
  const staticDesignSlides = useMemo<StructuredDesignSlide[]>(() => isGraphic
    ? [{ position: 1, role: "content", headline: copy.split(/\n+/)[0]?.trim() || "", body: copy.split(/\n+/).slice(1).join("\n").trim() }]
    : activeSlides.map((slide, index) => {
        const lines = slide.copy.split(/\n+/).map((line) => line.trim()).filter(Boolean);
        const role = index === 0 ? "hook" : index === activeSlides.length - 1 ? "cta" : "content";
        return { position: index + 1, role, headline: lines[0] || "", body: lines.slice(1, role === "cta" ? -1 : undefined).join("\n"), actionLabel: role === "cta" ? lines.at(-1) || "" : undefined };
      }), [isGraphic, copy, activeSlides]);

  // Load the brand's visual style (refetchable).
  useEffect(() => {
    if (!accessCode) return;
    let alive = true;
    setBriefLoading(true);
    setBriefError("");
    (async () => {
      try {
        const r = await fetch("/api/my-brief", { headers: { "x-access-code": accessCode } });
        const j: any = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) throw new Error(j?.error || `Couldn't load your brand brief (${r.status}).`);
        const f = j?.brief?.fields;
        if (!f) throw new Error("No brand brief is linked to this account yet.");
        setBrief({
          graphicFields: f,
          brandName: String(f["Brand Name"] || ""),
          captionsPrimary: String(f["Captions style primary"] || ""),
          captionsSecondary: String(f["Captions style secondary"] || ""),
          fontPrimary: String(f["Font color (Primary)"] || ""),
          fontSecondary: String(f["Font color (Secondary)"] || ""),
          bgPrimary: String(f["Font background Color (Primary)"] || ""),
          bgSecondary: String(f["Font background Color (Secondary)"] || ""),
          bgOpacity: String(f["Caption background opacity"] ?? ""),
          aesthetic: String(f["Aesthetic preferences"] || ""),
          coverBackground: String(f["Carousel Cover Background"] || ""),
          coverBackground2: String(f["Carousel Cover Background 2"] || ""),
          coverAlign: String(f["Carousel Cover Text Align"] || ""),
          slidesAlign: String(f["Carousel Slides Text Align"] || ""),
          slidesBackground: String(f["Carousel Slides Background"] || ""),
          titleColor: String(f["Carousel Title Color"] || ""),
          subtitleColor: String(f["Carousel Slides Subtitle Color"] || ""),
          textColor: String(f["Carousel Slides Text Color"] || ""),
        });
      } catch (e: any) {
        if (alive) setBriefError(String(e?.message || e));
      } finally {
        if (alive) setBriefLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessCode, briefNonce]);

  // Load submitted requests (all statuses, not just "To Edit").
  useEffect(() => {
    if (!accessCode) return;
    let alive = true;
    setRequestsLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/dwy-edit-yourself", {
          headers: { "x-access-code": accessCode },
        });
        const j: any = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) throw new Error(j?.error || `Couldn't load requests (${r.status}).`);
        setRequests(
          (j.items || []).sort(
            (a: any, b: any) =>
              new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime(),
          ),
        );
      } catch {
        // Board is secondary; don't block the form.
      } finally {
        if (alive) setRequestsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessCode, requestsNonce]);

  // Keep the board fresh so deliveries show up without a reload.
  useEffect(() => {
    if (!accessCode) return;
    const id = window.setInterval(() => setRequestsNonce((n) => n + 1), 60000);
    return () => window.clearInterval(id);
  }, [accessCode]);

  // Notice requests that flip to "Edited" and summarise the last 15 minutes.
  useEffect(() => {
    if (!requests.length) return;
    const prev = deliveredSeenRef.current;
    const next = new Map<string, string>();
    for (const r of requests) next.set(r.id, String(r.status || "").toLowerCase());
    deliveredSeenRef.current = next;
    if (!prev) return; // first load: don't count history
    const fresh: Delivery[] = [];
    for (const [id, statusNow] of next) {
      const before = prev.get(id);
      if (before && before !== "edited" && statusNow === "edited") {
        const req = requests.find((r) => r.id === id);
        fresh.push({
          id,
          kind: (DESIGN_STYLES as readonly string[]).includes(String(req?.editingStyle || ""))
            ? "design"
            : "edit",
          at: Date.now(),
        });
      }
    }
    if (!fresh.length) return;
    setDeliveries((current) => {
      const merged = [...current.filter((d) => !fresh.some((f) => f.id === d.id)), ...fresh];
      writeDeliveries(accessCode, merged);
      return merged;
    });
    setDeliveryDismissed(false);
  }, [requests, accessCode]);

  // Load stored deliveries and keep the "minutes ago" copy moving.
  useEffect(() => {
    setDeliveries(readDeliveries(accessCode));
    const id = window.setInterval(() => setDeliveryTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, [accessCode]);

  const liveDeliveries = deliveries.filter((d) => Date.now() - d.at < DELIVERY_WINDOW_MS);
  void deliveryTick;
  const deliveryBanner = (() => {
    if (deliveryDismissed || !liveDeliveries.length) return "";
    const firstAt = Math.min(...liveDeliveries.map((d) => d.at));
    const minutes = Math.max(1, Math.round((Date.now() - firstAt) / 60000));
    const designs = liveDeliveries.filter((d) => d.kind === "design").length;
    const edits = liveDeliveries.length - designs;
    const noun =
      designs && edits
        ? "edits and designs"
        : designs
          ? designs === 1
            ? "design"
            : "designs"
          : edits === 1
            ? "edit"
            : "edits";
    const verb = liveDeliveries.length === 1 ? "was" : "were";
    return `${liveDeliveries.length} ${noun} ${verb} delivered in the last ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  })();


  const readScriptPdf = async (f: File | null) => {
    setScriptError("");
    if (!f) {
      setScriptFile(null);
      setScriptStatus("idle");
      if (scriptInputRef.current) scriptInputRef.current.value = "";
      return;
    }
    setScriptFile(f);
    setScriptStatus("reading");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] || "");
        r.onerror = () => reject(new Error("Could not read the file"));
        r.readAsDataURL(f);
      });
      const res = await fetch("/api/parse-script", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ base64, filename: f.name, accessCode }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Could not read the script (${res.status})`);
      const overlay = String(data.textOverlay || "").trim();
      if (overlay) setTextOverlay(overlay);
      const hook = String(data.visualHook || data.textOverlay || "").trim();
      if (hook) setVisualHook(hook);
      const parsedCta = String(data.cta || "").trim();
      if (parsedCta) setCta(parsedCta);

      // Designs: fill the graphic copy, or the cover and each slide.
      const parsedSlides: string[] = Array.isArray(data.slides)
        ? data.slides.map((s: any) => String(s || "").trim()).filter(Boolean)
        : [];
      const cover = String(data.coverCopy || "").trim();
      if (isGraphic) {
        const graphicCopy = cover || parsedSlides[0] || hook || overlay;
        if (graphicCopy) {
          setCopy(graphicCopy);
          setScriptStatus("done");
          return;
        }
      }
      if (isCarousel && (parsedSlides.length || cover)) {
        const ordered = parsedSlides.length ? parsedSlides : [cover];
        if (cover && parsedSlides.length && parsedSlides[0] !== cover) ordered.unshift(cover);
        const next = ordered.slice(0, 10);
        setSlides((prev) =>
          prev.map((s, i) => (i < next.length ? { ...s, copy: next[i] } : { ...s, copy: "" })),
        );
        setSlideCount(Math.max(1, next.length));
        setScriptStatus("done");
        return;
      }

      if (!overlay && !hook) {
        setScriptStatus("error");
        setScriptError("No text overlay found in that PDF — fill it in manually below.");
        return;
      }
      setScriptStatus("done");
    } catch (e: any) {
      setScriptStatus("error");
      setScriptError(e?.message || "Could not read the script PDF.");
    }
  };

  // Pull the sound off a TikTok/Instagram link, turn it into an mp3 and park it
  // on Drive so the request record is created with the file already attached.
  const prepareMusic = async (link: string) => {
    const trimmed = link.trim();
    const run = ++musicRunRef.current;
    if (!trimmed) {
      setMusicAudio({ status: "idle" });
      return;
    }
    if (!/(tiktok\.com|instagram\.com)/i.test(trimmed)) {
      setMusicAudio({
        status: "error",
        error: "Paste a public TikTok or Instagram post link to pull its audio.",
      });
      return;
    }
    setMusicAudio({ status: "working" });
    try {
      const { file } = await extractAudioFromLink(trimmed, accessCode);
      const up = await uploadDirectToDrive(file, accessCode);
      if (musicRunRef.current !== run) return;
      setMusicAudio({
        status: "ready",
        filename: file.name,
        fileId: up.fileId,
        previewUrl: URL.createObjectURL(file),
      });
    } catch (e: any) {
      if (musicRunRef.current !== run) return;
      setMusicAudio({ status: "error", error: e?.message || "Could not pull that audio." });
    }
  };

  const clearMusic = () => {
    musicRunRef.current++;
    setMusic("");
    setMusicAudio({ status: "idle" });
  };

  const onPickFiles = (picked: FileList | null) => {

    setError("");
    const chosen = picked ? Array.from(picked) : [];
    if (inputRef.current) inputRef.current.value = "";
    if (chosen.length === 0) return;
    const list = chosen;
    const tooBig = list.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`${tooBig.name} is ${humanSize(tooBig.size)}. Please share Drive links instead.`);
      setUseLink(true);
      return;
    }
    setFiles((prev) => (isDesign ? [...prev, ...list] : [list[0]]));
  };

  const clipsValid = filledClips.length > 0 && filledClips.every((c) => /^https?:\/\//i.test(c));

  const submit = async () => {
    if (!style.trim()) return setError(`Please select a ${isDesign ? "design" : "editing"} style.`);
    if (showOverlay && !textOverlay.trim()) return setError("Please add the text overlay.");
    if (showHook && !visualHook.trim()) return setError("Please add the visual hook.");
    if (showHook && !cta.trim()) return setError("Please add the CTA for the end of the shot.");
    if (isGraphic && !copy.trim()) return setError("Please add the copy for the graphic.");
    if (isCarousel) {
      const missing = activeSlides.findIndex((s) => !s.copy.trim());
      if (missing >= 0)
        return setError(
          `Please add the copy for ${missing === 0 ? "the cover" : `slide ${missing + 1}`}.`,
        );
    }
    if (isDesign) {
      const staticError = validateDesignCopy(isGraphic ? "graphic" : "carousel", designSubtype, staticDesignSlides);
      if (staticError) return setError(staticError);
    }
    if (showMusic && music.trim() && musicAudio.status === "working")
      return setError("The audio is still being prepared. One moment.");
    if (showMusic && music.trim() && musicAudio.status !== "ready")
      return setError("That audio link could not be used. Paste another link or clear it.");


    if (useLink && !clipsValid && !assetsOptional)
      return setError("Please paste at least one valid clip link (https://…).");
    if (!isDesign && useLink && !videoFootageReady(0, filledClips[0] || "", linkCheck.status, checkingLink))
      return setError(checkingLink ? "The footage link is still being checked." : "We could not verify that footage link. Check access and try again.");
    if (!useLink && files.length === 0 && !assetsOptional)
      return setError(
        isDesign ? "Please attach the assets to use." : "Please attach a file to edit.",
      );
    if (!requestIdRef.current) requestIdRef.current = `editor:${crypto.randomUUID()}`;
    setStatus("submitting");
    setError("");
    setProgress(0);
    let responseData: any = {};
    try {
      await submissionRef.current.run(async () => {
      const payload: Record<string, any> = {
        accessCode,
        requestId: requestIdRef.current,
        requestType: isDesign ? "Design" : "Video Edit",
        editingStyle: style.trim(),
        textOverlay: showOverlay ? textOverlay.trim() : "",
        visualHook: showHook ? visualHook.trim() : "",
        cta: showHook ? cta.trim() : isCarousel ? activeSlides.at(-1)?.copy.trim().split(/\n+/).filter(Boolean).at(-1) || "" : "",
        music: showMusic ? music.trim() : "",
        musicFileId: showMusic && musicAudio.status === "ready" ? musicAudio.fileId : "",
        musicFilename: showMusic && musicAudio.status === "ready" ? musicAudio.filename : "",

        copy: isGraphic ? copy.trim() : "",
        designSubtype: isDesign ? designSubtype : "",
        slideCount: isCarousel ? requiredSlideCount : 0,
        slideCopy: isCarousel ? activeSlides.map((s) => s.copy.trim()) : [],

        aestheticsApproved: true,
        requestStyle: isDesign
          ? graphicRequestStyleFields(frameStyle)
          : !brief ? {} : requestStyleFields(toPreviewStyle(brief), {
              talking: style.trim() === STYLE_TALKING,
              styleSampleEnabled: true,
              textPosition: style.trim() === STYLE_TALKING ? "top" : "center",
            }),
      };

      if (useLink) {
        payload.rawClips = filledClips.slice(0, 3);
        payload.driveLink = filledClips[0];
      } else if (files.length) {
        const uploaded: { fileId: string; filename: string; contentType: string }[] = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const up = await uploadDirectToDrive(f, accessCode, (p) =>
            setProgress(Math.round(((i + p / 100) / files.length) * 100)),
          );
          uploaded.push({ fileId: up.fileId, filename: up.filename, contentType: up.contentType });
        }
        payload.files = uploaded;
        payload.fileId = uploaded[0].fileId;
        payload.filename = uploaded[0].filename;
        payload.contentType = uploaded[0].contentType;
      }

      // Designs: render the finished images and send them with any source photos.
      if (designFrames?.length) {
        setRendering(true);
        const prefix = isCarousel ? "carousel" : "graphic";
        const rendered = await renderFramesToFiles(designFrames, prefix);
        const sources = isCarousel
          ? activeSlides.map((s) => s.photo).filter(Boolean)
          : [graphicPhoto.photo].filter(Boolean);
        const toUpload = [...rendered, ...(sources as File[])];
        const out: { fileId: string; filename: string; contentType: string }[] = [];
        for (let i = 0; i < toUpload.length; i++) {
          const up = await uploadDirectToDrive(toUpload[i], accessCode, (p) =>
            setProgress(Math.round(((i + p / 100) / toUpload.length) * 100)),
          );
          out.push({ fileId: up.fileId, filename: up.filename, contentType: up.contentType });
        }
        setRendering(false);
        payload.renderedFiles = out.slice(0, rendered.length);
        payload.files = [...(payload.files || []), ...out];
        if (out.length) {
          payload.fileId = payload.fileId || out[0].fileId;
          payload.filename = payload.filename || out[0].filename;
          payload.contentType = payload.contentType || out[0].contentType;
        }
      }

      const res = await fetch("/api/dwy-edit-yourself", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}
      if (!res.ok) {
        throw new Error(data?.error || text.slice(0, 300) || `Request failed (${res.status})`);
      }
      responseData = data;
      }, async () => {});
      setStatus("success");
      if (responseData?.warning) setError(String(responseData.warning));
      setFyiOpen(true);
      setFiles([]);
      setClips(["", "", ""]);
      setUseLink(false);
      setProgress(0);
      setStyle("");
      setTextOverlay("");
      setVisualHook("");
      setCta("");
      setCopy("");
      clearMusic();

      setSlideCount(3);
      slides.forEach((s) => s.photoUrl && URL.revokeObjectURL(s.photoUrl));
      if (graphicPhoto.photoUrl) URL.revokeObjectURL(graphicPhoto.photoUrl);
      setSlides(Array.from({ length: 10 }, () => emptySlide()));
      setGraphicPhoto(emptySlide());

      setRequestsNonce((n) => n + 1);

      setScriptFile(null);
      setScriptStatus("idle");
      setScriptError("");
      if (scriptInputRef.current) scriptInputRef.current.value = "";
      if (inputRef.current) inputRef.current.value = "";
      window.sessionStorage.removeItem(`slate.video-request.${accessCode}`);
      requestIdRef.current = `editor:${crypto.randomUUID()}`;
      window.sessionStorage.setItem(`slate.video-request.${accessCode}`, requestIdRef.current);
      submissionRef.current = createProductionSubmission();
    } catch (e: any) {
      setError(e?.message || "Failed to submit edit request.");
      setStatus("error");
    }
  };

  const submitting = status === "submitting";
  const busy = submitting || scriptStatus === "reading";

  // Keep the user from navigating away mid-upload.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const canSubmit =
    !!style.trim() &&
    (assetsOptional || (useLink ? clipsValid && linkCheck.status === "ok" && !checkingLink : files.length > 0)) &&
    (!showOverlay || !!textOverlay.trim()) &&
    (!showHook || (!!visualHook.trim() && !!cta.trim())) &&
    copyValid &&
    (!showMusic || !music.trim() || musicAudio.status === "ready");

  const previewCaptionText = isGraphic
    ? copy
    : isCarousel
      ? activeSlides.find((s) => s.copy.trim())?.copy || ""
      : textOverlay;
  const previewHookText = isGraphic
    ? copy
    : isCarousel
      ? activeSlides[0]?.copy || ""
      : visualHook;


  return (
    <div className="min-h-[calc(100vh-200px)] bg-white text-[#1A1A1D]">
      <div className="bg-white">
        <LaneTabs lanes={lanes} active={activeLane} onChange={onLaneChange} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-14">
        <div className="relative w-full overflow-hidden rounded-2xl border border-[#EDEDF0] bg-[#FAFAFB] shadow-sm text-[#1A1A1D]">
          <div className="m-6 mb-0 flex rounded-lg border border-[#E5E5E8] bg-[#F8F8FB] p-1 md:m-8 md:mb-0">
            {(
              [
                { key: "video", label: "Video Edit" },
                { key: "design", label: "Design" },
              ] as const
            ).map(({ key, label }) => {
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key);
                    setStyle("");
                                  setFiles([]);
                    setError("");
                  }}
                    className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-[11px] transition-colors ${
                      active
                        ? "bg-white text-[#1A1A1D] shadow-sm"
                        : "text-[#5A5860] hover:text-[#1A1A1D]"
                    }`}
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="p-6 md:p-8 space-y-6">

            {/* Style dropdown */}
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                {isDesign ? "Design style" : "Editing style"}
              </label>
              <Dropdown
                value={style}
                options={styleOptions}
                descriptions={STYLE_DESCRIPTIONS}
                placeholder={`Select a ${isDesign ? "design" : "editing"} style…`}
                onChange={(v) => {
                  setStyle(v);
                  if (v === "Carousel") setSlideCount(designSubtype === "insightful" ? 10 : 6);
                  setError("");
                }}
              />
              {style && STYLE_DESCRIPTIONS[style] && (
                <p className="mt-2 text-[12px] text-[#6A6A72]">{STYLE_DESCRIPTIONS[style]}</p>
              )}
            </div>

            {/* Aesthetics confirmation (video styles) */}
            {needsAesthetics && (
              <AestheticsPanel
                onModifyBranding={onGoToBranding}
                style={brief}
                loading={briefLoading}
                error={briefError}
                requestStyle={style}
                hookText={previewHookText}
                captionText={previewCaptionText}
                designFrames={designFrames}
                onRetry={() => setBriefNonce((n) => n + 1)}
              />
            )}

            {/* Script PDF (optional) + text overlay (BROLL only) */}
            {showScript && (
              <div
                className={`grid gap-5 ${showOverlay || showHook || isGraphic ? "md:grid-cols-2" : ""}`}
              >
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                    Script{" "}
                    <span className="text-[#9A9AA2] normal-case tracking-normal">(optional)</span>
                  </label>

                  {!scriptFile ? (
                    <label className="flex items-center gap-3 border border-dashed border-[#E5E5E8] bg-[#FAFAFB] rounded-xl px-4 py-4 cursor-pointer hover:border-[#4F6BFF]/60 hover:bg-[#F6F6F7] transition h-[86px]">
                      <span className="w-8 h-8 rounded-lg bg-[#4F6BFF]/10 text-[#4F6BFF] flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-[#1A1A1D]">Attach the script PDF</span>
                      </span>
                      <input
                        ref={scriptInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => readScriptPdf(e.target.files?.[0] || null)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-3 border border-[#E5E5E8] bg-[#FAFAFB] rounded-xl px-4 py-3 h-[86px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-[#6A6A72] shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-[#1A1A1D] truncate">{scriptFile.name}</div>
                          <div className="text-[11px] text-[#6A6A72] flex items-center gap-1.5">
                            {scriptStatus === "reading" && (
                              <>
                                <Loader2 size={11} className="animate-spin" /> Reading the script…
                              </>
                            )}
                            {scriptStatus === "done" && (
                              <>
                                <CheckCircle2 size={11} className="text-[#0E8A5F]" /> Filled in —
                                edit as needed
                              </>
                            )}
                            {scriptStatus === "error" && (
                              <span className="text-[#C4322A]">{scriptError}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => readScriptPdf(null)}
                        className="text-[#6A6A72] hover:text-[#1A1A1D] p-1 rounded shrink-0"
                        aria-label="Remove script"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isGraphic && (
                  <div>
                    <div className="mb-3 flex gap-2">
                      {(["quote", "insightful"] as const).map((value) => (
                        <button key={value} type="button" onClick={() => setDesignSubtype(value)} className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${designSubtype === value ? "bg-[#4F6BFF] text-white" : "bg-[#F1F1F3] text-[#4A4A52]"}`}>{value === "quote" ? "Quote" : "Insightful"}</button>
                      ))}
                    </div>
                    <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Type size={12} /> Copy <span className="text-[#C4322A]">*</span>
                      </span>
                    </label>
                    <textarea
                      value={copy}
                      onChange={(e) => {
                        setCopy(e.target.value);
                        setError("");
                      }}
                      rows={3}
                      placeholder="The copy that should appear on the graphic"
                      className="w-full h-[86px] bg-white border border-[#E5E5E8] focus:border-[#4F6BFF]/60 rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none resize-y"
                    />
                    <div className="mt-3">
                      <PhotoSlot
                        label="Photo (optional)"
                        slot={graphicPhoto}
                        onPick={(f) => attachSlidePhoto("graphic", f)}
                      />
                    </div>
                  </div>
                )}

                {isCarousel && (
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex gap-2">
                      {(["quote", "insightful"] as const).map((value) => (
                        <button key={value} type="button" onClick={() => { setDesignSubtype(value); setSlideCount(value === "insightful" ? 10 : 6); }} className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${designSubtype === value ? "bg-[#4F6BFF] text-white" : "bg-[#F1F1F3] text-[#4A4A52]"}`}>{value === "quote" ? "Quote" : "Insightful"}</button>
                      ))}
                    </div>
                    <div className="sm:max-w-[220px]">
                      <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                        Number of slides <span className="text-[#C4322A]">*</span>
                      </label>
                      <div className="rounded-xl border border-[#E5E5E8] bg-[#F6F6F7] px-3 py-2.5 text-[13px] font-semibold text-[#1A1A1D]">{requiredSlideCount}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-[#1A1A1D]">Slides copy</label>
                      {Array.from({ length: requiredSlideCount }, (_, i) => (
                        <CollapsibleField key={i} title={i === 0 ? "Slide 1 · Cover *" : `Slide ${i + 1}`} preview={slides[i]?.copy} defaultOpen={i === 0}>
                          <textarea
                            value={slides[i]?.copy || ""}
                            onChange={(e) => {
                              setSlideAt(i, { copy: e.target.value });
                              setError("");
                            }}
                            rows={2}
                            placeholder={`Copy for slide ${i + 1}`}
                            className="w-full bg-white border border-[#E5E5E8] focus:border-[#4F6BFF]/60 rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none resize-y"
                          />
                          {i === 0 && <div className="mt-2"><PhotoSlot label="One photo for every slide (optional)" slot={slides[0] || emptySlide()} onPick={(f) => attachSlidePhoto(0, f)} /></div>}
                        </CollapsibleField>
                      ))}
                    </div>
                  </div>
                )}

                {showOverlay && (
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Type size={12} /> Text overlay <span className="text-[#C4322A]">*</span>
                      </span>
                    </label>
                    <textarea
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      rows={3}
                      placeholder="What text should appear on the video?"
                      className="w-full h-[86px] bg-white border border-[#E5E5E8] focus:border-[#4F6BFF]/60 rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none resize-y"
                    />
                  </div>
                )}

                {showHook && (
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Type size={12} /> Visual hook <span className="text-[#C4322A]">*</span>
                      </span>
                    </label>
                    <textarea
                      value={visualHook}
                      onChange={(e) => setVisualHook(e.target.value)}
                      rows={3}
                      placeholder="The on-screen hook for the first seconds"
                      className="w-full h-[86px] bg-white border border-[#E5E5E8] focus:border-[#4F6BFF]/60 rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none resize-y"
                    />
                  </div>
                )}

                {showHook && (
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                      CTA <span className="text-[#C4322A]">*</span>
                      <span className="ml-1.5 text-[#9A9AA2] normal-case tracking-normal">
                        (goes at the end of the shot)
                      </span>
                    </label>
                    <textarea
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                      rows={2}
                      placeholder="e.g. Comment “GUIDE” and I'll send it over"
                      className="w-full bg-white border border-[#E5E5E8] focus:border-[#4F6BFF]/60 rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none resize-y"
                    />
                  </div>
                )}

                {showMusic && (
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-bold text-[#1A1A1D] mb-2">
                      Music
                      <span className="ml-1.5 text-[#9A9AA2] normal-case tracking-normal">
                        (optional — paste a TikTok or Instagram post link and we pull its audio)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={music}
                      onChange={(e) => setMusic(e.target.value)}
                      onBlur={(e) => prepareMusic(e.target.value)}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (pasted) window.setTimeout(() => prepareMusic(pasted), 0);
                      }}
                      placeholder="https://www.tiktok.com/… or https://www.instagram.com/reel/…"
                      className="w-full bg-white border border-[#E5E5E8] focus:border-[#4F6BFF]/60 rounded-xl px-3 py-2.5 text-[13px] text-[#1A1A1D] outline-none"
                    />
                    {musicAudio.status === "working" && (
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-[#6A6A72]">
                        <Loader2 size={13} className="animate-spin" />
                        Preparing audio… this takes up to a minute.
                      </div>
                    )}
                    {musicAudio.status === "ready" && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-[#D8E3D8] bg-[#F4FBF6] px-3 py-2">
                        <CheckCircle2 size={14} className="text-[#12854A]" />
                        <span className="text-[12px] text-[#1A1A1D] truncate max-w-[220px]">
                          {musicAudio.filename}
                        </span>
                        {musicAudio.previewUrl && (
                          <audio controls src={musicAudio.previewUrl} className="h-8" />
                        )}
                        <button
                          type="button"
                          onClick={clearMusic}
                          className="text-[11px] uppercase tracking-[.12em] text-[#6A6A72] hover:text-[#1A1A1D]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {musicAudio.status === "error" && (
                      <div className="mt-2 flex items-start gap-2 text-[12px] text-[#C4322A]">
                        <AlertCircle size={13} className="mt-0.5 shrink-0" />
                        <span>
                          {musicAudio.error}{" "}
                          <button
                            type="button"
                            onClick={clearMusic}
                            className="underline hover:no-underline"
                          >
                            Clear
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* Raw footage (designs use the per-slide photo slots above) */}
            {!isDesign && (
              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#1A1A1D]">Raw footage</label>
                <AttachBox
                  disabled={submitting}
                  uploading={submitting && files.length > 0}
                  pct={progress}
                  onFiles={(picked) => { setUseLink(false); setClips(["", "", ""]); onPickFiles(picked); }}
                  link={clipDraft}
                  onLink={setClipDraft}
                  onSaveLink={() => {
                    const link = clipDraft.trim();
                    if (!link) return;
                    setError("");
                    setFiles([]);
                    setUseLink(true);
                    setClips((prev) => { const next = prev.filter((c) => c.trim()); return [...next, link].slice(0, 3).concat(["", "", ""]).slice(0, 3); });
                    setClipDraft("");
                  }}
                  items={useLink
                    ? filledClips.map((c, i) => ({ key: `clip-${i}`, name: `Clip ${i + 1}`, note: c, href: c, onRemove: () => setClips((prev) => { const next = prev.filter((x) => x.trim() && x.trim() !== c); if (!next.length) setUseLink(false); return next.concat(["", "", ""]).slice(0, 3); }) }))
                    : files.map((f, i) => ({ key: `${f.name}-${i}`, name: f.name, note: humanSize(f.size), onRemove: () => { setError(""); setFiles((prev) => prev.filter((_, idx) => idx !== i)); } }))}
                >
                  <p className="mt-2 text-[11px] text-brand-ink-soft">One video file, or up to 3 clip links shared with “Anyone with the link”.</p>
                </AttachBox>
              </div>
            )}

            {submitting && isDesign && (
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E5E8]">
                  <div
                    className="h-full bg-[#4F6BFF] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-[#6A6A72]">
                  {rendering ? "Creating your designs…" : `Uploading… ${progress}%`}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-[13px] text-[#C4322A]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-start gap-2 text-[13px] text-[#0E8A5F]">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>Edit request submitted. We'll get to it shortly.</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !canSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-[#4F6BFF] hover:bg-[#8878ea] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[12px] font-semibold px-5 py-2.5 transition"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? "Submitting…" : isDesign ? "Design now" : "Edit now"}
              </button>
            </div>
          </div>
        </div>

        {/* Submitted requests board */}
          <div className="mt-10">
            {deliveryBanner && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#BBEBD3] bg-[#EFFAF4] px-4 py-3">
                <span className="flex items-start gap-2 text-[12.5px] text-[#0E6B4C]">
                  <CheckCircle2 size={15} className="mt-[1px] shrink-0" />
                  {deliveryBanner}
                </span>
                <button
                  type="button"
                  onClick={() => setDeliveryDismissed(true)}
                  aria-label="Dismiss"
                  className="shrink-0 rounded-md p-0.5 text-[#0E6B4C]/60 transition hover:bg-[#0E6B4C]/10 hover:text-[#0E6B4C]"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <p
              className="mb-3 text-[11px] uppercase tracking-[.14em] text-[#5A5860]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Submitted requests
            </p>
            {requestsLoading ? (
              <div className="inline-flex items-center gap-2 text-[12px] text-[#9B9BA1]">
                <Loader2 size={14} className="animate-spin" /> Loading your requests…
              </div>
            ) : requests.length === 0 ? (
              <p className="text-[13px] text-[#9B9BA1]">
                No requests yet. Submit your first one above.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E5E5E8] bg-white">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="bg-[#F4F4F6]">
                    <tr className="text-[11px] uppercase tracking-[.08em] text-[#5A5860]">
                      <th className="px-4 py-2.5 font-semibold">Submitted</th>
                      <th className="px-4 py-2.5 font-semibold">Type</th>
                      <th className="px-4 py-2.5 font-semibold">Style</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Assets</th>
                      <th className="px-4 py-2.5 font-semibold">Music</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEDF0] text-[13px] text-[#2A2A2E]">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#FAFAFB]">

                        <td className="px-4 py-3 text-[#1A1A1D] whitespace-nowrap">
                          {fmtDate(req.createdTime)}
                        </td>
                        <td className="px-4 py-3 text-[#1A1A1D]">
                          {req.editingStyle === "Graphic" || req.editingStyle === "Carousel"
                            ? "Design"
                            : "Video Edit"}
                        </td>
                        <td className="px-4 py-3 text-[#1A1A1D]">{req.editingStyle}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${statusClasses(req.status)}`}
                          >
                            {req.status || "To Edit"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {req.files.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {req.files[0].type?.startsWith("video/") ? (
                                <FileVideo size={14} className="text-[#6A6A72]" />
                              ) : req.files[0].type?.startsWith("image/") ? (
                                <FileImage size={14} className="text-[#6A6A72]" />
                              ) : (
                                <FileText size={14} className="text-[#6A6A72]" />
                              )}
                              <span className="text-[#6A6A72]">
                                {req.files.length} file{req.files.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#9A9AA2]">Link / copy only</span>
                          )}
                         </td>
                        <td className="px-4 py-3">
                          {req.music ? (
                            <a
                              href={req.music}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#4F6BFF] hover:underline"
                            >
                              <Link2 size={12} /> Track
                            </a>
                          ) : (
                            <span className="text-[#9A9AA2]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {busy && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-[2px] cursor-wait"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
          role="alertdialog"
          aria-live="polite"
        >
          <div className="rounded-2xl bg-white px-6 py-5 shadow-xl border border-[#E5E5E8] text-center max-w-xs">
            <Loader2 size={22} className="animate-spin text-[#4F6BFF] mx-auto" />
            <p className="mt-3 text-[13px] font-semibold text-[#1A1A1D]">
              {submitting ? "Submitting your request…" : "Reading your script…"}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6A6A72] leading-relaxed">
              Please keep this tab open and don't click away — it will finish on its own.
            </p>
            {submitting && files.length > 0 && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-[#E5E5E8] overflow-hidden">
                  <div
                    className="h-full bg-[#4F6BFF] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-[#6A6A72]">Uploading… {progress}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {fyiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5E8] shadow-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#0E8A5F] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-[15px] font-semibold text-[#1A1A1D]">Request received</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#4A4A52]">
                  {isDesign ? (
                    <>
                      Your design is ready. It is already on your{" "}
                      <strong>Approve &amp; Post</strong> board with the images attached, waiting for
                      your approval.
                    </>
                  ) : (
                    <>
                      FYI — your edit is being produced now. In about 5 minutes, head to your{" "}
                      <strong>Approve &amp; Post</strong> board to review and approve the finished
                      file.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFyiOpen(false)}
                className="rounded-full border border-[#E5E5E8] text-[#4A4A52] hover:border-[#1A1A1D] text-sm px-4 py-2 transition"
              >
                Got it
              </button>
              {onGoToApprovals && (
                <button
                  type="button"
                  onClick={() => {
                    setFyiOpen(false);
                    onGoToApprovals();
                  }}
                  className="rounded-lg bg-[#4F6BFF] hover:bg-[#8878ea] text-white text-[12px] font-semibold px-4 py-2 transition"
                >
                  Go to approval board
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
