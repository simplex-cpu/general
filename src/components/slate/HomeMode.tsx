// ============= Full file contents =============

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ExternalLink, ArrowRight, ChartNoAxesCombined, CheckCheck, CircleAlert, Clapperboard, Info, LayoutGrid, GalleryHorizontal, Film, Image as ImageIcon, Loader2, Route as PathIcon, UsersRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { profileUrl } from "@/lib/slate/profileUrl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { homeContent } from "@/lib/home.functions";
import { listMyBrands } from "@/lib/brands.functions";
import { analyzePostMetrics, METRIC_PLATFORMS, type MetricPlatform, type MetricKey } from "@/lib/slate/postMetrics";
import { BOARD_STAGES, boardStage, stageDropStatus, type BoardStage } from "@/lib/slate/plannerStatus";
import { useQueryClient } from "@tanstack/react-query";
import { ApproveAndPostMode } from "./ApproveAndPostMode";
const STAGE_PILL: Record<BoardStage, string> = {
  footage: "bg-brand-line text-brand-ink-mid",
  edit: "bg-destructive/10 text-destructive",
  design: "bg-destructive/10 text-destructive",
  approve: "bg-status-new-surface text-status-new",
  post: "bg-status-done-surface text-status-done",
};
import type { MetricsPost } from "@/lib/slate/postMetrics";
import { learningQueryOptions } from "@/lib/slate/learningQuery";
import { courseCounts } from "./learning/types";
import { Progress } from "./learning/ui";
import { siInstagram, siTiktok, siYoutube, siFacebook } from "simple-icons";
function PlatformGlyph({ platform }: { platform: MetricPlatform }) {
  const icon = platform === "Instagram" ? siInstagram : platform === "TikTok" ? siTiktok : platform === "YouTube" ? siYoutube : siFacebook;
  return <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-current" aria-hidden="true"><path d={icon.path} /></svg>;
}
import type { LearningTarget } from "./LearningMode";
import type { Mode } from "./ModeTabs";
import { refreshSummary } from "@/lib/slate/postMetrics";
import { HomePostsFeedModal } from "./HomePostsFeedModal";

const number = (value: number | null) => value === null ? "—" : new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const metrics: { key: MetricKey; label: string }[] = [
  { key: "views", label: "Views" }, { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" }, { key: "saves", label: "Saves" }, { key: "shares", label: "Shares" },
];
const controlClass = "h-10 w-32 shrink-0 rounded-md px-2.5 text-xs md:h-8";
const secondaryClass = `${controlClass} border-brand-line bg-brand-surface text-brand-ink-mid shadow-none hover:bg-brand-wash`;
const performanceControl = `${controlClass} border-brand-line bg-brand-wash text-brand-ink-mid shadow-home-control hover:bg-brand-line`;
const primaryClass = "h-10 min-w-32 w-auto shrink-0 gap-2 rounded-md px-4 text-xs md:h-8 bg-brand-accent text-brand-surface shadow-none hover:bg-brand-blue-light";
function HomeCard({ title, icon: Icon, children, footer, controls, subtitle }: { title: string; icon: LucideIcon; children: ReactNode; footer?: ReactNode; controls?: ReactNode; subtitle?: ReactNode }) {
  return <section aria-label={title} className="flex min-w-0 flex-col rounded-lg border border-brand-line bg-brand-surface p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><h2 className="flex items-center gap-2 text-base font-semibold tracking-normal"><Icon aria-hidden="true" size={16} className="shrink-0 text-brand-ink-soft" /><span>{title}</span></h2>{subtitle && <div className="mt-1.5">{subtitle}</div>}</div>
      {controls && <div className="ml-auto flex max-w-full flex-wrap justify-end gap-2">{controls}</div>}
    </div>
    <div className="min-w-0 flex-1">{children}</div>
    {footer && <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2">{footer}</div>}
  </section>;
}
function Retry({ onRetry }: { onRetry: () => void }) {
  return <Button onClick={onRetry} className={primaryClass}>Try again <ArrowRight /></Button>;
}
function Failure({ message }: { message: string }) {
  return <p role="alert" className="py-4 text-[13px] text-brand-ink-soft">{message}</p>;
}
function Loading() { return <div className="flex items-center gap-2 py-6 text-[13px] text-brand-ink-soft"><Loader2 size={16} className="animate-spin" />Loading…</div>; }

export function HomeMode({ accessCode, clientName, onOpenSession, onChange, onOpenPost, onContinue, onCommunity }: {
  accessCode: string; clientName: string; onOpenSession: (id: string) => void; onChange: (mode: Mode) => void; onOpenPost: (id: string) => void;
  onContinue: (target: LearningTarget) => void;
  onCommunity: (target: { postId: string; filter: "all" | "support" | "strategy" }) => void;
}) {
  const getContent = useServerFn(homeContent);
  const content = useQuery({ queryKey: ["home-content", accessCode], queryFn: () => getContent({ data: { accessCode } }), staleTime: 60_000, retry: 1 });
  const learning = useQuery(learningQueryOptions(accessCode));
  const [platform, setPlatform] = useState<MetricPlatform>("Instagram");
  const [days, setDays] = useState("90");
  const getBrands = useServerFn(listMyBrands);
  const brands = useQuery({ queryKey: ["home-brands", accessCode], queryFn: () => getBrands({ data: { accessCode } }), staleTime: 300_000, retry: 1 });
  const [brand, setBrand] = useState("all");
  useEffect(() => { const saved = localStorage.getItem("home-brand"); if (saved) setBrand(saved); }, []);
  const chooseBrand = (value: string) => { setBrand(value); localStorage.setItem("home-brand", value); };
  const brandList = brands.data || [];
  const activeBrand = brand !== "all" && brandList.some((b) => b.id === brand) ? brand : "all";
  const brandPosts = useMemo(() => activeBrand === "all" ? content.data || [] : (content.data || []).filter((post) => { const ids = brandList.find((b) => b.id === activeBrand)?.brandIds || []; return post.brandIds?.some((id) => ids.includes(id)); }), [content.data, activeBrand, brandList]);
  const [feedOpen, setFeedOpen] = useState(false);
  const analysis = useMemo(() => analyzePostMetrics(brandPosts, platform, Number(days)), [brandPosts, platform, days]);
  const queryClient = useQueryClient();
  const [modalPostId, setModalPostId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState<BoardStage | null>(null);
  const [moved, setMoved] = useState<Record<string, string>>({});
  const modalStarter = useMemo(() => { const p = (content.data || []).find((x) => x.id === modalPostId); return p ? { id: p.id, postName: p.postName, postType: p.postType, clientStatus: moved[p.id] ?? p.clientStatus, postingDate: p.postingDate, createdTime: p.createdAt || "", platforms: p.platforms, brandIds: p.brandIds } : undefined; }, [modalPostId, content.data, moved]);
  const board = useMemo(() => {
    const out: Record<BoardStage, MetricsPost[]> = { footage: [], edit: [], design: [], approve: [], post: [] };
    for (const post of content.data || []) { if (post.source === "post") continue; const stage = boardStage(moved[post.id] ?? post.clientStatus, post.postType); if (stage) out[stage].push(post); }
    for (const list of Object.values(out)) list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return out;
  }, [content.data, moved]);
  const moveCard = async (id: string, stage: BoardStage) => {
    const post = (content.data || []).find((p) => p.id === id);
    if (!post) return;
    const current = boardStage(moved[id] ?? post.clientStatus, post.postType);
    if (current === stage || (stage !== "edit" && stage !== "design" ? false : current === "edit" || current === "design")) return;
    const status = stageDropStatus(stage);
    setMoved((m) => ({ ...m, [id]: status }));
    try {
      const res = await fetch("/api/dwy-client-content", { method: "PATCH", headers: { "Content-Type": "application/json", "x-access-code": accessCode }, body: JSON.stringify({ id, fields: { clientStatus: status } }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "The status couldn’t be saved.");
      await queryClient.invalidateQueries({ queryKey: ["home-content", accessCode] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The status couldn’t be saved.");
    } finally {
      setMoved((m) => { const { [id]: _, ...rest } = m; return rest; });
    }
  };
  const milestones = learning.data?.milestones || [];
  const counts = milestones.reduce((sum, milestone) => { const count = courseCounts(milestone); return { total: sum.total + count.total, complete: sum.complete + count.complete }; }, { total: 0, complete: 0 });
  const percent = counts.total ? Math.round(counts.complete / counts.total * 100) : 0;
  const next = learning.data?.next;
  const milestone = milestones.find((item) => item.id === next?.milestoneId) || milestones.find((item) => !item.locked);
  const course = milestone?.missions.flatMap((mission) => mission.modules).find((item) => item.id === next?.courseId);
  const latestMeasured = brandPosts.map((post) => post.metrics[platform]).filter((m) => m.url && m.publishedAt && m.views !== null).map((m) => m.publishedAt).sort().pop() || "";
  const lastUpdate = brandPosts.map((post) => post.metrics[platform].updatedAt).filter((value) => Number.isFinite(Date.parse(value))).sort((a, b) => Date.parse(a) - Date.parse(b)).pop();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshPhase, setRefreshPhase] = useState("");
  const [askHandle, setAskHandle] = useState<{ id: string; name: string } | null>(null);
  const [handleInput, setHandleInput] = useState("");
  const platformLabel = (item: MetricPlatform) => {
    const key = item === "TikTok" ? "Tiktok" : item === "YouTube" ? "Youtube" : item;
    const handles = (activeBrand === "all" ? brandList : brandList.filter((b) => b.id === activeBrand)).map((b) => b.handles?.[key]).filter(Boolean);
    return handles.length === 1 ? `@${handles[0]}` : item;
  };
  const canRefresh = platform === "Instagram" || platform === "TikTok";
  const post = async (payload: Record<string, unknown>) => {
    const r = await fetch("/api/home-refresh-stats", { method: "POST", headers: { "Content-Type": "application/json", "x-access-code": accessCode }, body: JSON.stringify({ platform, ...payload }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "Statistics refresh failed. Please try again.");
    return data as { needsHandle?: boolean; runId?: string; status?: string; updated?: number; notOnPlanner?: number; toTag?: number; scraped?: number; remaining?: number; stalled?: boolean; processedIds?: string[]; warnings?: string[]; queued?: boolean; message?: string };
  };
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const show = (pct: number) => setRefreshPhase(`Collecting ${Math.min(99, Math.max(0, Math.round(pct)))}%`);
  const refreshBrand = async (b: { id: string; name: string }, handle?: string): Promise<{ updated: number; notOnPlanner: number; scraped: number } | "needsHandle"> => {
    const RETRY_WAIT = [30_000, 120_000];
    for (let attempt = 0; attempt < 3; attempt++) {
      let start = await post({ action: "start", brandId: b.id, handle, attempt });
      if (start.needsHandle) return "needsHandle";
      for (let q = 0; start.queued && q < 40; q++) { setRefreshPhase("Queued"); await wait(15_000); start = await post({ action: "start", brandId: b.id, handle, attempt }); }
      if (!start.runId) throw new Error("Too many profiles are being read right now. Please try again in a few minutes.");
      const began = Date.now();
      show(0);
      for (let i = 0; i < 120; i++) {
        await wait(5000);
        // Time-eased 0-40% while the profile is read.
        show(40 * (1 - Math.exp(-(Date.now() - began) / 60_000)));
        const res = await post({ action: "finish", brandId: b.id, runId: start.runId });
        if (res.status === "running") continue;
        if (res.status === "blocked") {
          if (attempt === 2) throw new Error(res.message || `${platform} temporarily blocked reading this profile. Please try again in a few minutes.`);
          setRefreshPhase("Retrying shortly…");
          await wait(RETRY_WAIT[attempt]);
          break;
        }
        if (res.status === "done") {
          show(50);
          let remaining = res.toTag || 0;
          const total = Math.max(1, remaining);
          const processedIds: string[] = [];
          const warnings = new Set<string>();
          for (let t = 0; remaining > 0 && t < 100; t++) {
            show(50 + 50 * (1 - remaining / total));
            const tag = await post({ action: "tag", brandId: b.id, runId: start.runId, processedIds });
            processedIds.push(...(tag.processedIds || []));
            for (const warning of tag.warnings || []) warnings.add(warning);
            remaining = tag.remaining || 0;
            if (tag.stalled) break;
          }
          setRefreshPhase("Collecting 100%");
          if (warnings.size) toast.warning(`Stats saved. Some post copy is incomplete: ${[...warnings].join(" ")}`, { duration: Infinity, closeButton: true });
          return { updated: res.updated || 0, notOnPlanner: (res as any).created || 0, scraped: res.scraped || 0 };
        }
        if (i === 119) throw new Error("Reading your profile is taking too long. Please try again later.");
      }
    }
    throw new Error(`${platform} temporarily blocked reading this profile. Please try again in a few minutes.`);
  };
  const runRefresh = async (handleFor?: { id: string; handle: string }) => {
    if (refreshing) return;
    const targets = activeBrand === "all" ? brandList : brandList.filter((b) => b.id === activeBrand);
    if (!targets.length) { toast.error("Add a brand first to refresh statistics."); return; }
    setRefreshing(true);
    let updated = 0, skipped = 0, found = 0, missing: { id: string; name: string } | null = null;
    try {
      for (const b of targets) {
        if (handleFor && b.id !== handleFor.id) continue;
        const result = await refreshBrand(b, handleFor?.handle);
        if (result === "needsHandle") { if (activeBrand !== "all" || handleFor) missing = missing || b; continue; }
        updated += result.updated; skipped += result.notOnPlanner; found += result.scraped;
      }
      if (missing) { setHandleInput(""); setAskHandle(missing); }
      else { toast.success(refreshSummary(platform, found, updated, skipped)); await content.refetch(); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Statistics refresh failed.", { duration: Infinity, closeButton: true }); }
    finally { setRefreshing(false); setRefreshPhase(""); }
  };
  const hasUrlWithoutDate = (content.data || []).some((post) => post.metrics[platform].url && !post.metrics[platform].publishedAt);

  return <div className="min-h-full bg-social-feed text-brand-ink">
    {modalPostId && <ApproveAndPostMode key={modalPostId} accessCode={accessCode} initialPostId={modalPostId} initialItem={modalStarter} modalOnly onClose={() => { setModalPostId(null); void queryClient.invalidateQueries({ queryKey: ["home-content", accessCode] }); }} />}
    <Dialog open={!!askHandle} onOpenChange={(open) => { if (!open) setAskHandle(null); }}>
      <DialogContent className="border-brand-line bg-brand-surface text-brand-ink sm:max-w-md">
        <DialogHeader><DialogTitle>Add your {platform} handle</DialogTitle><DialogDescription>We need {askHandle?.name || "this brand"}'s {platform} handle to read its latest statistics. It will be saved to the brand's Connected Accounts.</DialogDescription></DialogHeader>
        <Input autoFocus placeholder="@yourbrand" value={handleInput} onChange={(e) => setHandleInput(e.target.value)} className="border-brand-line" />
        <DialogFooter><Button variant="outline" onClick={() => setAskHandle(null)} className="border-brand-line">Cancel</Button><Button disabled={!handleInput.replace(/^@/, "").trim()} onClick={() => { const b = askHandle; setAskHandle(null); if (b) void runRefresh({ id: b.id, handle: handleInput }); }} className="bg-brand-accent text-brand-surface hover:bg-brand-blue-light">Save & refresh</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <main className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 pt-6 sm:gap-6 sm:px-8 md:pb-14 md:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 break-words text-sm font-light tracking-normal text-brand-ink-mid">Welcome back{clientName.trim() ? `, ${clientName.trim()}` : ""}</h1>
        {brandList.length > 0 && <Select value={activeBrand} onValueChange={chooseBrand}>
          <SelectTrigger aria-label="Brand for performance and growth path" className={`${secondaryClass} w-44`}><SelectValue /></SelectTrigger>
          <SelectContent className="border-brand-line bg-brand-surface text-brand-ink"><SelectItem value="all">All brands</SelectItem>{brandList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name || "Untitled brand"}</SelectItem>)}</SelectContent>
        </Select>}
      </div>

      <HomeCard title="Performance" icon={ChartNoAxesCombined} controls={<>
            <Select value={platform} onValueChange={(value) => { if (METRIC_PLATFORMS.includes(value as MetricPlatform)) setPlatform(value as MetricPlatform); }}>
              <SelectTrigger aria-label="Performance platform" className={`${performanceControl} min-w-[11rem] w-auto`}><SelectValue /></SelectTrigger>
              <SelectContent className="border-brand-line bg-brand-surface text-brand-ink">{METRIC_PLATFORMS.map((item) => <SelectItem key={item} value={item}><span className="flex items-center gap-1.5"><PlatformGlyph platform={item} />{platformLabel(item)}</span></SelectItem>)}</SelectContent>
            </Select>
            {(() => { const label = platformLabel(platform); const href = label.startsWith("@") ? profileUrl(platform, label) : ""; return href ? <a href={href} target="_blank" rel="noreferrer" title={`Open ${label} on ${platform}`} aria-label={`Open ${label} on ${platform}`} className={`${performanceControl} inline-flex w-auto items-center gap-1 px-2.5 text-brand-ink-soft hover:text-brand-accent`}><ExternalLink size={14} /></a> : null; })()}
            {canRefresh && <Button variant="outline" onClick={() => void runRefresh()} disabled={refreshing || brandList.length === 0} className={`${performanceControl} w-auto gap-1.5 px-3`}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? refreshPhase || "Refreshing…" : "Refresh stats"}</Button>}
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger aria-label="Performance period" className={performanceControl}><SelectValue /></SelectTrigger>
              <SelectContent className="border-brand-line bg-brand-surface text-brand-ink">{["7", "30", "90", "180", "365"].map((value) => <SelectItem key={value} value={value}>Last {value} days</SelectItem>)}</SelectContent>
            </Select>
      </>} footer={content.isError ? <Retry onRetry={() => void content.refetch()} /> : undefined}>
        {content.isPending ? <Loading /> : content.isError ? <Failure message="Statistics couldn’t be loaded." /> : <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-brand-line pt-3 pb-8 sm:grid-cols-4 lg:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
            {metrics.map(({ key, label }, index) => <div key={key} className={index === 0 ? "col-span-2 sm:col-span-4 lg:col-span-1" : "min-w-0 lg:border-l lg:border-brand-line lg:pl-6"}>
              <p className="text-[11px] font-medium text-brand-ink-soft">{label}</p>
              <p className={index === 0 ? "mt-2 text-[42px] font-semibold leading-none tabular-nums tracking-normal" : "mt-2.5 text-[22px] font-medium leading-none tabular-nums tracking-normal"}>{number(analysis.totals[key].value)}</p>
            </div>)}
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-[3fr_2fr]">
            <div className="min-w-0">
              <h3 className="text-[11px] font-medium tracking-normal text-brand-ink-soft">Your top performing topic</h3>
              {analysis.topTopics[0] ? <div className="mt-2"><p title={analysis.topTopics[0].topic} className="truncate text-[17px] font-semibold leading-tight tracking-normal text-brand-ink">{analysis.topTopics[0].topic}</p><p className="mt-1 text-[11px] text-brand-ink-soft">{number(analysis.topTopics[0].averageViews)} avg views across {analysis.topTopics[0].count} post{analysis.topTopics[0].count === 1 ? "" : "s"}</p>{analysis.topTopics[1] && <p className="mt-0.5 text-[11px] text-brand-ink-soft">Runner-up: {analysis.topTopics[1].topic} ({number(analysis.topTopics[1].averageViews)} avg views)</p>}</div>
                : <p className="mt-2 text-[11px] text-brand-ink-soft">Not enough data yet.</p>}
            </div>
            <div className="min-w-0 sm:border-l sm:border-brand-line sm:pl-6">
              <h3 className="text-[11px] font-medium tracking-normal text-brand-ink-soft">Your top performing format</h3>
              {analysis.topFormats[0] ? <div className="mt-2"><p title={analysis.topFormats[0].format} className="truncate text-[17px] font-semibold leading-tight tracking-normal text-brand-ink">{analysis.topFormats[0].format}</p><p className="mt-1 text-[11px] text-brand-ink-soft">{number(analysis.topFormats[0].averageViews)} avg views across {analysis.topFormats[0].count} post{analysis.topFormats[0].count === 1 ? "" : "s"}</p></div>
                : <p className="mt-2 text-[11px] text-brand-ink-soft">Not enough data yet.</p>}
            </div>
          </div>
          <HomePostsFeedModal accessCode={accessCode} brands={brandList} onOpenSession={onOpenSession} brandNames={brandList.map((b) => b.name)} open={feedOpen} onOpenChange={setFeedOpen} platform={platform} days={days} publications={analysis.publications} />
          {analysis.measuredCount === 0 && latestMeasured && <p className="mt-4 text-[11px] text-brand-ink-soft">No measured {platform} posts in the last {days} days. The latest one was published {date(latestMeasured)} — choose a longer period to see it.</p>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-1 text-[11px] text-brand-ink-soft"><p>Last update {lastUpdate ? new Date(lastUpdate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>{(analysis.measuredCount > 0 || hasUrlWithoutDate) && <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Statistics details" className="size-6 shrink-0 text-brand-ink-soft hover:bg-brand-line"><Info size={14} /></Button></PopoverTrigger>
              <PopoverContent align="start" className="max-w-[calc(100vw-2rem)] border-brand-line bg-brand-surface text-brand-ink">
                <p className="text-[13px] font-semibold">Statistics coverage</p>
                <p className="mt-2 text-[11px] leading-4 text-brand-ink-soft">{analysis.publishedCount} published {platform} posts in this period. Missing statistics are not counted as zero.{analysis.updatedAt ? ` Oldest collection: ${date(analysis.updatedAt)}.` : " Collection time is not available."}</p>
                <dl className="mt-3 space-y-2">{metrics.map(({ key, label }) => <div key={key} className="flex justify-between gap-3 text-[11px]"><dt>{label}</dt><dd className="text-brand-ink-soft">{analysis.totals[key].count} measured</dd></div>)}</dl>
              </PopoverContent>
            </Popover>}{!analysis.measuredCount && hasUrlWithoutDate && <span>· Stats pending</span>}</div>{analysis.publishedCount > 0 && <Button variant="outline" onClick={() => setFeedOpen(true)} className={`${performanceControl} w-auto gap-2 px-3 text-brand-accent`}>See all posts ({analysis.publishedCount}) <ArrowRight size={14} /></Button>}</div>
        </>}
      </HomeCard>

      <HomeCard title="Priority" icon={CircleAlert} footer={content.isError ? <Retry onRetry={() => void content.refetch()} /> : undefined}>
        {content.isPending ? <Loading /> : content.isError ? <Failure message="Pending posts couldn’t be loaded." /> : <div className="-mx-1 overflow-x-auto pb-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-line [&::-webkit-scrollbar-track]:bg-brand-wash">
          <div className="grid min-w-[900px] grid-cols-5 gap-3 px-1">{BOARD_STAGES.map((stage) => {
            const cards = board[stage.key];
            const over = dropOver === stage.key;
            return <section key={stage.key} aria-label={stage.label} onDragOver={(e) => { if (!dragId) return; e.preventDefault(); setDropOver(stage.key); }} onDragLeave={() => setDropOver((s) => s === stage.key ? null : s)} onDrop={(e) => { e.preventDefault(); setDropOver(null); const id = e.dataTransfer.getData("text/plain") || dragId; setDragId(null); if (id) void moveCard(id, stage.key); }} className={`flex min-h-[420px] flex-col rounded-lg p-1 transition-colors ${over ? "bg-brand-wash" : ""}`}>
              <header className="flex items-center gap-2 px-1 pb-2 pt-1"><h3 className={`rounded px-2 py-0.5 text-[12px] font-medium ${STAGE_PILL[stage.key]}`}>{stage.label}</h3><span className="text-[11px] tabular-nums text-brand-ink-grey">{cards.length}</span></header>
              <div className="flex max-h-[560px] flex-col gap-1.5 overflow-y-auto [scrollbar-width:thin]">{cards.length ? cards.map((post) => <div key={post.id} role="button" tabIndex={0} onClick={() => setModalPostId(post.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModalPostId(post.id); } }} className={`group relative cursor-pointer rounded-md border border-brand-line bg-brand-surface px-2.5 py-2 text-left shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition-colors hover:border-brand-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 ${dragId === post.id ? "opacity-50" : ""}`}>
                <span draggable aria-label="Drag to change status" title="Drag to move" onClick={(e) => e.stopPropagation()} onDragStart={(e) => { e.dataTransfer.setData("text/plain", post.id); e.dataTransfer.effectAllowed = "move"; setDragId(post.id); }} onDragEnd={() => { setDragId(null); setDropOver(null); }} className="absolute right-1.5 top-1.5 flex size-5 cursor-grab items-center justify-center rounded text-brand-ink-grey hover:bg-brand-wash hover:text-brand-ink active:cursor-grabbing"><LayoutGrid size={12} /></span>
                {stage.key === "approve" && (() => { const t = post.postType || ""; const Icon = /carousel/i.test(t) ? GalleryHorizontal : /graphic/i.test(t) ? ImageIcon : Film; return <span title={t.replace(/^\P{L}+/u, "") || "Format"} className="mb-1 flex text-brand-ink-soft"><Icon size={12} aria-label={t || "Format"} /></span>; })()}
                <span className="line-clamp-2 break-words pr-5 text-[12.5px] font-medium leading-snug text-brand-ink">{post.postName || "Untitled post"}</span>
                <span className="mt-1 block text-[11px] text-brand-ink-soft">{post.createdAt ? date(post.createdAt) : "—"}</span>
              </div>) : <p className="px-1.5 py-2 text-[11px] text-brand-ink-grey">Nothing here</p>}</div>
            </section>;
          })}</div>
        </div>}
      </HomeCard>

    </main>
  </div>;
}
