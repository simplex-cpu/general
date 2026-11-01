import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { Loader2, Check, Upload, FileText, X, Download } from "lucide-react";
import { siInstagram, siTiktok } from "simple-icons";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  parseCSV, fmt, summarize, STEPS, PLATFORM_NOTES,
  type ParsedFile, type Credits, type Report,
} from "@/lib/slate/analyseHelpers";


const ACCESS_KEY = "simplex_access";

function getAccessCode(): string {
  try {
    const raw = sessionStorage.getItem(ACCESS_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.code || "";
  } catch {
    return "";
  }
}

type Summary = ReturnType<typeof summarize>;

/** Set by AnalyzeMode so module-level helpers can surface a small toast. */
let notifyToast: ((msg: string) => void) | null = null;

/**
 * Open normally outside the embedded builder. The builder cannot create an
 * unrestricted Instagram tab, so copy the URL there instead of redirecting to
 * a page that will ultimately be blocked by Instagram.
 */
function openExternal(e: React.MouseEvent, url: string) {
  if (!url) return;
  e.preventDefault();
  e.stopPropagation();
  if (window.top !== window.self) {
    void navigator.clipboard.writeText(url).then(
      () => notifyToast?.("Post link copied. Paste it into a new browser tab."),
      () => notifyToast?.(url),
    );
    return;
  }
  let opened: Window | null = null;
  try {
    opened = window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    opened = null;
  }
  if (opened) return;
  // Popup blocked entirely: hand the user the URL.
  try {
    void navigator.clipboard.writeText(url);
    notifyToast?.("Link copied. Paste it into a new browser tab to open the post.");
  } catch {
    notifyToast?.(url);
  }
}




/**
 * Render an advice string that may contain markdown links [text](url) and/or
 * bare URLs. Returns JSX with anchor tags so post references in the AI's
 * insights become clickable links instead of bare "Post 19" text.
 */
function renderAdvice(text: string): ReactNode {
  if (!text) return null;
  const parts: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    const label = m[1];
    const url = m[2] || m[3];
    parts.push(
      <a
        key={`lk-${key++}`}
        href={url}
        onClick={e => openExternal(e, url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#2530CC] hover:text-[#4F6BFF] hover:underline underline-offset-2 font-medium"
      >

        {label || url}
      </a>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

type PastAudit = {
  id: string;
  profile: string;
  platform: string;
  postsAnalysed: number;
  createdAt: string | null;
  linked?: boolean;
};

/** Strip @ and stray spacing so stored handles stay tidy. */
function cleanedHandle(raw: string) {
  return String(raw || "").trim().replace(/^@+/, "");
}

function auditDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PastAudits({
  audits,
  loading,
  openingId,
  onOpen,
  onLink,
}: {
  audits: PastAudit[];
  loading: boolean;
  openingId: string;
  onOpen: (id: string) => void;
  onLink: (id: string) => void;
}) {
  return (
    <div className="mt-10">
      <p
        className="text-[11px] uppercase tracking-[.14em] text-[#5A5860]"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
      >
        Past audits
      </p>

      {loading && audits.length === 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#9B9BA1]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading your audits…
        </p>
      ) : audits.length === 0 ? (
        <p className="mt-3 text-[13px] text-[#9B9BA1]">No audits yet. Run your first one above.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#E5E5E8] bg-white">
          <table className="w-full text-left">
            <thead className="bg-[#F4F4F6]">
              <tr className="text-[11px] uppercase tracking-[.08em] text-[#5A5860]">
                <th className="px-4 py-2.5 font-semibold">Account</th>
                <th className="px-4 py-2.5 font-semibold">Platform</th>
                <th className="px-4 py-2.5 font-semibold">Posts</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => {
                const busy = openingId === a.id;
                return (
                  <tr
                    key={a.id}
                    className={`border-t border-[#EDEDF0] text-[13px] text-[#2A2A2E] ${
                      a.linked ? "bg-[#F6F8FF]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1A1D]">
                      {a.profile ? `@${a.profile}` : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#5A5860]">{a.platform || "—"}</td>
                    <td className="px-4 py-3 text-[#5A5860]">{a.postsAnalysed || "—"}</td>
                    <td className="px-4 py-3 text-[#5A5860]">{auditDate(a.createdAt) || "—"}</td>
                    <td className="px-4 py-3">
                      {a.linked ? (
                        <span className="inline-flex whitespace-nowrap items-center rounded-full border border-brand-accent/25 bg-brand-surface px-2.5 py-1 text-[11px] text-brand-accent">
                          Used
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#9B9BA1]">Saved</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-nowrap items-center justify-end gap-3">
                        <Button variant="outline" size="sm"
                          type="button"
                          disabled={busy}
                          onClick={() => onOpen(a.id)}
                          className="shrink-0 whitespace-nowrap border-brand-line bg-brand-surface text-brand-ink shadow-none hover:bg-brand-surface hover:border-brand-accent hover:text-brand-accent"
                        >
                          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}View
                        </Button>
                        {!a.linked && (
                          <Button size="sm"
                            type="button"
                            disabled={busy}
                            onClick={() => onLink(a.id)}
                            className="shrink-0 whitespace-nowrap bg-brand-accent text-brand-surface hover:bg-brand-accent/90"
                          >
                            Use
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Props = {
  onSendToScripts?: (report: Report, summary: Summary | null) => void;
  onCreditsChange?: () => void;
};

export function AnalyzeMode({ onSendToScripts, onCreditsChange }: Props) {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [platform, setPlatform] = useState("instagram");
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<"handle" | "csv">("handle");
  const [handle, setHandle] = useState("");
  const [fetchPhase, setFetchPhase] = useState<{ phase: string; done: number; total: number } | null>(null);
  /** Usernames from the brand's connected socials, keyed by platform. */
  const [connected, setConnected] = useState<Record<string, string>>({});
  const [connectedLoaded, setConnectedLoaded] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState<{ broll: number; talking: number; graphic: number; carousel: number } | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refinedStrategy, setRefinedStrategy] = useState<string | null>(null);
  const [refinedPlatform, setRefinedPlatform] = useState("instagram");
  const [showRefinedModal, setShowRefinedModal] = useState(false);
  // Audit scope: either a date range OR a post count — never both.
  const [scopeMode, setScopeMode] = useState<"days" | "posts">("days");
  const [windowDays, setWindowDays] = useState(21);
  const [maxPosts, setMaxPosts] = useState(44);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [audits, setAudits] = useState<PastAudit[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [openingAuditId, setOpeningAuditId] = useState<string>("");
  /** A stored audit opened for reading, shown in a modal over the Analyze tab. */
  const [viewAudit, setViewAudit] = useState<{
    report: Report;
    summary: Summary | null;
    platform: string;
    profile: string;
    createdAt: string | null;
  } | null>(null);
  /** The audit just linked to the strategy, handed to scripting once approved. */
  const [pendingLinked, setPendingLinked] = useState<{ report: Report; summary: Summary | null } | null>(null);

  

  const loadAudits = useCallback(async () => {
    const code = getAccessCode();
    if (!code) return;
    setAuditsLoading(true);
    try {
      const res = await fetch("/api/analysis-report?list=1", { headers: { "x-access-code": code } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.audits)) setAudits(data.audits as PastAudit[]);
    } catch {
      // A missing history is not an error worth surfacing.
    } finally {
      setAuditsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  /** Open a stored audit for reading in a modal over the Analyze tab. */
  const openAudit = async (id: string) => {
    const code = getAccessCode();
    if (!code) return;
    setOpeningAuditId(id);
    try {
      const res = await fetch(`/api/analysis-report?id=${encodeURIComponent(id)}`, {
        headers: { "x-access-code": code },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.report) throw new Error("Could not open that audit.");
      setViewAudit({
        report: data.report as Report,
        summary: (data.summary || null) as Summary | null,
        platform: String(data.platform || platform).toLowerCase(),
        profile: String(data.profile || ""),
        createdAt: data.createdAt || null,
      });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not open that audit.");
    } finally {
      setOpeningAuditId("");
    }
  };

  /** Seconds since the analysis started, used to keep the progress bar honest. */
  const [elapsed, setElapsed] = useState(0);
  const [auditElapsed, setAuditElapsed] = useState(0);

  useEffect(() => {
    if (!loading || !fetchPhase) {
      setAuditElapsed(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => setAuditElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [loading, fetchPhase?.phase]);

  useEffect(() => {
    notifyToast = (msg: string) => {
      setToast(msg);
      window.setTimeout(() => setToast(null), 4000);
    };
    return () => { notifyToast = null; };
  }, []);


  const accessCode = getAccessCode();

  useEffect(() => {
    if (!accessCode) return;
    fetch(`/api/analyse`, { headers: { "x-access-code": accessCode } })
      .then(r => r.json())
      .then(d => { if (d.credits) setCredits(d.credits); })
      .catch(() => {});
  }, [accessCode]);

  useEffect(() => {
    if (!accessCode) return;
    fetch(`/api/my-brief`, { headers: { "x-access-code": accessCode } })
      .then(r => r.json())
      .then(d => {
        const s = d?.brief?.socials || {};
        setConnected({
          instagram: String(s.Instagram?.user || "").replace(/^@/, "").trim(),
          tiktok: String(s.Tiktok?.user || "").replace(/^@/, "").trim(),
        });
      })
      .catch(() => {})
      .finally(() => setConnectedLoaded(true));
  }, [accessCode]);

  // Keep the selected username in sync with the platform the user picked.
  useEffect(() => {
    setHandle(connected[platform] || "");
  }, [platform, connected]);


  const handleFiles = useCallback(async (incoming: FileList | null) => {
    if (!incoming) return;
    const csvFiles = Array.from(incoming).filter(f => f.name.endsWith(".csv"));
    if (!csvFiles.length) return;
    const parsed = await Promise.all(csvFiles.map(async f => ({ name: f.name, rows: parseCSV(await f.text()) })));
    setFiles(prev => {
      const combined = [...prev, ...parsed].slice(0, 4);
      const allRows = combined.flatMap(f => f.rows);
      const total = allRows.length;
      if (total > 40) {
        setError(`Risevoice analyzes up to 40 posts per report. Your CSV has ${total} — please trim it and try again.`);
        return prev;
      }
      setError(null);
      // Analyze is Instagram-only; CSV rows are treated as Instagram Reels.
      return combined;
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const totalRows = files.reduce((s, f) => s + f.rows.length, 0);
  const reset = () => {
    setFiles([]); setReport(null); setError(null); setStepIdx(-1); setProgress(0); setSummary(null);
    setFetchPhase(null); setRefined(null); setRefineError(null); setRefinedStrategy(null); setShowRefinedModal(false);
    setHandle(""); setSource("handle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const noCredits = !!credits && credits.left <= 0;

  const canGenerate = source === "handle" ? handle.trim().length > 1 : totalRows >= 5;

  /** Scrape the chosen window of posts for a handle and transcribe them, returning CSV-shaped rows. */
  const fetchRowsFromHandle = async (): Promise<Record<string, string>[]> => {
    setFetchPhase({ phase: "Finding the profile", done: 0, total: maxPosts });
    const startRes = await fetch("/api/scrape-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: handle.trim(), platform, accessCode, scopeMode, windowDays, maxPosts }),
    });
    const start = await startRes.json();
    if (!startRes.ok) throw new Error(start?.error || "Could not start the scraper.");

    const deadline = Date.now() + 1000 * 60 * 10;
    while (Date.now() < deadline) {
      const pollRes = await fetch(
        `/api/scrape-posts?jobId=${encodeURIComponent(start.jobId)}&accessCode=${encodeURIComponent(accessCode)}&scopeMode=${scopeMode}&windowDays=${windowDays}&maxPosts=${maxPosts}`,
      );
      const poll = await pollRes.json();
      if (!pollRes.ok) throw new Error(poll?.error || "Scrape failed.");
      if (poll.status === "error") throw new Error(poll.error || "Scrape failed.");
      setFetchPhase({ phase: poll.phase || "Working", done: poll.done || 0, total: poll.total || maxPosts });
      if (poll.status === "ready") {
        setFetchPhase(null);
        return (poll.rows || []) as Record<string, string>[];
      }
      await new Promise(r => setTimeout(r, 2500));
    }
    throw new Error("Collecting the posts took too long. Please try again.");
  };

  const generate = async () => {
    setError(null); setLoading(true); setStepIdx(0); setProgress(0); setReport(null);
    try {
      const allRows = source === "handle" ? await fetchRowsFromHandle() : files.flatMap(f => f.rows);
      if (!allRows.length) throw new Error("No posts to analyze.");
      const data = summarize(allRows, platform);
      setSummary(data);


      setElapsed(0);
      const startedAt = Date.now();
      const elapsedInterval = setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAt) / 1000));
      }, 1000);

      let currentStep = 0;
      const stepInterval = setInterval(() => {
        if (currentStep < STEPS.length - 2) {
          currentStep++;
          setStepIdx(currentStep);
          setProgress(Math.round((currentStep / (STEPS.length - 1)) * 82));
        }
      }, 1500);
      // Keeps creeping (slowly) all the way to 99 so the bar never looks frozen
      // while the model is writing the report.
      const creepInterval = setInterval(() => {
        setProgress(p => (p < 99 ? p + Math.max(0.08, (99 - p) * 0.02) : p));
      }, 700);


      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, accessCode, postUrls: data.postUrls }),
      });
      clearInterval(stepInterval);
      clearInterval(creepInterval);
      clearInterval(elapsedInterval);

      const raw = await res.text();
      let result: any = null;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        // Non-JSON response (e.g. 504 "upstream request timeout" from the edge proxy)
        const snippet = raw.slice(0, 200).trim();
        if (res.status === 504 || /timeout/i.test(snippet)) {
          throw new Error("The analysis took too long and timed out. Try again with fewer posts or retry in a moment.");
        }
        throw new Error(`Server error ${res.status}${snippet ? ` — ${snippet}` : ""}`);
      }
      if (!res.ok) {
        if (result?.error === "no_credits") {
          if (result.credits) setCredits(result.credits);
          setError(result.message || "No reports remaining this month.");
          return;
        }
        console.error("[analyse] server error", result);
        const extra = result?.stopReason ? ` (stop: ${result.stopReason})` : "";
        const detail = result?.detail ? ` — ${String(result.detail).slice(0, 160)}` : "";
        throw new Error((result?.error || `Server error ${res.status}`) + extra + detail);
      }
      if (result.credits) setCredits(result.credits);
      onCreditsChange?.();
      setStepIdx(STEPS.length - 1);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setReport(result.report);

      // Persist the audit findings so they survive refresh.
      try {
        fetch("/api/analysis-report", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({
            report: result.report,
            summary: data,
            profile: source === "handle" ? cleanedHandle(handle) : data?.profileName || "",
            platform,
            postsAnalysed: data?.total,
          }),
        })
          .then(() => loadAudits())
          .catch(() => {});
      } catch {
        // Never block the UI if persistence fails.
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setFetchPhase(null);

    }
  };

  const buildMarkdown = (
    reportIn: Report | null = report,
    summaryIn: Summary | null = summary,
    platformIn: string = platform,
  ): string => {
    const report = reportIn;
    const summary = summaryIn;
    const platform = platformIn;
    if (!report || !summary) return "";

    const platformLabel = platform === "tiktok" ? "TikTok" : "Instagram";
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const lines: string[] = [];
    lines.push(`# Content Report — @${summary.profileName || platformLabel} — ${platformLabel}`);
    lines.push(`Generated: ${date}`);
    lines.push(`Total posts analyzed: ${summary.total}`);
    lines.push("");
    lines.push("## Overview");
    lines.push(`- Average views per post: ${report.scorecard.avgViewsPerPost}`);
    lines.push(`- Best single post: ${report.scorecard.topPostViews} views`);
    lines.push(`- Strongest topic: ${report.scorecard.topPerformingTopic}`);
    lines.push(`- Best content style: ${report.scorecard.bestContentCategory}`);
    lines.push("");
    lines.push("## Which type of video performs better");
    const winner = report.formatComparison.winner === "Talking video" ? "Talking video" : "B-roll";
    lines.push(`**${winner} is winning.** ${report.formatComparison.winnerReason}`);
    lines.push("");
    lines.push("## Top performing posts");
    report.topPosts.forEach(p => {
      lines.push(`- [${p.format}] ${p.views} · ${p.reactions} — ${p.description}`);
    });
    lines.push("");
    if (report.bottomPosts && report.bottomPosts.length > 0) {
      lines.push("## Bottom performing posts");
      report.bottomPosts.forEach(p => {
        lines.push(`- [${p.format}] ${p.views} · ${p.reactions} — ${p.description}`);
      });
      lines.push("");
    }
    lines.push("## Opening lines that stop people scrolling");
    report.openingLines.forEach((h, i) => {
      lines.push(`${i + 1}. **${h.pattern}** — "${h.example}" — ${h.result}`);
    });
    lines.push("");
    lines.push("## Topic Pillars");
    report.topicPillars.forEach(t => {
      lines.push(`- **${t.topicPillar}** — ${t.bestResult} — ${t.whyItConnects}`);
    });
    lines.push("");
    lines.push("## Phrases that connect");
    lines.push(report.languagePatterns.phrases.map(p => `"${p}"`).join(", "));
    lines.push(report.languagePatterns.explanation);
    lines.push("");
    lines.push("## What to avoid");
    report.whatToAvoid.forEach(item => {
      lines.push(`- **${item.category.toUpperCase()}** · ${item.advice}`);
    });
    lines.push("");
    lines.push("## What to double down on");
    report.whatToDoubleDownOn.forEach(item => {
      lines.push(`- **${item.category.toUpperCase()}** · ${item.advice}`);
    });
    return lines.join("\n");
  };

  const downloadReport = () => {
    const md = buildMarkdown();
    if (!md) return;
    const platformLabel = platform === "tiktok" ? "TikTok" : "Instagram";
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-report-${platformLabel.toLowerCase()}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Draft a strategy with the AI strategist. Nothing is saved until the user approves it. */
  const refineStrategy = async (
    reportIn: Report | null = report,
    summaryIn: Summary | null = summary,
    platformIn: string = platform,
  ) => {
    const md = buildMarkdown(reportIn, summaryIn, platformIn);
    if (!md) return;
    setRefining(true);
    setRefineError(null);
    setApproveError(null);
    try {
      const res = await fetch("/api/brand-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, reportMarkdown: md, platform: platformIn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setRefined({
        broll: Number(data.broll) || 0,
        talking: Number(data.talking) || 0,
        graphic: Number(data.graphic) || 0,
        carousel: Number(data.carousel) || 0,
      });
      setRefinedStrategy(String(data.strategy || ""));
      setRefinedPlatform(platformIn);
      setShowRefinedModal(true);
    } catch (e) {
      setRefineError(e instanceof Error ? e.message : "Could not refine the strategy.");
    } finally {
      setRefining(false);
    }
  };

  /**
   * Link a stored audit to the strategy (only one at a time), then regenerate the
   * strategy and per-format targets from it for the user to review and approve.
   */
  const linkAudit = async (id: string) => {
    const code = getAccessCode();
    if (!code) return;
    setOpeningAuditId(id);
    setToast(null);
    try {
      const res = await fetch("/api/analysis-report", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": code },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.report) throw new Error("Could not link that audit.");
      const linkedReport = data.report as Report;
      const linkedSummary = (data.summary || null) as Summary | null;
      const linkedPlatform = String(data.platform || platform).toLowerCase();
      setPendingLinked({ report: linkedReport, summary: linkedSummary });
      setAudits((prev) => prev.map((a) => ({ ...a, linked: a.id === id })));
      await refineStrategy(linkedReport, linkedSummary, linkedPlatform);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not link that audit.");
    } finally {
      setOpeningAuditId("");
    }
  };


  /** Persist the (possibly edited) strategy, then hand the user over to scripting. */
  const approveAndScript = async () => {
    if (!refined || !refinedStrategy?.trim()) return;
    setApproving(true);
    setApproveError(null);
    try {
      const res = await fetch("/api/brand-guidance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({
          strategy: refinedStrategy.trim(),
          broll: refined.broll,
          talking: refined.talking,
          graphic: refined.graphic,
          carousel: refined.carousel,
          platform: refinedPlatform,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || `Failed (${res.status})`);
      setShowRefinedModal(false);
      const handOff = pendingLinked ?? (report ? { report, summary } : null);
      setPendingLinked(null);
      loadAudits();
      if (handOff) onSendToScripts?.(handOff.report, handOff.summary);
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : "Could not save the strategy.");
    } finally {
      setApproving(false);
    }
  };

  const startAnotherAnalysis = () => {
    setShowRefinedModal(false);
    reset();
  };




  const downloadReportPdf = () => {
    if (!report || !summary) return;
    const platformLabel = platform === "tiktok" ? "TikTok" : "Instagram";
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long" });

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 16;
    const CONTENT_W = PAGE_W - M * 2;

    // Brand palette (mirrors AnalyzeMode tokens)
    const INK = "#1A1A1D";
    const SUB = "#2A2A2E";
    const MUTED = "#5A5860";
    const FAINT = "#9B9BA1";
    const HAIR = "#E5E5E8";
    const SOFT = "#F6F6F7";
    const ACCENT = "#4F6BFF";
    const LINK = "#2530CC";
    const RED = "#DC2626";
    const GREEN = "#16A34A";
    const ALT = "#FAFAF7";

    const stripMd = (s: string) => (s || "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

    let y = M;

    const hex = (h: string): [number, number, number] => {
      const n = parseInt(h.replace("#", ""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const setFill = (h: string) => { const [r, g, b] = hex(h); doc.setFillColor(r, g, b); };
    const setDraw = (h: string) => { const [r, g, b] = hex(h); doc.setDrawColor(r, g, b); };
    const setText = (h: string) => { const [r, g, b] = hex(h); doc.setTextColor(r, g, b); };



    const ensure = (need: number) => {
      if (y + need > PAGE_H - M) {
        doc.addPage();
        y = M;
      }
    };

    const text = (
      s: string,
      x: number,
      yy: number,
      opts: { size?: number; bold?: boolean; color?: string; align?: "left" | "right" | "center"; maxWidth?: number } = {},
    ) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size ?? 10);
      setText(opts.color ?? INK);
      const o: any = { align: opts.align ?? "left" };
      if (opts.maxWidth) o.maxWidth = opts.maxWidth;
      doc.text(s, x, yy, o);
    };

    const wrap = (s: string, size: number, w: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      return doc.splitTextToSize(s || "", w) as string[];
    };

    const para = (s: string, size = 10, color = INK, gap = 1.6, bold = false) => {
      const lh = size * 0.45;
      const lines = wrap(s, size, CONTENT_W);
      for (const ln of lines) {
        ensure(lh);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        setText(color);
        doc.text(ln, M, y);
        y += lh;
      }
      y += gap;
    };

    const hairline = (label: string) => {
      y += 6;
      ensure(14);
      text(label, M, y, { size: 9, color: MUTED, bold: false });
      setDraw(HAIR);
      doc.setLineWidth(0.2);
      const labelW = doc.getTextWidth(label);
      doc.line(M + labelW + 4, y - 1, M + CONTENT_W, y - 1);
      y += 5;
    };

    // Card with optional top accent bar
    const card = (height: number, opts: { fill?: string; topAccent?: string } = {}) => {
      ensure(height + 2);
      setFill(opts.fill ?? "#FFFFFF");
      setDraw(HAIR);
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CONTENT_W, height, 2.5, 2.5, "FD");
      if (opts.topAccent) {
        setFill(opts.topAccent);
        doc.rect(M, y, CONTENT_W, 1.2, "F");
      }
    };

    // ---------- HEADER BAND ----------
    setFill(INK);
    doc.rect(0, 0, PAGE_W, 22, "F");
    setFill(ACCENT);
    doc.circle(M, 11, 2.2, "F");
    text("RISEVOICE", M + 5, 12.5, { size: 10, bold: true, color: "#F6F6F7" });
    text(`${monthLabel.toUpperCase()} REPORT`, PAGE_W - M, 12.5, { size: 8, color: "#6C7BFF", align: "right" });
    y = 30;

    // ---------- ACCOUNT ----------
    if (summary.profileName) {
      text("ACCOUNT AUDITED", M, y, { size: 8, color: FAINT, bold: true });
      y += 6;
      text(`@${summary.profileName}`, M, y, { size: 18, bold: true });
      y += 4;
      setDraw(HAIR); doc.setLineWidth(0.2);
      doc.line(M, y, M + CONTENT_W, y);
      y += 6;
    }

    // ---------- TITLE ----------
    text(`${monthLabel.toUpperCase()} REPORT`, M, y, { size: 8, color: ACCENT, bold: true });
    y += 7;
    text("Your content report", M, y, { size: 22, bold: true });
    y += 5;
    text(`${platformLabel} · ${summary.total} posts analyzed · ${date}`, M, y, { size: 10, color: MUTED });
    y += 8;

    // ---------- SCORECARD (2x2) ----------
    const sc = report.scorecard;
    const tiles = [
      { label: "AVERAGE VIEWS PER POST", value: sc.avgViewsPerPost },
      { label: "BEST SINGLE POST", value: `${sc.topPostViews} views` },
      { label: "STRONGEST TOPIC", value: sc.topPerformingTopic },
      { label: "BEST CONTENT STYLE", value: sc.bestContentCategory },
    ];
    const tileW = (CONTENT_W - 6) / 2;
    const tileH = 22;
    for (let i = 0; i < tiles.length; i += 2) {
      ensure(tileH + 4);
      for (let j = 0; j < 2; j++) {
        const t = tiles[i + j]; if (!t) continue;
        const x = M + j * (tileW + 6);
        setFill("#FFFFFF"); setDraw(HAIR); doc.setLineWidth(0.2);
        doc.roundedRect(x, y, tileW, tileH, 2.5, 2.5, "FD");
        text(t.label, x + 5, y + 6, { size: 7, color: MUTED, bold: true });
        const valLines = wrap(t.value || "—", 12, tileW - 10);
        text(valLines[0] || "—", x + 5, y + 14, { size: 12, bold: true });
        if (valLines[1]) text(valLines[1], x + 5, y + 19, { size: 9, color: SUB });
      }
      y += tileH + 4;
    }

    // ---------- FORMAT COMPARISON ----------
    hairline("Which type of video performs better");
    const winner = report.formatComparison.winner === "Talking video" ? "Talking videos" : "B-roll videos";
    para(`${winner} are winning.`, 11, INK, 1, true);
    para(stripMd(report.formatComparison.winnerReason), 10, SUB, 2);

    const drawBars = (title: string, camLbl: string, movLbl: string, startY: number): number => {
      const innerW = CONTENT_W - 12;
      text(title, M + 6, startY + 6, { size: 9, color: MUTED });
      const rows = [
        { label: "Talking video", val: camLbl, color: "#7B83FF" },
        { label: "B-roll", val: movLbl, color: "#5A5860" },
      ];
      const parseVal = (v: string) => parseFloat((v || "").replace(/[,%KMk]/g, "")) || 0;
      const max = Math.max(parseVal(camLbl), parseVal(movLbl), 0.001);
      let by = startY + 11;
      for (const r of rows) {
        text(r.label, M + 6, by + 5, { size: 9 });
        const barX = M + 6 + 28;
        const barW = innerW - 28;
        setFill(SOFT); doc.roundedRect(barX, by, barW, 6, 1.2, 1.2, "F");
        const pct = Math.max(0.12, parseVal(r.val) / max);
        setFill(r.color); doc.roundedRect(barX, by, barW * pct, 6, 1.2, 1.2, "F");
        text(r.val, barX + barW * pct - 2, by + 4.4, { size: 8, bold: true, color: "#FFFFFF", align: "right" });
        by += 9;
      }
      return by;
    };

    const fcH = 44;
    card(fcH);
    const cardTop = y;
    drawBars("Average views", report.formatComparison.speaksToCamera.avgViews, report.formatComparison.musicOrMovement.avgViews, cardTop + 2);
    drawBars("% of viewers who reacted", report.formatComparison.speaksToCamera.reactionRate, report.formatComparison.musicOrMovement.reactionRate, cardTop + 24);
    y += fcH + 4;

    // ---------- TABLE HELPER ----------
    const drawTable = (
      headers: string[],
      widths: number[], // fractions summing to 1
      rows: string[][],
    ) => {
      const colWs = widths.map(w => w * CONTENT_W);
      const headerH = 8;
      const rowPad = 2.5;
      const lineH = 4.2;

      // header
      ensure(headerH + 6);
      setFill(SOFT); setDraw(HAIR); doc.setLineWidth(0.2);
      doc.rect(M, y, CONTENT_W, headerH, "FD");
      let cx = M;
      headers.forEach((h, i) => {
        text(h, cx + 2.5, y + 5.4, { size: 8, bold: true, color: MUTED });
        cx += colWs[i];
      });
      y += headerH;

      rows.forEach((row, idx) => {
        // compute row height
        const wrapped = row.map((cell, i) => wrap(cell || "", 8.5, colWs[i] - 5));
        const maxLines = Math.max(...wrapped.map(w => w.length));
        const rowH = Math.max(headerH, maxLines * lineH + rowPad * 2);
        ensure(rowH);
        setFill(idx % 2 === 0 ? "#FFFFFF" : ALT);
        setDraw(HAIR); doc.setLineWidth(0.15);
        doc.rect(M, y, CONTENT_W, rowH, "FD");
        cx = M;
        wrapped.forEach((lines, i) => {
          lines.forEach((ln, li) => {
            text(ln, cx + 2.5, y + rowPad + 3 + li * lineH, { size: 8.5, color: INK });
          });
          cx += colWs[i];
        });
        y += rowH;
      });
      y += 2;
    };

    // ---------- TOP POSTS ----------
    hairline("Your top performing posts");
    drawTable(
      ["Type", "Views", "Reactions", "What it was about", "Link"],
      [0.13, 0.13, 0.18, 0.4, 0.16],
      report.topPosts.map((p, i) => {
        const csvPost = summary.topPostsWithUrls?.find(c => c.views === p.views) || summary.topPostsWithUrls?.[i];
        const url = csvPost?.url || p.url || "";
        return [p.format, p.views, p.reactions, stripMd(p.description), url ? "View ↗" : "—"];
      }),
    );

    // ---------- BOTTOM POSTS ----------
    if (report.bottomPosts && report.bottomPosts.length > 0) {
      hairline("Your bottom performing posts");
      drawTable(
        ["Type", "Views", "Reactions", "What it was about", "Link"],
        [0.13, 0.13, 0.18, 0.4, 0.16],
        report.bottomPosts.map((p, i) => {
          const csvPost = summary.bottomPostsWithUrls?.find(c => c.views === p.views) || summary.bottomPostsWithUrls?.[i];
          const url = csvPost?.url || p.url || "";
          return [p.format, p.views, p.reactions, stripMd(p.description), url ? "View ↗" : "—"];
        }),
      );
    }

    // ---------- OPENING LINES ----------
    hairline("Opening lines that stop people scrolling");
    report.openingLines.forEach((h, i) => {
      const titleLines = wrap(`${i + 1}. ${h.pattern}`, 11, CONTENT_W - 10);
      const quoteLines = wrap(`"${h.example}"`, 10, CONTENT_W - 10);
      const resLines = wrap(stripMd(h.result), 9, CONTENT_W - 10);
      const innerH = titleLines.length * 5 + quoteLines.length * 4.5 + resLines.length * 4 + 8;
      card(innerH);
      let yy = y + 5;
      titleLines.forEach(ln => { text(ln, M + 5, yy, { size: 11, bold: true }); yy += 5; });
      yy += 1;
      quoteLines.forEach(ln => { text(ln, M + 5, yy, { size: 10, color: MUTED }); yy += 4.5; });
      yy += 1;
      resLines.forEach(ln => { text(ln, M + 5, yy, { size: 9, color: SUB }); yy += 4; });
      y += innerH + 2;
    });

    // ---------- TOPIC PILLARS ----------
    hairline("Topic Pillars");
    drawTable(
      ["Topic Pillar", "Best result", "Why it connects"],
      [0.3, 0.25, 0.45],
      report.topicPillars.map(t => [t.topicPillar, t.bestResult, t.whyItConnects]),
    );

    // ---------- LANGUAGE ----------
    hairline("Phrases that connect");
    const phrases = report.languagePatterns.phrases || [];
    const explainLines = wrap(stripMd(report.languagePatterns.explanation), 10, CONTENT_W - 10);
    // estimate pill row height
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    let pillRows = 1;
    {
      let cx2 = M + 5;
      phrases.forEach(p => {
        const w = doc.getTextWidth(`"${p}"`) + 6;
        if (cx2 + w > M + CONTENT_W - 5) { pillRows++; cx2 = M + 5; }
        cx2 += w + 3;
      });
    }
    const langH = pillRows * 7 + explainLines.length * 4.5 + 10;
    card(langH);
    let py = y + 6;
    let px = M + 5;
    setFill(SOFT); setDraw(HAIR); doc.setLineWidth(0.2);
    phrases.forEach(p => {
      const label = `"${p}"`;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      const w = doc.getTextWidth(label) + 6;
      if (px + w > M + CONTENT_W - 5) { px = M + 5; py += 7; }
      setFill(SOFT); setDraw(HAIR);
      doc.roundedRect(px, py - 4, w, 5.5, 2.5, 2.5, "FD");
      text(label, px + 3, py, { size: 9, bold: true });
      px += w + 3;
    });
    py += 6;
    explainLines.forEach(ln => { text(ln, M + 5, py, { size: 10, color: SUB }); py += 4.5; });
    y += langH + 2;

    // ---------- WHAT TO AVOID ----------
    hairline("What to avoid");
    report.whatToAvoid.forEach(item => {
      const adviceLines = wrap(stripMd(item.advice), 10, CONTENT_W - 10);
      const h = adviceLines.length * 4.5 + 12;
      card(h, { topAccent: RED });
      text(item.category.toUpperCase(), M + 5, y + 7, { size: 8, color: RED, bold: true });
      let ay = y + 13;
      adviceLines.forEach(ln => { text(ln, M + 5, ay, { size: 10 }); ay += 4.5; });
      y += h + 2;
    });

    // ---------- WHAT TO DOUBLE DOWN ----------
    hairline("What to double down on");
    report.whatToDoubleDownOn.forEach(item => {
      const adviceLines = wrap(stripMd(item.advice), 10, CONTENT_W - 10);
      const h = adviceLines.length * 4.5 + 12;
      card(h, { topAccent: GREEN });
      text(item.category.toUpperCase(), M + 5, y + 7, { size: 8, color: GREEN, bold: true });
      let ay = y + 13;
      adviceLines.forEach(ln => { text(ln, M + 5, ay, { size: 10 }); ay += 4.5; });
      y += h + 2;
    });

    // ---------- FOOTERS ----------
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      text("Generated by Risevoice Creators Hub", PAGE_W / 2, PAGE_H - 8, { size: 8, color: FAINT, align: "center" });
      text(`${p} / ${total}`, PAGE_W - M, PAGE_H - 8, { size: 8, color: FAINT, align: "right" });
    }

    doc.save(`content-report-${platformLabel.toLowerCase()}-${Date.now()}.pdf`);
  };



  return (
    <section className="min-h-full bg-social-feed">
      {!report && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 md:px-8">
          <PlatformTabs platform={platform} onChange={setPlatform} disabled={loading} />
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {!report && (
          <>
            <AnalyzeUpload
              platform={platform}
              files={files}
              dragOver={dragOver}
              setDragOver={setDragOver}
              onDrop={onDrop}
              fileRef={fileRef}
              handleFiles={handleFiles}
              removeFile={removeFile}
              totalRows={totalRows}
              loading={loading}
              noCredits={noCredits}
              onGenerate={generate}
              source={source}
              setSource={setSource}
              handle={handle}
              setHandle={setHandle}
              canGenerate={canGenerate}
              connected={connected}
              connectedLoaded={connectedLoaded}
              scopeMode={scopeMode}
              setScopeMode={setScopeMode}
              windowDays={windowDays}
              setWindowDays={setWindowDays}
              maxPosts={maxPosts}
              setMaxPosts={setMaxPosts}
            />
            {loading && fetchPhase && <AuditProgress phase={fetchPhase} elapsed={auditElapsed} />}
            {loading && !fetchPhase && <AnalyzeProgress stepIdx={stepIdx} progress={progress} elapsed={elapsed} />}
            {error && (
              <div className="mt-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start justify-between gap-4">
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => { setError(null); generate(); }}
                  disabled={loading || !canGenerate}
                  className="shrink-0 px-3 py-1.5 rounded-md bg-brand-accent text-white text-[12px] font-semibold hover:bg-brand-blue-light transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Re-try
                </button>
              </div>
            )}
            {!loading && (
              <PastAudits
                audits={audits}
                loading={auditsLoading}
                openingId={openingAuditId}
                onOpen={openAudit}
                onLink={linkAudit}
              />
            )}
          </>
        )}
        {report && summary && (
          <>
            <AnalyzeReport
              report={report}
              summary={summary}
              platform={platform}
              onReset={reset}
              onDownload={downloadReport}
              onDownloadPdf={downloadReportPdf}
            />
            <SendToScriptsBridge
              onRefine={refineStrategy}
              onSkip={reset}
              refining={refining}
              refined={refined}
              refineError={refineError}
            />

          </>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-[#1A1A1D] text-[#F6F6F7] text-[13px] shadow-lg max-w-[90vw]">
          {toast}
        </div>
      )}

      {viewAudit && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/40 backdrop-blur-sm"
          onClick={() => setViewAudit(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5E5E8] bg-white px-6 py-4">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[.18em] text-[#9B9BA1]"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  Saved audit
                </p>
                <p className="text-[15px] text-[#1A1A1D]" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
                  {viewAudit.profile ? `@${viewAudit.profile}` : "Audit"}
                  {viewAudit.createdAt ? ` · ${auditDate(viewAudit.createdAt)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewAudit(null)}
                className="rounded-lg border border-[#D8D8DE] px-3 py-1.5 text-[12px] text-[#1A1A1D] transition hover:border-[#4F6BFF] hover:text-[#2530CC]"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-6">
              {viewAudit.summary ? (
                <AnalyzeReport
                  report={viewAudit.report}
                  summary={viewAudit.summary}
                  platform={viewAudit.platform}
                  onReset={() => setViewAudit(null)}
                  onDownload={() => {
                    const md = buildMarkdown(viewAudit.report, viewAudit.summary, viewAudit.platform);
                    if (!md) return;
                    const blob = new Blob([md], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `content-report-${viewAudit.platform}-${Date.now()}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  onDownloadPdf={() => setToast("The PDF is available right after an audit is generated.")}
                />
              ) : (
                <p className="text-[13px] text-[#5A5860]">
                  This audit was saved without its headline numbers, so it can still be used for findings but not
                  displayed in full.
                </p>
              )}
            </div>
          </div>
        </div>
      )}


      {showRefinedModal && refined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5E5E8] bg-white px-6 py-4">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[.18em] text-[#4F6BFF]"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  Strategy built for {refinedPlatform === "tiktok" ? "TikTok" : "Instagram"}
                </p>
                <h3
                  className="text-[18px] leading-tight text-[#1A1A1D]"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
                >
                  Your {refinedPlatform === "tiktok" ? "TikTok" : "Instagram"} strategy is ready
                </h3>
              </div>
              <button
                onClick={() => setShowRefinedModal(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5A5860] hover:bg-[#F6F6F7] transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[12px] uppercase tracking-[.16em] text-[#5A5860] mb-2" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                  Recommended strategy · editable
                </p>
                <textarea
                  value={refinedStrategy || ""}
                  onChange={(e) => setRefinedStrategy(e.target.value)}
                  rows={7}
                  className="w-full rounded-xl border border-[#E5E5E8] bg-[#F8F8FB] px-3 py-2.5 text-[13px] leading-relaxed text-[#2A2A2E] outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <p className="text-[12px] uppercase tracking-[.16em] text-[#5A5860] mb-2" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                  Format split · 24 posts
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["broll", "B-roll videos", "video · clean cuts + text overlay"],
                    ["talking", "Talking videos", "video · on-camera script"],
                    ["graphic", "Graphics", "1 single slide with text overlay"],
                    ["carousel", "Carousels", "multi-slide · cover, copy, CTA"],
                  ] as Array<[keyof typeof refined, string, string]>).map(([key, label, hint]) => (
                    <div key={key} className="rounded-xl border border-[#E5E5E8] bg-white p-3">
                      <label className="block text-[11px] text-[#5A5860] mb-1" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                        {label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={refined[key]}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(24, Math.round(Number(e.target.value) || 0)));
                          setRefined((prev) => (prev ? { ...prev, [key]: v } : prev));
                        }}
                        className="w-full rounded-lg border border-[#E5E5E8] px-2.5 py-1.5 text-[16px] text-[#1A1A1D] outline-none focus:border-[#4F6BFF]"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                      />
                      <p className="mt-1 text-[10px] text-[#9B9BA1]">{hint}</p>
                    </div>
                  ))}
                </div>
                {(() => {
                  const total = refined.broll + refined.talking + refined.graphic + refined.carousel;
                  return (
                    <p className={`mt-2 text-[11px] ${total === 24 ? "text-[#12854A]" : "text-[#D92D20]"}`}>
                      Total: {total} of 24 posts
                      {total === 24 ? " · balanced" : total > 24 ? " · remove a few" : " · add a few more"}
                    </p>
                  );
                })()}

              </div>

              {approveError && <p className="text-[12px] text-[#D92D20]">{approveError}</p>}
              <p className="text-[11px] text-[#9B9BA1]">
                Nothing is saved until you approve. “Analyze another account” discards this draft.
              </p>
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-[#E5E5E8] bg-white px-6 py-4">
              <button
                onClick={startAnotherAnalysis}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-[#5A5860] hover:text-[#1A1A1D] hover:bg-[#F6F6F7] transition"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Analyze another account
              </button>
              <button
                onClick={approveAndScript}
                disabled={approving || !refinedStrategy?.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#4F6BFF] hover:bg-[#6C7BFF] transition disabled:opacity-50"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {approving && <Loader2 size={14} className="animate-spin" />}
                {approving ? "Saving…" : "Approve & script"}
              </button>

            </div>
          </div>
        </div>
      )}
    </section>

  );
}

/* ---------------- UPLOAD ---------------- */

function BrandGlyph({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

/** Instagram / TikTok selector using the shared pill-container tab design. */
function PlatformTabs({
  platform,
  onChange,
  disabled,
}: {
  platform: string;
  onChange: (id: "instagram" | "tiktok") => void;
  disabled: boolean;
}) {
  const items = [
    { id: "instagram" as const, label: "Instagram", icon: <BrandGlyph path={siInstagram.path} /> },
    { id: "tiktok" as const, label: "TikTok", icon: <BrandGlyph path={siTiktok.path} /> },
  ];
  return (
    <div role="tablist" aria-label="Analysis platform" className="grid grid-cols-2 gap-1 rounded-lg bg-brand-tab-container p-1">
      {items.map(({ id, label, icon }) => {
        const active = platform === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-1 text-xs transition disabled:opacity-60 sm:h-10 ${
              active
                ? "bg-brand-surface font-semibold text-brand-ink shadow-sm"
                : "text-brand-ink-soft hover:bg-brand-surface/50"
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AnalyzeUpload({
  platform, files, dragOver, setDragOver, onDrop, fileRef,
  handleFiles, removeFile, totalRows, loading, noCredits, onGenerate,
  source, setSource, handle, setHandle, canGenerate, connected, connectedLoaded,
  scopeMode, setScopeMode, windowDays, setWindowDays, maxPosts, setMaxPosts,
}: {
  platform: string;
  files: ParsedFile[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  handleFiles: (f: FileList | null) => void;
  removeFile: (i: number) => void;
  totalRows: number;
  loading: boolean;
  noCredits: boolean;
  onGenerate: () => void;
  source: "handle" | "csv";
  setSource: (s: "handle" | "csv") => void;
  handle: string;
  setHandle: (h: string) => void;
  canGenerate: boolean;
  connected: Record<string, string>;
  connectedLoaded: boolean;
  scopeMode: "days" | "posts";
  setScopeMode: (v: "days" | "posts") => void;
  windowDays: number;
  setWindowDays: (v: number) => void;
  maxPosts: number;
  setMaxPosts: (v: number) => void;

}) {
  const cleanHandleInput = (v: string) => v.trim().replace(/^@+/, "");
  return (
    <div>

      {source === "handle" && (
        <div className="rounded-2xl border border-[#EDEDF0] bg-white px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div
              className="text-[13px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Username
            </div>
            <button
              type="button"
              onClick={() => setSource("csv")}
              disabled={loading}
              className="shrink-0 text-[11px] text-[#4F6BFF] hover:text-[#2530CC] underline underline-offset-2 disabled:opacity-50"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
            >
              Upload a CSV instead
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 bg-white border border-[#E5E5E8] rounded-xl px-3 py-2.5 focus-within:border-[#4F6BFF]/60">
            <span className="text-[11px] text-[#9B9BA1]">@</span>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value.replace(/^@+/, ""))}
              disabled={loading}
              placeholder={`any ${platform === "tiktok" ? "TikTok" : "Instagram"} handle or profile link`}
              aria-label="Handle to analyze"
              className="flex-1 bg-transparent text-[11px] text-[#1A1A1D] placeholder:text-[#9B9BA1] focus:outline-none"
            />
          </div>
          {connected[platform] && cleanHandleInput(handle) !== connected[platform] && (
            <button type="button" disabled={loading} onClick={() => setHandle(connected[platform])} className="mt-2 rounded-full border border-[#E5E5E8] px-2.5 py-1 text-[11px] text-[#4F6BFF] hover:bg-[#F3F5FF]">
              Use @{connected[platform]}
            </button>
          )}

          <div className="mt-10">
            <div
              className="text-[13px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Audit scope
            </div>

            <div className="mt-3 inline-flex rounded-lg border border-[#E5E5E8] bg-[#F8F8FB] p-1">
              {([
                ["days", "By time Period"],
                ["posts", "By Recent Posts"],
              ] as Array<["days" | "posts", string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={loading}
                  onClick={() => setScopeMode(value)}
                  className={`px-3 py-1.5 text-[11px] rounded-md transition-colors disabled:opacity-50 ${
                    scopeMode === value ? "bg-white text-[#1A1A1D] shadow-sm" : "text-[#5A5860]"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  {label}
                </button>
              ))}
            </div>

            {scopeMode === "days" ? (
              <div className="mt-10 max-w-sm">
                <div className="relative h-5 mb-1">
                  <span
                    className="absolute top-0 -translate-x-1/2 text-[11px] text-[#4F6BFF]"
                    style={{ left: `${((windowDays - 7) / (31 - 7)) * 100}%`, fontWeight: 500 }}
                  >
                    {windowDays} days
                  </span>
                </div>
                <input
                  type="range"
                  min={7}
                  max={31}
                  step={1}
                  value={windowDays}
                  disabled={loading}
                  onChange={(e) => setWindowDays(Number(e.target.value))}
                  className="w-full accent-[#4F6BFF] disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-[#9B9BA1] mt-2">
                  <span>7 days</span>
                  <span>31 days</span>
                </div>
              </div>
            ) : (
              <div className="mt-10 max-w-sm">
                <div className="relative h-5 mb-1">
                  <span
                    className="absolute top-0 -translate-x-1/2 text-[11px] text-[#4F6BFF]"
                    style={{ left: `${((maxPosts - 15) / (45 - 15)) * 100}%`, fontWeight: 500 }}
                  >
                    {maxPosts} posts
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={45}
                  step={1}
                  value={maxPosts}
                  disabled={loading}
                  onChange={(e) => setMaxPosts(Number(e.target.value))}
                  className="w-full accent-[#4F6BFF] disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-[#9B9BA1] mt-2">
                  <span>15 posts</span>
                  <span>45 posts</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-20 flex justify-end">
            <button
              onClick={onGenerate}
              disabled={!canGenerate || loading || noCredits}
              className="rounded-lg bg-[#4F6BFF] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#3B56E0] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {loading
                ? "Analysing your posts…"
                : noCredits
                  ? "No reports remaining this month"
                  : "Analyze my performance"}
            </button>
          </div>
        </div>
      )}

      {source === "csv" && (
        <div className="rounded-2xl border border-[#EDEDF0] bg-white px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div
              className="text-[15px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Upload {platform === "tiktok" ? "TikTok" : "Instagram"} CSV
            </div>
            <button
              type="button"
              onClick={() => setSource("handle")}
              disabled={loading}
              className="shrink-0 text-[11px] text-[#4F6BFF] hover:text-[#2530CC] underline underline-offset-2 disabled:opacity-50"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
            >
              Use a connected profile instead
            </button>
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all px-6 py-12 text-center ${
              dragOver ? "border-[#4F6BFF] bg-[#EEEBFA]" : "border-[#E5E5E8] bg-transparent hover:border-[#9B9BA1]"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            <Upload className="mx-auto text-[#4F6BFF] mb-3" size={22} />
            <div
              className="text-[15px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Drop your CSV files here
            </div>
            <div className="text-[12px] text-[#5A5860] mt-1">
              or <span className="text-[#4F6BFF] underline">browse to upload</span> · CSV with up to 40 posts
            </div>
          </div>

          <p className="text-[12px] text-[#5A5860] mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {PLATFORM_NOTES[platform]}
          </p>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E5E5E8] rounded-lg"
                >
                  <FileText size={14} className="text-[#4F6BFF]" />
                  <span className="text-[13px] text-[#1A1A1D] flex-1 truncate">{f.name}</span>
                  <span className="text-[11px] text-[#9B9BA1]">{f.rows.length} rows</span>
                  <button
                    onClick={e => { e.stopPropagation(); removeFile(i); }}
                    className="text-[#9B9BA1] hover:text-[#1A1A1D]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 flex justify-end">
            <button
              onClick={onGenerate}
              disabled={!canGenerate || loading || noCredits}
              className="rounded-lg bg-[#4F6BFF] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#3B56E0] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {loading
                ? "Analysing your posts…"
                : noCredits
                  ? "No reports remaining this month"
                  : "Analyze my performance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- PROGRESS ---------------- */

function AnalyzeProgress({ stepIdx, progress, elapsed }: { stepIdx: number; progress: number; elapsed: number }) {
  const nearlyDone = progress > 88;
  return (
    <div className="mt-8 p-6 rounded-2xl bg-white border border-brand-line">
      <div className="flex items-center justify-between mb-3 text-[12px] text-[#5A5860]">
        <span>Analysing · {Math.floor(elapsed / 60)}m {String(elapsed % 60).padStart(2, "0")}s</span>
        <span className="font-semibold text-[#1A1A1D]">{Math.round(progress)}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-[#E5E5E8] overflow-hidden">
        <div
          className="h-full bg-[#4F6BFF] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {nearlyDone && (
        <p className="mt-3 text-[12px] text-[#5A5860]">
          Still writing your report. This last step takes a couple of minutes, please keep this tab open.
        </p>
      )}

      <div className="mt-5 space-y-2">
        {STEPS.map((s, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div
              key={i}
              className={`flex items-center gap-2.5 text-[12px] transition ${
                done ? "text-[#5A5860]" : active ? "text-[#1A1A1D]" : "text-[#9B9BA1]"
              }`}
            >
              {done ? (
                <Check size={14} className="text-[#4F6BFF]" />
              ) : active ? (
                <Loader2 size={12} className="animate-spin text-[#4F6BFF]" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-[#9B9BA1]/40" />
              )}
              <span>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditProgress({
  phase,
  elapsed,
}: {
  phase: { phase: string; done: number; total: number };
  elapsed: number;
}) {
  const isCollecting = /auditing|collecting|profile/i.test(phase.phase);
  const ratio = phase.total > 0 ? Math.min(1, phase.done / phase.total) : 0;
  const percent = isCollecting
    ? Math.min(24, 4 + elapsed * 0.18)
    : /confirming/i.test(phase.phase)
      ? 24 + ratio * 16
      : 40 + ratio * 58;
  const detail = isCollecting
    ? elapsed < 25
      ? "Finding posts published in the 21-day window…"
      : elapsed < 70
        ? "Reading performance and engagement signals…"
        : "Sorting the strongest posts before analysis…"
    : /confirming/i.test(phase.phase)
      ? "Checking performance data before selecting the top posts…"
      : `Processing post ${Math.min(phase.done + 1, phase.total)} of ${phase.total}…`;

  return (
    <div className="mt-6 rounded-xl bg-white border border-brand-line px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Loader2 size={15} className="animate-spin text-[#4F6BFF] shrink-0" />
          <span className="text-[13px] font-medium text-[#1A1A1D] truncate">{phase.phase}</span>
        </div>
        <span className="text-[12px] font-semibold text-[#1A1A1D]">{Math.round(percent)}%</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-[#E5E5E8] overflow-hidden">
        <div className="h-full bg-[#4F6BFF] transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[#6A6A72]">
        <span>{detail}</span>
        <span className="shrink-0">{Math.floor(elapsed / 60)}m {String(elapsed % 60).padStart(2, "0")}s</span>
      </div>
    </div>
  );
}

/* ---------------- REPORT ---------------- */

function HairlineLabel({ label }: { label: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-10 mb-4">
      <span
        className="text-[12px] text-[#5A5860]"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, letterSpacing: ".04em" }}
      >
        {label}
      </span>
      <span className="flex-1 h-px bg-[#E5E5E8]" />
    </div>
  );
}

function FormatBadge({ format }: { format: string }) {
  const isCamera = format.toLowerCase().includes("talking") || format.toLowerCase().includes("camera");
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border ${
        isCamera
          ? "bg-[#7B83FF]/15 text-[#2530CC] border-[#7B83FF]/30"
          : "bg-[#9B9BA1]/15 text-[#2A2A2E] border-[#9B9BA1]/30"
      }`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {isCamera ? "Talking video" : format || "B-roll"}
    </span>
  );
}


function Bars({ title, cameraLabel, movementLabel }: {
  title: string; cameraLabel: string; movementLabel: string;
}) {
  const parseVal = (v: string) => {
    const n = parseFloat(v.replace(/[KMk%,]/g, ""));
    if (v.toUpperCase().includes("M")) return n * 1000000;
    if (v.toUpperCase().includes("K")) return n * 1000;
    return n || 0;
  };
  const cam = parseVal(cameraLabel);
  const mov = parseVal(movementLabel);
  const maxVal = Math.max(cam, mov, 0.001);
  const camPct = Math.min(Math.round((cam / maxVal) * 88), 88);
  const movPct = Math.min(Math.round((mov / maxVal) * 88), 88);
  return (
    <div>
      <div className="text-[12px] text-[#5A5860] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {title}
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-24 text-[12px] text-[#1A1A1D]">Talking video</div>
          <div className="flex-1 h-7 rounded bg-[#F6F6F7] relative overflow-hidden">
            <div
              className="h-full bg-[#7B83FF] flex items-center justify-end pr-2 text-[11px] font-semibold text-[#F6F6F7]"
              style={{ width: `${Math.max(camPct, 14)}%` }}
            >
              {cameraLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 text-[12px] text-[#1A1A1D]">B-roll</div>
          <div className="flex-1 h-7 rounded bg-[#F6F6F7] relative overflow-hidden">
            <div
              className="h-full bg-[#5A5860] flex items-center justify-end pr-2 text-[11px] font-semibold text-[#F6F6F7]"
              style={{ width: `${Math.max(movPct, 14)}%` }}
            >
              {movementLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function AnalyzeReport({
  report, summary, platform, onReset, onDownload, onDownloadPdf,
}: {
  report: Report;
  summary: Summary;
  platform: string;
  onReset: () => void;
  onDownload: () => void;
  onDownloadPdf: () => void;
}) {

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long" });
  const platformLabel = platform === "tiktok" ? "TikTok" : "Instagram";

  return (
    <div className="text-[#1A1A1D]">
      {/* Account header */}
      {summary.profileName && (
        <div className="pb-5 mb-6 border-b border-[#E5E5E8]">
          <p
            className="text-[11px] uppercase tracking-[.18em] text-[#4F6BFF] mb-2"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9B9BA1" }}
          >
            Account audited
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="text-[22px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              @{summary.profileName}
            </span>
            <a
              href={
                platform === "tiktok"
                  ? `https://www.tiktok.com/@${summary.profileName}`
                  : `https://www.instagram.com/${summary.profileName}`
              }
              onClick={e =>
                openExternal(
                  e,
                  platform === "tiktok"
                    ? `https://www.tiktok.com/@${summary.profileName}`
                    : `https://www.instagram.com/${summary.profileName}`,
                )
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[#2530CC] underline"
            >

              View profile ↗
            </a>
          </div>
        </div>
      )}

      {/* Title row */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <p
            className="text-[11px] uppercase tracking-[.18em] text-[#4F6BFF] mb-2"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9B9BA1" }}
          >
            {monthLabel} report
          </p>
          <h2
            className="text-[28px] md:text-[32px] tracking-tight leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
          >
            Your content report
          </h2>
          <p className="text-[13px] text-[#5A5860] mt-1">
            {platformLabel} · {summary.total} posts analyzed
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-[#1A1A1D] bg-white border border-[#E5E5E8] hover:bg-[#F6F6F7] transition"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Start over
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-[#1A1A1D] bg-white border border-[#E5E5E8] hover:bg-[#F6F6F7] transition"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <Download size={13} />
            Download .md
          </button>
          <button
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#4F6BFF] hover:bg-[#6C7BFF] transition"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <Download size={13} />
            Download .pdf
          </button>
        </div>

      </div>

      {/* Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Average views per post", value: report.scorecard.avgViewsPerPost },
          { label: "Best single post", value: report.scorecard.topPostViews },
          { label: "Strongest topic", value: report.scorecard.topPerformingTopic },
          { label: "Best content style", value: report.scorecard.bestContentCategory },
        ].map((m, i) => (
          <div key={i} className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E8]">
            <div
              className="text-[10px] uppercase tracking-[.16em] text-[#5A5860] mb-2"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
            >
              {m.label}
            </div>
            <div
              className="text-[20px] text-[#1A1A1D] leading-tight"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Format comparison */}
      <HairlineLabel label="Which type of video performs better" />
      <p className="text-[13px] text-[#2A2A2E] mb-4">
        <strong className="text-[#1A1A1D]">
          {report.formatComparison.winner === "Talking video" ? "Talking videos" : "B-roll videos"} are winning.
        </strong>{" "}
        {report.formatComparison.winnerReason}
      </p>
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E8]">
        <div className="grid md:grid-cols-2 gap-6">
          <Bars
            title="Average views"
            cameraLabel={report.formatComparison.speaksToCamera.avgViews}
            movementLabel={report.formatComparison.musicOrMovement.avgViews}
          />
          <Bars
            title="% of viewers who reacted"
            cameraLabel={report.formatComparison.speaksToCamera.reactionRate}
            movementLabel={report.formatComparison.musicOrMovement.reactionRate}
          />
        </div>
        {(report.formatComparison.speaksToCamera.note || report.formatComparison.musicOrMovement.note) && (
          <div className="mt-4 text-[12px] text-[#5A5860]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {report.formatComparison.speaksToCamera.note || report.formatComparison.musicOrMovement.note}
          </div>
        )}
      </div>

      {/* Top posts table */}
      <HairlineLabel label="Your top performing posts" />
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E8]">
        <div className="rounded-lg overflow-x-auto border border-[#E5E5E8]">
          <table className="w-full min-w-[560px] text-[11.5px]">
            <thead className="bg-[#F6F6F7] text-[#5A5860]">
              <tr>
                <th className="text-left p-3 font-semibold">Type</th>
                <th className="text-left p-3 font-semibold">Views</th>
                <th className="text-left p-3 font-semibold">Reactions</th>
                <th className="text-left p-3 font-semibold">What it was about</th>
                <th className="text-left p-3 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody>
              {report.topPosts.map((p, i) => {
                const csvPost = summary.topPostsWithUrls?.find(c => p.url && c.url.replace(/\/$/, "") === p.url.replace(/\/$/, "")) || summary.topPostsWithUrls?.[i];
                const postUrl = p.url || csvPost?.url || "";
                const displayFormat = csvPost?.postType || p.format;
                return (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF7]"}>
                    <td
                      className="p-3"
                      title={csvPost?.typeReason ? `Why: ${csvPost.typeReason}${csvPost.typeConfidence ? ` (${csvPost.typeConfidence}% confident)` : ""}` : undefined}
                    ><FormatBadge format={displayFormat} /></td>
                    <td className="p-3"><strong className="text-[#1A1A1D]">{p.views}</strong></td>
                    <td className="p-3 text-[#5A5860]">{p.reactions}</td>
                    <td className="p-3 text-[#1A1A1D]">{p.description}</td>
                    <td className="p-3 whitespace-nowrap">
                      {postUrl ? (
                        <a href={postUrl} onClick={e => openExternal(e, postUrl)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#2530CC] hover:text-[#4F6BFF] hover:underline underline-offset-2">
                          View ↗
                        </a>
                      ) : (
                        <span className="text-[#C8C6BC]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom posts table */}
      {report.bottomPosts && report.bottomPosts.length > 0 && (
        <>
          <HairlineLabel label="Your bottom performing posts" />
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E8]">
            <div className="rounded-lg overflow-x-auto border border-[#E5E5E8]">
              <table className="w-full min-w-[560px] text-[11.5px]">
                <thead className="bg-[#F6F6F7] text-[#5A5860]">
                  <tr>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Views</th>
                    <th className="text-left p-3 font-semibold">Reactions</th>
                    <th className="text-left p-3 font-semibold">What it was about</th>
                    <th className="text-left p-3 font-semibold">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bottomPosts.map((p, i) => {
                    const csvPost = summary.bottomPostsWithUrls?.find(c => p.url && c.url.replace(/\/$/, "") === p.url.replace(/\/$/, "")) || summary.bottomPostsWithUrls?.[i];
                    const postUrl = p.url || csvPost?.url || "";
                    const displayFormat = csvPost?.postType || p.format;
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF7]"}>
                        <td
                      className="p-3"
                      title={csvPost?.typeReason ? `Why: ${csvPost.typeReason}${csvPost.typeConfidence ? ` (${csvPost.typeConfidence}% confident)` : ""}` : undefined}
                    ><FormatBadge format={displayFormat} /></td>
                        <td className="p-3"><strong className="text-[#1A1A1D]">{p.views}</strong></td>
                        <td className="p-3 text-[#5A5860]">{p.reactions}</td>
                        <td className="p-3 text-[#1A1A1D]">{p.description}</td>
                        <td className="p-3 whitespace-nowrap">
                          {postUrl ? (
                            <a href={postUrl} onClick={e => openExternal(e, postUrl)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#2530CC] hover:text-[#4F6BFF] hover:underline underline-offset-2">
                              View ↗
                            </a>
                          ) : (
                            <span className="text-[#C8C6BC]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      {/* Opening lines */}
      <HairlineLabel label="Opening lines that stop people scrolling" />
      <div className="p-6 rounded-2xl bg-white border border-[#E5E5E8] space-y-5">
        {report.openingLines.map((h, i) => (
          <div key={i} className={i > 0 ? "pt-5 border-t border-[#E5E5E8]" : ""}>
            <h3
              className="text-[15px] text-[#1A1A1D] mb-1.5"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              {i + 1}. {h.pattern}
            </h3>
            <p
              className="text-[14px] text-[#5A5860] mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              &ldquo;{h.example}&rdquo;
            </p>
            <span className="text-[12px] text-[#2A2A2E]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {h.result}
            </span>
          </div>
        ))}
      </div>

      {/* Topic pillars */}
      <HairlineLabel label="Topic Pillars" />
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E8]">
        <div className="rounded-lg overflow-x-auto border border-[#E5E5E8]">
          <table className="w-full min-w-[560px] text-[11.5px]">
            <thead className="bg-[#F6F6F7] text-[#5A5860]">
              <tr>
                <th className="text-left p-3 font-semibold">Topic Pillar</th>
                <th className="text-left p-3 font-semibold">Best result</th>
                <th className="text-left p-3 font-semibold">Why it connects</th>
              </tr>
            </thead>
            <tbody>
              {report.topicPillars.map((t, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF7]"}>
                  <td className="p-3"><strong className="text-[#1A1A1D]">{t.topicPillar}</strong></td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#F6F6F7] border border-[#E5E5E8] text-[11px] font-semibold">
                      {t.bestResult}
                    </span>
                  </td>
                  <td className="p-3 text-[#2A2A2E]">{t.whyItConnects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Language patterns */}
      <HairlineLabel label="Phrases that connect" />
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E8]">
        <div className="flex flex-wrap gap-2 mb-3">
          {report.languagePatterns.phrases.map((l, i) => (
            <span
              key={i}
              className="inline-block px-3 py-1.5 rounded-full bg-[#F6F6F7] border border-[#E5E5E8] text-[12px] text-[#1A1A1D] font-semibold"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              &ldquo;{l}&rdquo;
            </span>
          ))}
        </div>
        <p className="text-[13px] text-[#2A2A2E]">{report.languagePatterns.explanation}</p>
      </div>

      {/* What to avoid */}
      <HairlineLabel label="What to avoid" />
      <div className="space-y-2">
        {report.whatToAvoid.map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-[#E5E5E8] border-t-[3px] border-t-[#DC2626]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 shrink-0 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-bold leading-none">−</span>
              <span
                className="text-[10px] uppercase tracking-[.16em] text-[#DC2626]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
              >
                {item.category}
              </span>
            </div>
            <div className="text-[13px] text-[#1A1A1D] leading-relaxed">{renderAdvice(item.advice)}</div>
          </div>
        ))}
      </div>

      {/* What to double down on */}
      <HairlineLabel label="What to double down on" />
      <div className="space-y-2">
        {report.whatToDoubleDownOn.map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-[#E5E5E8] border-t-[3px] border-t-[#16A34A]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 shrink-0 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-bold leading-none">+</span>
              <span
                className="text-[10px] uppercase tracking-[.16em] text-[#16A34A]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
              >
                {item.category}
              </span>
            </div>
            <div className="text-[13px] text-[#1A1A1D] leading-relaxed">{renderAdvice(item.advice)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- BRIDGE ---------------- */

function SendToScriptsBridge({
  onRefine,
  onSkip,
  refining,
  refined,
  refineError,
}: {
  onRefine: () => void;
  onSkip: () => void;
  refining: boolean;
  refined: { broll: number; talking: number; graphic: number; carousel: number } | null;
  refineError: string | null;
}) {
  return (
    <div className="relative mt-12 p-6 md:p-8 rounded-2xl bg-white border border-brand-line text-brand-ink overflow-hidden">
      <div className="relative flex items-center justify-between gap-6 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[.18em] text-brand-accent mb-2 font-semibold">
            Optional · next step
          </p>
          <h3 className="text-[20px] md:text-[22px] tracking-tight font-bold text-brand-ink">
            Turn this report into your content strategy.
          </h3>
          <p className="text-[13px] text-brand-ink-soft mt-1 max-w-md">
            We'll read the report and draft your recommended strategy, plus how many b-roll, talking videos, graphics
            and carousels to produce across your next 24 posts. You review it before anything is saved.
          </p>
          {refined && (
            <p className="text-[12px] text-brand-accent mt-3">
              Draft ready · {refined.broll} b-roll · {refined.talking} talking · {refined.graphic} graphics ·{" "}
              {refined.carousel} carousels.

            </p>
          )}
          {refineError && <p className="text-[12px] text-red-600 mt-3">{refineError}</p>}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onSkip}
            className="text-[12px] font-medium text-brand-ink-soft hover:text-brand-ink underline-offset-4 hover:underline transition"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Skip
          </button>
          <button
            onClick={onRefine}
            disabled={refining}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-[#4F6BFF] hover:bg-[#6C7BFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {refining && <Loader2 size={14} className="animate-spin" />}
            {refining ? "Refining…" : refined ? "Refine again" : "Refine strategy"}
            {!refining && <span aria-hidden>→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}


