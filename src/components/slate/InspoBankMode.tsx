import { RepurposeAnglePicker } from "./RepurposeAnglePicker";
import { inspoEmbedUrl } from "@/lib/slate/inspoBank";
import type { Angle } from "@/lib/slate/brandContext";
import { useRef, useState, type ReactNode } from "react";
import { externalHref } from "@/lib/slate/externalLink";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, ImageOff, ChevronDown, Loader2, Plus, Search, Trash2, Wand2, Check, X, Sparkles, Play } from "lucide-react";
import { searchTerms as termsSchema } from "@/lib/slate/inspoFind";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { listMyBrands } from "@/lib/brands.functions";
import { INSPO_FORMATS, INSPO_PLATFORMS, postAge, isMinedInspo, splitWhyItWorks, type InspoPost } from "@/lib/slate/inspoBank";
import { detectInspoPlatform, inspoFields, metadataIsCurrent } from "@/lib/slate/inspoValidation";
import { SectionHeader } from "./SectionHeader";
import { SectionTabs } from "./SectionTabs";
import { PlatformIcon } from "./post/PlatformIcon";

function InspoStats({ p }: { p: InspoPost }) {
  const f = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
  return <span className="flex items-center gap-3 text-[11px] text-brand-ink-mid tabular-nums">{([["views", p.views], ["likes", p.likes], ["comments", p.comments]] as const).map(([l, v]) => <span key={l}><b className="font-semibold text-brand-ink">{v == null ? "—" : f.format(v)}</b> {l}</span>)}</span>;
}

function WhyBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-brand-line bg-brand-wash/50 p-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-accent">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-brand-ink-mid">{text || "—"}</p>
    </div>
  );
}

type InspoView = "New" | "Repurposed";

const action =
  "brand-slim-action h-8 gap-2 rounded-md bg-brand-accent px-4 text-xs text-brand-surface hover:bg-brand-blue-light";
const select =
  "h-10 w-full appearance-none rounded-md border border-brand-line bg-brand-surface bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pl-3 pr-9 text-sm text-brand-ink [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]";

const field =
  "h-10 w-full rounded-md border border-brand-line bg-brand-surface px-3 text-sm text-brand-ink placeholder:text-brand-ink-soft focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-accent";
const EMPTY = {
  title: "",
  copy: "",
  url: "",
  platform: "",
  format: "",
  handle: "",
  topic: "",
  whyItWorks: "",
  postedDate: "",
  thumbnail: "",
};

async function call<T>(accessCode: string, path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-access-code": accessCode },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || (r.status >= 500 ? "Something went wrong on our side — please try again." : `Request failed (${r.status})`));
  return data as T;
}

export function InspoBankMode({
  accessCode,
  backControl,
  onOpenSession,
}: {
  accessCode: string;
  backControl: ReactNode;
  onOpenSession: (id: string) => void;
}) {
  const qc = useQueryClient();
  const key = ["inspo-bank", accessCode];
  const posts = useQuery({
    queryKey: key,
    queryFn: () => call<{ posts: InspoPost[] }>(accessCode, "/api/inspo-bank").then((d) => d.posts),
  });
  const list = useServerFn(listMyBrands);
  const brands = useQuery({
    queryKey: ["my-brands", accessCode],
    queryFn: () => list({ data: { accessCode } }),
    staleTime: 30000,
  });
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<InspoView>("New");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<InspoPost | null>(null);
  const [repurposing, setRepurposing] = useState<InspoPost | null>(null);
  const [repurposeError, setRepurposeError] = useState("");
  const [previewing, setPreviewing] = useState<InspoPost | null>(null);
  const [viewingId, setViewing] = useState<InspoPost | null>(null);
  const [brandId, setBrandId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [finding, setFinding] = useState(false);
  const [findMode, setFindMode] = useState<"" | "own" | "auto">("");
  const [terms, setTerms] = useState<string[]>([""]);
  const [findBrand, setFindBrand] = useState("");
  const [findBusy, setFindBusy] = useState(false);
  const [findNote, setFindNote] = useState("");
  const [findError, setFindError] = useState("");
  const [findStage, setFindStage] = useState<"setup" | "search" | "checking" | "read" | "complete" | "error">("setup");
  const [findProgress, setFindProgress] = useState({ searched: 0, searches: 0, done: 0, total: 0, added: 0, duplicates: 0, skipped: 0, failed: 0 });
  const [findWarnings, setFindWarnings] = useState<string[]>([]);
  const [bankSuccess, setBankSuccess] = useState("");
  const searchLock = useRef(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupNote, setLookupNote] = useState("");
  const currentUrl = useRef("");
  const lookupCache = useRef(new Map<string, Partial<typeof EMPTY>>());
  const lookupPending = useRef(new Set<string>());
  const [read, setRead] = useState(false);
  const [steps, setSteps] = useState<Record<string, string>>({});
  const [repurposeFormat, setRepurposeFormat] = useState("");
  const [formatUnlocked, setFormatUnlocked] = useState(false);
  const [angleStep, setAngleStep] = useState(false);
  const [editing, setEditing] = useState<{
    post: InspoPost;
    key: keyof typeof EMPTY;
    value: string;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  async function lookup(url: string) {
    if (!detectInspoPlatform(url) || lookupPending.current.has(url)) return;
    if (lookupCache.current.has(url)) {
      setForm((f) => ({ ...f, ...lookupCache.current.get(url) }));
      setRead(true);
      return;
    }
    if (!["Instagram", "TikTok"].includes(detectInspoPlatform(url))) return setRead(true);
    lookupPending.current.add(url);
    setLookupBusy(true);
    setLookupNote("");
    setSteps({});
    const merged: Partial<typeof EMPTY> = {};
    try {
      const r = await fetch("/api/inspo-read", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ url }),
      });
      if (!r.ok || !r.body)
        throw new Error((await r.json().catch(() => ({})))?.error || "Reading failed");
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        buf += dec.decode(value, { stream: !done });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim() || !metadataIsCurrent(url, currentUrl.current)) continue;
          const ev = JSON.parse(line);
          if (ev.result) {
            Object.assign(merged, ev.result);
            setForm((f) => ({ ...f, ...ev.result }));
          } else {
            setSteps((s) => ({
              ...s,
              [ev.step]: ev.status === "start" ? ev.message || "start" : ev.status,
            }));
            if (ev.status === "error")
              setLookupNote(
                ev.message || "Part of this post could not be read. Fill in the rest below.",
              );
          }
        }
        if (done) break;
      }
      lookupCache.current.set(url, merged);
    } catch (e) {
      if (metadataIsCurrent(url, currentUrl.current))
        setLookupNote(e instanceof Error ? e.message : "Details unavailable. Fill them in below.");
    } finally {
      lookupPending.current.delete(url);
      if (metadataIsCurrent(url, currentUrl.current)) {
        setLookupBusy(false);
        setRead(true);
      }
    }
  }

  async function saveEdit() {
    if (!editing || editSaving) return;
    setEditSaving(true);
    setEditError("");
    try {
      const data = await call<{ post: InspoPost }>(
        accessCode,
        `/api/inspo-bank?id=${editing.post.id}`,
        { method: "PATCH", body: JSON.stringify({ [editing.key]: editing.value }) },
      );
      qc.setQueryData<InspoPost[]>(key, (old) =>
        (old || []).map((p) => (p.id === data.post.id ? data.post : p)),
      );
      setEditing(null);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Could not save this change.");
    } finally {
      setEditSaving(false);
    }
  }

  function cell(post: InspoPost, k: keyof typeof EMPTY, label: string, display?: ReactNode) {
    if (isMinedInspo(post)) return <span className="line-clamp-2 text-brand-ink">{display || post[k] || "—"}</span>;
    return (
      <Button
        variant="ghost"
        title={`Edit ${label}`}
        aria-label={`Edit ${label} for ${post.title}`}
        onClick={() => {
          setEditing({ post, key: k, value: post[k] || "" });
          setEditError("");
        }}
        className="h-auto min-h-8 w-full justify-start whitespace-normal rounded-sm px-1 py-1 text-left text-xs font-normal text-brand-ink hover:bg-brand-wash"
      >
        <span className="line-clamp-3">{display || post[k] || "—"}</span>
      </Button>
    );
  }

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (saving) return;
    const parsed = inspoFields.safeParse(form);
    if (!parsed.success)
      return setFormError(parsed.error.issues[0]?.message || "Complete the three required fields.");
    setSaving(true);
    setFormError("");
    try {
      await call<{ post: InspoPost }>(accessCode, "/api/inspo-bank", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await qc.invalidateQueries({ queryKey: key });
      setAdding(false);
      setForm(EMPTY);
      currentUrl.current = "";
      setLookupNote("");
      setRead(false);
      setSteps({});
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openFind() {
    setFinding(true);
    setFindMode("");
    setTerms([""]);
    setFindNote("");
    setFindError("");
    setFindBrand(brandList[0]?.id || "");
    setFindStage("setup");
    setFindWarnings([]);
    setBankSuccess("");
  }

  async function generateTerms() {
    setFindBusy(true);
    setFindError("");
    try {
      const r = await call<{ terms: string[] }>(accessCode, "/api/inspo-find", {
        method: "POST",
        body: JSON.stringify({ action: "generate", brandId: findBrand || undefined }),
      });
      setTerms(r.terms);
    } catch (e: any) {
      setFindError(e.message);
    } finally {
      setFindBusy(false);
    }
  }

  async function runSearch() {
    if (searchLock.current) return;
    const clean = terms.map((t) => t.trim()).filter(Boolean);
    const v = termsSchema.safeParse(clean);
    if (!v.success) return setFindError(v.error.issues[0]?.message || "Check your search terms");
    searchLock.current = true;
    setFindBusy(true);
    setFindStage("search");
    setFindProgress({ searched: 0, searches: clean.length, done: 0, total: 0, added: 0, duplicates: 0, skipped: 0, failed: 0 });
    setFindWarnings([]);
    setFindError("");
    setFindNote("Searching TikTok…");
    try {
      const r = await fetch("/api/inspo-find", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ action: "search", terms: v.data }),
      });
      if (!r.ok || !r.body) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error || `Search failed (${r.status})`);
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let completed = false;
      while (true) {
        const { value, done } = await reader.read();
        buf += dec.decode(value, { stream: !done });
        const lines = buf.split("\n");
        buf = done ? "" : lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.phase === "search") {
            setFindStage("search");
            setFindNote(`Searching "${e.term}"…`);
          }
          if (e.phase === "searched") setFindProgress(p => ({ ...p, searched: e.done, searches: e.total }));
          if (e.phase === "checking") {
            setFindStage("checking");
            setFindNote("Checking found posts against your bank…");
          }
          if (e.phase === "checked") {
            setFindStage("read");
            setFindProgress(p => ({ ...p, total: e.total, duplicates: e.duplicates }));
            setFindNote(`Reading and saving ${e.total} new posts…`);
          }
          if (e.phase === "read") {
            setFindStage("read");
            setFindNote(`Read ${e.done} of ${e.total} posts`);
            setFindProgress(p => ({ ...p, done: e.done, total: e.total, added: e.added || 0, duplicates: e.duplicates || 0, skipped: e.skipped || 0 }));
          }
          if (e.phase === "warn") setFindWarnings(w => [...w, String(e.message || "A post could not be processed.")]);
          if (e.phase === "complete") {
            completed = true;
            setFindStage("complete");
            setFindProgress(p => ({ ...p, done: e.total, total: e.total, added: e.added, duplicates: e.duplicates || 0, skipped: e.skipped || 0, failed: e.failed || 0 }));
            if (e.added) setBankSuccess(`${e.added} new post${e.added === 1 ? "" : "s"} added to your bank.`);
          }
          if (e.phase === "error") throw new Error(e.message);
        }
        if (done) break;
      }
      if (!completed) throw new Error("The search stopped before completion. Posts already saved are still in your bank; a new search will check for duplicates.");
      await qc.invalidateQueries({ queryKey: key });
    } catch (e: any) {
      setFindError(e.message);
      setFindNote("");
      setFindStage("error");
      await qc.invalidateQueries({ queryKey: key });
    } finally {
      setFindBusy(false);
      searchLock.current = false;
    }
  }

  async function remove(post: InspoPost) {
    setDeleting(null);
    setError("");
    try {
      await call(accessCode, `/api/inspo-bank?id=${post.id}`, { method: "DELETE" });
      qc.setQueryData<InspoPost[]>(key, (old) => (old || []).filter((p) => p.id !== post.id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function repurpose(post: InspoPost, angle?: Angle) {
    if (busyId) return;
    setBusyId(post.id);
    setRepurposeError("");
    try {
      const r = await call<{ sessionId: string }>(accessCode, "/api/inspo-repurpose", {
        method: "POST",
        body: JSON.stringify({
          id: post.id,
          brandId: brandId || undefined,
          format: repurposeFormat || undefined,
          angle,
        }),
      });
      setRepurposing(null); setAngleStep(false);
      onOpenSession(r.sessionId);
    } catch (e: any) {
      setRepurposeError(e.message || "The script could not be written right now.");
    } finally {
      setBusyId(null);
    }
  }

  const allRows = posts.data || [];
  const rows = allRows.filter((p) => (p.status || "New") === view);
  const counts = { New: allRows.filter((p) => (p.status || "New") === "New").length, Repurposed: allRows.filter((p) => p.status === "Repurposed").length };
  const brandList = brands.data || [];

  return (
    <>
      <SectionHeader
        title="Find Viral Posts"
        leading={backControl}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="brand-slim-action h-8 gap-2 rounded-md border-brand-accent bg-brand-surface px-4 text-xs text-brand-accent hover:bg-brand-accent/5"
              onClick={openFind}
            >
              <Search size={15} />
              Find Inspo
            </Button>
            <Button className={action} onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add inspo
            </Button>
          </div>
        }
      />
      <div className="px-5 pb-8 pt-4 sm:px-8">
        {bankSuccess && <p role="status" className="mb-3 flex items-center gap-2 rounded-md bg-status-done-surface px-3 py-2 text-sm text-status-done"><Check size={16} />{bankSuccess}</p>}
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-md border border-red-200 bg-brand-surface px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}
        {posts.isPending ? (
          <p className="flex items-center gap-2 py-12 text-sm text-brand-ink-soft">
            <Loader2 size={16} className="animate-spin" />
            Loading your inspo…
          </p>
        ) : posts.isError ? (
          <div role="alert" className="py-8 text-sm text-brand-ink-soft">
            {posts.error.message}{" "}
            <Button variant="link" onClick={() => void posts.refetch()}>
              Try again
            </Button>
          </div>
        ) : !allRows.length ? (
          <div className="rounded-lg border border-brand-line bg-brand-surface py-16 text-center">
            <p className="mb-4 text-sm text-brand-ink-soft">
              Save posts that inspire you, then repurpose them for your brand.
            </p>
            <Button className={action} onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add inspo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
          <div className="max-w-sm">
            <SectionTabs ariaLabel="Inspo status" active={view} onChange={(id) => setView(id as InspoView)}
              items={[{ id: "New", label: `New (${counts.New})`, icon: Sparkles }, { id: "Repurposed", label: `Repurposed (${counts.Repurposed})`, icon: Check }]} />
          </div>
          {!rows.length ? (
            <p className="rounded-lg border border-brand-line bg-brand-surface py-10 text-center text-sm text-brand-ink-soft">
              {view === "New" ? "No new inspo. Find or add posts to fill your bank." : "Nothing repurposed yet."}
            </p>
          ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-brand-line/60 bg-brand-surface shadow-[0_4px_16px_-12px_color-mix(in_oklab,var(--color-brand-ink)_30%,transparent)]">
                <div role="button" tabIndex={0} aria-label={`Open details for ${p.title || "post"}`} onClick={() => setViewing(p)} onKeyDown={(e) => { if (e.key === "Enter") setViewing(p); }} className="relative aspect-square w-full cursor-pointer overflow-hidden bg-brand-line">
                  {p.thumbnail ? <><span aria-hidden className="absolute inset-0 animate-pulse bg-brand-line" /><img src={p.thumbnail} alt="" decoding="async" referrerPolicy="no-referrer" onLoad={(e) => { e.currentTarget.style.opacity = "1"; (e.currentTarget.previousSibling as HTMLElement | null)?.classList.remove("animate-pulse"); }} onError={(e) => { e.currentTarget.style.display = "none"; const ph = e.currentTarget.previousSibling as HTMLElement | null; ph?.classList.remove("animate-pulse"); }} style={{ opacity: 0 }} className="absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300" /></>
                    : <span className="absolute inset-0 flex items-center justify-center text-brand-ink-soft"><ImageOff size={22} /></span>}
                  <span className={`absolute left-2 top-2 z-[2] inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${p.status === "Repurposed" ? "bg-status-done-surface text-status-done" : "bg-status-new-surface text-status-new"}`}>{p.status || "New"}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3 text-[12px]">
                  <button type="button" onClick={() => setViewing(p)} aria-label={`Open details for ${p.title || "post"}`} className="flex flex-col gap-2.5 text-left">
                    <span className="text-[11px] text-brand-ink-soft">{p.postedDate ? new Date(p.postedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date"}</span>
                    <span className="line-clamp-2 text-sm font-bold leading-snug text-brand-ink">{p.title || "Untitled post"}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-brand-ink-mid"><PlatformIcon platform={p.platform} /><span className="truncate">{p.handle ? `@${p.handle.replace(/^@/, "")}` : "—"}</span></span>
                    <span className="min-w-0 text-[11px]"><span className="block text-brand-ink-soft">Topic</span><span className="block truncate font-medium text-brand-ink">{p.topic || "—"}</span></span>
                    <InspoStats p={p} />
                  </button>
                  <div className="mt-auto grid grid-cols-2 gap-2 border-t border-brand-line/60 pt-2.5">
                        <Button
                      className={`${action} w-full px-2.5`}
                      disabled={!!busyId}
                      onClick={() => {
                        setBrandId(brandList[0]?.id || "");
                        setRepurposeFormat(p.format); setFormatUnlocked(false);
                        setRepurposing(p);
                      }}
                    >
                      {busyId === p.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Wand2 size={14} />
                      )}
                      {busyId === p.id ? "Writing…" : "Repurpose"}
                    </Button>
                    <Button
                      variant="outline"
                      aria-label={`Discard ${p.title}`}
                      disabled={busyId === p.id}
                      onClick={() => setDeleting(p)}
                      className="brand-slim-action h-8 w-full gap-1.5 border-destructive/40 bg-brand-surface px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 size={14} />
                      Discard
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          )}
          </div>
        )}
      </div>

      {(() => {
        const v = viewingId && (allRows.find((r) => r.id === viewingId.id) || viewingId);
        const why = v ? splitWhyItWorks(v.whyItWorks || "") : { hook: "", framework: "" };
        return (
          <Dialog open={!!v} onOpenChange={(o) => !o && setViewing(null)}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto border-brand-line bg-social-feed text-brand-ink sm:max-w-2xl">
              {v && (<>
                <DialogTitle className="sr-only">{v.title || "Post details"}</DialogTitle>
                <DialogDescription className="sr-only">Post details and why it works</DialogDescription>
                <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
                  <button type="button" aria-label="Play preview" onClick={() => setPreviewing(v)} className="group relative aspect-[9/16] max-h-[420px] w-full cursor-pointer overflow-hidden rounded-lg bg-brand-line">
                    {v.thumbnail ? <img src={v.thumbnail} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-brand-ink-soft"><ImageOff size={22} /></span>}
                    <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface/90 text-brand-ink shadow-lg transition group-hover:scale-105"><Play size={20} className="ml-0.5 fill-current" /></span></span>
                  </button>
                  <div className="flex min-w-0 flex-col gap-2 text-sm">
                    <div className="text-lg font-bold leading-snug">{cell(v, "title", "Post title")}</div>
                    <div className="divide-y divide-brand-line rounded-lg bg-brand-line/60 text-[12px]">
                      <div className="px-3.5 py-3"><span className="mb-1 block text-[11px] text-brand-ink-soft">Stats</span><span className="[&_span]:text-sm [&_b]:text-lg"><InspoStats p={v} /></span></div>
                      <div className="px-3.5 py-2"><span className="block text-[10px] text-brand-ink-soft">Creator</span><span className="flex items-center gap-1.5"><PlatformIcon platform={v.platform} />{cell(v, "handle", "Creator handle", v.handle ? `@${v.handle.replace(/^@/, "")}` : "—")}</span></div>
                      <div className="px-3.5 py-2"><span className="block text-[10px] text-brand-ink-soft">Posted date</span>{cell(v, "postedDate", "Posted date", v.postedDate ? new Date(v.postedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—")}</div>
                      <div className="px-3.5 py-2"><span className="block text-[10px] text-brand-ink-soft">Topic</span>{cell(v, "topic", "Topic")}</div>
                      <div className="px-3.5 py-2"><span className="block text-[10px] text-brand-ink-soft">Format</span>{cell(v, "format", "Format")}</div>
                      <div className="px-3.5 py-2"><span className="block text-[10px] text-brand-ink-soft">Platform</span>{v.platform || "—"}</div>
                    </div>
                    {v.url && <a href={externalHref(v.url)} target="_blank" className="inline-flex items-center gap-1.5 text-xs text-brand-accent hover:underline"><ExternalLink size={13} />Open original post</a>}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <WhyBox label="Hook template" text={why.hook} />
                  <WhyBox label="Framework" text={why.framework} />
                </div>
                {!isMinedInspo(v) && <Button variant="outline" className="brand-slim-action h-8 w-fit border-brand-line bg-brand-surface text-xs" onClick={() => { setEditing({ post: v, key: "whyItWorks", value: v.whyItWorks }); setEditError(""); }}>Edit why it works</Button>}
                <div className="grid grid-cols-2 gap-2 border-t border-brand-line/60 pt-3">
                  <Button className={`${action} w-full`} disabled={!!busyId} onClick={() => { setViewing(null); setBrandId(brandList[0]?.id || ""); setRepurposeFormat(v.format); setFormatUnlocked(false); setRepurposing(v); }}><Wand2 size={14} />Repurpose</Button>
                  <Button variant="outline" disabled={busyId === v.id} onClick={() => { setViewing(null); setDeleting(v); }} className="brand-slim-action h-8 w-full gap-1.5 border-destructive/40 bg-brand-surface text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} />Discard</Button>
                </div>
              </>)}
            </DialogContent>
          </Dialog>
        );
      })()}

      <Dialog open={adding} onOpenChange={(o) => !saving && setAdding(o)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-brand-line bg-social-feed text-brand-ink sm:max-w-lg">
          <DialogTitle>Add inspo</DialogTitle>
          <DialogDescription className="text-brand-ink-soft">
            Save a post that worked so you can repurpose it later.
          </DialogDescription>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              Post URL
              <Input
                aria-label="Post URL"
                className={field}
                placeholder="https://"
                value={form.url}
                onBlur={() => void lookup(form.url.trim())}
                onChange={(e) => {
                  const url = e.target.value;
                  currentUrl.current = url.trim();
                  setLookupBusy(false);
                  setLookupNote("");
                  setRead(false);
                  setSteps({});
                  if (
                    /^https?:\/\/\S+\.\S+\/\S+/.test(url.trim()) &&
                    e.nativeEvent instanceof InputEvent &&
                    e.nativeEvent.inputType === "insertFromPaste"
                  )
                    setTimeout(() => void lookup(url.trim()), 0);
                  setForm((f) => ({
                    ...EMPTY,
                    title: f.title,
                    url,
                    platform: detectInspoPlatform(url),
                  }));
                }}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              Platform
              <select
                aria-label="Platform"
                className={select}
                value={form.platform}
                onChange={set("platform")}
              >
                <option value="">Select platform</option>
                {INSPO_PLATFORMS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            {(lookupBusy || Object.keys(steps).length > 0) && (
              <ol
                role="status"
                className="grid gap-1 rounded-md bg-brand-surface p-3 text-xs text-brand-ink-soft"
              >
                {[
                  ["basics", "Reading post"],
                  [
                    "content",
                    steps.content && !["done", "error", "start"].includes(steps.content)
                      ? steps.content
                      : "Transcribing / reading slides",
                  ],
                  ["analysis", "Analyzing what works"],
                ].map(([k, label]) => (
                  <li key={k} className="flex items-center gap-2">
                    {steps[k] === "done" ? (
                      <span className="text-brand-accent">✓</span>
                    ) : steps[k] === "error" ? (
                      <span className="text-red-600">!</span>
                    ) : steps[k] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <span className="opacity-40">•</span>
                    )}
                    {label}
                  </li>
                ))}
              </ol>
            )}
            {lookupNote && (
              <p role="status" className="text-xs text-brand-ink-soft">
                {lookupNote}
              </p>
            )}
            {read && (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-xs font-medium">
                    Creator handle
                    <Input
                      aria-label="Creator handle"
                      className={field}
                      value={form.handle}
                      onChange={set("handle")}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Posted date
                    <Input
                      type="date"
                      aria-label="Posted date"
                      className={field}
                      value={form.postedDate}
                      onChange={set("postedDate")}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Format
                    <select
                      aria-label="Format"
                      className={select}
                      value={form.format}
                      onChange={set("format")}
                    >
                      <option value="">Select format</option>
                      {INSPO_FORMATS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Topic
                    <Input
                      aria-label="Topic"
                      className={field}
                      value={form.topic}
                      onChange={set("topic")}
                    />
                  </label>
                </div>
                <label className="grid gap-1.5 text-xs font-medium">
                  Why it works
                  <textarea
                    aria-label="Why it works"
                    rows={6}
                    className={`${field} h-auto py-2`}
                    value={form.whyItWorks}
                    onChange={set("whyItWorks")}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium">
                  Transcript / post copy
                  <textarea
                    aria-label="Post copy"
                    rows={4}
                    className={`${field} h-auto py-2`}
                    value={form.copy}
                    onChange={set("copy")}
                  />
                </label>
              </div>
            )}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button className={`${action} h-10`} disabled={saving || lookupBusy} onClick={save}>
              {saving && <Loader2 size={14} className="animate-spin" />}Save inspo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-md border-brand-line bg-brand-surface text-brand-ink">
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription className="text-brand-ink-soft">{previewing?.title || ""}</DialogDescription>
          {previewing && (inspoEmbedUrl(previewing.url)
            ? <iframe src={inspoEmbedUrl(previewing.url)} title="Post preview" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="mx-auto h-[70vh] w-full rounded-lg border-0 bg-brand-line" />
            : previewing.thumbnail ? <img src={previewing.thumbnail} alt="" referrerPolicy="no-referrer" className="mx-auto max-h-[70vh] rounded-lg object-contain" />
            : <p className="py-6 text-center text-[12px] text-brand-ink-soft">No preview available for this post.</p>)}
          {previewing?.url && <a href={previewing.url} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-brand-accent">Open original post</a>}
        </DialogContent>
      </Dialog>
      <Dialog open={!!repurposing} onOpenChange={(o) => { if (!o && !busyId) { setRepurposing(null); setAngleStep(false); setRepurposeError(""); } }}>
        <DialogContent className="border-brand-line bg-social-feed text-brand-ink sm:max-w-md">
          <DialogTitle>Repurpose for your brand</DialogTitle>
          <DialogDescription className="truncate">A new script on this post's hook and beats, in your voice.</DialogDescription>
          {angleStep && repurposing ? (
            <RepurposeAnglePicker accessCode={accessCode} busy={!!busyId} error={repurposeError} request={{ source: "viral", id: repurposing.id, brandId: brandId || undefined, format: repurposeFormat }} onBack={() => { setRepurposeError(""); setAngleStep(false); }} onConfirm={(a) => void repurpose(repurposing, a)} />
          ) : (<>
          {brandList.length > 1 && (
            <select
              aria-label="Brand"
              className={select}
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              {brandList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {repurposing?.format && !formatUnlocked ? (
            <p className="flex items-center justify-between gap-2 rounded-md border border-brand-line bg-brand-surface px-3 py-2 text-xs">
              <span><span className="text-brand-ink-soft">Format: </span><span className="font-semibold text-brand-ink">{repurposeFormat} — same as original</span></span>
              <button type="button" onClick={() => setFormatUnlocked(true)} className="text-[11px] font-medium text-brand-accent hover:underline">Wrong format? Change</button>
            </p>
          ) : (
            <label className="grid gap-1.5 text-xs">
              Format
              <select
                aria-label="Repurpose format"
                className={select}
                value={repurposeFormat}
                onChange={(e) => setRepurposeFormat(e.target.value)}
              >
                <option value="">Select format</option>
                {INSPO_FORMATS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          )}
          {repurposing?.format && formatUnlocked && repurposeFormat !== repurposing.format && <p className="text-[11px] text-brand-ink-soft">The script will follow {repurposeFormat} guidelines instead of the original's structure.</p>}
          <Button
            className={`${action} h-10`}
            disabled={!repurposeFormat || !!busyId}
            onClick={() => setAngleStep(true)}
          >
            <Wand2 size={14} />
            Next: pick angle
          </Button>
          </>)}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && !editSaving && setEditing(null)}>
        <DialogContent className="border-brand-line bg-social-feed text-brand-ink sm:max-w-md">
          <DialogTitle>Edit post detail</DialogTitle>
          <DialogDescription className="text-brand-ink-soft">
            {editing?.post.title}
          </DialogDescription>
          {editing &&
            (["platform", "format"].includes(editing.key) ? (
              <select
                aria-label="Post detail"
                className={select}
                value={editing.value}
                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              >
                <option value="">Select</option>
                {(editing.key === "platform" ? INSPO_PLATFORMS : INSPO_FORMATS).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            ) : ["whyItWorks", "copy"].includes(editing.key) ? (
              <Textarea
                aria-label="Post detail"
                className={`${field} min-h-40`}
                value={editing.value}
                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              />
            ) : (
              <Input
                aria-label="Post detail"
                type={editing.key === "postedDate" ? "date" : "text"}
                className={field}
                value={editing.value}
                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              />
            ))}
          {editing && (
            <Button
              variant="link"
              className="justify-start px-0 text-brand-accent"
              onClick={() =>
                setEditing({ post: editing.post, key: "copy", value: editing.post.copy })
              }
            >
              Edit post copy
            </Button>
          )}
          {editError && (
            <p role="alert" className="text-sm text-destructive">
              {editError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-brand-line bg-brand-surface text-brand-ink"
              disabled={editSaving}
              onClick={() => setEditing(null)}
            >
              <X size={14} />
              Cancel
            </Button>
            <Button className={action} disabled={editSaving} onClick={() => void saveEdit()}>
              {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={finding} onOpenChange={(o) => !findBusy && setFinding(o)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-brand-line bg-social-feed text-brand-ink sm:max-w-md">
          <DialogTitle>Find Inspo</DialogTitle>
          <DialogDescription className="text-brand-ink-soft">
            {findStage === "complete" ? "Your search is complete." : "TikTok · Last 180 days"}
          </DialogDescription>
          {findStage !== "setup" ? (
            <div className="space-y-5">
              {findStage === "complete" ? (
                <div role="status" className="space-y-2 py-2 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-done-surface text-status-done"><Check size={24} /></span>
                  <h3 className="text-lg font-semibold text-brand-ink">{findProgress.added ? `${findProgress.added} new posts added` : "No new posts added"}</h3>
                  <p className="text-sm text-brand-ink-soft">{findProgress.added ? "Saved to your viral posts." : findProgress.duplicates ? "The qualifying posts are already in your bank." : "No new posts could be saved. Try different search strings."}</p>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-brand-ink-soft">
                    <span>{findProgress.duplicates} duplicates skipped</span>
                    {(findProgress.skipped + findProgress.failed) > 0 && <span>{findProgress.skipped} posts skipped · {findProgress.failed} searches failed</span>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2" aria-live="polite">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words font-medium text-brand-ink">{findStage === "error" ? "Search interrupted" : findNote}</span>
                    {findBusy && <Loader2 size={16} className="shrink-0 animate-spin text-brand-accent" />}
                  </div>
                  <Progress className="bg-brand-accent/15 [&>div]:bg-brand-accent" aria-label="Find Inspo progress" value={findStage === "search" ? 40 * findProgress.searched / Math.max(1, findProgress.searches) : findStage === "checking" ? 45 : 50 + 50 * findProgress.done / Math.max(1, findProgress.total)} />
                  <p className="text-xs text-brand-ink-soft">{findProgress.added} saved · {findProgress.duplicates} duplicates skipped</p>
                </div>
              )}
              <ol className="space-y-3">
                {[
                  { label: "Search TikTok", detail: `${findProgress.searched} / ${findProgress.searches} search strings`, done: findProgress.searched === findProgress.searches, active: findStage === "search" },
                  { label: "Check for duplicates", detail: findStage === "read" || findStage === "complete" ? `${findProgress.duplicates} duplicates skipped` : "Compare with your bank", done: findStage === "read" || findStage === "complete", active: findStage === "checking" },
                  { label: "Read & save new posts", detail: `${findProgress.done} / ${findProgress.total} posts`, done: findStage === "complete", active: findStage === "read" },
                ].map((step, i) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${step.done ? "bg-status-done-surface text-status-done" : step.active ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-line text-brand-ink-soft"}`}>
                      {step.done ? <Check size={14} /> : step.active ? <Loader2 size={14} className="animate-spin" /> : i + 1}
                    </span>
                    <span className="min-w-0"><span className="block text-sm font-medium text-brand-ink">{step.label}</span><span className="block text-xs text-brand-ink-soft">{step.detail}</span></span>
                  </li>
                ))}
              </ol>
              {findWarnings.length > 0 && <details className="text-xs text-brand-ink-soft"><summary className="cursor-pointer">{findWarnings.length} skipped or unsuccessful items</summary><ul className="mt-2 space-y-2 break-words">{findWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
              {findError && <p role="alert" className="text-sm text-destructive">{findError}</p>}
              {!findBusy && <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" className="h-9 border-brand-line bg-brand-surface text-brand-ink" onClick={() => { setFindStage("setup"); setFindError(""); setFindNote(""); }}>New search</Button>
                <Button className={`${action} h-9`} onClick={() => setFinding(false)}>{findStage === "complete" ? "View bank" : "Close"}</Button>
              </div>}
            </div>
          ) : !findMode ? (
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="h-auto justify-start whitespace-normal border-brand-line bg-brand-surface px-4 py-3 text-left text-sm text-brand-ink hover:bg-brand-wash"
                onClick={() => setFindMode("own")}
              >
                I have my own search terms
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start whitespace-normal border-brand-line bg-brand-surface px-4 py-3 text-left text-sm text-brand-ink hover:bg-brand-wash"
                onClick={() => {
                  setFindMode("auto");
                  setTerms([]);
                }}
              >
                Generate them for me
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {findMode === "auto" && (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium text-brand-ink-mid"
                      htmlFor="inspo-find-brand"
                    >
                      Brand to write search strings for
                    </label>
                    <select
                      id="inspo-find-brand"
                      className={select}
                      value={findBrand}
                      onChange={(e) => setFindBrand(e.target.value)}
                      disabled={findBusy}
                    >
                      {brandList.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!terms.length && (
                    <Button
                      className={`${action} h-10 w-full`}
                      disabled={findBusy}
                      onClick={() => void generateTerms()}
                    >
                      {findBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Wand2 size={14} />
                      )}
                      Generate search strings
                    </Button>
                  )}
                </div>
              )}
              {(findMode === "own" || terms.length > 0) && (
                <div className="space-y-2">
                  <p className="text-xs text-brand-ink-soft">Up to 5 terms, 5 words max each.</p>
                  {terms.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className={field}
                        value={t}
                        disabled={findBusy}
                        placeholder="e.g. side hustle"
                        onChange={(e) =>
                          setTerms((old) => old.map((x, j) => (j === i ? e.target.value : x)))
                        }
                      />
                      {terms.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove term"
                          disabled={findBusy}
                          onClick={() => setTerms((old) => old.filter((_, j) => j !== i))}
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {terms.length < 5 && (
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-xs text-brand-accent"
                      disabled={findBusy}
                      onClick={() => setTerms((old) => [...old, ""])}
                    >
                      <Plus size={14} /> Add term
                    </Button>
                  )}
                </div>
              )}
              {findNote && (
                <p className="flex items-center gap-2 text-sm text-brand-ink-mid">
                  {findBusy && <Loader2 size={14} className="animate-spin" />}
                  {findNote}
                </p>
              )}
              {findError && (
                <p role="alert" className="text-sm text-destructive">
                  {findError}
                </p>
              )}
              {!(findMode === "auto" && !terms.length) && (
                <div className="flex justify-end gap-2">
                  {findMode === "auto" ? (
                    <Button
                      variant="outline"
                      className="brand-slim-action h-8 border-brand-line bg-brand-surface text-xs text-brand-ink"
                      disabled={findBusy}
                      onClick={() => {
                        setTerms([]);
                        void generateTerms();
                      }}
                    >
                      <Wand2 size={14} /> Regenerate search strings
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="brand-slim-action h-8 border-brand-line bg-brand-surface text-xs text-brand-ink"
                      disabled={findBusy}
                      onClick={() => setFinding(false)}
                    >
                      Close
                    </Button>
                  )}
                  <Button
                    className={action}
                    disabled={findBusy || !terms.some((t) => t.trim())}
                    onClick={() => void runSearch()}
                  >
                    <Search size={14} /> Search TikTok
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="border-brand-line bg-social-feed text-brand-ink">
          <AlertDialogTitle>Delete this inspo?</AlertDialogTitle>
          <AlertDialogDescription className="text-brand-ink-soft">
            "{deleting?.title}" will be removed from your bank.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
