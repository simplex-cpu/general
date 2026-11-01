import { useMemo, useState } from "react";
import { ExternalLink, ImageOff, Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideCarousel } from "./SlideCarousel";
import { CollapsibleField } from "./post/CollapsibleField";
import { RepurposeProgress } from "./RepurposeProgress";
import type { Angle } from "@/lib/slate/brandContext";
import { sectionsFromPostCopy, type CopySection } from "@/lib/slate/postFields";
import { REPURPOSE_TARGETS, TARGET_LABEL, planRepurpose, type RepurposeTarget } from "@/lib/slate/postRepurpose";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeFormat, readableTitle, type MetricPlatform, type MetricsPost, type PlatformMetrics } from "@/lib/slate/postMetrics";

type Publication = { post: MetricsPost; metrics: PlatformMetrics };
type SortKey = "views" | "likes" | "comments" | "newest";
const number = (v: number | null) => v === null ? "—" : new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
const STATS = [["views", "Views"], ["likes", "Likes"], ["comments", "Comments"], ["saves", "Saves"], ["shares", "Shares"]] as const;

/** Sorted feed of the exact publications counted in the Performance summary. */
export function sortPublications(list: Publication[], sort: SortKey) {
  return [...list].sort((a, b) => sort === "newest" ? Date.parse(b.metrics.publishedAt) - Date.parse(a.metrics.publishedAt) : (b.metrics[sort] ?? -1) - (a.metrics[sort] ?? -1));
}

function Thumb({ urls, video, onClick }: { urls: string[]; video?: string; onClick: () => void }) {
  const [i, setI] = useState(0);
  const list = urls.filter(Boolean);
  const src = list[i];
  const [loaded, setLoaded] = useState(false);
  return <button type="button" onClick={onClick} aria-label="Preview post" className="relative w-28 shrink-0 self-stretch overflow-hidden rounded-md bg-brand-line sm:w-32" style={{ minHeight: 140 }}>
    {src && !loaded && <span aria-hidden className="absolute inset-0 animate-pulse bg-brand-line" />}
    {src ? <img src={src} alt="" decoding="async" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setI(i + 1); }} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`} />
      : video ? <video src={`${video}#t=0.5`} preload="metadata" muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      : <span className="absolute inset-0 flex items-center justify-center text-brand-ink-soft"><ImageOff size={18} /></span>}
    {video && <span className="absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-brand-navy/70 text-brand-surface"><Play size={12} /></span>}
  </button>;
}

/** Ordered format fields; short fields inline, long ones folded. */
function CopySections({ sections }: { sections: CopySection[] }) {
  return <div className="space-y-2">{sections.map((sec) => sec.items ? <div key={sec.label} className="space-y-1.5"><p className="text-[10px] uppercase tracking-[.18em] text-brand-ink-soft">{sec.label}</p>{sec.items.map((it) => <CollapsibleField key={it.title} title={it.title} preview={it.text.replace(/\s*\n+\s*/g, " ")}><p className="whitespace-pre-wrap text-[12px] text-brand-ink-mid">{it.text}</p></CollapsibleField>)}</div>
    : <CollapsibleField key={sec.label} title={sec.label} preview={(sec.text || "").replace(/\s*\n+\s*/g, " ")}><p className="whitespace-pre-wrap text-[12px] text-brand-ink-mid">{sec.text}</p></CollapsibleField>)}</div>;
}

type Brand = { id: string; name: string; brandIds?: string[] };

function FeedRow({ item, brandNames, onPreview, onRepurpose }: { item: Publication; brandNames: string[]; onPreview: () => void; onRepurpose: () => void }) {
  const [open, setOpen] = useState(false);
  const { post, metrics } = item;
  const p = post.posted;
  const copy = p?.caption || "";
  const format = normalizeFormat(post.postType);
  const title = readableTitle(post.postName, brandNames, [p?.hook || "", copy]);
  const details = p ? sectionsFromPostCopy(post.postType, { caption: p.caption || "", hashtags: p.hashtags || "", transcript: p.transcript || "", textOnScreen: p.textOnScreen || "", coverTitle: p.coverTitle || "", coverCopy: p.coverCopy || "", visualHook: p.visualHook || "", slideCopy: p.slideCopy || "", hook: p.hook || "" }).filter((d) => d.text || d.items?.length) : [];
  const row = (label: string, value: string) => <div className="flex gap-2 text-[12px]"><span className="w-16 shrink-0 text-brand-ink-soft">{label}</span><span className="min-w-0 text-brand-ink">{value}</span></div>;
  return <li className="flex gap-4 border-b border-brand-line py-4 last:border-b-0">
    <Thumb urls={[p?.coverUrl || "", post.previewUrl || ""]} video={post.media?.find((m) => m.type === "video")?.url} onClick={onPreview} />
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-[14px] font-semibold text-brand-ink">{title}</p>
        <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={onRepurpose} className="inline-flex items-center gap-1 rounded-md border border-brand-line px-2 py-1 text-[11px] font-medium text-brand-accent hover:bg-brand-wash"><Sparkles size={12} />Repurpose</button>
        {metrics.url && <a href={metrics.url} target="_blank" rel="noreferrer" aria-label="Open post" className="text-brand-ink-soft hover:text-brand-accent"><ExternalLink size={14} /></a>}</div>
      </div>
      <div className="mt-2 space-y-1">
        {row("Posted", new Date(metrics.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))}
        {row("Format", format || "—")}
        {row("Topic", post.topic || "—")}
      </div>
      <dl className="mt-3 grid grid-cols-5 gap-2">{STATS.map(([key, label]) => <div key={key} className="min-w-0"><dt className="text-[10px] text-brand-ink-soft">{label}</dt><dd className="text-[13px] font-semibold tabular-nums text-brand-ink">{number(metrics[key])}</dd></div>)}</dl>
      {details.length > 0 && <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-[11px] font-medium text-brand-accent">{open ? "Hide copy" : "Show copy"}</button>}
      {open && <div className="mt-2"><CopySections sections={details} /></div>}
    </div>
  </li>;
}

export function HomePostsFeedModal({ open, onOpenChange, platform, days, publications, brandNames = [], accessCode, brands = [], onOpenSession }: { accessCode: string; brands?: Brand[]; onOpenSession: (id: string) => void; brandNames?: string[]; open: boolean; onOpenChange: (v: boolean) => void; platform: MetricPlatform; days: string; publications: Publication[] }) {
  const [sort, setSort] = useState<SortKey>("views");
  const list = useMemo(() => sortPublications(publications, sort), [publications, sort]);
  const [preview, setPreview] = useState<Publication | null>(null);
  const [repurpose, setRepurpose] = useState<Publication | null>(null);
  const [busy, setBusy] = useState<RepurposeTarget | null>(null);
  const [target, setTarget] = useState<RepurposeTarget | null>(null);
  const [runError, setRunError] = useState("");
  const run = async (target: RepurposeTarget) => {
    const angle: Angle = { kind: "keep", text: "" };
    if (!repurpose || busy) return;
    const { post } = repurpose; const p = post.posted;
    const brand = brands.find((b) => b.brandIds?.some((id) => post.brandIds?.includes(id)));
    setBusy(target); setTarget(target); setRunError("");
    try {
      const r = await fetch("/api/post-repurpose", { method: "POST", headers: { "Content-Type": "application/json", "x-access-code": accessCode }, body: JSON.stringify({ brandId: brand?.id, target, angle, url: repurpose?.metrics.url || "", postId: post.source === "post" ? post.id : undefined, title: readableTitle(post.postName, brandNames, [p?.hook || "", p?.caption || ""]), postType: post.postType, topic: post.topic || "", hook: p?.hook || "", caption: p?.caption || "", transcript: p?.transcript || "", slideCopy: p?.slideCopy || "", coverTitle: p?.coverTitle || "", coverCopy: p?.coverCopy || "", textOnScreen: p?.textOnScreen || "", visualHook: p?.visualHook || "", hashtags: p?.hashtags || "" }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "The repurposed version could not be written.");
      setRepurpose(null); setTarget(null); onOpenChange(false); if (data.sessionId) onOpenSession(data.sessionId);
    } catch (e) { setRunError(e instanceof Error ? e.message : "Repurpose failed."); }
    finally { setBusy(null); }
  };
  const describe = (t: RepurposeTarget) => { const m = repurpose ? planRepurpose(repurpose.post.postType, t) : "reformat"; return m === "visual" ? "Same script, new visual" : m === "cover" ? "Same slides, new cover title" : "Same copy, new format"; };
  const previewMedia = preview ? (preview.post.media?.length ? preview.post.media : [preview.post.posted?.coverUrl, preview.post.previewUrl].filter(Boolean).slice(0, 1).map((url) => ({ url: url as string, type: "image" as const }))) : [];
  const previewVideo = previewMedia.find((m) => m.type === "video");
  return <>
  <Dialog open={!!preview} onOpenChange={(v) => { if (!v) setPreview(null); }}>
    <DialogContent className="max-w-md border-brand-line bg-brand-surface text-brand-ink">
      <DialogHeader><DialogTitle>Preview</DialogTitle><DialogDescription className="text-brand-ink-soft">{preview ? readableTitle(preview.post.postName, brandNames, [preview.post.posted?.hook || ""]) : ""}</DialogDescription></DialogHeader>
      {previewVideo ? <video src={previewVideo.url} controls autoPlay playsInline className="mx-auto aspect-[9/16] max-h-[70vh] w-auto max-w-full rounded-lg bg-brand-navy object-contain" />
        : previewMedia.length ? <SlideCarousel slides={previewMedia.map((m, i) => ({ url: m.url, filename: `Slide ${i + 1}` }))} />
        : <p className="py-6 text-center text-[12px] text-brand-ink-soft">No preview saved for this post.</p>}
      {preview?.metrics.url && <a href={preview.metrics.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-accent">Open on {platform} <ExternalLink size={12} /></a>}
    </DialogContent>
  </Dialog>
  <Dialog open={!!repurpose} onOpenChange={(v) => { if (!v && !busy) { setRepurpose(null); setTarget(null); setRunError(""); } }}>
    <DialogContent className="max-w-md border-brand-line bg-brand-surface text-brand-ink">
      <DialogHeader><DialogTitle>Repurpose this post</DialogTitle><DialogDescription className="text-brand-ink-soft">{target ? `Rewriting as a ${TARGET_LABEL[target]}.` : "Choose the new format."}</DialogDescription></DialogHeader>
      {repurpose && target ? <RepurposeProgress error={runError || undefined} onBack={() => { setRunError(""); setTarget(null); }} onRetry={() => void run(target)} /> : <div className="grid grid-cols-2 gap-2">{REPURPOSE_TARGETS.map((t) => <Button key={t} variant="outline" disabled={!!busy} onClick={() => void run(t)} className="h-auto flex-col items-start gap-0.5 border-brand-line bg-brand-surface px-3 py-3 text-left text-brand-ink hover:bg-brand-wash hover:text-brand-ink">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-ink">{busy === t && <Loader2 size={12} className="animate-spin" />}{TARGET_LABEL[t]}</span>
        <span className="text-[11px] font-normal text-brand-ink-soft">{describe(t)}</span>
      </Button>)}</div>}
    </DialogContent>
  </Dialog>
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col border-brand-line bg-brand-surface text-brand-ink">
      <DialogHeader>
        <DialogTitle>All {platform} posts</DialogTitle>
        <DialogDescription className="text-brand-ink-soft">{list.length} post{list.length === 1 ? "" : "s"} published in the last {days} days. Missing statistics show a dash.</DialogDescription>
      </DialogHeader>
      <div className="flex justify-end">
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger aria-label="Sort posts" className="h-9 w-40 border-brand-line bg-brand-surface text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent className="border-brand-line bg-brand-surface text-brand-ink"><SelectItem value="views">Most views</SelectItem><SelectItem value="likes">Most likes</SelectItem><SelectItem value="comments">Most comments</SelectItem><SelectItem value="newest">Newest</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {list.length ? <ul>{list.map((item) => <FeedRow key={item.post.id} item={item} brandNames={brandNames} onPreview={() => setPreview(item)} onRepurpose={() => setRepurpose(item)} />)}</ul> : <p className="py-8 text-center text-[12px] text-brand-ink-soft">No published posts in this period.</p>}
      </div>
    </DialogContent>
  </Dialog>
  </>;
}
