import { useEffect, useState, type ReactNode } from "react";
import {
  PenLine,
  Target,
  History,
  Loader2,
  ArrowLeft,
  FileText,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { historyAction } from "@/lib/slate/variationFlow";
import { sessionBrandName, type ScriptBrand } from "@/lib/slate/scriptBrands";

export type RailView = { kind: "writer" } | { kind: "strategy" } | { kind: "session"; id: string };

export type SessionSummary = {
  id: string;
  title: string;
  type?: "Single" | "Batch";
  format?: string;
  status: "In progress" | "Done";
  contentIds: string[];
  brandIds?: string[];
  updatedAt?: string;
  scripts?: any[];
  transcript?: any[];
  topics?: any[];
  createdAt?: string;
};

export function useWriterSessions(accessCode: string, refreshKey = 0) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!accessCode) return;
    let alive = true;
    setLoading(true);
    fetch("/api/writer-sessions", { headers: { "x-access-code": accessCode } })
      .then((r) => r.json())
      .then((d) => alive && setSessions(Array.isArray(d.sessions) ? d.sessions : []))
      .catch(() => alive && setSessions([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [accessCode, refreshKey]);
  return { sessions, loading };
}

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

export function sessionDisplay(session: SessionSummary, brands: ScriptBrand[] = []) {
  const format = session.format || "Script";
  const date = fmtDate(session.createdAt || session.updatedAt);
  const first = session.topics?.[0];
  const topic = typeof first === "string" ? first : first?.title;
  const brand = brands.length ? sessionBrandName(session.brandIds, brands) : "";
  const base =
    session.title === "Repurpose"
      ? "Repurpose"
      : [format, date].filter(Boolean).join(" - ") || session.title;
  return {
    title: brand ? `${brand} · ${base}` : base,
    description: `${format} - ${topic || "Choosing topics"}`,
  };
}

function RailButton({
  active,
  icon,
  label,
  onClick,
  collapsed = false,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  collapsed?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`w-full min-w-0 gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] ${collapsed ? "justify-center" : "justify-start"} ${
        active
          ? "bg-brand-accent/10 font-semibold text-brand-accent"
          : "text-brand-ink/75 hover:bg-brand-ink/5"
      }`}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </Button>
  );
}

export function ScriptShell({
  view,
  onView,
  accessCode,
  refreshKey,
  activeSession,
  compactOnPhone = false,
  brands = [],
  onDeleted,
  children,
}: {
  onDeleted?: (id: string) => void;
  view: RailView;
  onView: (v: RailView) => void;
  accessCode: string;
  refreshKey?: number;
  activeSession?: SessionSummary | null;
  compactOnPhone?: boolean;
  brands?: ScriptBrand[];
  children: ReactNode;
}) {
  const { sessions, loading } = useWriterSessions(accessCode, refreshKey);
  const [collapsed, setCollapsed] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  async function removeSession(id: string) {
    if (deleting || !window.confirm("Delete this conversation? This can't be undone.")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/writer-sessions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-access-code": accessCode },
      });
      if (!r.ok && r.status !== 404) throw new Error("Couldn't delete this conversation. Please try again.");
      setDeletedIds((ids) => [...ids, id]);
      onDeleted?.(id);
    } catch (e: any) {
      window.alert(e?.message || "Couldn't delete this conversation.");
    } finally {
      setDeleting(null);
    }
  }
  useEffect(() => {
    if (!compactOnPhone) return;
    const media = window.matchMedia("(max-width: 639px)");
    if (media.matches) setCollapsed(true);
    const listener = (event: MediaQueryListEvent) => {
      if (event.matches) setCollapsed(true);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [compactOnPhone]);
  const visibleSessions = (activeSession
    ? [activeSession, ...sessions.filter((s) => s.id !== activeSession.id)]
    : sessions
  ).filter((s) => !deletedIds.includes(s.id));
  return (
    <div className="flex h-full min-h-0 w-full bg-social-feed">
      <aside
        className={`flex min-h-0 shrink-0 flex-col border-r border-brand-line bg-social-canvas p-2 ${collapsed ? "w-14" : "w-48 sm:w-64"}`}
      >
        <div
          className={`mb-6 flex items-center gap-2 pt-2 ${collapsed ? "justify-center" : "justify-between pl-3"}`}
        >
          {!collapsed && <h1 className="text-sm font-bold text-brand-ink">Scripting Hub</h1>}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
            className="text-brand-ink-soft hover:bg-brand-ink/5"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <RailButton
            collapsed={collapsed}
            active={view.kind === "writer"}
            icon={<PenLine className="h-4 w-4 shrink-0" />}
            label="My Scriptwriter"
            onClick={() => onView({ kind: "writer" })}
          />
          <RailButton
            collapsed={collapsed}
            active={view.kind === "strategy"}
            icon={<Target className="h-4 w-4 shrink-0" />}
            label="Strategy details"
            onClick={() => onView({ kind: "strategy" })}
          />
        </div>
        <div className="mt-7 min-h-0 flex-1 overflow-y-auto border-t border-brand-line pt-5">
          {collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="mx-auto flex text-brand-ink-soft hover:bg-brand-ink/5"
              aria-label="Expand History"
              title="History"
              onClick={() => setCollapsed(false)}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          {!collapsed && (
            <p className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-brand-ink/45">
              <History className="h-3.5 w-3.5" /> History
            </p>
          )}
          {!collapsed && loading && (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-brand-ink/40" />
          )}
          {!collapsed && !loading && visibleSessions.length === 0 && (
            <p className="px-3 text-[12px] text-brand-ink/45">No sessions yet.</p>
          )}
          {!collapsed && (
            <div className="space-y-2">
              {visibleSessions.map((s) => {
                const display = sessionDisplay(s, brands);
                return (
                  <div key={s.id} className="group relative">
                  <Button
                    variant="ghost"
                    onClick={() => onView({ kind: "session", id: s.id })}
                    aria-label={display.title}
                    className={`h-auto w-full min-w-0 rounded-md py-2 pl-2 pr-8 text-left text-[12.5px] ${collapsed ? "justify-center" : "block"} ${
                      view.kind === "session" && view.id === s.id
                        ? "bg-brand-accent/10 text-brand-accent"
                        : "text-brand-ink/70 hover:bg-brand-ink/5"
                    }`}
                    title={display.title}
                  >
                    {collapsed ? (
                      <History className="h-4 w-4" />
                    ) : (
                      <>
                        <span className="block truncate">{display.title}</span>
                        <span className="block truncate text-[11px] text-brand-ink/40">
                          {display.description}
                        </span>
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    aria-label={`Delete ${display.title}`}
                    title="Delete conversation"
                    disabled={deleting === s.id}
                    onClick={() => void removeSession(s.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-brand-ink/35 opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100 disabled:opacity-50"
                  >
                    {deleting === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto" data-script-scroll>
        {children}
      </div>
    </div>
  );
}

export function ScriptBrandPicker({
  brands,
  loading,
  title,
  onPick,
  onBack,
}: {
  brands: ScriptBrand[];
  loading: boolean;
  title: string;
  onPick: (b: ScriptBrand) => void;
  onBack?: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col px-6 py-16">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 gap-1.5 self-start text-brand-ink-soft">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      )}
      <h2 className="text-center text-[22px] font-semibold text-brand-ink">{title}</h2>
      {loading ? (
        <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-brand-ink-soft" />
      ) : brands.length === 0 ? (
        <p className="mt-6 text-center text-sm text-brand-ink-soft">Add a brand in My Brand first.</p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {brands.map((b) => (
            <Button
              key={b.id}
              variant="outline"
              onClick={() => onPick(b)}
              className="h-14 justify-start border-brand-line bg-brand-surface text-[14px] font-semibold text-brand-ink hover:border-brand-accent hover:text-brand-accent"
            >
              {b.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModeQuestion({ onPick }: { onPick: (m: "single" | "batch") => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
      <h2 className="text-[22px] font-semibold text-[#1A1A1D]">
        Do you want to create a single script or a batch?
      </h2>
      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        <button
          onClick={() => onPick("single")}
          className="rounded-xl border border-brand-line bg-brand-surface p-5 text-left transition hover:border-brand-accent"
        >
          <FileText className="h-5 w-5 text-[#4F6BFF]" />
          <p className="mt-3 font-semibold text-[#1A1A1D]">Single script</p>
          <p className="mt-1 text-[12.5px] text-[#1A1A1D]/55">
            One script from your idea or an inspo video.
          </p>
        </button>
        <button
          onClick={() => onPick("batch")}
          className="rounded-xl border border-brand-line bg-brand-surface p-5 text-left transition hover:border-brand-accent"
        >
          <Layers className="h-5 w-5 text-[#4F6BFF]" />
          <p className="mt-3 font-semibold text-[#1A1A1D]">Batch</p>
          <p className="mt-1 text-[12.5px] text-[#1A1A1D]/55">
            Several scripts from your content pipeline.
          </p>
        </button>
      </div>
    </div>
  );
}

function scriptText(s: any): string {
  if (!s) return "";
  if (s.kind === "carousel" && Array.isArray(s.slides))
    return s.slides
      .map((sl: any) => [sl.headline, sl.body].filter(Boolean).join("\n"))
      .join("\n\n");
  return String(s.script || "");
}

export function SessionView({
  id,
  accessCode,
  onBack,
  renderTranscript,
  onRepurpose,
  liveSession,
  liveTranscript,
  onContinue,
  brands = [],
}: {
  id: string;
  accessCode: string;
  onBack: () => void;
  renderTranscript: (messages: any[]) => ReactNode;
  onRepurpose: (session: SessionSummary) => Promise<void>;
  liveSession?: SessionSummary | null;
  liveTranscript?: any[];
  onContinue: () => void;
  brands?: ScriptBrand[];
}) {
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [error, setError] = useState("");
  const [repurposing, setRepurposing] = useState(false);
  useEffect(() => {
    setSession(null);
    setError("");
    const controller = new AbortController();
    fetch(`/api/writer-sessions?id=${encodeURIComponent(id)}`, {
      headers: { "x-access-code": accessCode },
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Could not open this session");
        setSession(d.session);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e.message || e));
      });
    return () => controller.abort();
  }, [id, accessCode]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 text-brand-ink">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-5 gap-1.5 text-brand-ink-soft"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to my scriptwriter
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!liveSession && !session && !error && (
        <Loader2 className="h-5 w-5 animate-spin text-brand-ink-soft" />
      )}
      {(liveSession || session) &&
        (() => {
          const shown = liveSession || session;
          if (!shown) return null;
          const action = historyAction(shown.status, !!shown.scripts?.length);
          const transcript = liveTranscript || shown.transcript;
          return (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{sessionDisplay(shown, brands).title}</h2>
                  <p className="mt-1 text-sm text-brand-ink-soft">
                    {sessionDisplay(shown, brands).description}
                  </p>
                </div>
                {action !== "none" && (
                  <Button
                    disabled={repurposing}
                    onClick={async () => {
                      if (action === "continue") {
                        onContinue();
                        return;
                      }
                      setRepurposing(true);
                      try {
                        await onRepurpose(shown);
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Could not re-purpose this session",
                        );
                      } finally {
                        setRepurposing(false);
                      }
                    }}
                    className="gap-2 bg-brand-accent text-brand-surface hover:bg-brand-accent/90"
                  >
                    {action === "continue" ? (
                      <PenLine className="h-4 w-4" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )}
                    {action === "continue" ? "Continue session" : "Re-purpose"}
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-brand-ink-soft">
                {[shown.type, shown.format, shown.status, `${shown.contentIds.length} in planner`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-8 space-y-6" data-saved-transcript>
                {transcript?.length ? (
                  renderTranscript(transcript)
                ) : (
                  <>
                    <p className="text-sm text-brand-ink-soft">
                      This older session has no saved conversation.
                    </p>
                    {(shown.scripts || []).map((s: any, i: number) => (
                      <div key={i} className="rounded-lg border border-brand-line p-4">
                        <p className="text-sm font-semibold text-brand-accent">
                          {s?.topic || `Script ${i + 1}`}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                          {scriptText(s)}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          );
        })()}
    </div>
  );
}
