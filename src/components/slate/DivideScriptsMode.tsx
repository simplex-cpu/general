import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Check, Loader2, FileText, RefreshCw } from "lucide-react";
import { ChatThread } from "./chat/ChatThread";
import { AiBubble } from "./chat/AiBubble";
import { UserBubble } from "./chat/UserBubble";
import { TypingIndicator } from "./chat/TypingIndicator";
import {
  FORMAT_SPEC,
  getFieldLabel,
  isEligibleAssignee,
  readFieldValue,
  slidesToCopyText,
  type FieldKey,
  type FormatKey,
} from "@/lib/slate/formatFields";
import { fieldsToStructured, parseCarouselDocument } from "@/lib/slate/slideFields";

type Format = FormatKey;

const FORMAT_LABEL: Record<Format, string> = {
  talkingVideo: "Talking Video",
  broll: "BROLL",
  carousel: "Carousel",
  graphic: "Graphic",
  reactionRepurpose: "Reaction & Repurpose",
  trend: "Trend",
  podcastClips: "Podcast Clips",
};

const FORMAT_OPTIONS = ["📹 Video", "🏞️ Graphic"];
const CATEGORY_OPTIONS = ["Talking Point", "BROLL", "Carousel", "Graphic", "Reaction & Repurpose", "Trend", "Podcast Clips"];
const STATUS_OPTIONS = ["To Film", "Prepare for Prod", "To Edit | Design", "Production", "Ready to Post", "Posted"];

function formatToAirtable(f: Format) {
  return FORMAT_SPEC[f].chip;
}
function formatToCategory(f: Format) {
  return FORMAT_SPEC[f].category;
}

type Assignee = { id: string; name: string; email?: string; role?: string; todoCount?: number };

// Decide which roles are eligible to be auto-assigned for a given content format.
function eligibleForFormat(format: Format | null, role?: string): boolean {
  return isEligibleAssignee(format, role);
}

type Slide = { position: number; role: string; headline: string; subtitle?: string; body: string; actionLabel?: string };

type ScriptCard = {
  id: string;
  topic: string;
  visualHook: string;
  script: string;
  onScreenCta: string;
  slides: Slide[];
  inspo: string;
  filmingInstructions: string;
  creativeInstructions: string;
  assignees: Assignee[];
  captions: { instagram: string; facebook: string; tiktok: string; youtube: string };
  format: string;
  /** Internal format key this card was built from (may differ per script in a mixed doc). */
  formatKey: Format;
  category: string;
  clientStatus: string;
  productionStatus: string;
  sending?: boolean;
  sent?: boolean;
  error?: string;
};

type Brand = { id: string; name: string };

type Phase = "brand" | "format" | "pdf" | "count" | "analyzing" | "confirm" | "results";

type Mismatch = {
  docFormat: Format;
  sections: string[];
  sectionFormats: (Format | null)[];
  /** True when the format came from reading the fields, not a "Format:" line. */
  inferred: boolean;
  /** 1-based script numbers whose content is a different format than the pick. */
  mismatched: number[];
  /** Human lines describing out-of-place fields, e.g. 'Script 2: Text overlay'. */
  conflictNotes: string[];
  /** Formats the document's own scripts turned out to be. */
  docFormats: Format[];
};

type Persisted = {
  phase: Phase;
  brand: Brand | null;
  format: Format | null;
  fileName: string | null;
  count: string;
  cards: ScriptCard[];
};

export function DivideScriptsMode({ accessCode, clientName }: { accessCode: string; clientName?: string }) {
  const STORAGE_KEY = `rv_divide_state_${accessCode || "anon"}`;

  const initial: Persisted = (() => {
    if (typeof window === "undefined") return { phase: "brand", brand: null, format: null, fileName: null, count: "", cards: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { phase: "brand", brand: null, format: null, fileName: null, count: "", cards: [], ...JSON.parse(raw) };
    } catch {}
    return { phase: "brand", brand: null, format: null, fileName: null, count: "", cards: [] };
  })();

  // A pending format question can't survive a reload (the sections aren't stored),
  // so fall back to the count step.
  const [phase, setPhase] = useState<Phase>(initial.phase === "confirm" ? "count" : initial.phase);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brand, setBrand] = useState<Brand | null>(initial.brand);
  const [pendingBrandId, setPendingBrandId] = useState<string>("");
  const [format, setFormat] = useState<Format | null>(initial.format);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(initial.fileName);
  const [gdocUrl, setGdocUrl] = useState<string>("");
  const [count, setCount] = useState<string>(initial.count);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<string>("");
  const [analyzeProgress, setAnalyzeProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<ScriptCard[]>(initial.cards);
  const [batchSending, setBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<Mismatch | null>(null);
  const [mixedNote, setMixedNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assigneeOptions, setAssigneeOptions] = useState<Assignee[]>([]);

  useEffect(() => {
    if (!accessCode) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/list-airtable-collaborators`, { headers: { "x-access-code": accessCode } });
        const data = await r.json();
        if (!cancelled && r.ok && Array.isArray(data.people)) setAssigneeOptions(data.people);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [accessCode]);

  // Persist
  useEffect(() => {
    try {
      const p: Persisted = { phase, brand, format, fileName, count, cards };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {}
  }, [phase, brand, format, fileName, count, cards, STORAGE_KEY]);

  // Autoscroll on key transitions
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      });
    });
  }, [phase, cards.length, brand?.id, format, fileName]);

  // Load brands once
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/list-brands`, { headers: { "x-access-code": accessCode } });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to load brands");
        setBrands(data.brands || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load brands");
      } finally {
        setBrandLoading(false);
      }
    })();
  }, [accessCode]);

  function confirmBrand() {
    const b = brands.find((x) => x.id === pendingBrandId);
    if (!b) return;
    setBrand(b);
    setPhase("format");
  }
  function pickFormat(f: Format) {
    setFormat(f);
    setPhase("pdf");
  }
  function pickFile(f: File) {
    if (f.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB.");
      return;
    }
    setError(null);
    setFile(f);
    setFileName(f.name);
    setGdocUrl("");
    setPhase("count");
  }
  function confirmGdoc() {
    const url = gdocUrl.trim();
    const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) {
      setError("That doesn't look like a valid Google Doc link.");
      return;
    }
    setError(null);
    setFile(null);
    setFileName(`Google Doc: ${m[1].slice(0, 12)}…`);
    setPhase("count");
  }

  async function runAnalysis() {
    const n = parseInt(count, 10);
    if (!n || n < 1) {
      setError("Enter a valid number of scripts.");
      return;
    }
    const hasGdoc = !!gdocUrl.trim();
    if (!file && !hasGdoc) {
      setError("Re-attach the PDF or paste a Google Doc link to continue.");
      return;
    }
    if (!brand || !format) {
      setError("Missing brand or format.");
      return;
    }
    setError(null);
    setMismatch(null);
    setMixedNote(null);
    setAnalyzing(true);
    setAnalyzeProgress(null);
    setAnalyzeStatus(file ? "Reading the PDF…" : "Reading the Google Doc…");
    setPhase("analyzing");

    let sections: string[] = [];
    let sectionFormats: (Format | null)[] = [];
    let sectionSources: ("declared" | "inferred" | null)[] = [];
    let sectionConflicts: string[][] = [];
    try {
      // ---- Step 1: prepare — extract text and split into sections ----
      let preparePayload: Record<string, any> = { accessCode, expectedCount: n };
      if (file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(",")[1]);
          r.onerror = () => reject(new Error("File read failed"));
          r.readAsDataURL(file);
        });
        preparePayload.base64 = base64;
        preparePayload.filename = file.name;
      } else {
        preparePayload.gdocUrl = gdocUrl.trim();
      }

      const prepRes = await fetch("/api/divide-scripts/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify(preparePayload),
      });
      const prepText = await prepRes.text();
      let prepData: any = null;
      try { prepData = JSON.parse(prepText); } catch {
        throw new Error(
          prepRes.status === 504 || prepRes.status === 524
            ? "Reading the document timed out. Try a smaller file."
            : `Server returned a non-JSON response (${prepRes.status}). ${prepText.slice(0, 200)}`
        );
      }
      if (!prepRes.ok) throw new Error(prepData?.error || "Failed to read the document");

      sections = Array.isArray(prepData.sections) ? prepData.sections : [];
      if (sections.length === 0) {
        throw new Error(
          `Couldn't find any "Script N of M" headers in the document. Make sure each script begins with a line like "Script 1 of ${n}".`
        );
      }
      if (sections.length !== n) {
        throw new Error(
          `Detected ${sections.length} script section${sections.length === 1 ? "" : "s"} but you entered ${n}. Update the count or check that every script in the document starts with "Script N of ${sections.length}".`
        );
      }

      sectionFormats = (Array.isArray(prepData.sectionFormats) ? prepData.sectionFormats : []).map(
        (f: any) => (typeof f === "string" && f in FORMAT_LABEL ? (f as Format) : null)
      );
      while (sectionFormats.length < sections.length) sectionFormats.push(null);
      sectionSources = (Array.isArray(prepData.sectionFormatSources) ? prepData.sectionFormatSources : [])
        .map((s: any) => (s === "declared" || s === "inferred" ? s : null));
      sectionConflicts = (Array.isArray(prepData.sectionConflicts) ? prepData.sectionConflicts : [])
        .map((c: any) => (Array.isArray(c) ? c.map((x: any) => String(x)) : []));
      while (sectionConflicts.length < sections.length) sectionConflicts.push([]);
    } catch (e: any) {
      setError(e?.message || "Analysis failed");
      setPhase("count");
      setAnalyzing(false);
      setAnalyzeProgress(null);
      setAnalyzeStatus("");
      return;
    }

    const found = sectionFormats.filter(Boolean) as Format[];
    const unique = Array.from(new Set(found));

    // Every script is checked against the pick individually. Any script whose own
    // content is a different format, or which carries a field belonging to another
    // format, stops the run before a single AI call is spent.
    const mismatched = sectionFormats
      .map((f, i) => (f && f !== format ? i + 1 : null))
      .filter(Boolean) as number[];
    const conflictNotes = sectionConflicts
      .map((labels, i) =>
        labels.length ? `Script ${i + 1}: unexpected ${labels.join(", ")}` : null,
      )
      .filter(Boolean) as string[];
    const unidentified = sectionFormats
      .map((f, i) => (f ? null : i + 1))
      .filter(Boolean) as number[];

    if (mismatched.length > 0 || conflictNotes.length > 0) {
      setMismatch({
        docFormat: unique[0] || format,
        docFormats: unique,
        sections,
        sectionFormats,
        inferred: !sectionSources.includes("declared"),
        mismatched,
        conflictNotes,
      });
      setPhase("confirm");
      setAnalyzing(false);
      setAnalyzeStatus("");
      return;
    }

    if (unidentified.length > 0) {
      setMixedNote(
        `Script${unidentified.length === 1 ? "" : "s"} #${unidentified.join(", #")} ${unidentified.length === 1 ? "doesn't" : "don't"} carry the fields that identify a format, so ${unidentified.length === 1 ? "it" : "they"} will be read as ${FORMAT_LABEL[format]}. Check ${unidentified.length === 1 ? "that card" : "those cards"} before sending.`,
      );
    }

    await processSections(sections, sectionFormats, format, true);
  }

  async function resolveMismatch(useDocFormat: boolean) {
    const m = mismatch;
    if (!m || !format) return;
    setMismatch(null);
    const single = m.docFormats.length === 1 ? m.docFormats[0] : null;
    const chosen = useDocFormat && single ? single : format;
    if (useDocFormat && single) setFormat(single);
    await processSections(
      m.sections,
      useDocFormat ? m.sectionFormats : m.sectionFormats.map(() => null),
      chosen,
      useDocFormat,
    );
  }

  function cancelMismatch() {
    setMismatch(null);
    setPhase("count");
    setAnalyzing(false);
    setAnalyzeStatus("");
  }

  /** Step 2: one extraction call per section, then build the editable cards. */
  async function processSections(
    sections: string[],
    sectionFormats: (Format | null)[],
    fallbackFormat: Format,
    trustSectionFormat: boolean,
  ) {
    const formatFor = (i: number): Format => sectionFormats[i] || fallbackFormat;

    setAnalyzing(true);
    setPhase("analyzing");
    setAnalyzeStatus(`Found ${sections.length} scripts. Processing in parallel…`);
    setAnalyzeProgress({ done: 0, total: sections.length });

    try {
      const CONCURRENCY = 3;
      const results: any[] = new Array(sections.length);
      const errors: (string | null)[] = new Array(sections.length).fill(null);
      let cursor = 0;
      let completed = 0;

      const callSection = async (section: string, sectionFormat: Format, attempt: number): Promise<any> => {
        const r = await fetch("/api/divide-scripts/section", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({ section, format: sectionFormat, accessCode, trustSectionFormat }),
        });
        const txt = await r.text();
        let data: any = null;
        try { data = JSON.parse(txt); } catch {
          if (attempt < 2) throw new Error("retry");
          throw new Error(`Server returned non-JSON (${r.status})`);
        }
        if (!r.ok) {
          if (attempt < 2) throw new Error("retry");
          throw new Error(data?.error || `Section failed (${r.status})`);
        }
        return data.script;
      };

      const worker = async () => {
        while (true) {
          const i = cursor++;
          if (i >= sections.length) return;
          let lastErr: any = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              if (attempt > 0) {
                setAnalyzeStatus(`Retrying script ${i + 1} (attempt ${attempt + 1})…`);
              }
              results[i] = await callSection(sections[i], formatFor(i), attempt);
              lastErr = null;
              break;
            } catch (e: any) {
              lastErr = e;
              if (e?.message !== "retry" && attempt === 2) break;
              await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            }
          }
          if (lastErr) errors[i] = lastErr?.message || "Failed";
          completed++;
          setAnalyzeProgress({ done: completed, total: sections.length });
        }
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, sections.length) }, worker));

      const failed = errors.map((e, i) => (e ? i + 1 : null)).filter(Boolean) as number[];
      if (failed.length === sections.length) {
        throw new Error(`All scripts failed to process. Last error: ${errors.find(Boolean)}`);
      }

      // Auto-assignment is unchanged: the whole batch of a given format goes to the
      // same creative (the eligible person with the lowest current "To do" load).
      const assigneeCache = new Map<Format, Assignee | null>();
      const assigneeFor = (f: Format): Assignee | null => {
        if (assigneeCache.has(f)) return assigneeCache.get(f) ?? null;
        const spec = FORMAT_SPEC[f];
        const eligible = assigneeOptions
          .filter((o) => eligibleForFormat(f, o.role))
          .slice()
          .sort((a, b) => (a.todoCount ?? 0) - (b.todoCount ?? 0));
        const picked = spec.autoAssignRole && eligible.length ? eligible[0] : null;
        assigneeCache.set(f, picked);
        return picked;
      };

      // Carousel collapses slides into a single "Slides copy" text block on the card.
      const scripts: ScriptCard[] = results
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => !!s)
        .map(({ s, i }) => {
          const f = formatFor(i);
          const spec = FORMAT_SPEC[f];
          const slides = Array.isArray(s.slides) ? s.slides : [];
          const scriptText = f === "carousel" && slides.length
            ? slidesToCopyText(slides)
            : (s.script || "");
          const batchAssignee = assigneeFor(f);
          return {
            id: `c${Date.now()}_${i}`,
            topic: s.topic,
            visualHook: s.visualHook || "",
            script: scriptText,
            onScreenCta: s.onScreenCta || "",
            slides,
            inspo: s.inspo || "",
            filmingInstructions: s.filmingInstructions || "",
            creativeInstructions: s.creativeInstructions || "",
            assignees: batchAssignee ? [batchAssignee] : [],
            captions: s.captions || { instagram: "", facebook: "", tiktok: "", youtube: "" },
            formatKey: f,
            format: formatToAirtable(f),
            category: formatToCategory(f),
            clientStatus: spec.clientStatus,
            productionStatus: spec.productionStatus,
          };
        });

      setCards(scripts);
      setPhase("results");
      if (failed.length > 0) {
        setError(`${failed.length} script${failed.length === 1 ? "" : "s"} couldn't be processed (#${failed.join(", #")}). The rest are below — you can re-run to retry the failures.`);
      }
    } catch (e: any) {
      setError(e?.message || "Analysis failed");
      setPhase("count");
    } finally {
      setAnalyzing(false);
      setAnalyzeProgress(null);
      setAnalyzeStatus("");
    }
  }

  function updateCard(id: string, patch: Partial<ScriptCard>) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function updateCaption(id: string, key: keyof ScriptCard["captions"], value: string) {
    setCards((cs) =>
      cs.map((c) => (c.id === id ? { ...c, captions: { ...c.captions, [key]: value } } : c))
    );
  }
  function removeCard(id: string) {
    setCards((cs) => cs.filter((c) => c.id !== id));
  }

  async function sendOne(card: ScriptCard): Promise<boolean> {
    if (!brand) return false;
    updateCard(card.id, { sending: true, error: undefined });
    try {
      const cardFormat: Format = card.formatKey || (format as Format);
      const isCarousel = cardFormat === "carousel";
      const scriptPayload = isCarousel
        ? {
            kind: "carousel",
            // The edited document and structured slides are synchronized by the card.
            slidesCopy: card.script,
            slides: card.slides,
            inspo: card.inspo,
            filmingInstructions: card.filmingInstructions,
            creativeInstructions: card.creativeInstructions,
            assignees: card.assignees,
          }
        : {
            kind: "video",
            visualHook: card.visualHook,
            script: card.script,
            onScreenCta: card.onScreenCta,
            inspo: card.inspo,
            filmingInstructions: card.filmingInstructions,
            creativeInstructions: card.creativeInstructions,
            assignees: card.assignees,
            format: cardFormat,
          };
      const res = await fetch("/api/send-to-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode,
          topic: card.topic,
          brandId: brand.id,
          clientName: brand.name,
          format: cardFormat,
          requestId: `divide:${card.id}`,
          script: scriptPayload,
          captions: card.captions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Send failed");
      updateCard(card.id, { sending: false, sent: true });
      return true;
    } catch (e: any) {
      updateCard(card.id, { sending: false, error: e?.message || "Send failed" });
      return false;
    }
  }

  async function sendAll() {
    const pending = cards.filter((c) => !c.sent);
    if (!pending.length) return;
    setBatchSending(true);
    setBatchProgress({ done: 0, total: pending.length });
    let okCount = 0;
    let failCount = 0;
    for (let i = 0; i < pending.length; i++) {
      const ok = await sendOne(pending[i]);
      if (ok) okCount++;
      else failCount++;
      setBatchProgress({ done: i + 1, total: pending.length });
    }
    setBatchSending(false);
    // One Slack notification per batch when cards land with the creative team.
    const notifiable = pending.some((c) => (c.formatKey || format) !== "talkingVideo");
    if (okCount > 0 && notifiable) {
      fetch("/api/notify-edit-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, brandName: brand?.name, count: okCount }),
      }).catch(() => {});
    }
    if (failCount === 0) {
      setBatchSuccess(`✓ All ${okCount} script${okCount === 1 ? "" : "s"} added to production. Starting a fresh session…`);
      setTimeout(() => {
        setBatchSuccess(null);
        startOver();
      }, 1800);
    }
  }


  function startOver() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPhase("brand");
    setBrand(null);
    setPendingBrandId("");
    setFormat(null);
    setFile(null);
    setFileName(null);
    setCount("");
    setGdocUrl("");
    setCards([]);
    setMismatch(null);
    setMixedNote(null);
    setError(null);
  }

  const hasState = phase !== "brand" || !!brand || cards.length > 0 || !!fileName || !!format;

  return (
    <section className="bg-white min-h-full flex flex-col">
      {hasState && (
        <div className="flex justify-end border-b border-[#E5E5E8] px-6 py-3 md:px-8">
          <button
            onClick={startOver}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E8] px-3 py-2 text-[11px] text-[#1A1A1D]/65 transition-colors hover:border-[#1A1A1D]/25 hover:text-[#1A1A1D]"
            title="Restart from the beginning"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Start from scratch</span>
          </button>
        </div>
      )}

      <div className="bg-[#FAFAFB] flex-1">
        <ChatThread>
          <AiBubble>
            <p className="font-medium mb-1">Let's divide a scripts PDF into individual records.</p>
            <p className="text-[#5A5860]">
              I'll ask for the brand, the format, the PDF, and how many scripts I should find. Then I'll
              return one editable card per script and push them to Airtable.
            </p>
          </AiBubble>

          {/* Brand */}
          <AiBubble>
            <p className="mb-3">Which brand are these scripts for?</p>
            {brandLoading ? (
              <p className="text-[12px] text-[#5A5860] inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading brands…
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-w-md">
                <select
                  value={brand ? brand.id : pendingBrandId}
                  disabled={!!brand}
                  onChange={(e) => setPendingBrandId(e.target.value)}
                  className="bg-white border border-[#E5E5E8] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[#4F6BFF] disabled:opacity-60"
                >
                  <option value="">Select a brand…</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {!brand && (
                  <button
                    onClick={confirmBrand}
                    disabled={!pendingBrandId}
                    className="self-start bg-[#4F6BFF] text-white px-4 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm brand
                  </button>
                )}
                {brand && <span className="text-[12px] text-[#4F6BFF]">✓ Brand selected</span>}
              </div>
            )}
          </AiBubble>
          {brand && <UserBubble clientName={clientName}>{brand.name}</UserBubble>}

          {/* Format */}
          {phase !== "brand" && (
            <>
              <AiBubble>
                <p>What format are the scripts in?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => (
                    <button
                      key={f}
                      disabled={!!format && format !== f}
                      onClick={() => pickFormat(f)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border transition ${
                        format === f
                          ? "bg-[#4F6BFF] text-white border-[#4F6BFF]"
                          : "bg-white border-[#E5E5E8] hover:border-[#4F6BFF]/50"
                      }`}
                    >
                      {FORMAT_LABEL[f]}
                    </button>
                  ))}
                </div>
              </AiBubble>
              {format && <UserBubble clientName={clientName}>{FORMAT_LABEL[format]}</UserBubble>}
            </>
          )}

          {/* PDF */}
          {(phase === "pdf" || phase === "count" || phase === "analyzing" || phase === "confirm" || phase === "results") && (
            <>
              <AiBubble>
                <p>Upload a PDF or paste a Google Doc link that contains the scripts to divide.</p>
                {!file && fileName && !fileName.startsWith("Google Doc:") && (
                  <p className="mt-2 text-[12px] text-[#9b6b00]">
                    Previous file "{fileName}" was lost on refresh — please re-attach to continue.
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) pickFile(f);
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={phase !== "pdf" && phase !== "count"}
                      className="px-4 py-2 rounded-lg bg-[#1A1A1D] text-white text-[13px] disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> {file ? "PDF attached" : fileName && !fileName.startsWith("Google Doc:") ? "Re-attach PDF" : "Choose PDF"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#9B9BA1]">
                    <div className="flex-1 h-px bg-[#E5E5E8]" /> OR <div className="flex-1 h-px bg-[#E5E5E8]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={gdocUrl}
                      placeholder="https://docs.google.com/document/d/…"
                      disabled={phase !== "pdf" && phase !== "count"}
                      onChange={(e) => setGdocUrl(e.target.value)}
                      className="flex-1 bg-white border border-[#E5E5E8] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[#4F6BFF]/50 disabled:opacity-60"
                    />
                    <button
                      onClick={confirmGdoc}
                      disabled={!gdocUrl.trim() || (phase !== "pdf" && phase !== "count")}
                      className="px-3 py-2 rounded-md bg-[#4F6BFF] text-white text-[12px] disabled:opacity-50"
                    >
                      Use link
                    </button>
                  </div>
                </div>
              </AiBubble>
              {(file || fileName) && (
                <UserBubble clientName={clientName}>
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {file?.name || fileName}
                  </span>
                </UserBubble>
              )}
            </>
          )}

          {/* Count */}
          {(phase === "count" || phase === "analyzing" || phase === "confirm" || phase === "results") && (
            <AiBubble>
              <p>How many scripts should I find in this document?</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={count}
                  disabled={phase !== "count"}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="e.g. 10"
                  className="bg-white border border-[#E5E5E8] rounded-lg px-3 py-2 text-[14px] w-32 focus:outline-none focus:border-[#4F6BFF]/50"
                />
                <button
                  onClick={runAnalysis}
                  disabled={phase !== "count" || !count || (!file && !gdocUrl.trim())}
                  className="bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[13px] inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Divide scripts
                </button>
              </div>
            </AiBubble>
          )}

          {error && (
            <AiBubble>
              <p className="text-red-600 text-[13px]">{error}</p>
            </AiBubble>
          )}

          {phase === "analyzing" && (
            <>
              <TypingIndicator label={analyzeStatus || "Reading the document…"} />
              {analyzeProgress && (
                <div className="bg-white border border-[#E5E5E8] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#5A5860]">
                      Processed {analyzeProgress.done} of {analyzeProgress.total} scripts
                    </span>
                    <span className="text-[12px] font-semibold text-[#1A1A1D]">
                      {Math.round((analyzeProgress.done / analyzeProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F0F0F2] overflow-hidden">
                    <div
                      className="h-full bg-[#4F6BFF] transition-[width] duration-300"
                      style={{ width: `${(analyzeProgress.done / analyzeProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* The document disagrees with the pick — ask before spending any AI call. */}
          {phase === "confirm" && mismatch && (
            <AiBubble>
              {mismatch.mismatched.length > 0 ? (
                <p className="text-[13px]">
                  You asked for {FORMAT_LABEL[format!]} scripts, but{" "}
                  {mismatch.mismatched.length === mismatch.sections.length
                    ? "every script in this document"
                    : `script${mismatch.mismatched.length === 1 ? "" : "s"} #${mismatch.mismatched.join(", #")}`}{" "}
                  {mismatch.inferred ? "read as" : "say they are"}{" "}
                  {mismatch.docFormats.map((f) => FORMAT_LABEL[f]).join(" / ")}.
                </p>
              ) : (
                <p className="text-[13px]">
                  These read as {FORMAT_LABEL[format!]} scripts, but some carry fields that belong
                  to another format.
                </p>
              )}
              {mismatch.conflictNotes.length > 0 && (
                <ul className="mt-2 space-y-1 text-[12px] text-[#6B6B73]">
                  {mismatch.conflictNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[12px] text-[#6B6B73]">
                Nothing has been processed yet. Missing fields are fine, but a field from another
                format won't be forced into this one.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mismatch.mismatched.length > 0 && (
                  <button
                    onClick={() => resolveMismatch(true)}
                    className="bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] transition"
                  >
                    Use the document's format
                    {mismatch.docFormats.length > 1 ? "s" : ""}
                  </button>
                )}
                <button
                  onClick={() => resolveMismatch(false)}
                  className="bg-white border border-[#E5E5E8] px-4 py-2 rounded-lg text-[12px] hover:border-[#4F6BFF]/50 transition"
                >
                  Keep {format ? FORMAT_LABEL[format] : "my pick"}
                </button>
                <button
                  onClick={cancelMismatch}
                  className="bg-white border border-[#E5E5E8] px-4 py-2 rounded-lg text-[12px] hover:border-[#4F6BFF]/50 transition"
                >
                  Use a different document
                </button>
              </div>
            </AiBubble>
          )}

          {mixedNote && (phase === "analyzing" || phase === "results") && (
            <AiBubble>
              <p className="text-[13px]">{mixedNote}</p>
            </AiBubble>
          )}



          {phase === "results" && cards.length > 0 && (
            <>
              <AiBubble>
                <p>
                  I found {cards.length} script{cards.length === 1 ? "" : "s"}. Edit any field inline, then add
                  them to production individually or all at once.
                </p>
              </AiBubble>

              <div className="space-y-4">
                {cards.map((c, i) => (
                  <CardEditor
                    key={c.id}
                    card={c}
                    index={i + 1}
                    total={cards.length}
                    isGraphic={(c.formatKey || format) === "carousel" || (c.formatKey || format) === "graphic"}
                    contentFormat={c.formatKey || format}
                    assigneeOptions={assigneeOptions}
                    onChange={(patch) => updateCard(c.id, patch)}
                    onCaption={(k, v) => updateCaption(c.id, k, v)}
                    onRemove={() => removeCard(c.id)}
                    onSend={() => sendOne(c)}
                  />
                ))}
              </div>

              {batchSending && batchProgress && (
                <div className="bg-white border border-[#E5E5E8] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#5A5860]">
                      Adding {batchProgress.done} of {batchProgress.total} to production…
                    </span>
                    <span className="text-[12px] font-semibold text-[#1A1A1D]">
                      {Math.round((batchProgress.done / batchProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F0F0F2] overflow-hidden">
                    <div
                      className="h-full bg-[#4F6BFF] transition-[width] duration-300"
                      style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {batchSuccess && (
                <AiBubble>
                  <p className="text-emerald-700 font-medium">{batchSuccess}</p>
                </AiBubble>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={sendAll}
                  disabled={batchSending || cards.every((c) => c.sent)}
                  className="bg-[#1A1A1D] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {batchSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Add all to production
                </button>
              </div>
            </>
          )}
        </ChatThread>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1] mb-1"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#E5E5E8] rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#4F6BFF]/50 resize-y"
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-[#E5E5E8] rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#4F6BFF]/50"
    />
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-[#E5E5E8] rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#4F6BFF]/50"
    >
      {!options.includes(value) && value && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function CardEditor({
  card,
  index,
  total,
  isGraphic,
  contentFormat,
  assigneeOptions,
  onChange,
  onCaption,
  onRemove,
  onSend,
}: {
  card: ScriptCard;
  index: number;
  total: number;
  isGraphic: boolean;
  contentFormat: Format | null;
  assigneeOptions: Assignee[];
  onChange: (p: Partial<ScriptCard>) => void;
  onCaption: (k: keyof ScriptCard["captions"], v: string) => void;
  onRemove: () => void;
  onSend: () => void;
}) {
  const assigneeLabel = "Creative Assigned";
  const taken = new Set(card.assignees.map((a) => a.id));
  const eligibleIds = new Set(
    assigneeOptions.filter((o) => eligibleForFormat(contentFormat, o.role)).map((o) => o.id)
  );
  // Show eligible roles first, sorted by current "To do" load, then the rest alphabetically.
  const available = assigneeOptions
    .filter((o) => !taken.has(o.id))
    .slice()
    .sort((a, b) => {
      const ae = eligibleIds.has(a.id) ? 0 : 1;
      const be = eligibleIds.has(b.id) ? 0 : 1;
      if (ae !== be) return ae - be;
      if (ae === 0) return (a.todoCount ?? 0) - (b.todoCount ?? 0);
      return a.name.localeCompare(b.name);
    });
  return (
    <div className="bg-white border border-[#E5E5E8] rounded-2xl overflow-hidden">
      <div className="bg-[#F6F6F7] px-5 py-3 border-b border-[#E5E5E8] flex items-center justify-between">
        <p
          className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1]"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
        >
          Script {index} of {total}
        </p>
        <div className="flex items-center gap-3 text-[12px]">
          {card.sent && <span className="text-emerald-600 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Added</span>}
          {card.error && <span className="text-red-600">{card.error}</span>}
          <button onClick={onRemove} className="text-[#9B9BA1] hover:text-red-600" title="Remove">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Format"><Select value={card.format} options={FORMAT_OPTIONS} onChange={(v) => onChange({ format: v })} /></Field>
        <Field label="Category"><Select value={card.category} options={CATEGORY_OPTIONS} onChange={(v) => onChange({ category: v })} /></Field>
        <Field label="Client Status"><Select value={card.clientStatus} options={STATUS_OPTIONS} onChange={(v) => onChange({ clientStatus: v })} /></Field>
        <Field label="Production Status"><Select value={card.productionStatus} options={STATUS_OPTIONS} onChange={(v) => onChange({ productionStatus: v })} /></Field>
        <div className="md:col-span-2">
          <Field label={assigneeLabel}>
            <div className="flex flex-wrap items-center gap-2">
              {card.assignees.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1.5 bg-[#4F6BFF]/10 text-[#1A1A1D] border border-[#4F6BFF]/20 px-2 py-0.5 rounded-full text-[12px]">
                  {a.name}
                  <button
                    onClick={() => onChange({ assignees: card.assignees.filter((x) => x.id !== a.id) })}
                    className="text-[#4F6BFF]/70 hover:text-[#4F6BFF]"
                  >
                    ×
                  </button>
                </span>
              ))}
              {assigneeOptions.length === 0 ? (
                <span className="text-[12px] text-[#9B9BA1]">Loading team…</span>
              ) : available.length > 0 ? (
                <select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const found = assigneeOptions.find((o) => o.id === id);
                    if (found) onChange({ assignees: [...card.assignees, found] });
                  }}
                  className="bg-white border border-[#E5E5E8] rounded-md px-2 py-1 text-[12px] focus:outline-none focus:border-[#4F6BFF]/50"
                >
                  <option value="">+ Add {assigneeLabel.toLowerCase()}…</option>
                  {available.map((o) => {
                    const todo = typeof o.todoCount === "number" ? o.todoCount : 0;
                    const parts = [o.name];
                    if (o.role) parts.push(o.role);
                    parts.push(`${todo} to do`);
                    return <option key={o.id} value={o.id}>{parts.join(" · ")}</option>;
                  })}
                </select>
              ) : null}
            </div>
          </Field>
        </div>
        {contentFormat && (() => {
          const fields = FORMAT_SPEC[contentFormat].fields;
          const fieldSetters: Record<FieldKey, (v: string) => void> = {
            visualHook: (v) => onChange({ visualHook: v }),
            script: (v) => {
              if (contentFormat !== "carousel") {
                onChange({ script: v });
                return;
              }
              const count = Math.max(card.slides.length, 2);
              onChange({ script: v, slides: fieldsToStructured(parseCarouselDocument(v, count)) as Slide[] });
            },
            onScreenCta: (v) => onChange({ onScreenCta: v }),
            inspo: (v) => onChange({ inspo: v }),
            filmingInstructions: (v) => onChange({ filmingInstructions: v }),
            creativeInstructions: (v) => onChange({ creativeInstructions: v }),
          };
          const rowsFor = (f: FieldKey): number => {
            if (f === "script") return contentFormat === "carousel" ? 10 : 6;
            if (f === "visualHook" || f === "onScreenCta") return 2;
            return 3;
          };
          return fields.map((f) => (
            <div key={f} className="md:col-span-2">
              <Field label={getFieldLabel(f, contentFormat)}>
                <Input
                  value={readFieldValue(f, card)}
                  onChange={fieldSetters[f]}
                  multiline
                  rows={rowsFor(f)}
                />
              </Field>
            </div>
          ));
        })()}
        <Field label="IG Captions"><Input value={card.captions.instagram} onChange={(v) => onCaption("instagram", v)} multiline rows={3} /></Field>
        <Field label="FB Captions"><Input value={card.captions.facebook} onChange={(v) => onCaption("facebook", v)} multiline rows={3} /></Field>
        <Field label="TikTok Captions"><Input value={card.captions.tiktok} onChange={(v) => onCaption("tiktok", v)} multiline rows={3} /></Field>
        <Field label="YouTube Captions"><Input value={card.captions.youtube} onChange={(v) => onCaption("youtube", v)} multiline rows={3} /></Field>
      </div>

      <div className="px-5 py-3 border-t border-[#E5E5E8] flex justify-end">
        <button
          onClick={onSend}
          disabled={card.sending || card.sent}
          className="bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[12px] font-medium inline-flex items-center gap-2 disabled:opacity-50 hover:bg-[#6C7BFF] transition"
        >
          {card.sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {card.sent ? "Added to production" : "Add to production"}
        </button>
      </div>
    </div>
  );
}
