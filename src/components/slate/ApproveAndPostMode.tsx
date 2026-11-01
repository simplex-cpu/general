import { isLongFormType, showsClipFields } from "@/lib/slate/longFormTypes";
import { toast } from "sonner";
import { matchFilm, matchToApprove, matchApproved, matchPosted } from "@/lib/slate/plannerStatus";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { carouselSlidesFromPost, emptySlideFields, FIELD_LABELS, serializeCarouselCopy, slideFieldOrder, slideKind, type SlideFields } from "@/lib/slate/slideFields";
import { railItems, wordCount } from "@/lib/slate/contentCardRail";
import { Bot, Loader2, X, FileText, Image as ImageIcon, Upload, Trash2, Save, FileVideo, ExternalLink, Send, Link2 as LinkIcon, MoreHorizontal, Plus, MessageSquare, Maximize2, Check, RotateCcw, UserRound, ChevronDown, ChevronRight, ChevronLeft, Clock, Search } from "lucide-react";
import { siInstagram, siTiktok, siYoutube, siFacebook } from "simple-icons";
import { Button } from "@/components/ui/button";
import { CommentsPanel } from "./CommentsPanel";
import { BrandSelect, BrandMultiSelect } from "./BrandSelect";
import { startAiDesign, subscribeAiDesign, getAiDesignJob, clearAiDesignJob, AI_DESIGN_STALL_MS, type AiDesignJob } from "@/lib/slate/aiDesignJobs";
import { ProduceReviewModal } from "./ProduceReviewModal";
import { uploadDirectToDrive } from "@/lib/driveDirectUpload";
import { Teleprompter } from "./Teleprompter";
import { CarouselCopyEditor } from "./CarouselCopyEditor";
import { SlideCarousel } from "./SlideCarousel";
import { MediaStage, mediaMeta } from "./MediaStage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { normalizeTimestamps } from "@/lib/slate/longFormClipper";
import { AttachBox } from "./post/AttachBox";
import { checkAttachments, limitFor } from "@/lib/slate/attachLimits";
import { CollapsibleField } from "./post/CollapsibleField";
import { hashtagsFromCaption } from "@/lib/slate/postCopy";
import { shapeForFormat } from "@/lib/slate/socialSizes";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyBrands } from "@/lib/brands.functions";
import { PostTargets } from "./post/PostTargets";
import { postBlocker } from "@/lib/slate/postTargets";
import { fitColumnWidths, plannerMenuActions, plannerPrimaryActions, type PlannerActionId } from "@/lib/slate/plannerPresentation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { loadContentCard, mergeCard } from "@/lib/slate/contentCardLoader";
import { approvalGroup, APPROVAL_GROUPS, displayAssignee, productionGroup, PRODUCTION_GROUPS, statusTone, FORMAT_GROUPS, formatGroup } from "@/lib/slate/plannerPresentation";

type Attachment = { id?: string; url: string; filename: string; type?: string };
type StatusChoice = { name: string; color: string };
type Item = {
  id: string;
  createdTime: string;
  postName: string;
  postType: string;
  clientStatus: string;
  captions: string;
  captionsInstagram: string;
  captionsFacebook: string;
  captionsTiktok: string;
  captionsYoutube: string;
  platforms: string[];
  postingDate: string;
  producedFiles: Attachment[];
  thumbnail: Attachment[];
  editedFile: string;
  rawFilesLink: string;
  inspoUrl?: string;
  script?: string;
  visualHook?: string;
  textOverlay?: string;
  visualCta?: string;
  coverCopy?: string;
  slidesCopy?: string;
  ctaCopy?: string;
  /** "Risevoice Request" or "Do it Myself" — who is producing the post. */
  requestType?: string;
  designSubtype?: "quote" | "insightful";
  brandIds?: string[];
  postAccountIds?: string[];
  postFormats?: string[];
  /** Set when the post was clipped from a long form; timing and direction stay out of the script. */
  longFormIds?: string[];
  timestamps?: string;
  creativeDirection?: string;
  /** True while only Home's quick starter data is shown. */
  _starter?: boolean;
};

const isClip = (d: { longFormIds?: string[]; postType?: string }) => showsClipFields(d.postType || "", !!d.longFormIds?.length);

/** Which written fields a post type carries. */
type ScriptShape = "talking" | "broll" | "carousel" | "graphic";

function scriptShape(postType: string): ScriptShape {
  const t = postType || "";
  if (/carousel/i.test(t)) return "carousel";
  if (/graphic/i.test(t)) return "graphic";
  if (/broll|b-roll/i.test(t)) return "broll";
  return "talking";
}

/**
 * The written words arrive as one labelled blob ("Visual hook:", "Text
 * overlay:"), so split them back out for display.
 */
function splitScript(script: string) {
  const text = (script || "").replace(/\r/g, "");
  const grab = (label: RegExp) => {
    const re = new RegExp(`^[ \\t]*${label.source}[ \\t]*:[ \\t]*\\n?`, "im");
    const m = re.exec(text);
    if (!m) return "";
    const rest = text.slice(m.index + m[0].length);
    const next = /^[ \t]*(visual hook|hook|text overlay|script|copy|cta|on-screen cta|creative instructions)[ \t]*:/im.exec(rest);
    return (next ? rest.slice(0, next.index) : rest).trim();
  };
  const visualHook = grab(/(?:visual hook|hook)/);
  const textOverlay = grab(/text overlay/);
  // Anything not under a known label is the spoken script itself.
  let body = text;
  for (const part of [visualHook, textOverlay]) {
    if (part) body = body.split(part).join("");
  }
  body = body
    .split("\n")
    .filter((l) => !/^[ \t]*(visual hook|hook|text overlay)[ \t]*:[ \t]*$/i.test(l))
    .join("\n")
    .trim();
  return { visualHook, textOverlay, body };
}

/** Rebuilds the labelled blob from the edited pieces. */
function joinScript(parts: { visualHook?: string; textOverlay?: string; body?: string }) {
  return [
    parts.visualHook?.trim() ? `Visual hook:\n${parts.visualHook.trim()}` : "",
    parts.textOverlay?.trim() ? `Text overlay:\n${parts.textOverlay.trim()}` : "",
    parts.body?.trim() || "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

type FilterKey = "inProgress" | "toFilm" | "toApprove" | "approved" | "posted";

/** Long form Clipper view: Review (queued) / Production / To Approve / Ready to Post / Posted. */
const CLIPPER_FILTERS: { key: FilterKey; label: string; color: string; match: (s: string) => boolean }[] = [
  { key: "toFilm", label: "Review", color: "#B42318", match: matchFilm },
  { key: "inProgress", label: "Production", color: "#EF4444", match: (s) => !matchFilm(s) && !matchToApprove(s) && !matchApproved(s) && !matchPosted(s) },
  { key: "toApprove", label: "To Approve", color: "#F97316", match: matchToApprove },
  { key: "approved", label: "Ready to Post", color: "#EAB308", match: matchApproved },
  { key: "posted", label: "Posted", color: "#22C55E", match: matchPosted },
];

/** Scopes the planner to one long form's pieces and adds their source timestamps. */
const POSTING_ENABLED = false;

export type PlannerScope = { ids: string[]; timestamps: Record<string, string>; directions?: Record<string, string>; onSaveMeta?: (contentId: string, meta: { timestamps?: string; creativeDirection?: string }) => void; onDelete?: (contentId: string) => void; refreshKey?: number };

const isDeleted = (s: string) => /^deleted$/i.test((s || "").trim());



const FILTERS: { key: FilterKey; label: string; color: string; match: (s: string) => boolean }[] = [
  // Anything still being worked on, including internal statuses, so a post can
  // never become unreachable in the app.
  { key: "toFilm", label: "Prepare Footage", color: "#B42318", match: matchFilm },
  { key: "inProgress", label: "Production", color: "#EF4444", match: (s) => !matchFilm(s) && !matchToApprove(s) && !matchApproved(s) && !matchPosted(s) },
  { key: "toApprove", label: "To Approve", color: "#F97316", match: matchToApprove },
  { key: "approved", label: "Ready to Post", color: "#EAB308", match: matchApproved },
  { key: "posted", label: "Posted", color: "#22C55E", match: matchPosted },
];

/** Statuses that mean "waiting to be edited or designed". */
const isToProduceStatus = (s: string) =>
  /^(to\s*edit\s*\|\s*(to\s*)?design(ing)?|to\s*edit|to\s*design|produce|prepare for prod|scripting)$/i.test(
    (s || "").trim(),
  );

/** Statuses that mean the edit or design work itself is underway. */
const isProducingStatus = (s: string) =>
  /^(in progress|editing\s*\|\s*designing|editing|designing)$/i.test((s || "").trim());

/**
 * Reads any stored status the way the client thinks about it. The back end keeps
 * its own wording ("Produce", "To Edit | Design", "In Progress"), but for a
 * given format each one only ever means one of two things.
 */
function statusLabel(status: string, postType: string) {
  const s = (status || "").trim();
  const video = isVideoPostType(postType);
  if (/^(film|to film|prepare footage)$/i.test(s)) return "Prepare Footage";
  if (isProducingStatus(s)) return video ? "Editing" : "Designing";
  if (isToProduceStatus(s)) return video ? "To Edit" : "To Design";
  if (/^(approve|to approve|internal approval)$/i.test(s)) return "To Approve";
  if (/^ai re-?do$/i.test(s)) return "AI Redo";
  if (/^risevoice re-?do$/i.test(s)) return "Risevoice Redo";
  if (/^re-?do$/i.test(s)) return "AI Redo";
  return s;
}

/** Which board stage a stored status belongs to. */
function stageOf(status: string): FilterKey {
  return (FILTERS.find((f) => f.match(status))?.key || "inProgress") as FilterKey;
}

/** The stages a client can choose for a new post. */
const NEW_POST_STATUSES: { label: string; value: string }[] = [
  { label: "Prepare Footage", value: "Film" },
  { label: "Production", value: "In Progress" },
  { label: "To Approve", value: "Approve" },
  { label: "Ready to Post", value: "Approved" },
];

/** True when a post type is a video rather than a graphic or carousel. */
function isVideoPostType(postType: string) {
  return !/carousel|graphic/i.test(postType || "");
}

const isRisevoiceRequest = (it: { requestType?: string }) =>
  /risevoice/i.test(it.requestType || "");

/**
 * The bar only runs while the client's own edit or design is being produced.
 * Posts handed to a Risevoice creative show a tag instead, and posts merely
 * waiting to be produced show nothing.
 */
function showsProgress(it: { clientStatus: string; requestType?: string; editedFile?: string }) {
  if (isRisevoiceRequest(it)) return false;
  if (!isProducingStatus(it.clientStatus)) return false;
  return !/^https?:\/\//i.test((it.editedFile || "").trim());
}

/** Quiet ownership/activity state without an indeterminate moving bar. */
function ProductionActivity({ requestType, className = "", onRetry }: { requestType?: string; className?: string; onRetry?: () => void }) {
  const risevoice = /risevoice/i.test(requestType || "");
  return (
    <span data-no-open className={`inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-surface px-2 py-1 text-[10px] font-semibold text-brand-ink-soft ${className}`}>
      {risevoice ? <UserRound size={12} /> : <Bot size={12} className="text-brand-accent" />}
      {risevoice ? "In production" : "AI working"}
      {!risevoice && onRetry && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onRetry(); }} className="ml-1 rounded border border-brand-line bg-white px-1.5 py-0.5 text-brand-accent">Retry</button>
      )}
    </span>
  );
}

/** Live AI design progress for one post, or a failure note with retry. */
function AiDesignStatus({ id, onRetry, onTemplate, className = "" }: { id: string; onRetry: () => void; onTemplate: () => void; className?: string }) {
  const [job, setJob] = useState<AiDesignJob | undefined>(() => getAiDesignJob(id));
  useEffect(() => subscribeAiDesign(() => setJob(getAiDesignJob(id) ? { ...getAiDesignJob(id)! } : undefined)), [id]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (job?.state !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [job?.state]);
  if (!job) return null;
  if (job.state === "running") {
    const stalled = now - (job.updatedAt || now) > AI_DESIGN_STALL_MS;
    return (
      <span data-no-open className={`inline-flex flex-wrap items-center gap-1.5 rounded-full border border-brand-line bg-brand-surface px-2 py-1 text-[10px] font-semibold ${stalled ? "text-destructive" : "text-brand-ink-soft"} ${className}`}>
        {!stalled && <Loader2 size={11} className="animate-spin text-brand-accent" />}
        {stalled ? `AI design seems stuck at: ${job.step}` : job.step}
        {!stalled && job.total > 0 && (
          <span className="h-1 w-16 overflow-hidden rounded-full bg-brand-line">
            <span className="block h-full bg-brand-accent transition-all" style={{ width: `${Math.round(((/attaching/i.test(job.step) ? job.total + job.current : job.current) / (job.total * 2)) * 100)}%` }} />
          </span>
        )}
        {stalled && <button type="button" onClick={(e) => { e.stopPropagation(); onRetry(); }} className="rounded border border-brand-line bg-white px-1.5 py-0.5 text-brand-accent">Retry</button>}
      </span>
    );
  }
  if (job.state === "failed")
    return (
      <span data-no-open className={`inline-flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-destructive ${className}`}>
        AI design failed: {job.error}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRetry(); }} className="rounded border border-brand-line bg-white px-1.5 py-0.5 text-brand-accent">Retry</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); clearAiDesignJob(id); onTemplate(); }} className="rounded border border-brand-line bg-white px-1.5 py-0.5 text-brand-ink-soft">Use template instead</button>
      </span>
    );
  return job.fallbackSlides?.length ? <span className={`text-[10px] text-brand-ink-soft ${className}`}>Slides {job.fallbackSlides.join(", ")} used the standard layout</span> : null;
}

/** Shows who is producing the post, once a lane has been chosen. */
function RequestTypeTag({ requestType, className = "" }: { requestType?: string; className?: string }) {
  const rt = (requestType || "").trim();
  if (!rt) return null;
  const risevoice = /risevoice/i.test(rt);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
        risevoice ? "bg-[#EEF1FF] text-[#3F58E8]" : "bg-[#F3EEFF] text-[#6D45C9]"
      } ${className}`}
    >
      {risevoice ? "Risevoice request" : "Do it myself"}
    </span>
  );
}

/** Default widths (px) for the planner columns; the client can drag to resize. */
const DEFAULT_COL_WIDTHS = [200, 135, 165, 120, 190, 140, 180, 300];




function defaultStatusForTab(tab: string) {
  return ({ toFilm: "Film", inProgress: "To Edit | Design", toApprove: "Approve", approved: "Approved", posted: "Posted" } as Record<string, string>)[tab] || "Approve";
}

const CAPTION_PLATFORMS: { platform: string; key: "captionsInstagram" | "captionsFacebook" | "captionsTiktok" | "captionsYoutube"; label: string }[] = [
  { platform: "Instagram", key: "captionsInstagram", label: "Instagram" },
  { platform: "Facebook", key: "captionsFacebook", label: "Facebook" },
  { platform: "Tiktok", key: "captionsTiktok", label: "TikTok" },
  { platform: "Youtube", key: "captionsYoutube", label: "YouTube" },
];

/** Caption fields to show: the selected platforms, or all when none picked yet. */
function captionFieldsFor(platforms: string[] | undefined) {
  const sel = (platforms || []).map((p) => p.toLowerCase());
  const matched = CAPTION_PLATFORMS.filter((c) => sel.includes(c.platform.toLowerCase()));
  return matched.length ? matched : CAPTION_PLATFORMS;
}

type EditItem = {
  id: string;
  createdTime: string;
  editingStyle: string;
  status: string;
  textOverlay: string;
  visualHook: string;
  files: Attachment[];
};

function fmtDate(s: string) {
  if (!s) return "—";
  // Date-only values (2026-09-20) must never be pushed through the viewer's
  // timezone: that can show the previous day plus an invented time.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const utc = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return utc.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }
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


/** Newest first. */
function byNewest<T extends { createdTime?: string }>(a: T, b: T) {
  return new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime();
}

/** Status pill colours for the editing / designing board. */
function editStatusClasses(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("edited") || s.includes("designed") || s.includes("done") || s.includes("complete"))
    return "bg-[#DCFCE7] text-[#15803D]";
  if (s.includes("progress") || s.includes("editing") || s.includes("designing"))
    return "bg-[#FEF3C7] text-[#B45309]";
  return "bg-[#FEE2E2] text-[#B91C1C]";
}


function isImage(a: Attachment) {
  return (a.type || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)$/i.test(a.filename);
}
function isVideo(a: Attachment) {
  return (a.type || "").startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(a.filename);
}
function driveId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/[?&]id=([A-Za-z0-9_-]+)/) || url.match(/\/file\/d\/([A-Za-z0-9_-]+)/) || url.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
function drivePreviewUrl(url: string): string {
  const id = driveId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}
function driveThumbUrl(url: string): string {
  const id = driveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : url;
}

function readableTextOn(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1A1A1D" : "#FFFFFF";
}

function StatusPill({ status, choices }: { status: string; choices: StatusChoice[] }) {
  const c = choices.find((x) => x.name.toLowerCase() === (status || "").toLowerCase());
  const bg = c?.color || "#E5E7EB";
  return (
    <span
      className="inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
      style={{ backgroundColor: bg, color: readableTextOn(bg) }}
    >
      {status || "—"}
    </span>
  );
}

function PlatformIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  const p = platform.toLowerCase();
  const logo = p.includes("instagram") ? siInstagram : p.includes("tiktok") ? siTiktok : p.includes("youtube") ? siYoutube : p.includes("facebook") ? siFacebook : null;
  if (!logo) return <LinkIcon size={size} aria-hidden />;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={logo.path} /></svg>;
}

function PlatformList({ platforms }: { platforms: string[] }) {
  if (!platforms.length) return <span className="text-brand-ink-grey">Select…</span>;
  return <span className="flex min-w-0 items-center gap-3">{platforms.map((p) => <span key={p} title={p} aria-label={p} className="inline-flex shrink-0 items-center"><PlatformIcon platform={p} /></span>)}</span>;
}

/**
 * One compact dropdown instead of a row of buttons, so table rows stay a single
 * line tall. Clients still only ever pick a client-safe stage; "Request changes"
 * opens the comment dialog before the status moves to Re-do.
 */
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Prepare Footage", value: "Film" },
  { label: "To Edit | Design", value: "To Edit | Design" },
  { label: "Production", value: "In Progress" },
  { label: "To Approve", value: "Approve" },
  { label: "Approved", value: "Approved" },
  { label: "AI Redo", value: "AI Redo" },
  { label: "Risevoice Redo", value: "Risevoice Redo" },
  { label: "To Post", value: "To Post" },
  { label: "Posted", value: "Posted" },
];

/**
 * Any wording the back end may hold maps onto exactly one of the options above,
 * so the dropdown always shows the same nine stages with the right one selected.
 */
function canonicalStatus(status: string): string | null {
  const s = (status || "").trim();
  if (!s) return null;
  const exact = STATUS_OPTIONS.find((o) => o.value.toLowerCase() === s.toLowerCase());
  if (exact) return exact.value;
  if (/^(film|to film|prepare footage)$/i.test(s)) return "Film";
  if (isProducingStatus(s)) return "In Progress";
  if (isToProduceStatus(s)) return "To Edit | Design";
  if (/^(ai re-?do|re-?do)$/i.test(s)) return "AI Redo";
  if (/^risevoice re-?do$/i.test(s)) return "Risevoice Redo";
  if (/^(approve|to approve|internal approval)$/i.test(s)) return "Approve";
  if (/^posting$/i.test(s)) return "To Post";
  return null;
}

function ClientStatusSelect({
  status,
  choices,
  busy,
  onChangeStatus,
  onRequestChanges,
  chip,
  postType,
}: {
  status: string;
  choices: StatusChoice[];
  busy?: boolean;
  onChangeStatus: (status: string) => void;
  onRequestChanges: () => void;
  /** Renders as a coloured, still-editable status chip. */
  chip?: boolean;
  /** Lets combined statuses read as either the video or the design wording. */
  postType?: string;
}) {
  const current = (status || "").trim();
  const known = canonicalStatus(current);
  const options = [
    ...(known ? [] : [{ label: statusLabel(current, postType || "") || "—", value: "__current" }]),
    ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: statusLabel(o.value, postType || "") || o.label })),
    { label: "Request changes…", value: "__changes" },
  ];
  const supplied = choices.find((c) => c.name.toLowerCase() === current.toLowerCase())?.color;
  const tone = statusTone(current);
  const colour = supplied || ({ success: "#22C55E", warning: "#FACC15", danger: "#EF4444", active: "#F97316", pending: "#CBD5E1" } as const)[tone];
  return (
    <div className="flex items-center" data-no-open>
      <BrandSelect
        className={chip ? "" : "max-w-[180px]"}
        variant={chip ? "chip" : "inline"}
        chipColor={colour}
        value={known || "__current"}
        options={options}
        disabled={busy}
        onChange={(v) => {
          if (v === "__changes") { onRequestChanges(); return; }
          if (v === "__current") return;
          onChangeStatus(v);
        }}
      />
    </div>
  );
}





export type CardStarter = Partial<Item> & { id: string };
function starterItem(s: CardStarter): Item {
  return { createdTime: "", postName: "", postType: "", clientStatus: "", captions: "", captionsInstagram: "", captionsFacebook: "", captionsTiktok: "", captionsYoutube: "", platforms: [], postingDate: "", producedFiles: [], thumbnail: [], editedFile: "", rawFilesLink: "", ...s, _starter: true } as Item;
}

export function ApproveAndPostMode({ accessCode, initialPostId, initialItem, scope, modalOnly, onClose, onLinkOpened }: { accessCode: string; initialPostId?: string | null; initialItem?: CardStarter; scope?: PlannerScope; modalOnly?: boolean; onClose?: () => void; onLinkOpened?: () => void }) {
  const TABS = scope ? CLIPPER_FILTERS : FILTERS;
  const [items, setItems] = useState<Item[]>(() => (modalOnly && initialItem ? [starterItem(initialItem)] : []));
  const [statusChoices, setStatusChoices] = useState<StatusChoice[]>([]);
  const [postTypeChoices, setPostTypeChoices] = useState<string[]>([]);
  const [platformChoices, setPlatformChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>(scope ? "toFilm" : "toApprove");
  const [socials, setSocials] = useState<Record<string, { user: string; password: string; status: string }>>({});

  // Modal-only hosts (Home) open the card straight from its id — no list lookup needed.
  const [openId, setOpenId] = useState<string | null>(() => (modalOnly ? initialPostId || null : null));
  const linkedPostOpened = useRef<string | null>(modalOnly ? initialPostId || null : null);
  useEffect(() => {
    if (!initialPostId || linkedPostOpened.current === initialPostId) return;
    const post = items.find((item) => item.id === initialPostId);
    if (!post) return;
    linkedPostOpened.current = initialPostId;
    setFilter(scope ? (TABS.find((f) => f.match(post.clientStatus))?.key || "inProgress") : stageOf(post.clientStatus));
    setOpenId(post.id);
    onLinkOpened?.();
  }, [items, initialPostId]);
  // Modal-only hosts close only when an open card is closed (open → closed), never on mount.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!modalOnly) return;
    if (openId) wasOpen.current = true;
    else if (wasOpen.current) onClose?.();
  }, [modalOnly, openId]);
  const [draft, setDraft] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [rowSaving, setRowSaving] = useState<string | null>(null);
  const [platformsPopover, setPlatformsPopover] = useState<string | null>(null);
  const [platformsPos, setPlatformsPos] = useState<{ top: number; left: number } | null>(null);
  // Floating pickers close when the table scrolls so they never drift off their cell.
  useEffect(() => {
    if (!platformsPopover) return;
    const close = () => setPlatformsPopover(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [platformsPopover]);
  const [commentsFor, setCommentsFor] = useState<Item | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...PRODUCTION_GROUPS, ...APPROVAL_GROUPS, ...FORMAT_GROUPS].map(group => [group.key, true])),
  );
  const [colWidths, setColWidths] = useState<number[]>(DEFAULT_COL_WIDTHS);
  const manualCols = useRef<Set<number>>(new Set());
  const [brandFilter, setBrandFilter] = useState("");
  const listBrands = useServerFn(listMyBrands);
  const brandsQuery = useQuery({
    queryKey: ["my-brands", accessCode],
    queryFn: () => listBrands({ data: { accessCode } }),
    enabled: Boolean(accessCode),
    staleTime: 30000,
  });
  const plannerBrands = (brandsQuery.data || []) as { id: string; name: string; brandIds?: string[] }[];
  const brandOptions = plannerBrands.filter((b) => b.brandIds?.[0]).map((b) => ({ id: b.brandIds![0], name: b.name }));
  const actionTable = useRef<HTMLTableElement>(null);
  const [actionWidth, setActionWidth] = useState(280);
  // "To Edit"/"To Design": review the post, then pick who produces it.
  const [routeFor, setRouteFor] = useState<{ post: Item; handler?: "risevoice" | "myself" } | null>(null);
  const [designPick, setDesignPick] = useState<Item | null>(null);
  const [brandSel, setBrandSel] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  // Small "attach" chooser that sits on top of the post window.
  const [attachFor, setAttachFor] = useState<"Produced Files" | "Thumbnail" | null>(null);
  const [teleprompterFor, setTeleprompterFor] = useState<Item | null>(null);


  // Posted rows have nothing left to act on, so that column disappears there.
  const showAction = true;
  const ALL_HEADERS = ["Post name", "Type", "Status", "Assignee", "Created", "Platforms", "Posting date", "Action"];
  const visibleHeaders = showAction ? ALL_HEADERS : ALL_HEADERS.slice(0, 7);
  const visibleColWidths = showAction ? [...colWidths.slice(0, 7), actionWidth] : colWidths.slice(0, 7);


  /** Drag a column edge to resize it; widths never fall below 90px. */
  function startResize(index: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[index];
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(index === 4 ? 180 : 90, startWidth + (ev.clientX - startX));
      manualCols.current.add(index);
      setColWidths((prev) => prev.map((w, i) => (i === index ? next : w)));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
  const [createOpen, setCreateOpen] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<Item>>({
    postName: "",
    postType: "",
    // The client picks the stage in the form; defaults to To Approve.
    clientStatus: "Approve",

    captionsInstagram: "",
    captionsFacebook: "",
    captionsTiktok: "",
    captionsYoutube: "",
    platforms: [],
    postingDate: "",
  });
  const [confirmPost, setConfirmPost] = useState<Item | null>(null);
  const [changesFor, setChangesFor] = useState<Item | null>(null);
  const [changesText, setChangesText] = useState("");
  // Re-do asks first: fix it yourself (DIY) or send it back to Risevoice.
  const [changesMode, setChangesMode] = useState<"" | "diy" | "assign">("");
  const [changesSaving, setChangesSaving] = useState(false);

  const [warnMissing, setWarnMissing] = useState<string[] | null>(null);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editItemsLoading, setEditItemsLoading] = useState(false);
  const [editItemsError, setEditItemsError] = useState("");
  const [editOpen, setEditOpen] = useState<EditItem | null>(null);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [confirmDeleteEdit, setConfirmDeleteEdit] = useState<EditItem | null>(null);
  const [redoOpen, setRedoOpen] = useState(false);
  const [redoText, setRedoText] = useState("");
  const [redoSaving, setRedoSaving] = useState(false);

  const [mediaLink, setMediaLink] = useState("");
  const [thumbLink, setThumbLink] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const producedInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const rawFootageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingRaw, setUploadingRaw] = useState(false);
  /** Bumped after a post is handed over, so the board reloads. */
  const [nonce, setNonce] = useState(0);
  /** Which section of the open post is showing. */
  const [tab, setTab] = useState<"script" | "media" | "comments">("script");



  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (modalOnly && initialPostId) {
          // Shared single-card loader (same one Planner uses when a row opens).
          const { item, data } = await loadContentCard<Item>(initialPostId, accessCode);
          if (!cancelled) {
            setItems([{ ...mergeCard(initialItem, item), _starter: false }]);
            setStatusChoices(data.statusChoices || []);
            setPostTypeChoices(data.postTypeChoices || []);
            setPlatformChoices(data.platformChoices || []);
          }
          return;
        }
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 60000);
        const res = await fetch(`/api/dwy-client-content`, { headers: { "x-access-code": accessCode }, signal: ctl.signal }).finally(() => clearTimeout(timer));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        if (!cancelled) {
          setItems(data.items || []);
          setStatusChoices(data.statusChoices || []);
          setPostTypeChoices(data.postTypeChoices || []);
          setPlatformChoices(data.platformChoices || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.name === "AbortError" ? "This card took too long to load." : e?.message || "Failed to load posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accessCode, nonce, scope?.refreshKey]);

  // Planner: refresh the opened row through the shared loader (list data shows instantly meanwhile).
  useEffect(() => {
    if (modalOnly || !openId) return;
    const ctl = new AbortController();
    loadContentCard<Item>(openId, accessCode, ctl.signal)
      .then(({ item }) => setItems((prev) => prev.map((i) => (i.id === item.id ? mergeCard(i, item) : i))))
      .catch(() => {});
    return () => ctl.abort();
  }, [openId, modalOnly, accessCode]);
  const open = useMemo(() => items.find((i) => i.id === openId) || null, [items, openId]);
  // Reset only when a different post is opened, so background refreshes never
  // wipe unsaved typing or jump tabs.
  const openKey = open ? `${open.id}:${open._starter ? 1 : 0}` : null;
  useEffect(() => {
    setDraft(open ? { ...open } : null);
    setTab("script");
    // The paste box always opens empty: any existing delivered link is shown
    // read-only above it, so saving can never silently replace the media.
    setMediaLink("");
    setThumbLink("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);

  /** True only when the open post has edits waiting to be saved. */
  const dirty = useMemo(() => {
    if (!draft || !open) return false;
    if (mediaLink.trim() || thumbLink.trim()) return true;
    const keys = [
      "postName",
      "postType",
      "postingDate",
      "script",
      "visualHook",
      "textOverlay",
      "visualCta",
      "coverCopy",
      "slidesCopy",
      "ctaCopy",
      "rawFilesLink",
      "timestamps",
      "creativeDirection",
      "captionsInstagram",
      "captionsFacebook",
      "captionsTiktok",
      "captionsYoutube",
    ] as const;
    if (keys.some((k) => (draft[k] || "") !== (open[k] || ""))) return true;
    if ((draft.platforms || []).join("|") !== (open.platforms || []).join("|")) return true;
    if (draft.producedFiles.length !== open.producedFiles.length) return true;
    if (draft.thumbnail.length !== open.thumbnail.length) return true;
    return false;
  }, [draft, open, mediaLink, thumbLink]);

  /** Posts whose editing or design work is running in the back end right now. */
  const anyProducing = useMemo(() => items.some((item) => isProducingStatus(item.clientStatus)), [items]);

  // While work is running, quietly re-read the board so the progress bar clears
  // by itself the moment the finished file lands.
  useEffect(() => {
    if (!anyProducing) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/dwy-client-content", { headers: { "x-access-code": accessCode } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.items)) setItems(data.items);
      } catch {
        /* keep showing what we have */
      }
    }, 45000);
    return () => clearInterval(t);
  }, [anyProducing, accessCode]);

  useEffect(() => {
    if (modalOnly && loading) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/my-brief", { headers: { "x-access-code": accessCode } });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setSocials(data?.brief?.socials || {});
      } catch { /* non-blocking */ }
    })();
    return () => { cancelled = true; };
  }, [accessCode, modalOnly && loading]);


  useEffect(() => {
    if (modalOnly && loading) return;
    let cancelled = false;
    (async () => {
      setEditItemsLoading(true);
      setEditItemsError("");
      try {
        const res = await fetch("/api/dwy-edit-yourself", { headers: { "x-access-code": accessCode } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        if (!cancelled)
          setEditItems(
            (data.items || []).filter((i: EditItem) => !isDeleted(i.status)).sort(byNewest),
          );

      } catch (e: any) {
        if (!cancelled) setEditItemsError(e?.message || "Failed to load edit requests");
      } finally {
        if (!cancelled) setEditItemsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accessCode, modalOnly && loading]);

  const filtered = useMemo(() => {
    const f = TABS.find((x) => x.key === filter);
    if (!f) return [];
    return items
      .filter((i) => !scope || scope.ids.includes(i.id))
      .filter((i) => !isDeleted(i.clientStatus) && f.match(i.clientStatus || ""))
      .filter((i) => {
        if (!brandSel.length) return true;
        const ids = new Set(brandSel.flatMap((id) => [id, ...(plannerBrands.find((b) => b.id === id)?.brandIds || [])]));
        return (i.brandIds || []).some((id) => ids.has(id));
      })
      .filter((i) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [i.postName, i.postType, i.captionsInstagram, i.captionsTiktok, (i as any).topic].some((v) => String(v || "").toLowerCase().includes(q));
      })
      .sort(byNewest);

  }, [items, filter, scope, brandSel, search, plannerBrands]);

  // Size columns to their text once posts load; widths the client dragged stay put.
  useEffect(() => {
    if (!items.length || typeof document === "undefined") return;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return;
    const measure = (text: string, font: string) => { ctx.font = font; return ctx.measureText(text || "").width; };
    const fitted = fitColumnWidths(
      ["Post name", "Type", "Status", "Assignee", "Created", "Platforms", "Posting date"],
      [
        items.map((i) => i.postName),
        items.map((i) => i.postType),
        items.map((i) => statusLabel(i.clientStatus, i.postType).toUpperCase()),
        items.map((i) => displayAssignee(i.requestType)),
        items.map((i) => fmtDate(i.createdTime)),
        [],
        ["00/00/0000"],
      ],
      measure,
      DEFAULT_COL_WIDTHS.slice(0, 7),
    );
    setColWidths((prev) => prev.map((w, i) => (i < 7 && !manualCols.current.has(i) ? fitted[i] : w)));
  }, [items]);

  const displayedRows = useMemo(() => {
    if (filter === "toApprove") return APPROVAL_GROUPS.map((group) => ({
      ...group,
      items: filtered.filter((item) => approvalGroup(item.postType) === group.key),
    })).filter((group) => group.items.length > 0);
    if (filter !== "inProgress") return FORMAT_GROUPS.map((group) => ({
      ...group,
      items: filtered.filter((item) => formatGroup(item.postType) === group.key),
    })).filter((group) => group.items.length > 0);
    return PRODUCTION_GROUPS.map((group) => ({
      ...group,
      items: filtered.filter((item) => productionGroup(item.clientStatus, item.postType) === group.key),
    })).filter((group) => group.items.length > 0);
  }, [filter, filtered]);

  useEffect(() => {
    const controls = actionTable.current?.querySelectorAll<HTMLElement>("[data-planner-actions]");
    if (!controls?.length) return;
    const measure = () => {
      const widest = Math.max(...Array.from(controls, (control) => control.getBoundingClientRect().width));
      setActionWidth(Math.ceil(widest) + 24);
    };
    const observer = new ResizeObserver(measure);
    controls.forEach((control) => observer.observe(control));
    measure();
    return () => observer.disconnect();
  }, [filtered, filter, loading, collapsedGroups]);



  function updateItem(next: Item) {
    setItems((prev) => prev.map((i) => (i.id === next.id ? next : i)));
  }

  async function patchItem(id: string, fields: Record<string, any>): Promise<Item | null> {
    setRowSaving(id);
    try {
      const res = await fetch("/api/dwy-client-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ id, fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Save failed");
      updateItem(data.item);
      return data.item as Item;
    } catch (e: any) {
      alert(e?.message || "Save failed");
      return null;
    } finally {
      setRowSaving(null);
    }
  }

  /** The only two statuses a client action can produce, plus the posting flow. */
  async function setClientStatus(item: Item, status: string) {
    // When the post is open, the copy on screen is saved with the move, so a
    // stage change never throws away words the client just typed.
    if (draft && draft.id === item.id) {
      const saved = await persistDraft({ clientStatus: status });
      if (saved) setDraft({ ...saved, clientStatus: status });
      return;
    }
    await patchItem(item.id, { clientStatus: status });
  }

  /** One place that carries out a planner action from a button or the menu. */
  function runAction(it: Item, id: PlannerActionId, e?: React.MouseEvent) {
    if (id === "teleprompt") setTeleprompterFor(it);
    if (id === "attach") { setOpenId(it.id); setTab("media"); setAttachFor("Produced Files"); }
    if (id === "diyEdit" || id === "diyDesign") startDiy(it);
    if (id === "assign") setRouteFor({ post: it, handler: "risevoice" });
    if (id === "toApproval") void setClientStatus(it, "Approve");
    if (id === "toReady") void setClientStatus(it, "Approved");
    if (id === "redo") { setChangesMode(""); setChangesText(""); setChangesFor(it); }
    // Posting is "Coming soon"; keep the handler wired for when it returns.
    if (id === "post" && POSTING_ENABLED) attemptPost(it, e);
  }

  function runAiDesignJob(it: Item) {
    if (getAiDesignJob(it.id)?.state === "running" && !confirm("Restart this AI design from the beginning?")) return;
    void startAiDesign(it, {
      accessCode,
      setStatus: async (status) => {
        const res = await fetch("/api/dwy-client-content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({ id: it.id, fields: { clientStatus: status } }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Could not update the post.");
        setItems((prev) => prev.map((i) => (i.id === it.id ? { ...i, ...data.item } : i)));
      },
      onAttached: (f) => {
        const producedFiles = (f["Produced Files"] || []).map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }));
        setItems((prev) => prev.map((i) => (i.id === it.id ? { ...i, producedFiles } : i)));
      },
    }, { force: true });
  }

  function startDiy(it: Item) {
    if (isVideoPostType(it.postType)) setRouteFor({ post: it, handler: "myself" });
    else setDesignPick(it);
  }

  function actionsMenu(it: Item, primary: PlannerActionId[], onDelete?: () => void) {
    const list = plannerMenuActions(it.postType, primary);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" type="button" aria-label="More actions" className="h-8 w-8 shrink-0 border-brand-line bg-white text-brand-ink-soft hover:bg-[#F4F4F6] hover:text-brand-ink" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[120] w-52 rounded-lg border-[#E5E5E8] bg-white p-1 text-[#374151] shadow-[0_12px_30px_-12px_rgba(26,26,29,.35)]" onClick={(e) => e.stopPropagation()}>
          {list.map((a) => (
            <DropdownMenuItem key={a.id} disabled={a.disabled} onSelect={() => runAction(it, a.id)} className="flex-col items-start gap-0 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#374151] focus:bg-[#F7F8FF] focus:text-[#4F6BFF]">
              <span>{a.label}</span>
              {a.reason && <span className="text-[10.5px] font-normal text-[#9B9BA1]">{a.reason}</span>}
            </DropdownMenuItem>
          ))}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-destructive focus:bg-[#FEF2F2] focus:text-destructive"><Trash2 size={12} /> Delete</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  async function submitRequestChanges() {
    if (!changesFor || !changesText.trim()) return;
    const target = changesFor;
    setChangesSaving(true);
    try {
      const res = await fetch("/api/dwy-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ contentId: target.id, comment: changesText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      await setClientStatus(target, changesMode === "diy" ? "AI Redo" : "Risevoice Redo");
      setChangesFor(null);
      setChangesText("");
      if (changesMode === "diy") startDiy({ ...target, clientStatus: "AI Redo" });
    } catch (e: any) {
      alert(e?.message || "Failed to request changes");
    } finally {
      setChangesSaving(false);
    }
  }

  // DIY Re-do needs no note: move to AI Redo, then ask Template or AI design.
  async function startDiyRedo() {
    if (!changesFor) return;
    const target = changesFor;
    setChangesSaving(true);
    try {
      await setClientStatus(target, "AI Redo");
      setChangesFor(null);
      startDiy({ ...target, clientStatus: "AI Redo" });
    } catch (e: any) {
      alert(e?.message || "Failed to start the re-do");
    } finally {
      setChangesSaving(false);
    }
  }


  async function inlineSave(item: Item, changes: Partial<Item>) {
    const merged = { ...item, ...changes };
    updateItem(merged); // optimistic
    await patchItem(item.id, {
      postName: merged.postName,
      postType: merged.postType,
      // Status is never sent from an inline edit: it only changes through the
      // client actions, so an internal status can never be re-saved here.

      postingDate: merged.postingDate,
      platforms: merged.platforms,
    });
  }

  function missingPostFields(it: Item, pastedMedia?: string): string[] {
    const missing: string[] = [];
    if (!it.postType) missing.push("Post type");
    const hasMedia =
      (it.producedFiles && it.producedFiles.length > 0) ||
      /^https?:\/\//i.test((it.editedFile || "").trim()) ||
      /^https?:\/\//i.test((pastedMedia || "").trim());
    if (!hasMedia) missing.push("Media to Post");

    if (!it.platforms || it.platforms.length === 0) missing.push("Platforms");
    for (const c of captionFieldsFor(it.platforms)) {
      if (!((it[c.key] || "") as string).trim()) missing.push(`${c.label} caption`);
    }
    if (!it.postingDate) missing.push("Posting date");
    for (const p of it.platforms || []) {
      const entry = Object.entries(socials).find(([k]) => k.toLowerCase() === p.toLowerCase())?.[1];
      const connected =
        !!entry && /^connected$/i.test(entry.status || "") && !!entry.user?.trim() && !!entry.password?.trim();
      if (!connected) missing.push(`A connected ${p} account (Brand Info → Connected socials)`);
    }
    return missing;
  }


  function attemptPost(item: Item, e?: React.MouseEvent) {
    e?.stopPropagation();
    const missing = missingPostFields(item);
    if (missing.length > 0) {
      setWarnMissing(missing);
      return;
    }
    setConfirmPost(item);
  }

  async function confirmAndPost() {
    if (!confirmPost) return;
    const target = confirmPost;
    setConfirmPost(null);
    await patchItem(target.id, { clientStatus: "To Post" });
    if (draft && draft.id === target.id) setDraft({ ...draft, clientStatus: "To Post" });
  }

  async function createPost(override?: Partial<Item>) {
    const src = { ...newDraft, ...(override || {}) };
    if (!src.postName?.trim()) { alert("Post name required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/dwy-client-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({
          fields: {
            postName: src.postName,
            postType: src.postType || "",
            clientStatus: src.clientStatus || "Approve",
            postingDate: src.postingDate || "",
            platforms: src.platforms || [],
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setItems((prev) => [data.item, ...prev]);
      setCreateOpen(false);
      setInlineName("");
      setNewDraft({ postName: "", postType: "", clientStatus: "Approve", captionsInstagram: "", captionsFacebook: "", captionsTiktok: "", captionsYoutube: "", platforms: [], postingDate: "" });
      // Open the new record so user can attach media/thumbnail
      setOpenId(data.item.id);
    } catch (e: any) {
      alert(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  /** Saves everything on screen and returns the saved record, or null on failure. */
  async function persistDraft(extraFields: Record<string, any> = {}): Promise<Item | null> {
    if (!draft) return null;
    setSaving(true);
    try {
      const res = await fetch("/api/dwy-client-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({
          id: draft.id,
          fields: {
            postName: draft.postName,
            postType: draft.postType,
            // Status stays out of this save: it only moves through the client actions.
            captionsInstagram: draft.captionsInstagram || "",
            captionsFacebook: draft.captionsFacebook || "",
            captionsTiktok: draft.captionsTiktok || "",
            captionsYoutube: draft.captionsYoutube || "",
            postingDate: draft.postingDate,
            platforms: draft.platforms,
            script: draft.script || "",
            visualHook: draft.visualHook || "",
            textOverlay: draft.textOverlay || "",
            visualCta: draft.visualCta || "",
            creativeDirection: draft.creativeDirection || "",
            coverCopy: draft.coverCopy || "",
            slidesCopy: draft.slidesCopy || "",
            ...(scriptShape(draft.postType) === "carousel" ? { ctaCopy: draft.ctaCopy || "" } : {}),
            rawFilesLink: draft.rawFilesLink || "",
            ...(isClip(draft) ? { timestamps: draft.timestamps || "", creativeDirection: draft.creativeDirection || "" } : {}),
            producedFiles: draft.producedFiles,
            thumbnail: draft.thumbnail,
            ...(mediaLink.trim() ? { producedFileUrl: mediaLink.trim() } : {}),
            ...(thumbLink.trim() ? { thumbnailUrl: thumbLink.trim() } : {}),
            ...extraFields,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      updateItem(data.item);
      setMediaLink("");
      setThumbLink("");
      return data.item as Item;
    } catch (e: any) {
      alert(e?.message || "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    const saved = await persistDraft();
    if (saved) { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800); }
  }


  async function deleteDraft() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    setMenuOpen(false);
    await patchItem(target.id, { clientStatus: "Deleted" });
    setItems((prev) => prev.filter((i) => i.id !== target.id));
    setOpenId(null);
  }

  async function patchEditStatus(id: string, status: string) {
    const res = await fetch("/api/dwy-edit-yourself", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-access-code": accessCode },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Update failed");
  }

  async function deleteEditRequest() {
    if (!confirmDeleteEdit) return;
    const target = confirmDeleteEdit;
    setConfirmDeleteEdit(null);
    try {
      await patchEditStatus(target.id, "Deleted");
      setEditItems((prev) => prev.filter((i) => i.id !== target.id));
      setEditOpen(null);
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  async function submitRedo() {
    if (!editOpen) return;
    const text = redoText.trim();
    if (!text) { alert("Please describe what needs to be redone."); return; }
    setRedoSaving(true);
    try {
      const res = await fetch("/api/dwy-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ contentId: editOpen.id, comment: `Re-do request: ${text}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not save your redo request");
      await patchEditStatus(editOpen.id, "Re-do");
      setEditItems((prev) => prev.map((i) => (i.id === editOpen.id ? { ...i, status: "Re-do" } : i)));
      setEditOpen({ ...editOpen, status: "Re-do" });
      setRedoOpen(false);
      setRedoText("");
    } catch (e: any) {
      alert(e?.message || "Redo failed");
    } finally {
      setRedoSaving(false);
    }
  }


  /** Saves the whole window first, then validates the saved record, then posts. */
  async function postFromModal() {
    if (!draft || saving || uploading) return;
    const pastedMedia = mediaLink.trim();
    const saved = await persistDraft();
    if (!saved) return;
    const missing = missingPostFields(saved, pastedMedia);
    if (missing.length > 0) {
      setWarnMissing(missing);
      return;
    }
    setConfirmPost(saved);
  }



  async function uploadRawFootage(file?: File) {
    if (!file || !draft || uploadingRaw) return;
    setUploadingRaw(true);
    setUploadPct(0);
    try {
      const uploaded = await uploadDirectToDrive(file, accessCode, setUploadPct);
      await persistDraft({ rawFilesLink: `https://drive.google.com/file/d/${uploaded.fileId}/view` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Raw footage upload failed");
    } finally {
      setUploadingRaw(false);
      setUploadPct(0);
    }
  }

  async function handleUpload(field: "Produced Files" | "Thumbnail", file: File) {
    if (!draft) return;
    const isCarousel = /carousel/i.test(draft.postType || "");
    const multiple = field === "Produced Files" && isCarousel;
    setUploading(field);
    setUploadPct(0);
    try {
      // Bytes go browser → Google Drive directly, so there is no server size cap.
      const up = await uploadDirectToDrive(file, accessCode, setUploadPct);
      const res = await fetch("/api/dwy-content-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({
          recordId: draft.id,
          field,
          fileId: up.fileId,
          filename: up.filename,
          multiple,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok) throw new Error(data?.error || text.slice(0, 300) || "Upload failed");
      const f = data.fields || {};
      const next: Item = { ...draft };
      if (field === "Produced Files") {
        next.producedFiles = (f["Produced Files"] || []).map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }));
      } else {
        next.thumbnail = (f["Thumbnail"] || []).map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, type: a.type }));
      }
      setDraft(next);
      updateItem(next);
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(null);
      setUploadPct(0);
    }
  }


  function removeAttachment(field: "producedFiles" | "thumbnail", idx: number) {
    if (!draft) return;
    setDraft({ ...draft, [field]: draft[field].filter((_, i) => i !== idx) });
  }


  return (
    <div className={modalOnly ? "text-[#1A1A1D]" : `${scope ? "" : "min-h-[calc(100vh-200px)]"} bg-white text-[#1A1A1D]`}>
      {modalOnly && !draft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20" onClick={() => onClose?.()}>{error && !loading
        ? <div className="flex max-w-sm flex-col items-center gap-3 rounded-lg bg-background px-5 py-4 text-center text-sm shadow-lg" onClick={(e) => e.stopPropagation()}><p className="text-foreground">{error}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onClose?.()}>Close</Button><Button size="sm" onClick={() => setNonce((n) => n + 1)}>Try again</Button></div></div>
        : <span className="flex items-center gap-2 rounded-lg bg-background px-4 py-3 text-sm text-muted-foreground shadow-lg"><Loader2 size={16} className="animate-spin" /> Opening card…</span>}</div>}
      {modalOnly && draft && (loading || error) && <div className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-md">{loading ? <><Loader2 size={12} className="animate-spin" /> Loading details…</> : <>Couldn't load details — <button className="font-medium text-primary underline" onClick={() => setNonce((n) => n + 1)}>Try again</button></>}</div>}
      <div className={modalOnly ? "[&>*:not(.fixed)]:hidden" : "bg-white"}>
        {/* Filter sub-tabs */}
        <div className="flex w-full">
          {TABS.map((f) => {
            const active = filter === f.key;
            return (
              <Button variant="ghost"
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`h-12 flex-1 inline-flex items-center justify-center gap-2 rounded-none border-b-2 bg-brand-surface px-4 py-4 text-xs shadow-none transition hover:bg-brand-wash ${
                  active
                    ? "subtab-active"
                    : "border-transparent text-[#1A1A1D]/45 hover:text-[#1A1A1D]"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: f.color, opacity: active ? 1 : 0.5 }}
                  aria-hidden
                />
                {f.label}

              </Button>
            );
          })}
        </div>

        {/* Floating create-post action lives bottom-right; see below. */}



        <div className={scope ? "bg-white pt-3" : "bg-white px-4 sm:px-6 md:px-8 pt-6 pb-12"}>
          {!scope && (
            <div className="mb-4 flex items-center justify-end gap-2">
              {searchOpen && (
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setSearch(""); setSearchOpen(false); } }} placeholder="Search posts" className="h-8 w-48 rounded-lg border border-brand-line bg-white px-3 text-xs outline-none focus:border-[#7B83FF]" />
              )}
              <Button variant="outline" size="icon" type="button" aria-label="Search posts" onClick={() => { if (searchOpen) setSearch(""); setSearchOpen(!searchOpen); }} className="h-8 w-8 border-brand-line bg-white text-brand-ink-soft hover:bg-[#F4F4F6]"><Search size={14} /></Button>
              {plannerBrands.length > 1 && (
                <BrandMultiSelect
                  className="w-40 text-xs [&>button]:mt-0 [&>button]:h-8 [&>button]:py-1"
                  values={brandSel}
                  placeholder="All brands"
                  options={plannerBrands.map((b) => ({ label: b.name, value: b.id }))}
                  onChange={setBrandSel}
                />
              )}
            </div>
          )}
          {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-[#6A6A72]">
                <Loader2 size={16} className="animate-spin mr-2" /> Loading…
              </div>
            ) : error ? (
              <div className="p-8 text-sm text-red-600">{error}</div>
            ) : filtered.length === 0 && scope ? (
              <div className="p-12 text-center text-sm text-[#6A6A72]">
                No posts in this view.
              </div>
            ) : (
              <div className="planner-table-shell overflow-x-auto rounded-lg border border-brand-line bg-brand-surface">
                <table
                  ref={actionTable}
                  className="planner-table table-fixed text-xs"
                  style={{ width: visibleColWidths.reduce((a, b) => a + b, 0), minWidth: "100%" }}
                >
                  <colgroup>
                    {visibleColWidths.map((w, i) => (
                      <col key={i} style={{ width: w }} />
                    ))}
                  </colgroup>
                  <thead className="border-b border-brand-line bg-brand-surface text-brand-ink-soft text-xs">
                    <tr>
                      {visibleHeaders.map((label, i) => (
                        <th
                          key={label}
                          className={`font-medium py-3 text-left ${label === "Action" ? "planner-pinned sticky right-0 z-20 border-l border-brand-line bg-brand-surface" : "relative bg-brand-surface"} ${
                            label === "Action" ? "px-3" : label === "Created" ? "px-4" : "px-6"
                          }`}
                        >
                          <span className="block truncate">{label}</span>
                          {i < visibleColWidths.length - 1 && (
                            <span
                              role="separator"
                              aria-label={`Resize ${label} column`}
                              onMouseDown={(e) => startResize(i, e)}
                              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#4F6BFF]/40"
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.flatMap((group) => [
                      ...([
                        <tr key={`group-${group.key}`} className="planner-group border-t border-brand-line bg-brand-wash/70">
                          <td colSpan={visibleHeaders.length} className="p-0">
                            <Button variant="ghost" className="sticky left-0 h-10 justify-start gap-2 rounded-none px-5 text-brand-ink hover:bg-brand-line/30" aria-expanded={!collapsedGroups[group.key]} aria-label={`${collapsedGroups[group.key] ? "Expand" : "Collapse"} ${group.label}`} onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}>
                              {collapsedGroups[group.key] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              {filter !== "toApprove" && filter !== "inProgress" ? (/talking|broll/.test(group.key) ? <FileVideo size={14} className="text-brand-ink-soft" /> : <ImageIcon size={14} className="text-brand-ink-soft" />) : filter === "toApprove" ? (group.key === "videos" ? <FileVideo size={14} className="text-brand-ink-soft" /> : <ImageIcon size={14} className="text-brand-ink-soft" />) : <span className={`h-2 w-2 rounded-full ${group.key === "to-edit" || group.key === "to-design" ? "bg-progress-low" : "bg-progress-mid"}`} aria-hidden />}
                              <span className="text-xs font-semibold">{group.label}</span>
                              <span className="rounded-md border border-brand-line bg-brand-surface px-1.5 py-0.5 text-[10px] font-medium text-brand-ink-soft">{group.items.length}</span>
                            </Button>
                          </td>
                        </tr>,
                      ]),
                      ...(collapsedGroups[group.key] ? [] : group.items).map((it) => (
                      <tr
                        key={it.id}
                        onClick={(e) => {
                          const t = e.target as HTMLElement;
                          if (t.closest("input, select, textarea, button, a, [data-no-open]")) return;
                          setOpenId(it.id);
                        }}
                        className="group planner-row border-t border-brand-line hover:bg-brand-wash cursor-pointer align-middle"
                      >
                        {/* Post name inline */}
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                          <input
                            defaultValue={it.postName}
                            onBlur={(e) => {
                              const v = e.target.value;
                              if (v !== it.postName) inlineSave(it, { postName: v });
                            }}
                            className="w-full bg-transparent text-[#1A1A1D] font-medium outline-none border border-transparent hover:border-[#E5E5E8] focus:border-[#7B83FF] rounded px-2 py-1"
                            placeholder="Untitled"
                          />
                          <Button variant="ghost" size="icon" type="button" aria-label={`Expand ${it.postName || "post"}`} title="Expand" onClick={(e) => { e.stopPropagation(); setOpenId(it.id); }} className="h-7 w-7 shrink-0 text-brand-ink-soft hover:bg-brand-wash hover:text-brand-ink"><Maximize2 size={13} /></Button>
                          </div>
                          {getAiDesignJob(it.id) ? <AiDesignStatus id={it.id} className="ml-2 mt-1" onRetry={() => runAiDesignJob(it)} onTemplate={() => setRouteFor({ post: it, handler: "myself" })} /> : isProducingStatus(it.clientStatus) && <ProductionActivity requestType={it.requestType} className="ml-2 mt-1" onRetry={isVideoPostType(it.postType) ? undefined : () => runAiDesignJob(it)} />}
                        </td>
                        {/* Type inline */}
                        <td className="px-4 py-2">
                          <BrandSelect
                            value={it.postType}
                            options={[{ label: "—", value: "" }, ...postTypeChoices.map((p) => ({ label: p, value: p }))]}
                            onChange={(v) => inlineSave(it, { postType: v })}
                          />
                        </td>
                        {/* Status: read-only pill plus the client actions */}
                        <td className="px-4 py-2">
                          <ClientStatusSelect
                            status={it.clientStatus}
                            postType={it.postType}
                            choices={statusChoices}
                            busy={rowSaving === it.id}
                            onChangeStatus={(v) => setClientStatus(it, v)}
                            onRequestChanges={() => runAction(it, "redo")}
                            chip
                          />

                        </td>

                        {/* Assignee is derived from the production lane. */}
                        <td className="px-4 py-2 text-sm font-medium text-[#4A4A52]">
                          {displayAssignee(it.requestType)}
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4 text-brand-ink-soft whitespace-nowrap tabular-nums">{fmtDate(it.createdTime)}</td>
                        {/* Platforms inline popover */}
                        <td className="px-4 py-2 relative">
                          <Button variant="ghost"
                            type="button"
                            onClick={(e) => {
                              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setPlatformsPos({ top: r.bottom + 4, left: r.left });
                              setPlatformsPopover((p) => (p === it.id ? null : it.id));
                            }}
                            className="block w-full overflow-hidden bg-transparent text-brand-ink-mid text-sm border border-transparent hover:border-brand-line hover:bg-brand-wash rounded px-2 py-1 text-left"
                          >
                            <PlatformList platforms={it.platforms} />
                          </Button>
                          {platformsPopover === it.id && platformsPos && (
                            <div data-no-open style={{ position: "fixed", top: platformsPos.top, left: platformsPos.left }} className="z-[200] bg-white border border-[#E5E5E8] rounded-lg shadow-lg p-2 flex flex-row flex-wrap gap-2 min-w-[160px]">
                              {platformChoices.map((p) => {
                                const active = it.platforms.includes(p);
                                return (
                                  <Button variant="ghost"
                                    key={p}
                                    title={p}
                                    aria-label={p}
                                    aria-pressed={active}
                                    type="button"
                                    onClick={() => {
                                      const next = active ? it.platforms.filter((x) => x !== p) : [...it.platforms, p];
                                      inlineSave(it, { platforms: next });
                                    }}
                                    className={`text-left text-xs px-2 py-1.5 rounded ${active ? "bg-[#1A1A1D] text-white" : "hover:bg-[#F3F3F5] text-[#4A4A52]"}`}
                                  >
                                    <span className="inline-flex items-center gap-2"><PlatformIcon platform={p} />{active && <Check size={11} />}</span>
                                  </Button>
                                );
                              })}
                              <Button variant="ghost"
                                type="button"
                                onClick={() => setPlatformsPopover(null)}
                                className="text-[10px] text-[#6A6A72] mt-1 hover:text-[#1A1A1D]"
                              >
                                Close
                              </Button>
                            </div>
                          )}
                        </td>
                        {/* Posting date inline */}
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={it.postingDate ? it.postingDate.slice(0, 10) : ""}
                            onChange={(e) => inlineSave(it, { postingDate: e.target.value })}
                            className="bg-transparent text-[#4A4A52] outline-none border border-transparent hover:border-[#E5E5E8] focus:border-[#7B83FF] rounded px-2 py-1 text-sm"
                          />
                        </td>
                        {/* Action: one set of buttons per stage; none once posted */}

                        {showAction && (
                        <td className="planner-pinned sticky right-0 z-10 border-l border-brand-line bg-brand-surface px-3 py-3 text-left group-hover:bg-brand-wash" data-no-open>
                          <div data-planner-actions className="inline-flex w-max items-center justify-start gap-2 flex-nowrap [&>button]:shrink-0">
                            {filter === "toFilm" && scope && (
                              <Button type="button" onClick={(e) => { e.stopPropagation(); setRouteFor({ post: it }); }} disabled={rowSaving === it.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#4F6BFF] text-white border border-[#4F6BFF] hover:bg-[#3F58E8] whitespace-nowrap disabled:opacity-50"><Send size={11} /> Send to production</Button>
                            )}
                            {filter === "toFilm" && !scope && (
                              <>
                                <Button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(it.id); setTab("media"); setAttachFor("Produced Files"); }} disabled={rowSaving === it.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#4F6BFF] text-white border border-[#4F6BFF] hover:bg-[#3F58E8] whitespace-nowrap disabled:opacity-50"><Upload size={11} /> Attach</Button>
                                {scriptShape(it.postType) === "talking" && <Button type="button" onClick={(e) => { e.stopPropagation(); setTeleprompterFor(it); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-[#4F6BFF] border border-[#C7CCFF] hover:bg-[#F7F8FF] whitespace-nowrap"><FileText size={11} /> Teleprompt</Button>}
                              </>
                            )}
                            {filter === "inProgress" && isToProduceStatus(it.clientStatus) && (
                              <>
                                <Button variant="ghost"
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); startDiy(it); }}
                                  disabled={rowSaving === it.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#4F6BFF] text-white border border-[#4F6BFF] hover:bg-[#3F58E8] whitespace-nowrap disabled:opacity-50"
                                >
                                  {isVideoPostType(it.postType) ? "DIY Edit" : "DIY Design"}
                                </Button>
                                <Button variant="ghost"
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setRouteFor({ post: it, handler: "risevoice" }); }}
                                  disabled={rowSaving === it.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-[#4F6BFF] border border-[#C7CCFF] hover:bg-[#F7F8FF] whitespace-nowrap disabled:opacity-50"
                                >
                                  Assign to Risevoice
                                </Button>
                              </>
                            )}
                            {filter === "inProgress" && isProducingStatus(it.clientStatus) && (
                              <Button variant="ghost"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCommentsFor(it); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#4F6BFF] text-white border border-[#4F6BFF] hover:bg-[#3F58E8] whitespace-nowrap"
                              >
                                <MessageSquare size={11} />
                                Comment
                              </Button>
                            )}
                            {(filter === "toApprove" || (scope && filter === "inProgress" && matchToApprove(it.clientStatus))) && (
                              <>
                                <Button variant="ghost"
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setClientStatus(it, "Approved"); }}
                                  disabled={rowSaving === it.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-accent text-brand-surface hover:bg-brand-blue-mid whitespace-nowrap disabled:opacity-50"
                                >
                                  <Check size={11} />
                                  Approve
                                </Button>
                                <Button variant="ghost"
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); runAction(it, "redo"); }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-[#B42318] border border-[#B42318] hover:bg-[#B42318]/10 whitespace-nowrap"
                                >
                                  <RotateCcw size={11} />
                                  Re-do
                                </Button>
                              </>
                            )}
                            {scope?.onDelete && (
                              <Button variant="ghost" type="button" aria-label="Delete" title="Delete" onClick={(e) => { e.stopPropagation(); scope.onDelete?.(it.id); }} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></Button>
                            )}
                            {filter === "approved" && (
                              <span title="Coming soon" onClick={(e) => e.stopPropagation()} className="inline-flex cursor-not-allowed">
                                <Button variant="ghost"
                                  type="button"
                                  disabled
                                  aria-label="Post (coming soon)"
                                  className="pointer-events-none inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-accent text-brand-surface border border-brand-accent whitespace-nowrap disabled:opacity-50"
                                >
                                  <Send size={11} />
                                  Post
                                </Button>
                              </span>
                            )}
                          </div>
                        </td>
                        )}
                      </tr>
                    )),
                    ])}
                    {!scope && (
                      <tr className="border-t border-brand-line/60">
                        <td colSpan={visibleHeaders.length} className="p-0">
                          <div className="sticky left-0 flex items-center gap-2 px-4 py-2">
                            <Plus size={14} className="text-brand-ink-soft" />
                            <input
                              value={inlineName}
                              onChange={(e) => setInlineName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && inlineName.trim()) void createPost({ postName: inlineName.trim(), clientStatus: defaultStatusForTab(filter) }); }}
                              placeholder="New post — type a name and press Enter"
                              disabled={creating}
                              className="w-80 bg-transparent text-[13px] outline-none border border-transparent hover:border-[#E5E5E8] focus:border-[#7B83FF] rounded px-2 py-1"
                            />
                            {creating && <Loader2 size={13} className="animate-spin text-brand-ink-soft" />}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {draft && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-6"
            onClick={() => setOpenId(null)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-5xl w-full h-[96vh] flex flex-col shadow-2xl overflow-hidden"

              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 space-y-2.5 border-b border-[#EDEDF0] px-6 pb-3.5 pt-4 md:px-8">
                <div className="flex items-center gap-3">
                  <input
                    className="min-w-0 flex-1 truncate border-b border-transparent bg-transparent py-0.5 text-[15px] font-semibold outline-none hover:border-[#E5E5E8] focus:border-[#7B83FF]"
                    value={draft.postName}
                    onChange={(e) => setDraft({ ...draft, postName: e.target.value })}
                    placeholder="Post name"
                  />
                  <div role="tablist" aria-label="Card sections" className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-[#F3F4F6] p-0.5">
                    {([
                      { key: "script", label: "Script" },
                      { key: "media", label: "Media", count: draft.producedFiles.length },
                      { key: "comments", label: "Comments" },
                    ] as const).map((t) => (
                      <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                        className={`flex h-[26px] w-[88px] items-center justify-center gap-1 rounded-md text-[12px] font-medium transition ${tab === t.key ? "bg-white text-[#1A1A1D] shadow-sm" : "text-[#5A5860] hover:text-[#1A1A1D]"}`}>
                        {t.label}
                        {"count" in t && t.count ? <span className="text-[10px] font-semibold text-brand-ink-soft">{t.count}</span> : null}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setOpenId(null)} className="shrink-0 rounded-md p-1.5 text-[#6A6A72] hover:bg-[#F3F4F6] hover:text-[#1A1A1D]" aria-label="Close"><X size={16} /></button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                  <ClientStatusSelect
                    chip
                    status={draft.clientStatus}
                    postType={draft.postType}
                    choices={statusChoices}
                    busy={saving || !!uploading || rowSaving === draft.id}
                    onChangeStatus={(v) => setClientStatus(draft, v)}
                    onRequestChanges={() => runAction(draft, "redo")}
                  />
                  <span className="mx-1 h-3.5 w-px bg-[#E5E7EB]" aria-hidden />
                  <BrandSelect
                    className="[&>button]:h-6 [&>button]:px-1.5 [&>button]:text-[12px] [&>button]:font-medium [&>button]:text-[#374151]"
                    value={draft.postType}
                    placeholder="Format"
                    options={postTypeChoices.map((p) => ({ label: p, value: p }))}
                    onChange={async (v) => { setDraft({ ...draft, postType: v }); const saved = await persistDraft({ postType: v }); if (saved) setDraft((prev) => (prev && prev.id === saved.id ? { ...prev, postType: saved.postType || v } : prev)); }}
                  />
                  <DatePickerChip value={draft.postingDate ? draft.postingDate.slice(0, 10) : ""} onChange={(v) => setDraft({ ...draft, postingDate: v })} />
                  <PostTargets
                    accessCode={accessCode}
                    brands={brandOptions}
                    brandId={draft.brandIds?.[0] || ""}
                    accountIds={draft.postAccountIds || []}
                    formats={draft.postFormats || []}
                    icon={(p) => <PlatformIcon platform={p} size={12} />}
                    onBrand={async (brandId) => { setDraft({ ...draft, brandIds: [brandId], postAccountIds: [], postFormats: [] }); const saved = await persistDraft({ brandId }); if (saved) setDraft((prev) => (prev && prev.id === saved.id ? { ...prev, brandIds: saved.brandIds, postAccountIds: saved.postAccountIds, postFormats: saved.postFormats, platforms: saved.platforms } : prev)); }}
                    onTargets={async (postAccountIds, postFormats) => { setDraft({ ...draft, postAccountIds, postFormats }); const saved = await persistDraft({ postAccountIds, postFormats }); if (saved) setDraft((prev) => (prev && prev.id === saved.id ? { ...prev, postAccountIds: saved.postAccountIds, postFormats: saved.postFormats, platforms: saved.platforms } : prev)); }}
                  />
                  {open?.inspoUrl && /^https?:\/\//i.test(open.inspoUrl) && (
                    <a href={open.inspoUrl} target="_blank" rel="noopener" title={open.inspoUrl} className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1D]"><LinkIcon size={12} />Inspo</a>
                  )}
                </div>
              </div>

              <div
                className={`flex-1 min-h-0 bg-[#F7F7F9] ${
                  tab === "comments" ? "flex flex-col overflow-hidden" : tab === "script" ? "overflow-hidden" : "overflow-y-auto bg-white px-6 py-6 md:px-8"
                }`}
              >

                {tab === "script" && (
                  <CardScript
                    key={draft.id}
                    draft={draft}
                    shape={scriptShape(draft.postType)}
                    split={splitScript}
                    join={joinScript}
                    captionFields={captionFieldsFor(draft.platforms)}
                    patch={(f) => setDraft((prev) => (prev ? { ...prev, ...f } : prev))}
                    onTeleprompter={() => setTeleprompterFor(draft)}
                    clip={isClip({ ...draft, longFormIds: scope ? ["scope"] : draft.longFormIds }) ? <ClipMetaFields key={draft.id} timestamps={draft.timestamps || scope?.timestamps[draft.id] || ""} direction={draft.creativeDirection || scope?.directions?.[draft.id] || ""} onChange={(m) => setDraft((prev) => (prev ? { ...prev, ...m } : prev))} onSave={(m) => scope?.onSaveMeta?.(draft.id, m)} /> : null}
                  />
                )}
                {tab === "media" && (() => {
                  const isCarousel = /carousel/i.test(draft.postType || "");
                  const productionMedia = stageOf(draft.clientStatus) === "inProgress";
                  const sourceLink = /^https?:\/\//i.test(draft.rawFilesLink.trim()) ? draft.rawFilesLink.trim() : "";
                  const attachLabel = !isCarousel && draft.producedFiles.length > 0 ? "Replace" : "Attach";
                  const reel = shapeForFormat(draft.postType) === "reel";
                  const head = "flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#6A6A72]";
                  return (
                  <div className="grid min-h-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                <section className="flex min-w-0 flex-col gap-3">
                  <h3 className={head}>
                    <span>{productionMedia ? "Source media" : "Preview"}</span>
                    <span className="normal-case tracking-normal font-normal text-[12px] text-brand-ink-soft">{mediaMeta(draft.producedFiles, reel)}</span>
                  </h3>
                  {productionMedia && sourceLink && (
                    <div className="mb-4 space-y-3">
                      {/\.(mp4|webm|mov)(?:\?|$)/i.test(sourceLink) ? <video src={sourceLink} controls playsInline aria-label="Source footage" className="max-h-[360px] w-full bg-brand-navy" />
                        : /\.(png|jpe?g|webp)(?:\?|$)/i.test(sourceLink) ? <img src={sourceLink} alt="Source media" className="max-h-[360px] w-full object-contain" />
                          : /drive\.google\.com\/file\/d\//i.test(sourceLink) ? <iframe title="Source media" src={drivePreviewUrl(sourceLink)} className="h-[360px] w-full border-0" allow="autoplay" /> : null}
                      {/^https:\/\/drive\.google\.com\//i.test(sourceLink) ? <Button asChild variant="outline" className="border-brand-line bg-brand-surface text-brand-accent"><a href={sourceLink} target="_blank" rel="noreferrer"><ExternalLink size={14} />Open source media</a></Button> : <Button type="button" variant="outline" className="border-brand-line bg-brand-surface text-brand-accent" onClick={() => { void navigator.clipboard.writeText(sourceLink); toast.success("Link copied"); }}>Copy source link</Button>}
                    </div>
                  )}
                  {productionMedia && !sourceLink && !draft.producedFiles.length && <p className="mb-3 text-sm text-brand-ink-soft">No source media attached.</p>}
                  {(!productionMedia || draft.producedFiles.length > 0) && (
                    <MediaStage items={draft.producedFiles} reel={reel} broll={scriptShape(draft.postType) === "broll"} onRemove={(i) => removeAttachment("producedFiles", i)} />
                  )}
                </section>
                <div className="min-w-0 space-y-6">
                <section className="min-w-0 space-y-3" aria-label="Media to post attachments">
                  <h3 className={head}><span>Media to post</span><span className="normal-case tracking-normal font-normal text-[12px] text-brand-ink-soft">{draft.producedFiles.length} file{draft.producedFiles.length === 1 ? "" : "s"}</span></h3>
                  <div>
                    <AttachBox
                      compact
                      label={attachLabel}
                      multiple={isCarousel}
                      disabled={saving}
                      uploading={uploading === "Produced Files"}
                      pct={uploadPct}
                      accept={limitFor(draft.postType)?.accept}
                      onFiles={async (files) => { const list = Array.from(files); const err = checkAttachments(draft.postType, [...draft.producedFiles.map((f: any) => ({ type: f.type || (/\.(mp4|mov|webm)/i.test(f.filename || f.url || "") ? "video/mp4" : "image/png") })), ...list].slice(isCarousel ? 0 : -list.length)); if (err) { toast.error(err); return; } for (const f of list) await handleUpload("Produced Files", f); }}
                      link={mediaLink}
                      onLink={setMediaLink}
                      savingLink={saving}
                      onSaveLink={async () => { const saved = await persistDraft(); if (saved) setDraft(saved); }}
                    />
                  </div>
                </section>
                <section className="min-w-0 space-y-3" aria-label="Raw footage attachments">
                  <h3 className={head}><span>{scriptShape(draft.postType) === "carousel" || scriptShape(draft.postType) === "graphic" ? "Source files" : "Raw footage"}</span><span className="normal-case tracking-normal font-normal text-[12px] text-brand-ink-soft">{sourceLink ? "1 file" : "0 files"}</span></h3>
                  <AttachBox
                    compact
                    disabled={saving}
                    uploading={uploadingRaw}
                    pct={uploadPct}
                    onFiles={(files) => void uploadRawFootage(files[0])}
                    link={draft.rawFilesLink || ""}
                    onLink={(value) => setDraft({ ...draft, rawFilesLink: value })}
                    items={sourceLink ? [{ key: "raw", name: /drive\.google\.com/i.test(sourceLink) ? "Google Drive footage" : /dropbox/i.test(sourceLink) ? "Dropbox footage" : "Linked footage", href: sourceLink, onRemove: () => setDraft({ ...draft, rawFilesLink: "" }) }] : []}
                  />
                </section>
                </div>
                  </div>
                  );
                })()}

                {tab === "comments" && (
                  <CommentsPanel inline contentId={draft.id} accessCode={accessCode} />
                )}
              </div>


              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 border-t border-[#EDEDF0] bg-white [&_button]:py-1.5 [&_button]:text-[13px]">
                <div className="min-w-0 flex-1">
                  {getAiDesignJob(draft.id) ? <AiDesignStatus id={draft.id} onRetry={() => runAiDesignJob(draft)} onTemplate={() => setRouteFor({ post: draft, handler: "myself" })} /> : isProducingStatus(draft.clientStatus) ? <ProductionActivity requestType={draft.requestType} onRetry={isVideoPostType(draft.postType) ? undefined : () => runAiDesignJob(draft)} /> : <RequestTypeTag requestType={draft.requestType} />}
                </div>
                <div className="flex items-center gap-3">
                {/* Saving replaces the stage action, so there are never four buttons. */}
                {dirty ? (
                  <button
                    onClick={saveDraft}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                ) : (
                  <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-ink-soft"><Check size={13} /> {savedFlash ? "Saved" : "All changes saved"}</span>
                {/* The same actions the row shows for this stage. */}
                {stageOf(draft.clientStatus) === "toFilm" && (
                  <>
                    <button onClick={() => setTab("media")} disabled={saving || !!uploading || rowSaving === draft.id} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] disabled:opacity-50"><Upload size={14} /> Attach</button>
                    {scriptShape(draft.postType) === "talking" && <button onClick={() => setTeleprompterFor(draft)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#4F6BFF] border border-[#C7CCFF] hover:bg-[#F7F8FF]"><FileText size={14} /> Teleprompt</button>}
                  </>
                )}
                {stageOf(draft.clientStatus) === "inProgress" && isToProduceStatus(draft.clientStatus) && (
                  <>
                    <button
                      onClick={() => startDiy(draft)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8]"
                    >
                      {isVideoPostType(draft.postType) ? "DIY Edit" : "DIY Design"}
                    </button>
                    <button
                      onClick={() => setRouteFor({ post: draft, handler: "risevoice" })}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#4F6BFF] border border-[#C7CCFF] hover:bg-[#F7F8FF]"
                    >
                      Assign to Risevoice
                    </button>
                  </>
                )}
                {stageOf(draft.clientStatus) === "inProgress" && isProducingStatus(draft.clientStatus) && (
                  <button
                    onClick={() => setTab("comments")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8]"
                  >
                    <MessageSquare size={14} />
                    Comment
                  </button>
                )}
                {stageOf(draft.clientStatus) === "toApprove" && (
                  <>
                    <button
                      onClick={() => setClientStatus(draft, "Approved")}
                      disabled={saving || rowSaving === draft.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-accent text-brand-surface hover:bg-brand-blue-mid disabled:opacity-50"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => runAction(draft, "redo")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#B42318] border border-[#B42318] hover:bg-[#B42318]/10"
                    >
                      <RotateCcw size={14} />
                      Re-do
                    </button>
                  </>
                )}
                {stageOf(draft.clientStatus) === "approved" && (
                  <span title={postBlocker({ clientStatus: draft.clientStatus, postAccountIds: draft.postAccountIds || [], postFormats: draft.postFormats || [] }) || "Posting through your accounts is coming soon"} className="inline-flex cursor-not-allowed">
                    <button
                      type="button"
                      disabled
                      aria-label="Post (coming soon)"
                      className="pointer-events-none inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-accent text-brand-surface opacity-50"
                    >
                      <Send size={14} />
                      Post
                    </button>
                  </span>
                )}
                  </>
                )}
                {actionsMenu(draft, plannerPrimaryActions(scope ? filter : stageOf(draft.clientStatus), draft.clientStatus, draft.postType, isToProduceStatus(draft.clientStatus)), () => setConfirmDelete(draft))}
                </div>
              </div>

            </div>
          </div>
        )}

        {!createOpen && !scope && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="Create post"
            title="Create post"
            className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#4F6BFF] text-white shadow-lg transition hover:bg-[#3F58E8] focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]/40"
          >
            <Plus size={24} />
          </button>
        )}

        {/* Create Post modal */}
        {createOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto"
            onClick={() => !creating && setCreateOpen(false)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-2xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EDEDF0] shrink-0">
                <h2 className="text-lg font-semibold">Create Post</h2>
                <button
                  onClick={() => !creating && setCreateOpen(false)}
                  className="text-[#6A6A72] hover:text-[#1A1A1D] p-2 rounded"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div>
                  <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Post name *</label>
                  <input
                    className="mt-1 w-full border border-[#E5E5E8] rounded-lg px-3 py-2 bg-white text-sm"
                    value={newDraft.postName || ""}
                    onChange={(e) => setNewDraft({ ...newDraft, postName: e.target.value })}
                    placeholder="Untitled post"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Post type</label>
                    <BrandSelect
                      variant="field"
                      value={newDraft.postType || ""}
                      options={[{ label: "—", value: "" }, ...postTypeChoices.map((p) => ({ label: p, value: p }))]}
                      onChange={(v) => setNewDraft({ ...newDraft, postType: v })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Status</label>
                    <BrandSelect
                      variant="field"
                      value={newDraft.clientStatus || "Approve"}
                      options={NEW_POST_STATUSES}
                      onChange={(v) => setNewDraft({ ...newDraft, clientStatus: v })}
                    />
                  </div>


                  <div>
                    <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Posting date</label>
                    <input
                      type="date"
                      className="mt-1 w-full border border-[#E5E5E8] rounded-lg px-3 py-2 bg-white text-sm"
                      value={newDraft.postingDate || ""}
                      onChange={(e) => setNewDraft({ ...newDraft, postingDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72] mb-2 block">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {platformChoices.map((p) => {
                      const active = (newDraft.platforms || []).includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const cur = newDraft.platforms || [];
                            setNewDraft({ ...newDraft, platforms: active ? cur.filter((x) => x !== p) : [...cur, p] });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs border transition ${active ? "bg-[#1A1A1D] text-white border-[#1A1A1D]" : "bg-white text-[#4A4A52] border-[#E5E5E8] hover:border-[#1A1A1D]"}`}
                        >
                          <span className="inline-flex items-center gap-2"><PlatformIcon platform={p} />{active && <Check size={12} />}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#EDEDF0] shrink-0">

                <button
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void createPost()}
                  disabled={creating || !newDraft.postName?.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[#4F6BFF] text-white hover:bg-[#3F58E8] disabled:opacity-60"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                  {creating ? "Creating…" : "Create Post"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File pickers stay mounted so "Upload a file" always opens the device picker */}
        <input
          ref={rawFootageInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void uploadRawFootage(file);
          }}
        />
        <input
          ref={producedInputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("Produced Files", f); e.target.value = ""; }}
        />
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("Thumbnail", f); e.target.value = ""; }}
        />
        {/* Attach chooser: sits on top of the post window, upload or paste a link */}
        {attachFor && draft && (() => {
          const isThumb = attachFor === "Thumbnail";
          const link = isThumb ? thumbLink : mediaLink;
          const setLink = isThumb ? setThumbLink : setMediaLink;
          const close = () => { setLink(""); setAttachFor(null); };
          return (
            <div
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={close}
            >
              <div
                className="bg-white border border-[#E5E5E8] rounded-2xl max-w-sm w-full p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[15px] font-semibold text-[#1A1A1D] mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {isThumb ? "Add a thumbnail" : "Add media"}
                </h3>
                <p className="text-[13px] text-[#6A6A72] mb-4">Upload a file from your device, or paste a link to it.</p>
                <button
                  type="button"
                  onClick={() => {
                    setAttachFor(null);
                    (isThumb ? thumbnailInputRef : producedInputRef).current?.click();
                  }}
                  className="w-full h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#4F6BFF] text-white text-sm font-semibold hover:bg-[#3F58E8]"
                >
                  <Upload size={16} /> Upload a file
                </button>
                <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[.18em] text-[#9B9BA1]">
                  <span className="h-px flex-1 bg-[#EDEDF0]" /> or <span className="h-px flex-1 bg-[#EDEDF0]" />
                </div>
                <div className="h-[46px] flex items-center gap-2 border border-[#E5E5E8] rounded-lg px-3 bg-white focus-within:border-[#7B83FF]">
                  <LinkIcon size={14} className="text-[#9B9BA1] shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none h-full"
                    placeholder="Paste a link (https://…)"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!/^https?:\/\//i.test(link.trim()) || saving}
                    onClick={async () => {
                      const saved = await persistDraft();
                      if (saved) { setDraft(saved); setAttachFor(null); }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save link
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Request changes: leaves a comment and moves the post to Re-do */}
        {changesFor && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setChangesFor(null)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {!changesMode ? (
                <>
                  <h3 className="text-base font-semibold">Re-do “{changesFor.postName || "Untitled"}”</h3>
                  <p className="mt-1 text-[13px] text-[#6A6A72]">Who should make the changes?</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button type="button" disabled={changesSaving} onClick={startDiyRedo} className="flex flex-col items-center gap-1 rounded-lg bg-[#4F6BFF] py-4 text-white hover:bg-[#3F58E8] disabled:opacity-50">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">{changesSaving && <Loader2 size={14} className="animate-spin" />}DIY Re-do</span>
                      <span className="text-[11px] font-normal opacity-80">Fix it yourself</span>
                    </button>
                    <button type="button" onClick={() => setChangesMode("assign")} className="flex flex-col items-center gap-1 rounded-lg border border-[#E5E5E8] bg-white py-4 text-[#1A1A1F] hover:bg-[#FAFAFB]">
                      <span className="text-sm font-semibold">Assign Re-do</span>
                      <span className="text-[11px] font-normal text-[#6A6A72]">Send back to Risevoice</span>
                    </button>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => setChangesFor(null)} className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] bg-white text-[#1A1A1F] hover:bg-[#FAFAFB]">Cancel</button>
                  </div>
                </>
              ) : (
              <>
              <h3 className="text-base font-semibold">{changesMode === "diy" ? "DIY Re-do" : "Assign Re-do"}</h3>
              <p className="mt-1 text-[13px] text-[#6A6A72]">
                {changesMode === "diy" ? "Note what you'll change. It's saved in the comments, then your editor opens." : `Tell the team what to change on “${changesFor.postName || "Untitled"}”.`}
              </p>
              <textarea
                value={changesText}
                onChange={(e) => setChangesText(e.target.value)}
                rows={4}
                className="mt-3 w-full border border-[#E5E5E8] rounded-lg px-3 py-2 text-sm"
                placeholder="What should change?"
              />
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setChangesMode("")}
                  className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]"
                >
                  Back
                </button>
                <button
                  onClick={submitRequestChanges}
                  disabled={changesSaving || !changesText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] disabled:opacity-50"
                >
                  {changesSaving && <Loader2 size={14} className="animate-spin" />}
                  {changesMode === "diy" ? "Save & open editor" : "Send to Risevoice"}
                </button>
              </div>
              </>
              )}
            </div>
          </div>
        )}

        {/* Confirm Post modal */}
        {confirmPost && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmPost(null)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-3">Confirm post</h3>
                <p className="text-sm text-[#4A4A52]">
                  Are you sure you want to post{" "}
                  {confirmPost.producedFiles[0] ? (
                    <a
                      href={confirmPost.producedFiles[0].url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4F6BFF] underline"
                    >
                      {confirmPost.producedFiles[0].filename || "this media"}
                    </a>
                  ) : (
                    <span className="font-medium">this media</span>
                  )}{" "}
                  as a <span className="font-medium">{confirmPost.postType || "—"}</span> to{" "}
                  <span className="font-medium">{confirmPost.platforms.join(", ") || "—"}</span>, on{" "}
                  <span className="font-medium">{fmtDate(confirmPost.postingDate)}</span>?
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#EDEDF0]">
                <button
                  onClick={() => setConfirmPost(null)}
                  className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndPost}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-accent text-brand-surface border border-brand-accent hover:bg-brand-blue-mid whitespace-nowrap"
                >
                  <Send size={14} />
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warn missing fields modal */}
        {warnMissing && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setWarnMissing(null)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-3">Missing required fields</h3>
                <p className="text-sm text-[#4A4A52] mb-3">
                  Please fill out the pending required fields before trying to post:
                </p>
                <ul className="text-sm text-[#1A1A1D] list-disc pl-5 space-y-1">
                  {warnMissing.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#EDEDF0]">
                <button
                  onClick={() => setWarnMissing(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[#4F6BFF] text-white hover:bg-[#3F58E8]"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <div className="bg-white border border-[#E5E5E8] rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Delete this post?</h3>
                <p className="text-sm text-[#4A4A52]">
                  “{confirmDelete.postName || "Untitled"}” will be marked as <strong>Deleted</strong> and removed from your list.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#EDEDF0]">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]">
                  Cancel
                </button>
                <button onClick={deleteDraft} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}



        {editOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-6"
            onClick={() => setEditOpen(null)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 flex items-start justify-between gap-4 p-6 border-b border-[#EDEDF0]">
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold truncate">{editOpen.editingStyle || "Edit request"}</div>
                  <div className="mt-2">
                    <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${editStatusClasses(editOpen.status)}`}>
                      {editOpen.status || "—"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditOpen(null)}
                  className="shrink-0 text-[#6A6A72] hover:text-[#1A1A1D] p-2 rounded"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Editing style</label>
                    <div className="mt-1 border border-[#E5E5E8] rounded-lg px-3 py-2 bg-[#FAFAFB] text-sm">
                      {editOpen.editingStyle || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72]">Submitted</label>
                    <div className="mt-1 border border-[#E5E5E8] rounded-lg px-3 py-2 bg-[#FAFAFB] text-sm">
                      {fmtDate(editOpen.createdTime)}
                    </div>
                  </div>
                </div>

                <section>
                  <h3 className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72] mb-3">File to edit</h3>
                  {editOpen.files[0] ? (
                    <div className="bg-white border border-[#E5E5E8] rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm">
                      <FileVideo size={14} className="text-[#6A6A72] shrink-0" />
                      <span className="text-[12px] text-[#1A1A1D] truncate flex-1">{editOpen.files[0].filename}</span>
                      <a
                        href={editOpen.files[0].url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#4F6BFF] hover:underline inline-flex items-center gap-1.5 text-[12px] shrink-0"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-[#6A6A72] border border-dashed border-[#E5E5E8] rounded-xl p-8 text-center">
                      No file attached.
                    </div>
                  )}
                </section>

                {editOpen.editingStyle !== "Talking Video" && (
                  <section>
                    <h3 className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72] mb-2">Text overlay</h3>
                    <div className="border border-[#E5E5E8] rounded-xl p-3 text-sm bg-[#FAFAFB] whitespace-pre-wrap min-h-[52px]">
                      {editOpen.textOverlay || "—"}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-[10px] uppercase tracking-[.18em] text-[#6A6A72] mb-2">Visual hook</h3>
                  <div className="border border-[#E5E5E8] rounded-xl p-3 text-sm bg-[#FAFAFB] whitespace-pre-wrap min-h-[52px]">
                    {editOpen.visualHook || "—"}
                  </div>
                </section>

                <CommentsPanel contentId={editOpen.id} accessCode={accessCode} />
              </div>

              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 border-t border-[#EDEDF0] bg-white [&_button]:py-1.5 [&_button]:text-[13px]">
                <div className="relative">
                  <button
                    onClick={() => setEditMenuOpen((v) => !v)}
                    className="p-2 rounded-lg border border-[#E5E5E8] hover:bg-[#FAFAFB] text-[#6A6A72]"
                    aria-label="More actions"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {editMenuOpen && (
                    <div className="absolute left-0 bottom-11 z-10 w-52 bg-white border border-[#E5E5E8] rounded-xl shadow-lg overflow-hidden">
                      <button
                        onClick={() => { setEditMenuOpen(false); setConfirmDeleteEdit(editOpen); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-[#FEF2F2] inline-flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Delete request
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditOpen(null)}
                    className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setRedoText(""); setRedoOpen(true); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] shadow-sm"
                  >
                    Redo
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {confirmDeleteEdit && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDeleteEdit(null)}>
            <div className="bg-white border border-[#E5E5E8] rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Delete this request?</h3>
                <p className="text-sm text-[#6A6A72]">
                  This edit request will be marked as <strong>Deleted</strong> and removed from your list.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button onClick={() => setConfirmDeleteEdit(null)} className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB]">
                  Cancel
                </button>
                <button onClick={deleteEditRequest} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {redoOpen && editOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !redoSaving && setRedoOpen(false)}>
            <div className="bg-white border border-[#E5E5E8] rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Request a re-do</h3>
                <p className="text-sm text-[#6A6A72] mb-3">
                  Tell the team what needs to change. This is added to the comments thread and the status becomes <strong>Re-do</strong>.
                </p>
                <textarea
                  value={redoText}
                  onChange={(e) => setRedoText(e.target.value)}
                  rows={5}
                  autoFocus
                  placeholder="e.g. Please tighten the first 3 seconds and fix the captions timing…"
                  className="w-full border border-[#E5E5E8] rounded-xl p-3 text-sm outline-none focus:border-[#4F6BFF]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button
                  disabled={redoSaving}
                  onClick={() => setRedoOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-[#E5E5E8] hover:bg-[#FAFAFB] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={redoSaving}
                  onClick={submitRedo}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#4F6BFF] text-white hover:bg-[#3F58E8] shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {redoSaving && <Loader2 size={14} className="animate-spin" />} Send re-do
                </button>
              </div>
            </div>
          </div>
        )}

        {/* To Edit / To Design: review the post, then choose who produces it */}
        {routeFor && (
          <ProduceReviewModal
            accessCode={accessCode}
            post={routeFor.post}
            initialHandler={routeFor.handler}
            onDiyDesign={() => { const post = routeFor.post; setRouteFor(null); setDesignPick(post); }}
            onClose={() => setRouteFor(null)}
            onDone={(patch) => {
              const id = routeFor.post.id;
              if (patch) {
                setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
                setDraft((d) => (d && d.id === id ? { ...d, ...patch } : d));
              }
              setNonce((n) => n + 1);
            }}
          />
        )}

        {designPick && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setDesignPick(null)}>
            <div className="flex w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-brand-line bg-brand-surface text-brand-ink shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
                <h3 className="truncate text-sm font-semibold text-brand-ink">{designPick.postName || "Design"}</h3>
                <Button variant="outline" onClick={() => setDesignPick(null)} className="border-brand-line bg-brand-surface text-brand-ink-soft hover:bg-brand-wash hover:text-brand-ink" aria-label="Close"><X size={18} /></Button>
              </div>
              <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center">
                <h4 className="text-lg font-semibold text-brand-ink">How do you want to design it?</h4>
                <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button type="button" onClick={() => { runAiDesignJob(designPick); setDesignPick(null); }} className="h-12 rounded-lg bg-brand-accent font-semibold text-brand-surface hover:bg-brand-blue-mid">AI design</Button>
                  <Button variant="outline" type="button" onClick={() => { setRouteFor({ post: designPick, handler: "myself" }); setDesignPick(null); }} className="h-12 rounded-lg border-brand-line bg-brand-surface font-semibold text-brand-accent hover:bg-brand-wash">Template design</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {teleprompterFor && (
          <Teleprompter
            title={teleprompterFor.postName}
            script={splitScript(teleprompterFor.script || "").body || teleprompterFor.script || ""}
            onClose={() => setTeleprompterFor(null)}
          />
        )}

        {/* Comments shortcut from the Production board */}
        {commentsFor && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCommentsFor(null)}
          >
            <div
              className="bg-white border border-[#E5E5E8] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold">
                  Comments · {commentsFor.postName || "Untitled"}
                </h3>
                <button
                  onClick={() => setCommentsFor(null)}
                  className="text-[#6A6A72] hover:text-[#1A1A1D]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4">
                <CommentsPanel contentId={commentsFor.id} accessCode={accessCode} />
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

/** Header date chip with the app's calendar instead of the browser's native picker. */
function DatePickerChip({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const d = value ? new Date(`${value}T12:00:00`) : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Posting date" className="inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6]">
          <CalendarIcon size={12} className="text-[#9B9BA1]" />
          {d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "Date"}
          <ChevronDown size={14} className="text-[#9B9BA1]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-auto p-0" align="start">
        <Calendar mode="single" selected={d} onSelect={(x) => { if (x) onChange(`${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`); setOpen(false); }} initialFocus className="pointer-events-auto p-3" />
      </PopoverContent>
    </Popover>
  );
}

/** Clip-only fields kept outside the script; they are pushed to the editing request. */
function ClipMetaFields({ timestamps, direction, onChange, onSave }: { timestamps: string; direction: string; onChange: (m: { timestamps?: string; creativeDirection?: string }) => void; onSave: (m: { timestamps?: string; creativeDirection?: string }) => void }) {
  const [ts, setTs] = useState(timestamps);
  const [dir, setDir] = useState(direction);
  const label = "text-[10px] font-semibold uppercase tracking-[.18em] text-[#6A6A72]";
  const box = "mt-1.5 w-full resize-y rounded-xl border border-[#E5E5E8] bg-white p-3 text-sm outline-none focus:border-[#7B83FF]";
  return (
    <div className="flex flex-col gap-4">
      <label className="block"><span className={label}>Timestamps</span>
        <textarea value={ts} rows={Math.max(3, ts.split("\n").length + 1)} placeholder={"00:05:33-00:05:35\n00:07:10-00:07:42"} onChange={(e) => { setTs(e.target.value); onChange({ timestamps: e.target.value }); }}
          onBlur={() => { const n = normalizeTimestamps(ts); setTs(n); onChange({ timestamps: n }); if (n !== timestamps) onSave({ timestamps: n }); }} className={`${box} font-mono tabular-nums`} />
        <span className="mt-1 block text-[11px] text-brand-ink-soft">One range per line, in order.</span></label>
      <label className="block"><span className={label}>Creative direction</span>
        <textarea value={dir} maxLength={10000} rows={6} placeholder="Notes for the editor" onChange={(e) => { setDir(e.target.value); onChange({ creativeDirection: e.target.value }); }} onBlur={() => dir !== direction && onSave({ creativeDirection: dir })} className={box} /></label>
    </div>
  );
}

/** Script tab: a left rail of the post's parts and one editor for the selected part. */
function CardScript({ draft, shape, split, join, captionFields, patch, onTeleprompter, clip }: {
  draft: any; shape: ScriptShape; split: typeof splitScript; join: typeof joinScript;
  captionFields: { key: string; label: string }[]; patch: (f: Record<string, any>) => void; onTeleprompter: () => void; clip: ReactNode;
}) {
  const parts = { body: draft.script || "", visualHook: draft.visualHook || "", textOverlay: draft.textOverlay || "" };
  const [slides, setSlides] = useState<SlideFields[]>(() => carouselSlidesFromPost(draft.coverCopy || draft.ctaCopy ? draft : { slidesCopy: draft.slidesCopy || parts.body }));
  const graphic = draft.slidesCopy || draft.coverCopy || parts.body;
  const items = [...railItems(shape, { slideTitles: slides.map((s) => s.title) }), ...(shape === "talking" ? [{ key: "cta", title: "Visual CTA" }] : []), ...(!clip && draft.creativeDirection ? [{ key: "direction", title: "Creative direction" }] : [])];
  const keys = [...items.map((i) => i.key), ...(clip ? ["clip"] : []), "caption"];
  const [sel, setSel] = useState(keys[0]);
  const [cap, setCap] = useState(captionFields[0]?.key || "");
  const step = (d: number) => setSel(keys[Math.min(keys.length - 1, Math.max(0, keys.indexOf(sel) + d))]);
  const commit = (next: SlideFields[]) => { setSlides(next); patch(serializeCarouselCopy(next)); };
  const setPart = (p: { visualHook?: string; textOverlay?: string; body?: string }) => patch({ ...(p.body !== undefined ? { script: p.body } : {}), ...(p.visualHook !== undefined ? { visualHook: p.visualHook } : {}), ...(p.textOverlay !== undefined ? { textOverlay: p.textOverlay } : {}) });
  const label = "text-[10px] font-semibold uppercase tracking-[.18em] text-[#6A6A72]";
  const box = "mt-1.5 w-full flex-1 resize-none rounded-xl border border-[#E5E5E8] bg-white p-3 text-sm outline-none focus:border-[#7B83FF]";
  const row = (on: boolean) => `flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[12px] transition ${on ? "border-[#E5E7EB] bg-white text-[#1D1D1F] shadow-sm" : "border-transparent text-[#4B5563] hover:bg-white/60"}`;
  const nav = (
    <div className="flex gap-1">
      <button type="button" aria-label="Previous" onClick={() => step(-1)} className="rounded-md p-1 text-brand-ink-soft hover:bg-[#F3F4F6]"><ChevronLeft size={15} /></button>
      <button type="button" aria-label="Next" onClick={() => step(1)} className="rounded-md p-1 text-brand-ink-soft hover:bg-[#F3F4F6]"><ChevronRight size={15} /></button>
    </div>
  );
  const idx = sel.startsWith("s") ? Number(sel.slice(1)) : -1;
  let editor: ReactNode = null;
  if (sel === "caption") {
    const text = String(draft[cap] || "");
    editor = <>
      <div className="flex items-center justify-between gap-2"><span className={label}>Caption & hashtags</span>
        <div className="flex gap-0.5 rounded-lg bg-[#F3F4F6] p-0.5">{captionFields.map((c) => (
          <button key={c.key} type="button" onClick={() => setCap(c.key)} title={c.label} aria-label={c.label} className={`inline-flex h-6 items-center rounded-md px-2 ${cap === c.key ? "bg-white text-[#1A1A1D] shadow-sm" : "text-[#8A8A92] hover:text-[#1A1A1D]"}`}><PlatformIcon platform={c.label} size={12} /></button>))}</div>
      </div>
      <textarea className={box} value={text} onChange={(e) => patch({ [cap]: e.target.value })} placeholder="Write the caption…" />
      <div className="mt-1.5 flex justify-between text-[11px] text-brand-ink-soft"><span>{text.length} characters · Hashtags: {hashtagsFromCaption(text) || "none"}</span>{nav}</div>
    </>;
  } else if (sel === "cta" || sel === "direction") {
    const key = sel === "cta" ? "visualCta" : "creativeDirection";
    editor = <><span className={label}>{sel === "cta" ? "Visual CTA · on-screen text" : "Creative direction"}</span><textarea className={box} value={draft[key] || ""} onChange={(e) => patch({ [key]: e.target.value })} /><div className="mt-1.5 flex justify-end">{nav}</div></>;
  } else if (sel === "clip") {
    editor = <>{clip}</>;
  } else if (shape === "carousel" && slides[idx]) {
    const kind = slideKind(idx, slides.length);
    editor = <>
      <div className="flex items-center justify-between"><span className={label}>{kind === "cover" ? "Cover" : kind === "cta" ? "Closing slide" : `Slide ${idx}`}</span>
        {kind === "content" && slides.length > 3 && <button type="button" aria-label="Delete slide" onClick={() => { commit(slides.filter((_, i) => i !== idx)); setSel(`s${Math.max(0, idx - 1)}`); }} className="rounded-md p-1 text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>}
      </div>
      {slideFieldOrder(kind).map((k) => (
        <label key={k} className="mt-2 block"><span className="text-[11px] font-medium text-brand-ink-soft">{FIELD_LABELS[kind][k]}</span>
          <textarea value={slides[idx][k]} rows={k === "body" ? 6 : 2} onChange={(e) => commit(slides.map((x, i) => (i === idx ? { ...x, [k]: e.target.value } : x)))} className="mt-0.5 w-full resize-y rounded-xl border border-[#E5E5E8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7B83FF]" /></label>
      ))}
      <div className="mt-1.5 flex justify-between text-[11px] text-brand-ink-soft"><span>{Object.values(slides[idx]).join(" ").length} characters</span>{nav}</div>
    </>;
  } else if (shape === "graphic") {
    editor = <><span className={label}>Text on screen</span><textarea className={box} value={graphic} onChange={(e) => patch({ slidesCopy: e.target.value })} placeholder="Add the text on screen…" /><div className="mt-1.5 flex justify-end">{nav}</div></>;
  } else if (shape === "broll") {
    const v = parts.textOverlay || parts.body;
    editor = <><span className={label}>On-screen text overlay</span><textarea className={box} value={v} onChange={(e) => setPart({ textOverlay: e.target.value, body: "" })} placeholder="Text that sits on top of the b-roll…" /><div className="mt-1.5 flex justify-between text-[11px] text-brand-ink-soft"><span>{wordCount(v)} words</span>{nav}</div></>;
  } else if (sel === "hook") {
    editor = <><span className={label}>Visual hook · on-screen text</span><textarea className={box} value={parts.visualHook} onChange={(e) => setPart({ visualHook: e.target.value })} placeholder="What does the viewer see first?" /><div className="mt-1.5 flex justify-end">{nav}</div></>;
  } else {
    editor = <><span className={label}>Spoken script</span><textarea className={box} value={parts.body} onChange={(e) => setPart({ body: e.target.value })} placeholder="Write what you'll say on camera…" />
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-brand-ink-soft"><span>{wordCount(parts.body)} words · ~{Math.max(1, Math.round(wordCount(parts.body) / 2.5))}s</span><span className="flex items-center gap-2"><button type="button" onClick={onTeleprompter} className="rounded-md border border-brand-line bg-white px-2 py-1 font-medium text-brand-ink hover:bg-[#F3F4F6]">Open teleprompter</button>{nav}</span></div></>;
  }
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-5 p-4 md:grid-cols-[210px_minmax(0,1fr)]">
      <nav aria-label="Post parts" className="flex min-h-0 flex-col gap-1 overflow-y-auto">
        <span className={`${label} mb-1 px-1`}>{shape === "carousel" ? `Slides · ${slides.length}` : shape === "talking" ? "Talking video" : shape === "broll" ? "B-roll" : "Graphic"}</span>
        {items.map((r) => (
          <button key={r.key} type="button" onClick={() => setSel(r.key)} className={row(sel === r.key)}>
            <span className="truncate">{r.title}</span>
          </button>
        ))}
        {shape === "carousel" && <button type="button" onClick={() => { const next = [...slides.slice(0, -1), emptySlideFields(), slides[slides.length - 1]]; commit(next); setSel(`s${next.length - 2}`); }} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-brand-accent hover:bg-white/60"><Plus size={13} />Add slide</button>}
        <div className="my-1 h-px bg-[#E5E7EB]" />
        {clip && <button type="button" onClick={() => setSel("clip")} className={row(sel === "clip")}><Clock size={13} className="shrink-0 text-brand-ink-soft" /><span>Timestamps & direction</span></button>}
        <button type="button" onClick={() => setSel("caption")} className={row(sel === "caption")}><MessageSquare size={13} className="shrink-0 text-brand-ink-soft" /><span>Caption & hashtags</span></button>
      </nav>
      <div className="flex min-h-[320px] min-w-0 flex-col overflow-y-auto">{editor}</div>
    </div>
  );
}
