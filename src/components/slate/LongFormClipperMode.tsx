import { canRetry } from "@/lib/slate/studioJobs";
import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ExternalLink, FileText, FileAudio, Loader2, Plus, Trash2, X, Maximize2, Download, Clock, LayoutList, Copy, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApproveAndPostMode } from "./ApproveAndPostMode";
import { sourceSegments } from "@/lib/slate/podcastClipping";
import { parsePostCopy, creativeDirection } from "@/lib/slate/longFormClipper";
import { SectionTabs } from "./SectionTabs";
import { isFolderLink, type SourceFile } from "@/lib/slate/footageSource";
import { CTA_OPTIONS, ctaNeedsKeyword } from "./chat/CtaDecisionCard";
import { formatCtaChoice, type CtaChoice } from "@/lib/slate/variationFlow";
import { longFormStatus, clipperTab, transcriptionProgress, shortFormStage, longFormTab, shortFormCount, longFormDisplayName, transcriptionComplete, transcriptExport, transcriptFilename } from "@/lib/slate/clipperPresentation";
import { deliverFile } from "@/lib/slate/downloadFile";
import { SectionHeader } from "./SectionHeader";
import type { PlannerChoice } from "@/lib/slate/formatFields";
import { boardScript, canAddToBoard, MAX_PER_FORMAT, SHORT_FORMATS, CLIP_FORMATS, WRITER_FORMAT, pendingClipCounts, clipExitBlocked, estimateWait, MAX_CAROUSEL_SLIDES, type ShortFormat } from "@/lib/slate/longFormClipper";

type LongForm = { id: string; name: string; url: string; status: string; createdDate: string; transcript?: string; pendingCounts?: string; speakerNames?: Record<string, string>; transcriptDetails?: any; shortFormIds?: string[]; footageFile?: string; progress?: string; transcriptionSource?: string };
type ShortForm = { id: string; name: string; status: string; format: string; timestamps: string; creativeDirection?: string; copy: string; createdDate: string; contentIds: string[]; contentStatus?: string };
type Footage = { state: "none" | "saving" | "saved" | "failed"; url?: string; percent?: number; message?: string };
type Step = { step: string; status: "running" | "done" | "error"; message?: string; count?: number };

const action = "brand-slim-action h-8 gap-2 rounded-md bg-brand-accent px-4 text-xs text-brand-surface hover:bg-brand-accent/90";
const date = (d: string) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
/** Per-format shortfall reasons from a studio job result, as one short sentence. */
const shortfallText = (r: any) => {
  const parts = [["B-roll", r?.shortfall?.broll], ["Talking Clip", r?.shortfall?.talkingClip]].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  return parts.length ? ` ${parts.join(". ")}.` : "";
};
const pill = (s: string) =>
  s === "Done" || s === "In production" || s === "Clipped" || s === "Transcribed" ? "bg-status-done-surface text-status-done"
    : s === "Failed" ? "bg-destructive/10 text-destructive"
    : "bg-status-new-surface text-status-new";
const secondary = "h-9 border-brand-line bg-brand-surface text-brand-accent hover:bg-brand-wash hover:text-brand-accent";
const EMPTY_MANUAL = { format: "Talking Video" as ShortFormat, name: "", timestamps: "", creativeDirection: "", textOverlay: "", visualHook: "", script: "", cta: "", coverTitle: "", coverSubtitle: "", coverBody: "", slides: ["", "", "", "", ""], details: [{}, {}, {}, {}, {}] as { subtitle?: string; body?: string }[] };
const ZERO = { BROLL: 0, "Talking Video": 0, Graphic: 0, Carousel: 0 } as Record<ShortFormat, number>;

async function readStream(res: Response, onEvent: (e: any) => void) {
  if (!res.ok || !res.body) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    buf += dec.decode(value, { stream: !done });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const l of lines) if (l.trim()) onEvent(JSON.parse(l));
    if (done) break;
  }
}

export function LongFormClipperMode({ accessCode, backControl, onProcessingChange }: { accessCode: string; backControl: ReactNode; onProcessingChange?: (active: boolean) => void }) {
  const qc = useQueryClient();
  const h = { "x-access-code": accessCode, "Content-Type": "application/json" };
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("new");
  const [adding, setAdding] = useState(false);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [confirmClose, setConfirmClose] = useState(false);
  function closeDetail() { processingChanged(false); setOpenId(null); void list.refetch(); }
  function requestClose() { if (processingRef.current) setConfirmClose(true); else closeDetail(); }
  function processingChanged(active: boolean) { processingRef.current = active; setProcessing(active); onProcessingChange?.(active); }
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (processingRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); onProcessingChange?.(false); };
  }, [onProcessingChange]);
  const list = useQuery({
    queryKey: ["long-forms", accessCode],
    queryFn: async () => {
      const r = await fetch("/api/long-forms", { headers: h });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't load long forms");
      return d.longForms as LongForm[];
    },
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  async function removeLong(l: LongForm) {
    if (!window.confirm(`Delete "${longFormDisplayName(l.name)}"? Its pieces not yet on the board are deleted too.`)) return;
    setDeletingId(l.id);
    try {
      const r = await fetch(`/api/long-forms?id=${l.id}`, { method: "DELETE", headers: h });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) window.alert(d.error || "Couldn't delete this long form");
      await list.refetch();
    } finally { setDeletingId(null); }
  }

  return (
    <>
      <SectionHeader title="Long form Clipper" leading={backControl} actions={<Button className={action} onClick={() => setAdding(true)}><Plus size={16} />Add new</Button>} />
      <div className="space-y-4 px-5 pb-8 pt-4 sm:px-8">
        <SectionTabs ariaLabel="Long form status" active={tab} onChange={setTab} items={[
          ...([['new', 'New', Clock], ['toClip', 'To Clip', Scissors], ['clipped', 'Clipped', FileText]] as const).map(([id, label, icon]) => ({ id, label: `${label} (${list.data?.filter(l => clipperTab(l) === id).length || 0})`, icon })),
        ]} />
        {list.isPending ? (
          <p className="flex items-center gap-2 py-12 text-sm text-brand-ink-soft"><Loader2 size={16} className="animate-spin" />Loading your long forms…</p>
        ) : list.isError ? (
          <p role="alert" className="py-8 text-sm text-brand-ink-soft">{list.error.message} <Button variant="link" onClick={() => void list.refetch()}>Try again</Button></p>
        ) : !list.data.length ? (
          <div className="rounded-lg border border-brand-line bg-brand-surface py-16 text-center">
            <p className="mb-4 text-sm text-brand-ink-soft">Add a long-form video and turn it into short-form posts.</p>
            <Button className={action} onClick={() => setAdding(true)}><Plus size={16} />Add new</Button>
          </div>
        ) : !list.data.some(l => clipperTab(l) === tab) ? (
          <p className="py-10 text-center text-sm text-brand-ink-soft">{tab === 'clipped' ? 'No clipped long forms yet.' : tab === 'toClip' ? 'No long forms waiting to be clipped.' : 'No new long forms.'}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-brand-line bg-brand-surface">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead><tr className="border-b border-brand-line text-brand-ink-soft">{["Name", "Status", "Footage", "Created date", "Short forms", ""].map((label, i) => <th key={i} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
              <tbody>{list.data.filter(l => clipperTab(l) === tab).map((l) => <tr key={l.id} className="border-b border-brand-line last:border-0 hover:bg-brand-wash">
                <td className="max-w-[320px] px-4 py-3"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><Button variant="link" onClick={() => setOpenId(l.id)} className="h-auto min-w-0 justify-start whitespace-normal p-0 text-left text-xs text-brand-ink">{longFormDisplayName(l.name)}</Button><Button variant="ghost" size="icon" aria-label={`Expand ${longFormDisplayName(l.name)}`} title="Expand" className="h-8 w-8 shrink-0 text-brand-accent" onClick={() => setOpenId(l.id)}><Maximize2 size={15} /></Button></div></td>
                <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] ${pill(longFormStatus(l))}`}>{longFormStatus(l)}</span>{l.status === 'Transcribing' && (() => { const p = transcriptionProgress(l.progress); return <div className="mt-1.5 w-28"><div className="h-1 overflow-hidden rounded-full bg-brand-line"><div className="h-full bg-brand-accent" style={{ width: `${p.percent}%` }} /></div><span className="text-[10px] text-brand-ink-soft">{p.percent}%</span></div>; })()}</td>
                <td className="px-4 py-3">{isDriveFile(l.footageFile) ? <Button asChild variant="outline" className={`${secondary} h-8 text-xs`}><a href={l.footageFile} target="_blank" rel="noreferrer"><ExternalLink size={13} />Footage</a></Button> : <CopyLinkButton url={l.footageFile || l.url} className={`${secondary} h-8 text-xs`} />}</td>
                <td className="whitespace-nowrap px-4 py-3 text-brand-ink-soft">{date(l.createdDate)}</td>
                <td className="px-4 py-3 text-brand-ink">{shortFormCount(l)}</td>
                <td className="px-2 py-3 text-right"><Button variant="ghost" size="icon" aria-label={`Delete ${longFormDisplayName(l.name)}`} title="Delete" disabled={deletingId === l.id} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => void removeLong(l)}>{deletingId === l.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</Button></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={!!openId} onOpenChange={(o) => { if (!o) requestClose(); }}>
        <DialogContent className={`clipper-modal flex flex-col justify-start gap-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen min-w-0 max-w-none translate-x-0 translate-y-0 overflow-x-hidden overflow-y-auto rounded-none border-0 bg-social-feed p-3 text-brand-ink sm:max-w-none sm:rounded-none sm:p-8 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 [&>button]:text-brand-ink-soft`}>
          <DialogTitle className="sr-only">Long form details</DialogTitle>
          <DialogDescription className="sr-only">Transcript and short-form pieces from this video.</DialogDescription>
          {openId && <LongFormDetail id={openId} accessCode={accessCode} onProcessingChange={processingChanged} onBack={requestClose} />}
        </DialogContent>
      </Dialog>
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="clipper-modal border-brand-line bg-social-feed text-brand-ink sm:max-w-md [&>button]:text-brand-ink-soft">
          <DialogTitle>Close while processing?</DialogTitle>
          <DialogDescription className="text-brand-ink-soft">Transcription keeps running in the background and this long form updates when you reopen it. Short forms being written right now will pause — you can continue them later from this long form.</DialogDescription>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" className="border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash" onClick={() => setConfirmClose(false)}>Keep open</Button>
            <Button className="bg-brand-accent text-primary-foreground hover:bg-brand-accent/90" onClick={() => { setConfirmClose(false); closeDetail(); }}>Close anyway</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AddLongFormDialog open={adding} accessCode={accessCode} onProcessingChange={processingChanged} onClose={() => setAdding(false)}
        onDone={(id) => { setAdding(false); void qc.invalidateQueries({ queryKey: ["long-forms", accessCode] }); if (id) setOpenId(id); }} />
    </>
  );
}

function CountBoxes({ counts, onChange, disabled }: { counts: Record<ShortFormat, number>; onChange: (c: Record<ShortFormat, number>) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CLIP_FORMATS.map((f) => (
        <label key={f} className="text-[12px] font-semibold text-brand-ink">
          <span>{f} <span className="font-normal text-brand-ink-soft">(0–{MAX_PER_FORMAT})</span></span>
          <Input type="number" min={0} max={MAX_PER_FORMAT} disabled={disabled} value={counts[f] || ""}
            onChange={(e) => onChange({ ...counts, [f]: Math.max(0, Math.min(MAX_PER_FORMAT, Number(e.target.value) || 0)) })}
            className="mt-1 border-brand-line bg-brand-surface font-normal text-brand-ink" />
        </label>
      ))}
    </div>
  );
}

function ProgressList({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-brand-ink-soft"><span>Progress</span><span>{steps.filter(s => s.status === "done").length} steps finished</span></div>
      <div role="progressbar" aria-label="Long-form processing" className="h-1.5 overflow-hidden rounded-full bg-brand-line"><div className={`h-full bg-brand-accent ${steps.some(s => s.status === "running") ? "w-1/3 animate-pulse motion-reduce:animate-none" : "w-full"}`} /></div>
      <ul className="space-y-2">
      {steps.map((s) => (
        <li key={s.step} className="flex items-start gap-2 rounded-md bg-brand-surface px-3 py-2 text-sm">
          {s.status === "running" ? <Loader2 size={16} className="mt-0.5 animate-spin text-brand-accent" /> : s.status === "done" ? <Check size={16} className="mt-0.5 text-status-done" /> : <X size={16} className="mt-0.5 text-destructive" />}
          <span>
            {s.step === "saved" ? "Saving" : s.step === "transcript" ? "Transcribing" : `Writing ${s.step}${s.count != null ? ` · ${s.count} written` : ""}`}
            {s.message === "LONG" ? (
              <span className="block text-xs text-brand-ink-soft">Keep this page open until processing finishes.</span>
            ) : s.message ? (
              <span className="block text-xs text-destructive">{s.message}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
    </div>
  );
}

function Req() { return <span aria-label="required" className="text-destructive">*</span>; }

const isDriveFile = (u?: string) => !!u && /^https:\/\/drive\.google\.com\/file\//i.test(u);

/** Source links (YouTube, Dropbox, folders) are blocked inside the app frame, so they are copied, never opened. */
function CopyLinkButton({ url, label = "Copy link", className }: { url: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return <Button type="button" variant="outline" className={className} onClick={() => { void navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1500); }}><Copy size={13} />{done ? "Copied" : label}</Button>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block space-y-1 text-[12px] font-semibold text-brand-ink"><span>{label}{required && <Req />}</span>{children}</label>;
}

function SlideBox({ heading, onRemove, children }: { heading: string; onRemove?: () => void; children: ReactNode }) {
  return <div className="space-y-2 rounded-lg border border-brand-line bg-brand-surface/60 p-3">
    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-brand-ink-soft">{heading}{onRemove && <button type="button" aria-label={`Remove ${heading}`} onClick={onRemove} className="text-brand-ink-soft hover:text-destructive"><X size={13} /></button>}</div>
    {children}
  </div>;
}

function ChoiceCards({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; title: string; text: string }[] }) {
  return <div role="radiogroup" className="mt-1 grid gap-2 sm:grid-cols-2">{options.map((o) => <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
    className={`rounded-md border bg-brand-surface px-3 py-2.5 text-left transition-colors ${value === o.value ? "border-brand-accent ring-1 ring-brand-accent" : "border-brand-line hover:bg-brand-wash"}`}>
    <span className="block text-[13px] font-semibold text-brand-ink">{o.title}</span>{o.text && <span className="mt-0.5 block text-[11px] font-normal text-brand-ink-soft">{o.text}</span>}</button>)}</div>;
}

function useStepRunner() {
  const [steps, setSteps] = useState<Step[]>([]);
  const onEvent = (e: any) => {
    if (e.step === "complete") return;
    if (e.step === "error" || e.status === "error") throw new Error(e.message || "Processing failed");
    setSteps((s) => { const i = s.findIndex((x) => x.step === e.step); if (i < 0) return [...s, e]; const n = [...s]; n[i] = e; return n; });
  };
  return { steps, setSteps, onEvent };
}

function AddLongFormDialog({ open, accessCode, onClose, onDone, onProcessingChange }: { open: boolean; accessCode: string; onClose: () => void; onDone: (id: string | null) => void; onProcessingChange: (active: boolean) => void }) {
  const [url, setUrl] = useState("");
  const saveFlight = useRef(false);
  const [source, setSource] = useState<"" | "transcribe" | "upload">("");
  const [step, setStep] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"" | "add" | "create">("");
  const [counts, setCounts] = useState(ZERO);
  const [speakers, setSpeakers] = useState<{ name: string; bio: string }[]>([]);
  const [speakerMode, setSpeakerMode] = useState<"" | "solo" | "multi">("");
  const [cta, setCta] = useState<CtaChoice | "">("");
  const [ctaKeyword, setCtaKeyword] = useState("");
  const [ctaBenefit, setCtaBenefit] = useState("");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { steps, setSteps, onEvent } = useStepRunner();
  const urlOk = /^https?:\/\/\S+$/.test(url.trim());
  const folder = urlOk && isFolderLink(url.trim());
  const [folderInfo, setFolderInfo] = useState<{ files: SourceFile[]; warning?: string; needsFile?: boolean; checking?: boolean } | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  useEffect(() => {
    setFolderInfo(null); setAudioUrl(""); setAudioName("");
    if (!folder) return;
    let cancelled = false;
    setFolderInfo({ files: [], checking: true });
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/long-forms?inspect=${encodeURIComponent(url.trim())}`, { headers: { "x-access-code": accessCode } });
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) throw new Error(d.error || "The folder couldn't be checked.");
        setFolderInfo({ files: d.files || [], warning: d.warning, needsFile: d.needsFile });
        if (d.pick) { setAudioUrl(d.pick.url); setAudioName(d.pick.path); }
      } catch (e: any) { if (!cancelled) setFolderInfo({ files: [], needsFile: true, warning: e.message }); }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [url, folder]);
  const audioOk = !folder || source === "upload" || /^https?:\/\/\S+$/.test(audioUrl.trim()) && !/dropbox\.com\/scl\/fo\//i.test(audioUrl);
  const ctaOk = !!cta && (!ctaNeedsKeyword(cta) || (!!ctaKeyword.trim() && !!ctaBenefit.trim()));
  const countsOk = mode === "add" || mode === "create" && (Object.values(counts).some((n) => n > 0) && ctaOk);
  const step1Ok = urlOk && audioOk && (source === "transcribe" || source === "upload" && !!transcript.trim());
  const canSave = step1Ok && countsOk && !busy;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const verb = source === "upload" ? "Save transcript" : "Transcribe";
  const finalLabel = mode === "create" ? `${verb} & create ${total || ""} short form${total === 1 ? "" : "s"}`.replace("  ", " ") : `${verb} & save`;

  function reset() { setUrl(""); setAudioUrl(""); setAudioName(""); setSource(""); setStep(0); setTranscript(""); setFileName(""); setMode(""); setCounts(ZERO); setSpeakers([]); setSpeakerMode(""); setCta(""); setCtaKeyword(""); setCtaBenefit(""); setSteps([]); setFinished(null); setError(""); }

  async function readFile(f?: File) {
    setError("");
    if (!f) return;
    if (!/\.(md|txt)$/i.test(f.name)) return setError("Use a .md or .txt file.");
    if (f.size > 1_000_000) return setError("That file is too large (max 1 MB).");
    setTranscript(await f.text());
    setFileName(f.name);
  }

  async function save() {
    if (!canSave || saveFlight.current) return;
    saveFlight.current = true;
    setBusy(true); onProcessingChange(true); setError(""); setSteps([]);
    let id: string | null = null;
    try {
      const res = await fetch("/api/long-forms", { method: "POST", headers: { "x-access-code": accessCode, "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), ...(folder && source === "transcribe" ? { audioUrl: audioUrl.trim(), audioName: audioName || audioUrl.trim() } : {}), transcript: source === "upload" ? transcript : undefined, counts: mode === "create" ? counts : undefined, speakers: speakers.filter(sp => sp.name.trim()).map(sp => ({ name: sp.name.trim(), bio: sp.bio.trim() })), cta: mode === "create" && cta ? formatCtaChoice(cta, ctaKeyword, ctaBenefit) : undefined }) });
      await readStream(res, (e) => { if (e.id) id = e.id; onEvent(e); });
      if (id) { reset(); onDone(id); } else setFinished(id);
    } catch (e: any) { setError(e.message); }
    finally { saveFlight.current = false; setBusy(false); onProcessingChange(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) { onClose(); if (finished !== null || steps.length) onDone(null); reset(); } }}>
      <DialogContent onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }} className={`max-h-[90dvh] overflow-y-auto border-brand-line bg-social-feed text-brand-ink sm:max-w-2xl [&>button]:text-brand-ink-soft ${busy ? "[&>button]:hidden" : ""}`}>
        {!steps.length && <p className="text-[11px] font-medium uppercase tracking-wide text-brand-ink-soft">{["Source", "Speakers", "Next step"].map((label, i) => <span key={label} className={i === step ? "text-brand-accent" : ""}>{i > 0 && <span className="mx-1.5 text-brand-ink-soft">·</span>}{label}</span>)}</p>}
        <DialogTitle>Add long form</DialogTitle>
        <DialogDescription className="sr-only">Add a long-form video.</DialogDescription>
        {steps.length > 0 ? (
          <div className="space-y-4">
            <ProgressList steps={steps} />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {!busy && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" className={`${secondary} h-8 text-xs`} onClick={() => { onDone(null); reset(); }}>Back to long forms</Button>
                {finished && <Button className={action} onClick={() => { const f = finished; reset(); onDone(f); }}>View progress</Button>}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {step === 0 && <>
            <label className="block text-[12px] font-semibold">Footage link <Req />
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-1 border-brand-line bg-brand-surface" />
            </label>
            <div className="text-[12px] font-semibold">Do you already have a transcript? <Req />
              <ChoiceCards value={source} onChange={(v) => setSource(v as any)} options={[{ value: "transcribe", title: "Transcribe it for me", text: "" }, { value: "upload", title: "I have a transcript", text: ".md or .txt" }]} />
            </div>
            {folder && source !== "upload" && <div className="space-y-2 rounded-md border border-brand-line bg-brand-surface p-3 text-[12px]">
              {folderInfo?.checking ? <p className="flex items-center gap-2 text-brand-ink-soft"><Loader2 size={13} className="animate-spin" />Checking the folder…</p>
              : folderInfo && folderInfo.files.length === 1 && !folderInfo.needsFile ? <p className="flex items-center gap-2 text-brand-ink"><FileAudio size={14} className="shrink-0 text-brand-ink-soft" /><span className="truncate">{folderInfo.files[0].path.replace(/^\//, "")}</span><span className="shrink-0 text-brand-ink-soft">· {(folderInfo.files[0].size / 1e9).toFixed(1)} GB</span></p>
              : folderInfo && folderInfo.files.length > 1 && !folderInfo.needsFile ? <div className="font-semibold">Transcribe from
                  <Select value={audioUrl} onValueChange={(v) => { setAudioUrl(v); setAudioName(folderInfo.files.find(f => f.url === v)?.path || v); }}>
                    <SelectTrigger className="mt-1 border-brand-line bg-brand-surface font-normal"><SelectValue /></SelectTrigger>
                    <SelectContent>{folderInfo.files.map(f => <SelectItem key={f.url} value={f.url}>{f.path.replace(/^\//, "")} · {(f.size / 1e9).toFixed(1)} GB</SelectItem>)}</SelectContent>
                  </Select></div>
              : <label className="block font-semibold">Link to the mixed audio file
                  <Input value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); setAudioName(""); }} placeholder="https://www.dropbox.com/scl/fi/…/Stereo Mix.wav" className="mt-1 border-brand-line bg-brand-surface font-normal" />
                </label>}
              {folderInfo?.warning && <p className="text-[11px] text-brand-ink-soft">{folderInfo.warning}</p>}
            </div>}
            {source === "upload" && (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-brand-line bg-brand-surface px-4 py-6 text-center text-sm text-brand-ink-soft"
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void readFile(e.dataTransfer.files[0]); }}>
                <FileText size={18} className="text-brand-accent" />
                {fileName || "Drop a .md or .txt file, or click to choose"}
                <input type="file" accept=".md,.txt,text/plain,text/markdown" className="sr-only" onChange={(e) => void readFile(e.target.files?.[0])} />
              </label>
            )}
            </>}
            {step === 1 && <>
            <div className="space-y-2 text-[12px] font-semibold">
              <div>Speakers <span className="font-normal text-brand-ink-soft">(optional)</span></div>
              <ChoiceCards value={speakerMode} onChange={(v) => { setSpeakerMode(v as any); if (v === "solo") setSpeakers([]); else if (!speakers.length) setSpeakers([{ name: "", bio: "" }]); }} options={[{ value: "solo", title: "It's just me", text: "" }, { value: "multi", title: "Add speakers", text: "" }]} />
              {speakerMode === "multi" && speakers.map((sp, i) => <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2">
                <Input aria-label={`Speaker ${i + 1} name`} placeholder="Name" maxLength={80} value={sp.name} onChange={(e) => setSpeakers(list => list.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="h-8 border-brand-line bg-brand-surface font-normal" />
                <Input aria-label={`Speaker ${i + 1} bio`} placeholder="Short bio, e.g. Host, career coach" maxLength={400} value={sp.bio} onChange={(e) => setSpeakers(list => list.map((x, j) => j === i ? { ...x, bio: e.target.value } : x))} className="h-8 border-brand-line bg-brand-surface font-normal" />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove speaker" className="h-8 w-8 text-brand-ink-soft" onClick={() => setSpeakers(list => list.filter((_, j) => j !== i))}><X size={14} /></Button>
              </div>)}
              {speakerMode === "multi" && speakers.length < 10 && <Button type="button" variant="outline" className={`${secondary} h-8 text-xs`} onClick={() => setSpeakers(list => [...list, { name: "", bio: "" }])}><Plus size={13} />Add speaker</Button>}
            </div>
            </>}
            {step === 2 && <>
            <div className="text-[12px] font-semibold">What should happen after? <Req />
              <ChoiceCards value={mode} onChange={(v) => setMode(v as any)} options={[{ value: "add", title: "Transcribe", text: "" }, { value: "create", title: "Transcribe & create short forms", text: "" }]} />
            </div>
            {mode === "create" && <CountBoxes counts={counts} onChange={setCounts} />}
            {mode === "create" && <div className="space-y-2 text-[12px] font-semibold"><span>Call to action <Req /></span>
              <Select value={cta} onValueChange={(v) => setCta(v as CtaChoice)}>
                <SelectTrigger className="mt-1 border-brand-line bg-brand-surface font-normal"><SelectValue placeholder="Choose a CTA" /></SelectTrigger>
                <SelectContent>{CTA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
              {ctaNeedsKeyword(cta) && <div className="grid gap-2 sm:grid-cols-2">
                <Input aria-label="Keyword" placeholder="Enter the keyword" value={ctaKeyword} onChange={(e) => setCtaKeyword(e.target.value)} className="border-brand-line bg-brand-surface font-normal" />
                <Input aria-label="What the viewer will receive" placeholder="to get my ebook, guide…" value={ctaBenefit} onChange={(e) => setCtaBenefit(e.target.value)} className="border-brand-line bg-brand-surface font-normal" />
              </div>}
            </div>}
            {canSave && source && <p className="flex items-center gap-2 rounded-md bg-brand-surface px-3 py-2 text-[12px] text-brand-ink"><Clock size={13} className="text-brand-accent" />{estimateWait(source, mode === "create" ? total : 0)}</p>}
            </>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={`${secondary} h-8 text-xs`} onClick={() => { if (step) setStep(step - 1); else { onClose(); reset(); } }}>{step ? "Back" : "Cancel"}</Button>
              {step < 2 ? <Button className={action} disabled={step === 0 ? !step1Ok : !speakerMode} onClick={() => setStep(step + 1)}>Continue</Button>
                : <Button className={action} disabled={!canSave} onClick={save}>{finalLabel}</Button>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LongFormDetail({ id, accessCode, onBack, onProcessingChange }: { id: string; accessCode: string; onBack: () => void; onProcessingChange: (active: boolean) => void }) {
  const qc = useQueryClient();
  const h = { "x-access-code": accessCode, "Content-Type": "application/json" };
  const q = useQuery({
    queryKey: ["long-form", id],
    queryFn: async () => {
      const r = await fetch(`/api/long-forms?id=${id}`, { headers: h });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't load this long form");
      return d as { longForm: LongForm; shortForms: ShortForm[]; footage?: Footage };
    },
  });
  const [open, setOpen] = useState<ShortForm | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => { setNameDraft(open?.name || ""); }, [open?.id]);
  const baseCopy = (c?: string) => (c || "").split(/\n\s*Source notes:\s*\n/i)[0].trim();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [boarding, setBoarding] = useState<ShortForm | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [counts, setCounts] = useState(ZERO);
  const [generating, setGenerating] = useState(false);
  const runner = useStepRunner();

  const [paused, setPaused] = useState(false);
  const [resumeAllowed, setResumeAllowed] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speakerDraft, setSpeakerDraft] = useState<Record<string, string>>({});
  const [boardKey, setBoardKey] = useState(0);
  const [genMode, setGenMode] = useState<"choose" | "ai" | "manual" | "studio">("choose");
  const [studioCounts, setStudioCounts] = useState({ BROLL: 0, "Talking Video": 0 });
  const [studioCtaChoice, setStudioCtaChoice] = useState<CtaChoice | "">("");
  const [studioCtaKeyword, setStudioCtaKeyword] = useState("");
  const [studioCtaBenefit, setStudioCtaBenefit] = useState("");
  const [studioBusy, setStudioBusy] = useState(false);
  const jobs = useQuery({
    queryKey: ["podcast-script-jobs", id],
    queryFn: async () => {
      const r = await fetch(`/api/podcast-script-jobs?longFormId=${id}`, { headers: h });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't load studio jobs");
      return (d.jobs || []) as { id: string; status: string; error?: string; counts: any; result?: any; request?: any; created_at: string; updated_at: string }[];
    },
    refetchInterval: (qq) => (qq.state.data || []).some((j) => ["submitting", "processing", "submission_uncertain"].includes(j.status)) ? 4000 : false,
  });
  // Reload pieces when any run seen active (or finished in the last few minutes on open) becomes finished.
  const studioSeen = useRef<{ active: Set<string>; handled: Set<string>; first: boolean }>({ active: new Set(), handled: new Set(), first: true });
  useEffect(() => {
    if (!jobs.data) return;
    const s = studioSeen.current;
    let reload = false;
    for (const j of jobs.data) {
      const finished = ["completed", "partial", "needs_review"].includes(j.status);
      if (!finished) { if (["submitting", "processing", "submission_uncertain"].includes(j.status)) s.active.add(j.id); continue; }
      if (s.handled.has(j.id)) continue;
      s.handled.add(j.id);
      if (s.active.has(j.id) || (s.first && Date.now() - new Date(j.updated_at).getTime() < 5 * 60000)) reload = true;
    }
    s.first = false;
    if (reload) { void q.refetch(); void qc.invalidateQueries({ queryKey: ["long-forms"] }); }
  }, [jobs.dataUpdatedAt]);
  async function submitStudio() {
    if (studioBusy || activeRef.current) return;
    setStudioBusy(true); setError("");
    try {
      // Save speaker names/bios first so the job uses exactly what the user sees.
      if (JSON.stringify(studioSpeakers) !== studioInitial.current) {
      const names = Object.fromEntries(studioSpeakers.filter((s) => s.label).map((s) => [s.label, s.name.trim()]));
      const sp = await fetch("/api/long-forms", { method: "PATCH", headers: h, body: JSON.stringify({ id, speakerNames: names, speakerBios: studioSpeakers.map((s) => ({ name: s.name.trim(), bio: s.bio.trim() })) }) });
      const sd = await sp.json().catch(() => ({}));
      if (!sp.ok) throw new Error(sd.error || "The speakers could not be saved.");
      }
      const cta = studioCtaChoice ? formatCtaChoice(studioCtaChoice, studioCtaKeyword, studioCtaBenefit) : undefined;
      const r = await fetch("/api/podcast-script-jobs", { method: "POST", headers: h, body: JSON.stringify({ longFormId: id, counts: studioCounts, cta: cta || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "The job could not be sent.");
      setGenOpen(false); setStudioCounts({ BROLL: 0, "Talking Video": 0 }); setStudioCtaChoice(""); setStudioCtaKeyword(""); setStudioCtaBenefit("");
      void jobs.refetch(); void q.refetch();
    } catch (e: any) { setError(e.message); } finally { setStudioBusy(false); }
  }
  async function dismissStudio(jobId: string) {
    const r = await fetch("/api/podcast-script-jobs", { method: "PATCH", headers: h, body: JSON.stringify({ jobId, action: "dismiss" }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "The job could not be dismissed.");
    await jobs.refetch();
  }
  async function retryStudio(j: { id: string; counts: any; request?: any }) {
    if (studioBusy) return;
    setStudioBusy(true); setError("");
    try {
      await dismissStudio(j.id);
      const r = await fetch("/api/podcast-script-jobs", { method: "POST", headers: h, body: JSON.stringify({ longFormId: id, counts: j.counts, cta: j.request?.cta || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "The job could not be sent.");
      void jobs.refetch();
    } catch (e: any) { setError(e.message); } finally { setStudioBusy(false); }
  }
  const studioInitial = useRef("");
  const [editAllSpeakers, setEditAllSpeakers] = useState(false);
  const [studioSpeakers, setStudioSpeakers] = useState<{ label: string; name: string; bio: string }[]>([]);
  useEffect(() => {
    if (genMode !== "studio" || !q.data?.longForm) return;
    const lfd = q.data.longForm as any;
    const bios = new Map<string, string>();
    for (const row of String(lfd.speakerBios || "").split("\n")) { const m = row.match(/^([^:]+):\s*(.*)$/); const n = (m ? m[1] : row).trim(); if (n) bios.set(n.toLowerCase(), m ? m[2].trim() : ""); }
    const labels = [...new Set(sourceSegments(lfd.transcript || "").map((s) => s.speaker).filter((l) => l && l !== "Unidentified speaker"))];
    const list = labels.length
      ? labels.map((l0) => { const l = String(l0); const name = String(lfd.speakerNames?.[l] ?? "").trim() || String(l); return { label: l, name, bio: bios.get(name.toLowerCase()) || "" }; })
      : [...bios.entries()].map(([k, bio]) => ({ label: "", name: String(lfd.speakerBios).split("\n").map((r: string) => r.split(":")[0].trim()).find((n: string) => n.toLowerCase() === k) || k, bio }));
    const clean = list.map((x) => ({ label: String(x.label ?? ""), name: String(x.name ?? ""), bio: String(x.bio ?? "") }));
    studioInitial.current = JSON.stringify(clean.length ? clean : [{ label: "", name: "", bio: "" }]);
    setEditAllSpeakers(false);
    setStudioSpeakers(clean.length ? clean : [{ label: "", name: "", bio: "" }]);
  }, [genMode, q.data?.longForm]);
  // Ask only when the transcript found more than one speaker and some of them have no name yet.
  const studioAsk = useMemo(() => {
    const lf = q.data?.longForm as any;
    const labelled = studioSpeakers.filter((s) => s.label);
    if (labelled.length < 2) return [] as number[];
    return studioSpeakers.map((s, i) => (s.label && !String(lf?.speakerNames?.[s.label] ?? "").trim() ? i : -1)).filter((i) => i >= 0);
  }, [studioSpeakers.length, q.data?.longForm]);
  // Only the names the user is asked for must be filled; saved names (even shared ones) never block.
  const studioSpeakersOk = studioAsk.every((i) => { const s = studioSpeakers[i]; return !!s && !!s.name.trim() && s.name.trim() !== s.label; });
  const studioCtaOk = !!studioCtaChoice && (!ctaNeedsKeyword(studioCtaChoice) || (!!studioCtaKeyword.trim() && !!studioCtaBenefit.trim()));
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [manualSaving, setManualSaving] = useState(false);
  const [progress, setProgress] = useState<{ text: string; at: number }>({ text: "", at: Date.now() });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const footage = q.data?.footage;
  useEffect(() => { if (footage?.state !== "saving") return; const t = setTimeout(() => void q.refetch(), 15000); return () => clearTimeout(t); }, [footage?.state, q.dataUpdatedAt]);
  async function retryTranscription() {
    if (!window.confirm("Restart the transcription from the beginning? The current run will be stopped.")) return;
    await fetch("/api/long-forms", { method: "PATCH", headers: h, body: JSON.stringify({ id, retry: "transcription" }) });
    setProgress({ text: "", at: Date.now() }); void q.refetch();
  }
  async function startFootage() { await fetch("/api/long-forms", { method: "PATCH", headers: h, body: JSON.stringify({ id, footage: "start" }) }); void q.refetch(); }
  const [copied, setCopied] = useState(false);
  const [speakerSaving, setSpeakerSaving] = useState(false);
  const explicitResume = useRef(false);
  useEffect(() => { setSpeakerDraft(q.data?.longForm.speakerNames || {}); }, [q.data?.longForm.speakerNames]);
  async function saveSpeakers() {
    setSpeakerSaving(true); setError('');
    try {
      const r = await fetch('/api/long-forms', { method: 'PATCH', headers: h, body: JSON.stringify({ id, speakerNames: speakerDraft }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      await q.refetch();
    } catch (e: any) { setError(e.message); } finally { setSpeakerSaving(false); }
  }
  async function cleanupSpeech(enabled: boolean) {
    if (!open) return;
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/short-forms', { method: 'PATCH', headers: h, body: JSON.stringify({ id: open.id, cleanup: enabled }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      setOpen(d.shortForm); setDraft(d.shortForm.copy.split(/\n\s*Source notes:\s*\n/i)[0].trim()); await q.refetch();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }
  const activeRef = useRef(false);
  const requestFlight = useRef(false);
  const processingCallback = useRef(onProcessingChange);
  processingCallback.current = onProcessingChange;
  const lfState = q.data?.longForm;
  const transcribing = lfState?.status === "Transcribing";
  const pending = !!lfState?.pendingCounts && transcriptionComplete(lfState);
  const stopped = paused || (lfState?.status === "Failed" && pending && !resumeAllowed);
  const active = !stopped && (transcribing || pending || generating || continuing);
  activeRef.current = active;
  useEffect(() => {
    processingCallback.current(clipExitBlocked(active, error));
    return () => processingCallback.current(false);
  }, [active, error]);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active]);
  useEffect(() => {
    if (!active || generating) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const stop = (message: string) => { if (!cancelled) { setError(message); setPaused(true); } };
    async function advance() {
      try {
        if (transcribing) {
          const r = await fetch(`/api/long-forms?id=${id}&refresh=1`, { headers: h });
          const d = await r.json().catch(() => ({ error: "Couldn't save the finished transcript yet. It will try again shortly." }));
          if (!r.ok) {
            if ((r.status === 429 || r.status >= 500) && ++failures < 3) { timer = setTimeout(advance, 15000 * 2 ** failures); return; }
            throw new Error(d.error || `Transcription check failed (${r.status})`);
          }
          if (d.error || d.status === "Failed") throw new Error(d.error || "Transcription failed");
          if (d.status === "Transcribing") { const text = String(d.progress || ""); setProgress(p => p.text === text ? p : { text, at: Date.now() }); timer = setTimeout(advance, 15000); return; }
          await q.refetch();
        } else if (pending) {
          if (requestFlight.current) return;
          requestFlight.current = true;
          setContinuing(true);
          const res = await fetch("/api/long-forms", { method: "PUT", headers: h, body: JSON.stringify({ id, resume: true, explicit: explicitResume.current }) });
          await readStream(res, runner.onEvent);
          explicitResume.current = false;
          await q.refetch();
        }
      } catch (e: any) { stop(e.message || "Processing interrupted"); }
      finally { requestFlight.current = false; setContinuing(false); }
    }
    timer = setTimeout(advance, transcribing ? 15000 : 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [transcribing, pending, stopped, generating, resumeAllowed, q.dataUpdatedAt]);

  async function remove(s: ShortForm) {
    setBusyId(s.id); setError("");
    const r = await fetch(`/api/short-forms?id=${s.id}`, { method: "DELETE", headers: h });
    const d = await r.json().catch(() => ({}));
    setBusyId(null);
    if (!r.ok) setError(d.error || "Couldn't delete"); else void q.refetch();
  }
  async function removeEverywhere(s: ShortForm, contentId: string) {
    if (!window.confirm(`Delete "${s.name}"? It is removed from this long form and the planner.`)) return;
    await fetch("/api/dwy-client-content", { method: "PATCH", headers: h, body: JSON.stringify({ id: contentId, fields: { clientStatus: "Deleted" } }) });
    await remove(s); setBoardKey(k => k + 1);
  }
  // Every new piece goes straight to the planner queue, once.
  const boardFlight = useRef(false);
  const [boardFailed, setBoardFailed] = useState(false);
  useEffect(() => {
    if (active || generating || boardFlight.current || boardFailed) return;
    const todo = (q.data?.shortForms || []).filter(canAddToBoard);
    if (!todo.length) return;
    boardFlight.current = true; setBoarding(todo[0]);
    void (async () => {
      for (const s of todo) {
        const err = await addToBoard(s, { action: "queue" });
        if (err) { setError(`Couldn't add "${s.name}" to the planner: ${err}`); setBoardFailed(true); break; }
      }
      boardFlight.current = false; setBoarding(null); setBoardKey(k => k + 1); void q.refetch();
    })();
  }, [q.dataUpdatedAt, active, generating, boardFailed]);
  async function saveManual() {
    setManualSaving(true); setError("");
    try {
      const m = manual;
      const r = await fetch("/api/short-forms", { method: "PUT", headers: h, body: JSON.stringify({ longFormId: id, format: m.format, name: m.name, timestamps: m.timestamps, creativeDirection: m.creativeDirection,
        ...(m.format === "BROLL" ? { textOverlay: m.textOverlay } : m.format === "Talking Video" ? { visualHook: m.visualHook, script: m.script, cta: m.cta } : { coverTitle: m.coverTitle, coverSubtitle: m.coverSubtitle, coverBody: m.format === "Graphic" ? m.coverBody : undefined, cta: m.cta, ...(m.format === "Carousel" ? { slides: m.slides, slideDetails: m.details } : {}) }) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't save");
      setGenOpen(false); setManual(EMPTY_MANUAL); void q.refetch();
    } catch (e: any) { setError(e.message); } finally { setManualSaving(false); }
  }
  async function saveCopy() {
    if (!open) return;
    setSaving(true);
    const r = await fetch("/api/short-forms", { method: "PATCH", headers: h, body: JSON.stringify({ id: open.id, ...(draft !== baseCopy(open.copy) ? { copy: draft } : {}), ...(nameDraft.trim() && nameDraft.trim() !== open.name ? { name: nameDraft.trim() } : {}) }) });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return setError(d.error || "Couldn't save");
    setOpen(null); void q.refetch();
  }
  async function addToBoard(s: ShortForm, choice: PlannerChoice): Promise<string | null> {
    const format = s.format as ShortFormat;
    const script = boardScript(format, s.copy) as any;
    const r = await fetch("/api/send-to-production", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessCode, shortFormId: s.id, topic: s.name, script, format: WRITER_FORMAT[format], planner: choice, selectedCta: script.cta || undefined, requestId: `shortform:${s.id}` }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.recordId) return d.error || "Couldn't add to the board";
    const l = await fetch("/api/short-forms", { method: "POST", headers: h, body: JSON.stringify({ id: s.id, contentId: d.recordId }) });
    if (!l.ok) return (await l.json().catch(() => ({}))).error || "Added, but linking failed";
    setBoarding(null); void q.refetch();
    return null;
  }
  async function generate() {
    if (activeRef.current) return;
    setGenOpen(false);
    setGenerating(true); setError(""); setPaused(false); runner.setSteps([]);
    try {
      const res = await fetch("/api/long-forms", { method: "PUT", headers: h, body: JSON.stringify({ id, counts }) });
      await readStream(res, runner.onEvent);
    } catch (e: any) { setError(e.message); setPaused(true); }
    setGenerating(false); setGenOpen(false); void q.refetch();
  }

  const lf = q.data?.longForm;
  return (
    <>
      <div className="min-w-0 [&_header]:flex-wrap [&_header]:px-1 [&_header_h1]:break-words [&_header_h1]:text-base sm:[&_header]:px-0">
      <SectionHeader title={lf ? longFormDisplayName(lf.name) : "Long form"}
        leading={<Button variant="ghost" size="icon" aria-label="Back to Long form Clipper" onClick={onBack} className="h-11 w-11 shrink-0 text-brand-ink-mid hover:bg-brand-wash"><ArrowLeft size={18} /></Button>}
        actions={<Button className={action} disabled={active || pending || !lf?.transcript || !transcriptionComplete(lf)} onClick={() => { setCounts(ZERO); runner.setSteps([]); setGenMode("choose"); setManual(EMPTY_MANUAL); setGenOpen(true); }}><Plus size={16} />Create short forms</Button>} />
      </div>
      <div className="min-w-0 space-y-2 px-1 pb-8 pt-0 sm:px-0">
        {lf && <div className="-mt-1 flex flex-wrap items-center gap-2 pl-[52px] text-xs sm:pl-[52px]"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${pill(longFormStatus(lf))}`}>{longFormStatus(lf)}</span><span className="text-brand-ink-soft">{date(lf.createdDate)}</span></div>}
        {(active || stopped) && <div aria-live="polite" className="space-y-3 rounded-md border border-brand-line bg-brand-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium"><span>{stopped ? "Processing stopped" : active ? "Processing your long form" : "Short forms ready"}</span><span className="text-xs font-normal text-brand-ink-soft">{Math.floor(elapsed / 60)}m {elapsed % 60}s elapsed</span></div>
          {active && <><p className="text-xs text-brand-ink-soft">Keep this page open until processing finishes.</p>{transcribing ? (() => { const p = transcriptionProgress(progress.text); return <><div className="flex justify-between text-xs"><span>{p.label}</span>{now - progress.at > 20 * 60000 && <span className="flex items-center gap-2 text-destructive">No progress for 20 min<button type="button" className="font-medium text-brand-accent underline" onClick={() => void retryTranscription()}>Retry</button></span>}</div><div role="progressbar" aria-label="Transcription progress" aria-valuenow={p.percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-brand-line"><div className="h-full bg-brand-accent transition-all" style={{ width: `${p.percent}%` }} /></div></>; })() : <div role="progressbar" aria-label="Long-form processing" className="h-1.5 overflow-hidden rounded-full bg-brand-line"><div className="h-full w-full animate-pulse bg-brand-accent motion-reduce:animate-none" /></div>}</>}
          <ol className="space-y-2 text-xs">{["Video saved", "Transcribing", "Preparing transcript", "Creating short forms", "Complete"].map((label, i) => { const stage = transcribing ? 1 : pending || generating || continuing ? 3 : 4; return <li key={label} className="flex items-center gap-2">{i < stage || (!active && !stopped) ? <Check size={14} className="text-status-done" /> : i === stage && active ? <Loader2 size={14} className="animate-spin text-brand-accent" /> : <span className="h-3.5 w-3.5 rounded-full border border-brand-line" />}{label}</li>; })}</ol>
          {pending && (() => { try { const targets = JSON.parse(lf?.pendingCounts || "{}"); const left = targets; return <div className="grid grid-cols-2 gap-2 text-xs text-brand-ink-soft">{SHORT_FORMATS.filter(f => targets[f] > 0).map(f => <span key={f}>{f}: {left[f]} remaining</span>)}</div>; } catch { return null; } })()}
          {stopped && <Button className={action} onClick={() => { setError(""); setPaused(false); setResumeAllowed(true); explicitResume.current = true; void q.refetch(); }}>Continue processing</Button>}
        </div>}
        {lf && <>
          <div className="grid grid-cols-2 items-center gap-2 pb-1 text-xs">
            {footage?.state === "saved" && !isDriveFile(footage.url) ? <CopyLinkButton url={footage.url || ""} label="Copy footage link" className={`${secondary} h-10 text-xs`} />
              : footage?.state === "saved" ? <Button asChild variant="outline" className={`${secondary} h-10 text-xs`}><a href={footage.url} target="_blank" rel="noreferrer"><ExternalLink size={13} />{/dropbox\.com/i.test(footage.url || "") ? "Footage (Dropbox)" : "Footage"}</a></Button>
              : footage?.state === "saving" ? <Button variant="outline" disabled className={`${secondary} h-10 text-xs`}><Loader2 size={13} className="animate-spin" />Saving footage… {footage.percent ? `${footage.percent}%` : ""}</Button>
              : <Button variant="outline" className={`${secondary} h-10 text-xs`} title={footage?.message} onClick={() => void startFootage()}><Download size={13} />{footage?.state === "failed" ? "Retry saving footage" : "Save footage to Drive"}</Button>}
            {footage?.state === "failed" && footage.message && <p role="alert" className="col-span-2 text-[11px] text-destructive">{footage.message}</p>}
            <Button variant="outline" className={`${secondary} h-10 text-xs`} disabled={!lf.transcript} onClick={() => { if (lf.transcript) void deliverFile(new Blob([transcriptExport(lf.transcript, lf.speakerNames)], { type: 'text/plain;charset=utf-8' }), transcriptFilename(lf.name)); }}><Download size={13} />Transcript</Button>
            {(() => { try { const src = lf.transcriptionSource ? JSON.parse(lf.transcriptionSource) : null; return src?.name ? <span className="col-span-2 flex min-w-0 items-center gap-2 text-[11px] text-brand-ink-soft"><span className="truncate">Transcribed from: {String(src.name).split("/").pop()}</span>{src.url && <button type="button" className="inline-flex shrink-0 items-center gap-1 font-medium text-brand-accent hover:underline" onClick={() => { void navigator.clipboard.writeText(src.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy size={12} />{copied ? "Copied" : "Copy link"}</button>}</span> : null; } catch { return null; } })()}
          </div>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {(jobs.data || []).filter((j) => j.status !== "cancelled" && (!["completed", "partial", "needs_review"].includes(j.status) || Date.now() - new Date(j.created_at).getTime() < 10 * 60000)).slice(0, 2).map((j) => (
          <div key={j.id} aria-live="polite" className="flex flex-wrap items-center gap-2 rounded-md border border-brand-line bg-brand-surface px-4 py-3 text-xs">
            {j.status === "submission_uncertain" ? <><span className="font-medium text-destructive">We couldn't confirm the studio received this job</span><span className="text-brand-ink-soft">— it may still finish. Check before resending. {j.error || ""}</span></>
              : ["submitting", "processing"].includes(j.status) ? <><Loader2 size={14} className="animate-spin text-brand-accent" /><span className="font-medium">AI studio is writing {Number(j.counts?.BROLL || 0) + Number(j.counts?.["Talking Video"] || 0)} scripts</span><span className="text-brand-ink-soft">— {Math.max(0, Math.floor((Date.now() - new Date(j.created_at).getTime()) / 60000))} min so far. They appear here when ready.</span></>
              : j.status === "partial" ? <><Check size={14} className="text-status-done" /><span className="font-medium">AI studio delivered some scripts</span><span className="text-brand-ink-soft">— not every requested piece came back.{shortfallText(j.result)} Review the drafts below.</span></>
              : j.status === "needs_review" ? <><Check size={14} className="text-brand-accent" /><span className="font-medium">AI studio scripts need review</span><span className="text-brand-ink-soft">— automated checks flagged corrections.{shortfallText(j.result)} Review the drafts below.</span></>
              : j.status === "failed" || j.status === "needs_attention" ? <><span className="font-medium text-destructive">{j.status === "needs_attention" ? "The AI studio didn't respond" : "AI studio job failed"}</span><span className="text-brand-ink-soft">{j.error || "The scripts could not be written."}</span></>
              : <><Check size={14} className="text-status-done" /><span className="font-medium">AI studio delivered your scripts</span><span className="text-brand-ink-soft">— drafts, review before publishing.</span></>}
            {canRetry(j.status) && <span className="ml-auto flex gap-2">
              <Button size="sm" className="h-8 text-xs" disabled={studioBusy} onClick={() => void retryStudio(j)}>Try again</Button>
              <Button size="sm" variant="outline" className={`${secondary} h-8 text-xs`} disabled={studioBusy} onClick={() => void dismissStudio(j.id)}>Dismiss</Button>
            </span>}
          </div>
        ))}
        {(() => {
          const drafts = (q.data?.shortForms || []).filter((s) => s.copy.includes("AI studio draft, needs review"));
          if (!drafts.length) return null;
          return (
            <details className="rounded-md border border-brand-line bg-brand-surface px-4 py-3 text-xs">
              <summary className="cursor-pointer font-medium text-brand-ink">AI studio details ({drafts.length} drafts, review before recording)</summary>
              <div className="mt-3 space-y-3">
                {drafts.map((s) => (
                  <div key={s.id} className="space-y-1 border-t border-brand-line pt-3 first:border-0 first:pt-0">
                    <p className="font-medium text-brand-ink">{s.name} <span className="rounded bg-brand-wash px-1.5 py-0.5 text-[10px] font-medium text-brand-ink-soft">Draft — needs review</span></p>
                    <p className="whitespace-pre-wrap text-brand-ink-soft">{creativeDirection(parsePostCopy(s.copy)["source notes"] || "", lf?.speakerNames || {}) || (s.copy.split(/\n\s*Source notes:\s*\n/i)[1] || "").split("\n").slice(1).join("\n")}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })()}
        {q.isPending ? (
          <p className="flex items-center gap-2 py-12 text-sm text-brand-ink-soft"><Loader2 size={16} className="animate-spin" />Loading short forms…</p>
        ) : q.isError ? (
          <p role="alert" className="py-8 text-sm text-brand-ink-soft">{q.error.message}</p>
        ) : !q.data.shortForms.length ? (
          <p className="rounded-lg border border-brand-line bg-brand-surface py-12 text-center text-sm text-brand-ink-soft">{active ? "Your short forms will appear here as they are saved." : "No short forms yet."}</p>
        ) : (
          <>
            {boarding && <p className="flex items-center gap-2 text-xs text-brand-ink-soft"><Loader2 size={13} className="animate-spin" />Adding new pieces to the planner…</p>}
            <ApproveAndPostMode accessCode={accessCode} scope={{
              ids: q.data.shortForms.flatMap(s => s.contentIds),
              timestamps: Object.fromEntries(q.data.shortForms.flatMap(s => s.contentIds.map(c => [c, s.timestamps]))),
              directions: Object.fromEntries(q.data.shortForms.flatMap(s => s.contentIds.map(c => [c, s.creativeDirection || ""]))),
              onSaveMeta: (cid, meta) => { const s = q.data?.shortForms.find(x => x.contentIds.includes(cid)); if (s) void fetch("/api/short-forms", { method: "PATCH", headers: h, body: JSON.stringify({ id: s.id, ...meta }) }).then((r) => { if (!r.ok) setError("Couldn't save the clip details."); void q.refetch(); }); },
              refreshKey: boardKey,
              onDelete: (cid) => { const s = q.data?.shortForms.find(x => x.contentIds.includes(cid)); if (s) void removeEverywhere(s, cid); },
            }} />
          </>
        )}
      </div>

      <Dialog open={genOpen} onOpenChange={(o) => !active && setGenOpen(o)}>
        <DialogContent className="border-brand-line bg-social-feed text-brand-ink sm:max-w-xl [&>button]:text-brand-ink-soft">
          <DialogTitle>Create short forms</DialogTitle>
          {genMode === "choose" ? <>
            <DialogDescription className="sr-only">How do you want to create them?</DialogDescription>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setGenMode("studio")} className="rounded-lg border border-brand-line bg-brand-surface px-8 py-3 text-center text-sm font-semibold hover:border-brand-accent">AI studio</button>
              <button type="button" onClick={() => setGenMode("manual")} className="rounded-lg border border-brand-line bg-brand-surface px-8 py-3 text-center text-sm font-semibold hover:border-brand-accent">Manual</button>
            </div>
          </> : genMode === "manual" ? <>
            <DialogDescription className="text-brand-ink-soft">Fill in the template. It goes straight to the planner.</DialogDescription>
            <div className="max-h-[62vh] space-y-4 overflow-y-auto px-1 pb-1 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Format"><Select value={manual.format} onValueChange={(v) => setManual({ ...manual, format: v as ShortFormat })}>
                  <SelectTrigger aria-label="Format" className="h-9 border-brand-line bg-brand-surface"><SelectValue /></SelectTrigger>
                  <SelectContent>{CLIP_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select></Field>
                {manual.format === "Talking Video" && <><Field label="Timestamps"><Input placeholder="12:30–13:15" value={manual.timestamps} maxLength={200} onChange={e => setManual({ ...manual, timestamps: e.target.value })} className="h-9 border-brand-line bg-brand-surface" /></Field>
                <Field label="Creative direction"><Textarea placeholder="Notes for the editor (optional)" value={manual.creativeDirection} maxLength={10000} rows={2} onChange={e => setManual({ ...manual, creativeDirection: e.target.value })} className="border-brand-line bg-brand-surface" /></Field></>}
              </div>
              <Field label="Post name" required><Input value={manual.name} maxLength={200} onChange={e => setManual({ ...manual, name: e.target.value })} className="h-9 border-brand-line bg-brand-surface" /></Field>
              {manual.format === "BROLL" && <Field label="Text overlay"><Textarea rows={4} value={manual.textOverlay} onChange={e => setManual({ ...manual, textOverlay: e.target.value })} className="border-brand-line bg-brand-surface" /></Field>}
              {manual.format === "Talking Video" && <>
                <Field label="Visual hook"><Input value={manual.visualHook} onChange={e => setManual({ ...manual, visualHook: e.target.value })} className="h-9 border-brand-line bg-brand-surface" /></Field>
                <Field label="Script"><Textarea rows={6} value={manual.script} onChange={e => setManual({ ...manual, script: e.target.value })} className="border-brand-line bg-brand-surface" /></Field>
              </>}
              {(manual.format === "Carousel" || manual.format === "Graphic") && <SlideBox heading={manual.format === "Carousel" ? "Cover" : "Graphic"}>
                <Input aria-label="Title" placeholder="Title" value={manual.coverTitle} onChange={e => setManual({ ...manual, coverTitle: e.target.value })} className="h-9 border-brand-line bg-brand-surface" />
                <Input aria-label="Subtitle" placeholder="Subtitle" value={manual.coverSubtitle} onChange={e => setManual({ ...manual, coverSubtitle: e.target.value })} className="h-9 border-brand-line bg-brand-surface" />
                {manual.format === "Graphic" && <Textarea aria-label="Body" placeholder="Body" rows={3} value={manual.coverBody} onChange={e => setManual({ ...manual, coverBody: e.target.value })} className="border-brand-line bg-brand-surface" />}
              </SlideBox>}
              {manual.format === "Carousel" && manual.slides.map((t, i) => <SlideBox key={i} heading={`Slide ${i + 2}`} onRemove={manual.slides.length > 1 ? () => setManual({ ...manual, slides: manual.slides.filter((_, j) => j !== i), details: manual.details.filter((_, j) => j !== i) }) : undefined}>
                <Input aria-label={`Slide ${i + 2} title`} placeholder="Title" value={t} onChange={e => setManual({ ...manual, slides: manual.slides.map((x, j) => j === i ? e.target.value : x) })} className="h-9 border-brand-line bg-brand-surface" />
                <Input aria-label={`Slide ${i + 2} subtitle`} placeholder="Subtitle" value={manual.details[i]?.subtitle || ""} onChange={e => setManual({ ...manual, details: manual.details.map((x, j) => j === i ? { ...x, subtitle: e.target.value } : x) })} className="h-9 border-brand-line bg-brand-surface" />
                <Textarea aria-label={`Slide ${i + 2} body`} placeholder="Body" rows={2} value={manual.details[i]?.body || ""} onChange={e => setManual({ ...manual, details: manual.details.map((x, j) => j === i ? { ...x, body: e.target.value } : x) })} className="border-brand-line bg-brand-surface" />
              </SlideBox>)}
              {manual.format === "Carousel" && manual.slides.length < MAX_CAROUSEL_SLIDES && <Button type="button" variant="outline" className={`${secondary} h-8 text-xs`} onClick={() => setManual({ ...manual, slides: [...manual.slides, ""], details: [...manual.details, {}] })}><Plus size={13} />Add slide</Button>}
              {manual.format !== "BROLL" && <Field label="CTA"><Input value={manual.cta} onChange={e => setManual({ ...manual, cta: e.target.value })} className="h-9 border-brand-line bg-brand-surface" /></Field>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={`${secondary} h-8`} onClick={() => setGenMode("choose")} disabled={manualSaving}>Back</Button>
              <Button className={action} disabled={manualSaving || !manual.name.trim()} onClick={() => void saveManual()}>{manualSaving ? "Saving…" : "Save"}</Button>
            </div>
          </> : genMode === "studio" ? <>
            <DialogDescription className="sr-only">Create short forms with AI studio</DialogDescription>
            {q.data?.longForm && (() => { const segs = sourceSegments(q.data.longForm.transcript || ""); const last = segs[segs.length - 1]?.end; return (
              <p className="text-xs text-brand-ink-soft"><span className="font-medium text-brand-ink">{longFormDisplayName(q.data.longForm.name)}</span>{last ? ` · ${last}` : ""}</p>); })()}
            {studioAsk.length > 0 && <div className="space-y-2">
              <p className="text-xs font-medium text-brand-ink">Who is speaking?</p>
              {studioSpeakers.map((sp, i) => studioAsk.includes(i) && (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
                  <Input aria-label={`Speaker ${i + 1} name`} placeholder={sp.label || "Speaker"} maxLength={80} disabled={studioBusy} value={sp.name === sp.label ? "" : sp.name} onChange={(e) => setStudioSpeakers((l) => l.map((x, j) => j === i ? { ...x, name: e.target.value.replace(/[:\n]/g, "") } : x))} className="h-8 border-brand-line bg-brand-surface" />
                  <Input aria-label={`Speaker ${i + 1} bio`} placeholder="Role (optional)" maxLength={400} disabled={studioBusy} value={sp.bio} onChange={(e) => setStudioSpeakers((l) => l.map((x, j) => j === i ? { ...x, bio: e.target.value.replace(/\n/g, " ") } : x))} className="h-8 border-brand-line bg-brand-surface" />
                </div>
              ))}
            </div>}
            <div className="grid gap-3 sm:grid-cols-2">
              {(["BROLL", "Talking Video"] as const).map((f) => (
                <label key={f} className="space-y-1 text-xs font-medium text-brand-ink">
                  <span>{f === "BROLL" ? "B-roll" : "Talking Clip"}</span>
                  <Input type="number" min={0} max={20} disabled={studioBusy} value={studioCounts[f] || ""}
                    onChange={(e) => setStudioCounts({ ...studioCounts, [f]: Math.max(0, Math.min(20, Number(e.target.value) || 0)) })}
                    className="h-9 border-brand-line bg-brand-surface" />
                </label>
              ))}
            </div>
            <Field label="CTA">
              <Select value={studioCtaChoice} onValueChange={(v) => setStudioCtaChoice(v as CtaChoice)}>
                <SelectTrigger className="h-9 border-brand-line bg-brand-surface font-normal"><SelectValue placeholder="Choose a CTA" /></SelectTrigger>
                <SelectContent>{CTA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
              {ctaNeedsKeyword(studioCtaChoice) && <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input aria-label="Keyword" placeholder="Enter the keyword" value={studioCtaKeyword} onChange={(e) => setStudioCtaKeyword(e.target.value)} className="h-9 border-brand-line bg-brand-surface font-normal" />
                <Input aria-label="What the viewer will receive" placeholder="to get my ebook, guide…" value={studioCtaBenefit} onChange={(e) => setStudioCtaBenefit(e.target.value)} className="h-9 border-brand-line bg-brand-surface font-normal" />
              </div>}
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={`${secondary} h-8`} onClick={() => setGenMode("choose")} disabled={studioBusy}>Back</Button>
              <Button className={action} disabled={studioBusy || !studioSpeakersOk || !studioCtaOk || !(studioCounts.BROLL + studioCounts["Talking Video"] > 0)} onClick={() => void submitStudio()}>
                {studioBusy ? <><Loader2 size={15} className="animate-spin" />Sending…</> : "Generate scripts"}
              </Button>
            </div>
          </> : <>
          <DialogDescription className="text-brand-ink-soft">How many of each format should be written from this long form?</DialogDescription>
          <CountBoxes counts={counts} onChange={setCounts} disabled={active} />
          <div className="flex justify-end gap-2">
            {runner.steps.length && !generating ? (
              <Button className={action} onClick={() => setGenOpen(false)}>Done</Button>
            ) : (
              <Button className={action} disabled={generating || !Object.values(counts).some((n) => n > 0)} onClick={generate}>
                {generating ? <><Loader2 size={15} className="animate-spin" />Writing…</> : "Create"}
              </Button>
            )}
          </div>
          </>}
        </DialogContent>
      </Dialog>
    </>
  );
}
