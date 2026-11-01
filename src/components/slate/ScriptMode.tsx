import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import {
  FileText,
  AlertCircle,
  Paperclip,
  RefreshCw,
  ArrowLeft,
  Download,
  Loader2,
  Check,
  ExternalLink,
} from "lucide-react";
const DocIcon = FileText;
import jsPDF from "jspdf";
import type { Prompts, Brief, Format, DesignSubtype } from "@/lib/simplex/types";
import { extractBriefFromPDF } from "@/lib/simplex/api";
import {
  deriveSingleScriptTopic,
  type ChatPhase,
  type Topic,
  type Hook,
  type ScriptDoc,
  type Caption,
} from "@/lib/slate/scriptChat";
import {
  FORMAT_DOC_LABEL,
  FORMAT_SPEC,
  getDocHeading,
  readExportFieldValue,
  type FieldKey,
  type FormatKey,
} from "@/lib/slate/formatFields";
import { FORMAT_BALANCE_LABELS, getHighestNeedFormat } from "@/lib/slate/formatBalance";
import { assignBalancedCarouselSubtypes } from "@/lib/slate/designTemplates";
import { ChatThread } from "./chat/ChatThread";
import { AiBubble } from "./chat/AiBubble";
import { UserBubble } from "./chat/UserBubble";
import { QuickReplyPills } from "./chat/QuickReplyPills";
import { DocCard } from "./chat/DocCard";
import { ScriptCard } from "./chat/ScriptCard";
import { ScriptCardWriting } from "./chat/ScriptCardWriting";
import { TypingIndicator } from "./chat/TypingIndicator";
import { ChatInput, type AttachKind } from "./chat/ChatInput";
import { useBrandGuidance, StrategyStrip, BrandInfoGate } from "./StrategyStrip";
import {
  ScriptShell,
  ModeQuestion,
  ScriptBrandPicker,
  SessionView,
  type RailView,
  type SessionSummary,
} from "./ScriptRail";
import { Button } from "@/components/ui/button";
import { TranscriptReadOnly } from "./chat/TranscriptContext";
import { savedTranscript, createSessionSaveQueue } from "@/lib/slate/writerTranscript";
import { startAiDesign } from "@/lib/slate/aiDesignJobs";
import { createSessionStarter, hasSelectedWriterFormat } from "@/lib/slate/writerSessionLifecycle";
import {
  completeVariationPair,
  createWriterActionLock,
  plannerActionLabel,
  hookPair,
  liveVariations,
  orderedVariations,
  progressTone,
  writerProgress,
} from "@/lib/slate/variationFlow";
import type { PlannerChoice } from "@/lib/slate/formatFields";
import { AddToPlannerDialog } from "./chat/AddToPlannerDialog";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyBrands } from "@/lib/brands.functions";
import { autoBrand, type ScriptBrand } from "@/lib/slate/scriptBrands";
import { SingleScriptForm } from "./chat/SingleScriptForm";
import { applySelectedCta } from "@/lib/slate/scriptCta";
import { cleanHookOptions, needsVisualHookChoice } from "@/lib/slate/captionBatch";
import { CtaDecisionCard } from "./chat/CtaDecisionCard";

function renderRationale(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a
        key={`l${i++}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-[#1A1A1D] hover:text-[#5A5860]"
      >
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function HookRepromptBox({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-2 border border-[#E5E5E8] rounded-lg p-3 bg-[#F6F6F7]/50">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="What should change? e.g. punchier, different angle, less clinical…"
        className="w-full bg-white border border-[#E5E5E8] rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#4F6BFF]/50"
      />
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onCancel} className="text-[12px] text-[#5A5860] px-3 py-1.5">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(text.trim())}
          className="text-[12px] bg-[#1A1A1D] text-[#F6F6F7] px-3 py-1.5 rounded-lg"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}

const SCRIPT_REPROMPT_PRESETS = [
  "Punchier, cut the fluff",
  "Different angle on the same idea",
  "Shorter",
  "Longer, more detail",
  "Less clinical, more conversational",
  "Make it more specific with examples",
];

/**
 * Inline rewrite panel shown inside the decision bubble. Picking "Reprompt"
 * used to only print a message asking the user to type in chat; now the same
 * click gives one-tap directions plus a free-text box that fires the rewrite.
 */
function ScriptRepromptPanel({
  busy,
  onCancel,
  onSubmit,
}: {
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const submit = (value: string) => {
    const v = value.trim();
    if (!v || busy) return;
    onSubmit(v);
  };
  return (
    <div className="mt-3 border border-[#E5E5E8] rounded-xl p-3 bg-white">
      <p className="text-[12px] font-semibold text-[#1A1A1D]">What should change?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SCRIPT_REPROMPT_PRESETS.map((p) => (
          <button
            key={p}
            disabled={busy}
            onClick={() => submit(p)}
            className="px-2.5 py-1 rounded-full text-[11.5px] border border-[#E5E5E8] bg-white text-[#1A1A1D] hover:border-[#4F6BFF] hover:text-[#4F6BFF] disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        disabled={busy}
        placeholder="Or write your own direction…"
        className="mt-2 w-full bg-white border border-[#E5E5E8] rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#4F6BFF]/50"
      />
      <div className="flex justify-end items-center gap-2 mt-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="text-[12px] text-[#5A5860] px-3 py-1.5 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => submit(text)}
          disabled={busy || !text.trim()}
          className="text-[12px] bg-[#4F6BFF] text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {busy ? "Rewriting…" : "Rewrite script"}
        </button>
      </div>
    </div>
  );
}

function normalizedEditableText(text: string): string {
  return text.replace(/\u00A0/g, " ").replace(/\n$/, "");
}

// The model returns markdown. The session brief box is a plain-text editor, so
// convert markdown syntax into clean readable text: headings become uppercase
// lines (rendered bold), bold/italic markers are stripped, bullets normalised.
function plainifyBriefMarkdown(md: string): string {
  return String(md || "")
    .replace(/\r\n/g, "\n")
    .replace(/```+/g, "")
    .split("\n")
    .map((raw) => {
      let line = raw.replace(/\t/g, "  ");
      const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
      if (heading) {
        return heading[2]
          .replace(/[*_`#]+/g, "")
          .trim()
          .toUpperCase();
      }
      line = line.replace(/^(\s*)[-*+]\s+/, "$1• ");
      line = line.replace(/\*\*(.+?)\*\*/g, "$1");
      line = line.replace(/__(.+?)__/g, "$1");
      line = line.replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$|[.,;:!?])/g, "$1$2");
      line = line.replace(/`([^`]+)`/g, "$1");
      line = line.replace(/^\s*>\s?/, "");
      line = line.replace(/^\s*[-–—]{3,}\s*$/, "");
      return line.replace(/[*_`]+/g, "").replace(/\s+$/, "");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function SessionBriefDraftEditor({
  value,
  disabled,
  onInputValue,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  onInputValue: (draft: string) => void;
  onCommit: (draft: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const readValue = () => normalizedEditableText(editorRef.current?.innerText || "");

  const renderLine = (line: string, i: number) => {
    const isNotice = line.includes("[INFERRED-NOTICE]");
    const isInferred = !isNotice && line.includes("[INFERRED]");
    const clean = line
      .replace("[INFERRED-NOTICE]", "")
      .replace("[INFERRED]", isInferred ? "INFERRED —" : "")
      .trimStart();
    if (isNotice) {
      return (
        <div key={i} className="text-[#D92D20] font-medium whitespace-pre-wrap">
          ⚠️ {clean || "\u00A0"}
        </div>
      );
    }
    if (isInferred) {
      return (
        <div key={i} className="text-[#D92D20] whitespace-pre-wrap">
          {clean || "\u00A0"}
        </div>
      );
    }
    const isHeading = /^[A-Z0-9][A-Z0-9 '’&/\-.,()]*$/.test(line.trim()) && line.trim().length > 2;
    return (
      <div
        key={i}
        className={
          isHeading
            ? "whitespace-pre-wrap mt-3 text-[11px] uppercase tracking-[.14em] text-[#1A1A1D] font-semibold"
            : "whitespace-pre-wrap"
        }
      >
        {line || "\u00A0"}
      </div>
    );
  };

  return (
    <div
      ref={editorRef}
      role="textbox"
      aria-multiline="true"
      tabIndex={disabled ? -1 : 0}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={() => onInputValue(readValue())}
      onBlur={() => onCommit(readValue())}
      className="w-full bg-white border border-[#E5E5E8] rounded-lg px-3 py-2 text-[13px] leading-snug text-[#1A1A1D] focus:outline-none focus:border-[#4F6BFF] disabled:opacity-70 disabled:bg-[#F6F6F7] max-h-[520px] min-h-[260px] overflow-auto"
    >
      {value.split(/\r?\n/).map(renderLine)}
    </div>
  );
}

type FinalActionStatus = {
  status: "idle" | "loading" | "done" | "error";
  url?: string;
  error?: string;
};
type FinalActionsMsg = {
  id: string;
  content: string;
  gdoc: FinalActionStatus;
  pdf: FinalActionStatus;
  production: FinalActionStatus;
};

function FinalActionsCard({
  msg,
  onGdoc,
  onPdf,
  onProduction,
  isAdmin = false,
  format,
  assignees = [],
  onEditMyself,
}: {
  msg: FinalActionsMsg;
  onGdoc: () => void;
  onPdf: () => void;
  onProduction: (opts?: { assigneeId?: string; assignTo?: "risevoice" }) => void;
  isAdmin?: boolean;
  format?: Format | null;
  assignees?: { id: string; name: string; email?: string }[];
  onEditMyself?: () => void;
}) {
  const [prodChoice, setProdChoice] = useState<"none" | "choose" | "assign">("none");
  const [pickedAssignee, setPickedAssignee] = useState("");

  const PrimaryButton = ({
    onClick,
    status,
    idleLabel,
    doneLabel,
    icon,
    doneHref,
  }: {
    onClick: () => void;
    status: FinalActionStatus;
    idleLabel: string;
    doneLabel: string;
    icon: ReactNode;
    doneHref?: string;
  }) => {
    if (status.status === "done") {
      const body = (
        <span className="inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {doneLabel}
          {doneHref && <ExternalLink className="w-3.5 h-3.5" />}
        </span>
      );
      return doneHref ? (
        <a
          href={doneHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-[#E7F5EC] text-[#16A34A] border border-[#BBE7C6] px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[#D9EFE0] transition"
        >
          {body}
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 bg-[#E7F5EC] text-[#16A34A] border border-[#BBE7C6] px-3 py-1.5 rounded-lg text-[12px] font-medium">
          {body}
        </span>
      );
    }
    return (
      <button
        onClick={onClick}
        disabled={status.status === "loading"}
        className="inline-flex items-center gap-1.5 bg-white text-[#1A1A1D] border border-[#E5E5E8] px-3 py-1.5 rounded-lg text-[12px] font-medium hover:border-[#4F6BFF] hover:text-[#4F6BFF] disabled:opacity-60 transition"
      >
        {status.status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
        {status.status === "loading"
          ? "Working…"
          : status.status === "error"
            ? `Retry — ${idleLabel}`
            : idleLabel}
      </button>
    );
  };

  const zipButton = (
    <button
      onClick={onPdf}
      disabled={msg.pdf.status === "loading"}
      className="inline-flex items-center gap-1.5 bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] disabled:opacity-70 transition"
    >
      {msg.pdf.status === "loading" ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : msg.pdf.status === "done" ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {msg.pdf.status === "loading"
        ? "Preparing ZIP…"
        : msg.pdf.status === "done"
          ? "Scripts downloaded"
          : msg.pdf.status === "error"
            ? "Retry — Download scripts (ZIP)"
            : "Download scripts (ZIP)"}
    </button>
  );

  // B-roll, carousels and graphics don't need filming: the batch either goes
  // straight into production or the client edits/designs it themselves.
  const isProductionFormat = format === "broll" || format === "carousel" || format === "graphic";

  if (!isAdmin && isProductionFormat) {
    const busy = msg.production.status === "loading";
    const sent = msg.production.status === "done";
    return (
      <AiBubble>
        {msg.content && <p>{msg.content}</p>}
        {sent ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#16A34A]">
            <Check className="w-3.5 h-3.5" /> Cards created and assigned. You can track them in
            Approve &amp; Post.
          </p>
        ) : prodChoice === "choose" ? (
          <div className="mt-3 space-y-3">
            <p className="text-[12px] text-[#6B6B72]">Who should this batch be assigned to?</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setProdChoice("assign")}
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-white text-[#1A1A1D] border border-[#E5E5E8] px-4 py-2 rounded-lg text-[12px] font-medium hover:border-[#4F6BFF] hover:text-[#4F6BFF] disabled:opacity-60 transition"
              >
                Assign to my {format === "graphic" || format === "carousel" ? "designer" : "editor"}
              </button>
              <button
                onClick={() => onProduction({ assignTo: "risevoice" })}
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] disabled:opacity-70 transition"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {busy ? "Creating…" : "Assign to Risevoice"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setProdChoice("none")}
                disabled={busy}
                className="text-[12px] text-[#6B6B72] underline hover:text-[#1A1A1D] disabled:opacity-60"
              >
                Go back
              </button>
            </div>
          </div>
        ) : prodChoice === "assign" ? (
          <div className="mt-3 space-y-3">
            <p className="text-[12px] text-[#6B6B72]">Who should handle this batch?</p>
            <div className="rounded-xl border border-[#E5E5E8] bg-white p-3 space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6B6B72]">
                Assign to my {format === "graphic" || format === "carousel" ? "designer" : "editor"}
              </label>
              <select
                value={pickedAssignee}
                onChange={(e) => setPickedAssignee(e.target.value)}
                disabled={busy}
                className="w-full bg-white border border-[#E5E5E8] rounded-lg px-3 py-2 text-[13px] text-[#1A1A1D] focus:outline-none focus:border-[#4F6BFF]"
              >
                <option value="">Select a person…</option>
                {assignees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {!assignees.length && (
                <p className="text-[11px] text-[#6B6B72]">
                  No teammates found on your account yet.
                </p>
              )}
              <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                <button
                  onClick={() => onProduction({ assigneeId: pickedAssignee })}
                  disabled={busy || !pickedAssignee}
                  className="inline-flex items-center gap-1.5 bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] disabled:opacity-60 transition"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {busy ? "Creating…" : "Create and assign"}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setProdChoice("choose")}
                  disabled={busy}
                  className="text-[12px] text-[#6B6B72] underline hover:text-[#1A1A1D] disabled:opacity-60"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
            <button
              onClick={() => onEditMyself?.()}
              disabled={msg.pdf.status === "loading"}
              className="inline-flex items-center gap-1.5 bg-white text-[#1A1A1D] border border-[#E5E5E8] px-4 py-2 rounded-lg text-[12px] font-medium hover:border-[#4F6BFF] hover:text-[#4F6BFF] disabled:opacity-60 transition"
            >
              {msg.pdf.status === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {msg.pdf.status === "loading" ? "Preparing ZIP…" : "Edit myself"}
            </button>
            <button
              onClick={() => setProdChoice("choose")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-[#4F6BFF] text-white px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] disabled:opacity-70 transition"
            >
              Send to production
            </button>
          </div>
        )}
        {(msg.production.status === "error" || msg.pdf.status === "error") && (
          <p className="mt-2 text-[12px] text-[#DC2626]">
            {msg.production.error || msg.pdf.error || "Something went wrong. Please try again."}
          </p>
        )}
      </AiBubble>
    );
  }

  if (!isAdmin) {
    return (
      <AiBubble>
        {msg.content && <p>{msg.content}</p>}
        <div className="mt-3 flex items-center gap-2 flex-wrap">{zipButton}</div>
        {msg.pdf.status === "error" && (
          <p className="mt-2 text-[12px] text-[#DC2626]">
            {msg.pdf.error || "Something went wrong. Please try again."}
          </p>
        )}
      </AiBubble>
    );
  }

  return (
    <AiBubble>
      {msg.content && <p>{msg.content}</p>}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <PrimaryButton
          onClick={onGdoc}
          status={msg.gdoc}
          idleLabel="Create Google doc"
          doneLabel="Open Google doc"
          icon={<DocIcon className="w-3.5 h-3.5" />}
          doneHref={msg.gdoc.url}
        />
        <PrimaryButton
          onClick={onPdf}
          status={msg.pdf}
          idleLabel="Download scripts (ZIP)"
          doneLabel="Scripts downloaded"
          icon={<Download className="w-3.5 h-3.5" />}
        />
      </div>
      {(msg.gdoc.status === "error" || msg.pdf.status === "error") && (
        <p className="mt-2 text-[12px] text-[#DC2626]">{msg.gdoc.error || msg.pdf.error}</p>
      )}
    </AiBubble>
  );
}

type Message =
  | { id: string; role: "ai"; kind: "text"; content: string }
  | {
      id: string;
      role: "ai";
      kind: "pills";
      content: string;
      options: {
        label: string;
        value: any;
        tone?: "priority" | "primary" | "approval";
        disabled?: boolean;
      }[];
      pickedValue?: any;
      gridCols?: number;
      /** Inline rewrite panel open on this decision bubble. */
      repromptOpen?: boolean;
      repromptBusy?: boolean;
    }
  | { id: string; role: "ai"; kind: "askBriefCta"; content: string }
  | {
      id: string;
      role: "ai";
      kind: "ctaDecision";
      content: string;
      completed?: boolean;
      selectedCta?: string;
    }
  | {
      id: string;
      role: "ai";
      kind: "brandSnapshot";
      content: string;
      topicsToPrioritize?: string;
      languageToIncorporate?: string;
      languageToAvoid?: string;
    }
  | {
      id: string;
      role: "ai";
      kind: "brandPicker";
      content: string;
      brands?: { id: string; name: string }[];
      selectedId?: string;
      confirmed?: boolean;
      loading?: boolean;
      error?: string;
    }
  | {
      id: string;
      role: "ai";
      kind: "existingBriefPicker";
      content: string;
      filename: string;
      brandId: string;
      resolved?: "used" | "replaced";
    }
  | {
      id: string;
      role: "ai";
      kind: "briefSummaryEditor";
      content: string;
      draft: string;
      approved?: boolean;
    }
  | { id: string; role: "ai"; kind: "typing"; label?: string }
  | { id: string; role: "user"; kind: "text"; content: string; plannerRecordId?: string }
  | { id: string; role: "user"; kind: "fileChip"; content: { name: string; label: string } }
  | {
      id: string;
      role: "ai";
      kind: "topicList";
      topics: Topic[];
      content?: string;
      selected: number[];
      approved?: boolean;
    }
  | {
      id: string;
      role: "ai";
      kind: "hookList";
      hooks: Hook[];
      approved?: boolean;
      approvedFlags?: boolean[];
      repromptOpen?: number | null;
      regenIndex?: number | null;
      globalRepromptOpen?: boolean;
    }
  | {
      id: string;
      role: "ai";
      kind: "script";
      index: number;
      total: number;
      topic: string;
      script: ScriptDoc;
      status: "sample" | "approved" | "queued";
      scriptType: "fleshed" | "framework";
      variantLabel?: string;
      editCount: number;
      captions?: Caption;
      /** Topic position this card is a variation for. */
      variantGroup?: number;
      chosen?: boolean;
      discarded?: boolean;
      plannerAdded?: boolean;
      completed?: boolean;
    }
  | { id: string; role: "ai"; kind: "scriptWriting"; index: number; total: number; topic: string }
  | {
      id: string;
      role: "ai";
      kind: "creditError";
      content: string;
      retry: { index: number; isSample: boolean; scriptType: "fleshed" | "framework" };
    }
  | { id: string; role: "ai"; kind: "newBatchCta"; content: string }
  | { id: string; role: "ai"; kind: "progress"; label: string; current: number; total: number }
  | {
      id: string;
      role: "ai";
      kind: "finalActions";
      content: string;
      gdoc: { status: "idle" | "loading" | "done" | "error"; url?: string; error?: string };
      pdf: { status: "idle" | "loading" | "done" | "error"; error?: string };
      production: { status: "idle" | "loading" | "done" | "error"; error?: string };
    }
  | { id: string; role: "ai"; kind: "error"; content: string };

type State = {
  phase: ChatPhase;
  messages: Message[];
  format: Format | null;
  designSubtype: DesignSubtype | null;
  brief: Brief | null;
  seedReport: any | null;
  count: number;
  topicsMode: "suggest" | "have" | null;
  topics: Topic[];
  selectedTopics: number[];
  hooks: Hook[];
  cta: string;
  scriptType: "fleshed" | "framework" | "both" | null;
  scripts: ScriptDoc[];
  pendingBatchReprompt: string | null;
  captions: Caption[];
  loading: boolean;
  brandId: string | null;
  brandName: string | null;
  existingBrief: { url: string; filename: string } | null;
  adminBriefSummary: string | null;
  recentPostsDigest: string | null;
  hasStarted: boolean;
  /** Snapshots of earlier decision points so the user can step back one choice. */
  history: { label: string; snapshot: State }[];
};

type Action =
  | { type: "APPEND"; msg: Message }
  | { type: "APPEND_MANY"; messages: Message[] }
  | { type: "UPDATE_MSG"; id: string; patch: Partial<Message> }
  | { type: "REMOVE_MSG"; id: string }
  | { type: "SET_PHASE"; phase: ChatPhase }
  | { type: "PICK_FORMAT"; format: Format }
  | { type: "SET_DESIGN_SUBTYPE"; value: DesignSubtype }
  | { type: "SET_BRIEF"; brief: Brief | null }
  | { type: "SET_COUNT"; count: number }
  | { type: "SET_TOPICS_MODE"; mode: "suggest" | "have" }
  | { type: "SET_TOPICS"; topics: Topic[] }
  | { type: "TOGGLE_TOPIC"; msgId: string; index: number }
  | { type: "SET_SELECTED_TOPICS"; indices: number[] }
  | { type: "SET_HOOKS"; hooks: Hook[] }
  | { type: "SET_CTA"; value: string }
  | { type: "SET_SCRIPT_TYPE"; value: "fleshed" | "framework" | "both" }
  | { type: "PUSH_SCRIPT"; script: ScriptDoc }
  | { type: "REPLACE_SCRIPT"; index: number; script: ScriptDoc }
  | { type: "SET_CAPTIONS"; captions: Caption[] }
  | { type: "SET_BATCH_REPROMPT"; v: string | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_SEED"; seed: any }
  | { type: "SET_BRAND"; id: string; name: string }
  | { type: "SET_EXISTING_BRIEF"; brief: { url: string; filename: string } | null }
  | { type: "SET_ADMIN_SUMMARY"; summary: string | null; digest: string | null }
  | { type: "START_SCRIPTING" }
  | { type: "MOVE_SCRIPTS_LAST" }
  | { type: "ORDER_VARIATIONS"; group: number }
  | { type: "NEW_FORMAT_BATCH"; format: Format }
  | { type: "CHECKPOINT"; label: string }
  | { type: "UNDO" }
  | { type: "RESET" };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const INITIAL: State = {
  phase: "askFormat",
  messages: [],
  format: null,
  designSubtype: null,
  brief: null,
  seedReport: null,
  count: 5,
  topicsMode: null,
  topics: [],
  selectedTopics: [],
  hooks: [],
  cta: "",
  scriptType: null,
  scripts: [],
  pendingBatchReprompt: null,
  captions: [],
  loading: false,
  brandId: null,
  brandName: null,
  existingBrief: null,
  adminBriefSummary: null,
  recentPostsDigest: null,
  hasStarted: false,
  history: [],
};

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "APPEND":
      return { ...state, messages: [...state.messages, a.msg] };
    case "APPEND_MANY":
      return { ...state, messages: [...state.messages, ...a.messages] };
    case "UPDATE_MSG":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === a.id ? ({ ...m, ...a.patch } as Message) : m,
        ),
      };
    case "REMOVE_MSG":
      return { ...state, messages: state.messages.filter((m) => m.id !== a.id) };
    case "SET_PHASE":
      return { ...state, phase: a.phase };
    case "PICK_FORMAT":
      return { ...state, format: a.format, designSubtype: null };
    case "SET_DESIGN_SUBTYPE":
      return { ...state, designSubtype: a.value };
    case "SET_BRIEF":
      return { ...state, brief: a.brief };
    case "SET_COUNT":
      return { ...state, count: a.count };
    case "SET_TOPICS_MODE":
      return { ...state, topicsMode: a.mode };
    case "SET_TOPICS":
      return { ...state, topics: a.topics };
    case "TOGGLE_TOPIC": {
      const msgs = state.messages.map((m) => {
        if (m.id !== a.msgId || m.kind !== "topicList") return m;
        const has = m.selected.includes(a.index);
        if (has) {
          return { ...m, selected: m.selected.filter((x) => x !== a.index) };
        }
        if (m.selected.length >= state.count) return m; // cap
        return { ...m, selected: [...m.selected, a.index] };
      });
      return { ...state, messages: msgs };
    }
    case "SET_SELECTED_TOPICS":
      return { ...state, selectedTopics: a.indices };
    case "SET_HOOKS":
      return { ...state, hooks: a.hooks };
    case "SET_CTA":
      return { ...state, cta: a.value };
    case "SET_SCRIPT_TYPE":
      return { ...state, scriptType: a.value };
    case "PUSH_SCRIPT":
      return { ...state, scripts: [...state.scripts, a.script] };
    case "REPLACE_SCRIPT": {
      const arr = [...state.scripts];
      arr[a.index] = a.script;
      return { ...state, scripts: arr };
    }
    case "SET_CAPTIONS":
      return { ...state, captions: a.captions };
    case "SET_BATCH_REPROMPT":
      return { ...state, pendingBatchReprompt: a.v };
    case "SET_LOADING":
      return { ...state, loading: a.loading };
    case "SET_SEED":
      return { ...state, seedReport: a.seed };
    case "SET_BRAND":
      return { ...state, brandId: a.id, brandName: a.name };
    case "SET_EXISTING_BRIEF":
      return { ...state, existingBrief: a.brief };
    case "SET_ADMIN_SUMMARY":
      return { ...state, adminBriefSummary: a.summary, recentPostsDigest: a.digest };
    case "START_SCRIPTING":
      return { ...state, hasStarted: true };
    case "MOVE_SCRIPTS_LAST": {
      const scripts = state.messages.filter((m) => m.kind === "script");
      const rest = state.messages.filter((m) => m.kind !== "script");
      return { ...state, messages: [...rest, ...scripts] };
    }
    case "ORDER_VARIATIONS": {
      const pair = orderedVariations(
        state.messages.filter(
          (m): m is Extract<Message, { kind: "script" }> => m.kind === "script",
        ),
        a.group,
      );
      const ids = new Set(pair.map((m: any) => m.id));
      const firstIndex = state.messages.findIndex((m) => ids.has(m.id));
      if (firstIndex < 0) return state;
      const rest = state.messages.filter((m) => !ids.has(m.id));
      rest.splice(firstIndex, 0, ...pair);
      return { ...state, messages: rest };
    }
    case "NEW_FORMAT_BATCH":
      // Start a fresh batch for a new format while keeping the approved session
      // brief, brand context and the conversation history.
      return {
        ...state,
        format: a.format,
        designSubtype: null,
        topicsMode: null,
        topics: [],
        selectedTopics: [],
        hooks: [],
        cta: "",
        scriptType: null,
        scripts: [],
        captions: [],
        pendingBatchReprompt: null,
        messages: state.messages,
      };
    case "CHECKPOINT": {
      const snapshot: State = {
        ...state,
        history: [],
        messages: state.messages.filter((m) => m.kind !== "typing" && m.kind !== "scriptWriting"),
      };
      return { ...state, history: [...state.history, { label: a.label, snapshot }].slice(-6) };
    }
    case "UNDO": {
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      return { ...last.snapshot, history: state.history.slice(0, -1) };
    }
    case "RESET":
      return INITIAL;
    default:
      return state;
  }
}

/** Decision steps the user can step back from (never approvals or writing). */
const UNDOABLE_PHASES: ChatPhase[] = [
  "askFormat",
  "askCount",
  "askTopicsMode",
  "approveTopics",
  "approveHooks",
  "askCta",
  "askSlides",
  "askScriptType",
];

const DECISION_LABELS: Partial<Record<ChatPhase, string>> = {
  askFormat: "format choice",
  askCount: "batch size",
  askTopicsMode: "topics choice",
  approveTopics: "topic selection",
  approveHooks: "hook selection",
  askCta: "CTA",
  askSlides: "slides per carousel",
  askScriptType: "script style",
};

function phaseLabel(p: ChatPhase) {
  if (p === "generatingHooks") return "preparing script options";
  return p.replace(/([A-Z])/g, " $1").toLowerCase();
}

type ScriptModeProps = {
  clientName: string;
  accessCode?: string;
  prompts: Prompts;
  seedReport?: any | null;
  seedAccount?: string;
  seedCreatedAt?: string;
  onCreditsChange?: () => void;
  isAdmin?: boolean;
  onGoToBrief?: () => void;
  /** Open a saved History session on mount (e.g. a Bank of Inspo repurpose). */
  openSessionId?: string | null;
};

export function ScriptMode({
  clientName,
  accessCode = "",
  prompts,
  seedReport,
  seedAccount,
  seedCreatedAt = "",
  onCreditsChange,
  isAdmin = false,
  onGoToBrief,
  openSessionId,
}: ScriptModeProps) {
  const listBrands = useServerFn(listMyBrands);
  const brandsQuery = useQuery({
    queryKey: ["my-brands", accessCode],
    queryFn: () => listBrands({ data: { accessCode } }),
    enabled: Boolean(accessCode) && !isAdmin,
    staleTime: 30000,
  });
  const scriptBrands: ScriptBrand[] = (brandsQuery.data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    brandIds: b.brandIds || [],
  }));
  const [scriptBrand, setScriptBrand] = useState<ScriptBrand | null>(null);
  useEffect(() => {
    if (!scriptBrand) {
      const only = autoBrand(scriptBrands);
      if (only) setScriptBrand(only);
    }
  }, [brandsQuery.data, scriptBrand]);
  const { guidance, loading: guidanceLoading, setGuidance } = useBrandGuidance(
    accessCode,
    scriptBrand?.id,
  );
  const [railView, setRailView] = useState<RailView>(
    openSessionId ? { kind: "session", id: openSessionId } : { kind: "writer" },
  );
  const [writeMode, setWriteMode] = useState<"single" | "batch" | null>(null);
  const [openingSession, setOpeningSession] = useState(Boolean(openSessionId));
  const [restoreSessionId, setRestoreSessionId] = useState(openSessionId);
  const actionLock = useRef(createWriterActionLock());
  const [actionBusy, setActionBusy] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const hookPreparationRef = useRef<Promise<Hook[] | null> | null>(null);
  function beginWriterAction() {
    if (writingRef.current || !actionLock.current.acquire()) return false;
    setActionBusy(true);
    return true;
  }
  function endWriterAction() {
    actionLock.current.release();
    setActionBusy(false);
  }
  const [plannerFor, setPlannerFor] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(null);
  // Once a session exists it lives under its History entry, like ChatGPT/Claude.
  const activeSessionId = activeSession?.id;
  // Autosave reads the session through a ref so a successful save updating the
  // object never re-triggers the save effect (that caused a nonstop save loop).
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;
  const lastSavedPayloadRef = useRef<{ id: string; payload: string } | null>(null);
  useEffect(() => {
    if (activeSessionId)
      setRailView((v) => (v.kind === "writer" ? { kind: "session", id: activeSessionId } : v));
  }, [activeSessionId]);
  const [sessionsRefresh, setSessionsRefresh] = useState(0);
  const sessionStartRef = useRef<(() => Promise<SessionSummary>) | null>(null);
  const sessionGeneration = useRef(0);
  const saveQueue = useRef(createSessionSaveQueue());
  const repurposedFrom = useRef<string | undefined>(undefined);
  const [sessionSaveError, setSessionSaveError] = useState("");
  const sessionRestored = useRef(false);
  const briefBlocked =
    !isAdmin && !guidanceLoading && guidance !== null && !guidance.briefSubmitted;

  const STORAGE_KEY = `rv_script_state_${accessCode || "anon"}`;
  const [state, dispatch] = useReducer(reducer, INITIAL, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const msgs = Array.isArray(parsed.messages) ? parsed.messages : [];
        // A persisted session with no messages means the previous run died mid-step
        // (e.g. while loading brand context) — start clean instead of a blank screen.
        if (msgs.length === 0) return { ...init, hasStarted: isAdmin };
        const started = isAdmin || (parsed.hasStarted ?? msgs.length > 0);
        return {
          ...init,
          ...parsed,
          loading: false,
          pendingBatchReprompt: parsed.pendingBatchReprompt ?? null,
          history: Array.isArray(parsed.history) ? parsed.history : [],
          hasStarted: started,
          // If the user hasn't officially started, keep the slate clean.
          messages: started ? msgs : [],
        };
      }
    } catch {}
    return { ...init, hasStarted: isAdmin };
  });
  const sessionSnapshot = useRef({ state, writeMode });
  sessionSnapshot.current = { state, writeMode };

  function ensureWriterSession(mode: "single" | "batch" = "batch", format?: Format) {
    if (isAdmin || !accessCode || !hasSelectedWriterFormat(format)) return;
    if (!sessionStartRef.current) {
      const generation = sessionGeneration.current;
      sessionStartRef.current = createSessionStarter(async () => {
        const response = await fetch("/api/writer-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: JSON.stringify({
            title: `${mode === "single" ? "Single script" : "Batch"} · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
            type: mode === "single" ? "Single" : "Batch",
            format,
            status: "In progress",
            scripts: [],
            repurposedFrom: repurposedFrom.current,
            briefId: scriptBrand?.id,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.session?.id)
          throw new Error(result.error || "Could not save your session to History");
        const session: SessionSummary = result.session;
        if (generation === sessionGeneration.current) {
          setActiveSession(session);
          setSessionsRefresh((key) => key + 1);
          try {
            localStorage.setItem(`${STORAGE_KEY}_session`, JSON.stringify(session));
          } catch {}
        }
        return session;
      });
    }
    void sessionStartRef.current().catch((error) => appendError(error.message));
  }

  // Restore only the current record's identity; History remains read-only.
  useEffect(() => {
    if (openSessionId || isAdmin || sessionRestored.current) return;
    sessionRestored.current = true;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_session`);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.id) {
        setActiveSession(saved);
        setWriteMode(saved.type === "Single" ? "single" : "batch");
        sessionStartRef.current = createSessionStarter(async () => saved);
      } else if (state.hasStarted) ensureWriterSession("batch", state.format ?? undefined);
    } catch {}
  }, [STORAGE_KEY, isAdmin]);

  /** Rebuild a live writer from a saved In-progress transcript so its actions work again. */
  function resumeWriterSession(session: SessionSummary & { briefSnapshot?: string }, messages: Message[]) {
    const formats: Record<string, Format> = {
      "Talking Video": "talkingVideo",
      Broll: "broll",
      "B-roll": "broll",
      Carousel: "carousel",
      Graphic: "graphic",
    };
    const docs = messages.filter(
      (m): m is Extract<Message, { kind: "script" }> => m.kind === "script",
    );
    const format =
      formats[session.format || ""] || (session.format as Format) || docs[0]?.script.format || "talkingVideo";
    const topicMsg = [...messages].reverse().find((m) => m.kind === "topicList") as any;
    const topics: Topic[] = topicMsg?.topics?.length
      ? topicMsg.topics
      : ((session.topics || []) as any[]).map((t) =>
          typeof t === "string" ? { title: t, rationale: "" } : t,
        );
    const selected: number[] = topicMsg?.selected?.length
      ? topicMsg.selected
      : topics.map((_, i) => i);
    const cta = ([...messages].reverse().find((m) => m.kind === "ctaDecision") as any)?.selectedCta || "";
    const brand = scriptBrands.find((b) => session.brandIds?.includes(b.id));
    dispatch({ type: "RESET" });
    dispatch({ type: "APPEND_MANY", messages });
    dispatch({ type: "PICK_FORMAT", format });
    dispatch({ type: "SET_TOPICS", topics });
    dispatch({ type: "SET_SELECTED_TOPICS", indices: selected });
    dispatch({ type: "SET_COUNT", count: selected.length || 1 });
    dispatch({ type: "SET_CTA", value: cta });
    ctaRef.current = cta;
    dispatch({ type: "SET_SCRIPT_TYPE", value: "fleshed" });
    if (brand) {
      setScriptBrand(brand);
      dispatch({ type: "SET_BRAND", id: brand.id, name: brand.name });
    }
    const snapshot = (session.briefSnapshot || "").trim();
    if (snapshot.startsWith("{")) {
      try {
        dispatch({ type: "SET_BRIEF", brief: JSON.parse(snapshot) });
      } catch {}
    } else if (snapshot) {
      dispatch({ type: "SET_ADMIN_SUMMARY", summary: snapshot, digest: null });
      dispatch({ type: "SET_BRIEF", brief: { text: snapshot, name: "Session brief", loading: false } as Brief });
    }
    const subtype = docs.find((d) => d.script.kind === "carousel" && d.script.designSubtype)?.script as any;
    if (subtype?.designSubtype) dispatch({ type: "SET_DESIGN_SUBTYPE", value: subtype.designSubtype });
    docs.filter((d) => d.completed).forEach((d) => dispatch({ type: "PUSH_SCRIPT", script: d.script }));
    dispatch({ type: "START_SCRIPTING" });
    const pendingPlanner = docs.some((d) => d.completed && !d.plannerAdded);
    dispatch({ type: "SET_PHASE", phase: pendingPlanner ? "addToPlanner" : "pickVariation" });
    briefStageClosedRef.current = true;
    setWriteMode(session.type === "Single" ? "single" : "batch");
    setSessionFormat(format);
    setActiveSession(session);
    activeSessionRef.current = session;
    sessionStartRef.current = createSessionStarter(async () => session);
    setRailView({ kind: "session", id: session.id });
    try {
      localStorage.setItem(`${STORAGE_KEY}_session`, JSON.stringify(session));
    } catch {}
  }

  useEffect(() => {
    if (!restoreSessionId) return;
    let cancelled = false;
    sessionRestored.current = true;
    setOpeningSession(true);
    void (async () => {
      try {
        const r = await fetch(`/api/writer-sessions?id=${encodeURIComponent(restoreSessionId)}`, {
          headers: { "x-access-code": accessCode },
        });
        const data = await r.json();
        if (!r.ok || !data.session) throw new Error(data.error || "Could not open this session.");
        if (cancelled) return;
        const session = data.session as SessionSummary;
        const messages = (session.transcript || []) as Message[];
        const context = (
          messages.find((m) => m.id === "repurpose-context") as unknown as
            | {
                repurposeContext?: {
                  brandId: string;
                  brandName: string;
                  brief: Brief;
                  cta?: string;
                };
              }
            | undefined
        )?.repurposeContext;
        if (session.status === "Done") {
          setRailView({ kind: "session", id: session.id });
          return;
        }
        if (session.title !== "Repurpose" || !context) {
          if (!messages.some((m) => m.kind === "script")) {
            setRailView({ kind: "session", id: session.id });
            return;
          }
          resumeWriterSession(session, messages);
          return;
        }
        const docs = messages.filter(
          (m): m is Extract<Message, { kind: "script" }> => m.kind === "script",
        );
        const first = docs[0];
        if (!first) throw new Error("This session has no script to continue.");
        dispatch({ type: "RESET" });
        dispatch({ type: "APPEND_MANY", messages });
        dispatch({ type: "PICK_FORMAT", format: first.script.format });
        dispatch({ type: "SET_COUNT", count: 1 });
        dispatch({
          type: "SET_TOPICS",
          topics: [{ title: first.topic, rationale: "Repurposed inspiration" }],
        });
        dispatch({ type: "SET_SELECTED_TOPICS", indices: [0] });
        dispatch({ type: "SET_BRAND", id: context.brandId, name: context.brandName });
        dispatch({ type: "SET_BRIEF", brief: context.brief });
        dispatch({ type: "SET_CTA", value: context.cta || "" });
        ctaRef.current = context.cta || "";
        dispatch({ type: "SET_SCRIPT_TYPE", value: "fleshed" });
        if (first.script.kind === "carousel" && first.script.designSubtype)
          dispatch({ type: "SET_DESIGN_SUBTYPE", value: first.script.designSubtype });
        if (first.completed) dispatch({ type: "PUSH_SCRIPT", script: first.script });
        dispatch({ type: "START_SCRIPTING" });
        dispatch({ type: "SET_PHASE", phase: first.completed ? "addToPlanner" : "pickVariation" });
        setWriteMode("single");
        setSessionFormat(first.script.format);
        setActiveSession(session);
        activeSessionRef.current = session;
        sessionStartRef.current = createSessionStarter(async () => session);
        setRailView({ kind: "session", id: session.id });
        briefStageClosedRef.current = true;
        localStorage.setItem(`${STORAGE_KEY}_session`, JSON.stringify(session));
      } catch (e) {
        if (!cancelled)
          appendError(e instanceof Error ? e.message : "Could not open this session.");
      } finally {
        if (!cancelled) setOpeningSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restoreSessionId, accessCode]);

  // A step that was in flight when the page stopped can never finish on its own:
  // say so and offer a Retry instead of leaving the chat stuck.
  const interruptChecked = useRef(false);
  useEffect(() => {
    if (interruptChecked.current) return;
    interruptChecked.current = true;
    const busyPhases: ChatPhase[] = [
      "researching",
      "generatingHooks",
      "writingSample",
      "writingBatch",
      "writingCaptions",
    ];
    const stale = state.messages.filter(
      (m: any) => m.kind === "typing" || m.kind === "scriptWriting",
    );
    if (!busyPhases.includes(state.phase) && stale.length === 0) return;
    stale.forEach((m) => dispatch({ type: "REMOVE_MSG", id: m.id }));
    const last: any = state.messages[state.messages.length - 1];
    if (last?.kind === "pills" && last.pickedValue === undefined) return;
    const phase = busyPhases.includes(state.phase) ? state.phase : "writingBatch";
    appendError("This step was stopped before it finished.");
    appendPills("Want me to pick up where it stopped?", [
      { label: "Retry", value: `__retry_step__:${phase}`, tone: "primary" },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveCurrentSession() {
    const session = activeSessionRef.current;
    if (!session || isAdmin) return;
    const sessionId = session.id;
    const current = sessionSnapshot.current.state;
    const transcript = savedTranscript(current.messages);
    const scripts = transcript
      .filter((m: any) => m.kind === "script" && !m.discarded)
      .map((m: any) => ({ ...m.script, topic: m.topic, captions: m.captions }));
    const payload = JSON.stringify({
      format: current.format || undefined,
      topics: current.topics,
      scripts,
      transcript,
      briefSnapshot: current.adminBriefSummary || JSON.stringify(current.brief || {}),
    });
    // Skip the network round-trip entirely when nothing changed since the last
    // successful save — otherwise a save that only refreshes local state would
    // re-trigger the autosave effect and loop forever.
    if (
      lastSavedPayloadRef.current?.id === sessionId &&
      lastSavedPayloadRef.current?.payload === payload
    )
      return;
    try {
      await saveQueue.current(async () => {
        const response = await fetch(`/api/writer-sessions?id=${encodeURIComponent(sessionId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-access-code": accessCode },
          body: payload,
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "Could not update your session in History");
        }
      });
      lastSavedPayloadRef.current = { id: sessionId, payload };
      setActiveSession((session) =>
        session?.id === sessionId
          ? {
              ...session,
              format: current.format ? formatLabel(current.format) : session.format,
              topics: current.topics,
              scripts,
              transcript,
            }
          : session,
      );
      setSessionSaveError("");
    } catch (error) {
      console.error("Writer session save failed", error);
      setSessionSaveError(
        error instanceof Error ? error.message : "Could not save this conversation to History",
      );
    }
  }
  useEffect(() => {
    if (!activeSessionId || isAdmin || openingSession) return;
    const timer = setTimeout(() => {
      void saveCurrentSession();
    }, 1000);
    return () => clearTimeout(timer);
    // activeSession is read through a ref: the save result refreshes that
    // object, and depending on the object here caused an endless save loop.
  }, [
    activeSessionId,
    state.messages,
    state.format,
    state.topics,
    state.brief,
    state.adminBriefSummary,
    accessCode,
    isAdmin,
    openingSession,
  ]);
  // Step back one decision — only offered on decision steps, never mid-writing
  // and never once a script has been approved.
  const canUndo =
    (state.history?.length ?? 0) > 0 &&
    !state.loading &&
    UNDOABLE_PHASES.includes(state.phase) &&
    !state.messages.some((m) => m.kind === "scriptWriting" || m.kind === "typing");
  const initedRef = useRef(false);
  const writingRef = useRef(false);
  const hiddenFileRef = useRef<HTMLInputElement>(null);
  const ctaRef = useRef("");
  /** Average slides per carousel for the current batch. */
  const slidesRef = useRef(0);
  // Set when the user starts scripting straight from a format chip in the plan card.
  const presetRef = useRef<{ format: Format; count: number; label: string } | null>(null);
  const sessionBriefDraftRef = useRef<Record<string, string>>({});
  /** True once the session-brief step is done (approved, skipped or failed). */
  const briefStageClosedRef = useRef(false);
  /** True while a client session brief is being built, to stop double runs. */
  const briefBuildInFlightRef = useRef(false);

  const [prodStatus, setProdStatus] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [assigneeOptions, setAssigneeOptions] = useState<
    { id: string; name: string; email?: string }[]
  >([]);

  function recommendedCountForFormat(format: Format): number {
    const raw =
      format === "talkingVideo"
        ? guidance?.talking
        : format === "broll"
          ? guidance?.broll
          : format === "graphic"
            ? guidance?.graphic
            : guidance?.carousel;
    return Math.min(24, Math.max(1, Math.round(Number(raw) || 1)));
  }

  useEffect(() => {
    if (!accessCode) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/list-airtable-collaborators`, {
          headers: { "x-access-code": accessCode },
        });
        const data = await r.json();
        if (!cancelled && r.ok && Array.isArray(data.people)) setAssigneeOptions(data.people);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [accessCode]);

  // Teammates sharing this access code — used when a client assigns a batch.
  const [clientAssignees, setClientAssignees] = useState<
    { id: string; name: string; email?: string }[]
  >([]);
  useEffect(() => {
    if (!accessCode || isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/dwy-assignees`, { headers: { "x-access-code": accessCode } });
        const data = await r.json();
        if (!cancelled && r.ok && Array.isArray(data.people)) setClientAssignees(data.people);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [accessCode, isAdmin]);

  async function sendToProduction(msgId: string, msg: any) {
    if (prodStatus[msgId] === "sending" || prodStatus[msgId] === "sent") return;
    setProdStatus((s) => ({ ...s, [msgId]: "sending" }));
    try {
      const r = await fetch("/api/send-to-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: msg.topic,
          scriptNumber: msg.index + 1,
          script: msg.script,
          captions: msg.captions,
          clientName,
          scriptType: msg.scriptType,
          format: state.format,
          designSubtype: state.designSubtype || undefined,
          brandId: state.brandId,
          brandName: state.brandName,
          accessCode,
          sessionId: activeSession?.id,
          requestId: activeSession?.id
            ? `writer:${activeSession.id}:${msg.index}`
            : `writer-card:${msgId}`,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Send failed");
      setProdStatus((s) => ({ ...s, [msgId]: "sent" }));
      dispatch({ type: "UPDATE_MSG", id: msgId, patch: { status: "approved" } as any });
    } catch (e: any) {
      setProdStatus((s) => ({ ...s, [msgId]: "error" }));
      appendError(`Send to production failed: ${e.message}`);
    }
  }

  // Persist state across reloads (skip ephemeral messages).
  useEffect(() => {
    try {
      const persistable = {
        ...state,
        messages: state.messages.filter((m) => m.kind !== "typing" && m.kind !== "scriptWriting"),
        loading: false,
      };
      // The undo history and the attached audit report are the two heavyweights
      // in this object. Keeping them would blow the browser storage quota on a
      // real batch, which silently killed the whole save — so they stay out.
      // The report is re-attached from the server on the next load.
      const { history: _h, seedReport: _s, ...slim } = persistable as any;
      const write = (payload: any) => localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      try {
        write(slim);
      } catch {
        // Still too big: keep the most recent part of the conversation so the
        // session survives instead of vanishing entirely.
        try {
          write({ ...slim, messages: slim.messages.slice(-24) });
        } catch {
          try {
            write({ ...slim, messages: slim.messages.slice(-8) });
          } catch {}
        }
      }
    } catch {}
  }, [state, STORAGE_KEY]);

  function startNewBatch(opts?: { skipSave?: boolean }) {
    if (!opts?.skipSave) void saveCurrentSession();
    repurposedFrom.current = undefined;
    setWriteMode(null);
    setScriptBrand(null);
    setSessionFormat(null);
    setRailView({ kind: "writer" });
    sessionGeneration.current += 1;
    sessionStartRef.current = null;
    setActiveSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_session`);
    } catch {}
    initedRef.current = false;
    writingRef.current = false;
    ctaRef.current = "";
    slidesRef.current = 0;
    presetRef.current = null;
    sessionBriefDraftRef.current = {};
    briefStageClosedRef.current = false;
    briefBuildInFlightRef.current = false;
    setProdStatus({});
    dispatch({ type: "RESET" });
  }

  async function repurposeSession(session: SessionSummary) {
    const sourceScripts = session.scripts || [];
    const topics: Topic[] = sourceScripts.map((script: ScriptDoc, index: number) => ({
      title: script.topic || `Script ${index + 1}`,
      rationale: "Create a new variation of this saved script.",
    }));
    if (!topics.length) throw new Error("This session has no scripts to re-purpose yet.");
    startNewBatch();
    repurposedFrom.current = session.id;
    setWriteMode("batch");
    const formats: Record<string, Format> = {
      "B-roll": "broll",
      "Talking Video": "talkingVideo",
      Carousel: "carousel",
      Graphic: "graphic",
    };
    const format = formats[session.format || ""] || sourceScripts[0]?.format || "talkingVideo";
    ensureWriterSession("batch", format);
    dispatch({ type: "START_SCRIPTING" });
    dispatch({ type: "PICK_FORMAT", format });
    dispatch({ type: "SET_COUNT", count: topics.length });
    dispatch({ type: "SET_TOPICS", topics });
    dispatch({ type: "SET_BRIEF", brief: briefFromBrandInfo() });
    dispatch({
      type: "SET_BATCH_REPROMPT",
      v: `Create genuinely new variations of the saved scripts below. Keep their topics and brand guidelines, but change the hooks, examples and wording. Original scripts: ${JSON.stringify(sourceScripts)}`,
    });
    appendUser(`Re-purpose “${session.title}”.`);
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "ai",
        kind: "topicList",
        content: "Pick the topics you want to re-purpose from this batch.",
        topics,
        selected: topics.map((_, index) => index),
      },
    });
    dispatch({ type: "SET_PHASE", phase: "approveTopics" });
  }

  async function consumeScriptCredit(): Promise<{ ok: boolean; message?: string }> {
    if (!accessCode) return { ok: true };
    try {
      const r = await fetch("/api/consume-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode, kind: "script" }),
      });
      if (r.status === 402) {
        const d = await r.json().catch(() => ({}));
        return { ok: false, message: d.message || "Running out of credits. Contact admin" };
      }
      if (!r.ok) return { ok: true }; // fail-open on transient errors
      onCreditsChange?.();
      return { ok: true };
    } catch {
      return { ok: true };
    }
  }

  // Helpers --------------------------------------------------------------
  const appendAi = (text: string) =>
    dispatch({ type: "APPEND", msg: { id: uid(), role: "ai", kind: "text", content: text } });
  const appendPills = (
    text: string,
    options: { label: string; value: any; tone?: "priority" | "primary" | "approval" }[],
    gridCols?: number,
  ) =>
    dispatch({
      type: "APPEND",
      msg: { id: uid(), role: "ai", kind: "pills", content: text, options, gridCols },
    });
  const appendUser = (text: string) =>
    dispatch({ type: "APPEND", msg: { id: uid(), role: "user", kind: "text", content: text } });
  const appendError = (text: string) =>
    dispatch({ type: "APPEND", msg: { id: uid(), role: "ai", kind: "error", content: text } });
  const appendTyping = (label?: string): string => {
    const id = uid();
    dispatch({ type: "APPEND", msg: { id, role: "ai", kind: "typing", label } });
    return id;
  };
  const removeMsg = (id: string) => dispatch({ type: "REMOVE_MSG", id });

  // Initial mount --------------------------------------------------------
  /**
   * Asks for the format, unless the user already picked one (with a count) from
   * the plan card — in that case we lock it in and jump to the topics step.
   * Returns true when the format question was skipped.
   */
  function appendFormatPills(): boolean {
    briefStageClosedRef.current = true;
    const preset = presetRef.current;

    if (preset) {
      presetRef.current = null;
      dispatch({ type: "PICK_FORMAT", format: preset.format });
      dispatch({ type: "SET_COUNT", count: preset.count });
      appendUser(`${preset.count} × ${preset.label}`);
      appendPills("Do you already have topics in mind, or want me to suggest?", [
        { label: "Suggest some", value: "suggest" },
        { label: "I have topics", value: "have" },
      ]);
      dispatch({ type: "SET_PHASE", phase: "askTopicsMode" });
      return true;
    }
    appendPills("What are we creating today?", [
      { label: "Talking Video", value: "talkingVideo" },
      { label: "B-roll", value: "broll" },
      { label: "Carousel", value: "carousel" },
      { label: "Graphic", value: "graphic" },
    ]);
    return false;
  }

  async function loadBrandsInto(msgId: string) {
    try {
      const r = await fetch(`/api/list-brands`, { headers: { "x-access-code": accessCode } });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load brands");
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { loading: false, brands: data.brands || [] } as any,
      });
    } catch (e: any) {
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { loading: false, error: e?.message || "Failed to load brands" } as any,
      });
    }
  }

  /**
   * A refresh kills any in-flight generation, so a persisted session can land
   * on a phase where every card is already approved and nothing is clickable.
   * Re-offer the next step so the batch can always continue.
   */
  function resumeAfterReload() {
    const captionPills = () => {
      appendPills("All scripts are ready, want to generate captions?", [
        { label: "Yes, write the captions", value: "captions" },
        { label: "No, skip captions", value: false },
      ]);
      dispatch({ type: "SET_PHASE", phase: "offerCaptions" });
    };
    const scriptMsgs = state.messages.filter((m: any) => m.kind === "script") as any[];
    const total = state.selectedTopics.length;
    const nextIndex = scriptMsgs.length ? Math.max(...scriptMsgs.map((m) => m.index)) + 1 : 0;
    const allApproved = scriptMsgs.length > 0 && scriptMsgs.every((m) => m.status === "approved");
    const stalledWriting = state.phase === "writingSample" || state.phase === "writingBatch";

    if (state.phase === "writingCaptions") {
      captionPills();
      return;
    }
    if (stalledWriting || (state.phase === "approveTone" && allApproved)) {
      if (total > 0 && nextIndex < total) {
        appendPills(
          `Picking up where we left off — script ${nextIndex + 1} of ${total} hasn't been written yet.`,
          [{ label: `Write script ${nextIndex + 1}`, value: `__next__:${nextIndex}` }],
        );
        dispatch({ type: "SET_PHASE", phase: "writingBatch" });
      } else if (scriptMsgs.length > 0) {
        captionPills();
      }
    }
  }

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    // If state was rehydrated from storage, don't seed initial messages,
    // but repair any brand picker that got persisted mid-load.
    if (state.messages.length > 0) {
      state.messages.forEach((m: any) => {
        if (m.kind === "brandPicker" && !m.confirmed && (!m.brands || m.brands.length === 0)) {
          dispatch({
            type: "UPDATE_MSG",
            id: m.id,
            patch: { loading: true, error: undefined } as any,
          });
          loadBrandsInto(m.id);
        }
      });
      resumeAfterReload();
      return;
    }

    if (seedReport) {
      dispatch({ type: "SET_SEED", seed: seedReport });
    }
    if (isAdmin && !state.brandId) {
      const pickerId = uid();
      dispatch({
        type: "APPEND",
        msg: {
          id: pickerId,
          role: "ai",
          kind: "brandPicker",
          content:
            "Which brand are we scripting for? Pick a client so I can link the records to the right account in Airtable.",
          loading: true,
        },
      });
      loadBrandsInto(pickerId);
    } else if (isAdmin) {
      appendFormatPills();
    }
    // Client users start the conversation themselves via "Start scripting".
  }, [seedReport, seedAccount, state.messages.length, isAdmin]);

  // A stored audit can arrive after mount (or after a session was restored from
  // storage), so keep the attached report in sync outside the one-time init.
  useEffect(() => {
    if (seedReport && state.seedReport !== seedReport) {
      dispatch({ type: "SET_SEED", seed: seedReport });
    }
  }, [seedReport, state.seedReport]);

  function startScripting(preset?: { format: Format; count: number; label: string }) {
    setRailView({ kind: "writer" });
    ensureWriterSession(writeMode || "batch", preset?.format);
    if (preset) {
      presetRef.current = preset;
      dispatch({ type: "PICK_FORMAT", format: preset.format });
      dispatch({ type: "SET_COUNT", count: preset.count });
    }
    if (state.hasStarted) {
      // Session already running: picking a format from the plan card starts a
      // fresh batch and skips the session-brief approval step.
      if (preset && (state.brief || state.adminBriefSummary)) {
        presetRef.current = null;
        appendUser(`${preset.count} × ${preset.label}`);
        startNextFormat(preset.format, preset.count);
      }
      return;
    }
    dispatch({ type: "START_SCRIPTING" });
    if (seedReport) {
      const who = seedAccount ? `@${seedAccount.replace(/^@/, "")}` : "your brand";
      appendAi(`I've got your analysis report loaded for ${who}.`);
    }
    if (!isAdmin) {
      buildClientSessionBrief();
      return;
    }
    appendFormatPills();
  }

  // Client users: build an editable session brief from their Brand info before
  // anything else. They approve or edit it, then we ask about the format.
  async function buildClientSessionBrief() {
    // A second run would re-show the session brief and re-ask the format after
    // the user already moved on, so only ever run this once per session.
    if (briefBuildInFlightRef.current || briefStageClosedRef.current) return;
    const b = briefFromBrandInfo();
    if (!b) {
      appendError(
        "I couldn't read your Brand info. Complete it in the Brand info tab, then come back.",
      );
      return;
    }
    briefBuildInFlightRef.current = true;
    dispatch({ type: "SET_BRIEF", brief: b });
    dispatch({ type: "SET_PHASE", phase: "loadingBrandContext" });
    const typingId = appendTyping("Reading your Brand info and building your session brief…");
    try {
      const r = await fetch("/api/client-session-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode,
          brandName: guidance?.brandName || clientName || "this brand",
          briefText: b.text || "",
          strategy: guidance?.strategy || "",
        }),
      });
      const data = await r.json().catch(() => null);
      removeMsg(typingId);
      if (briefStageClosedRef.current) return;
      if (!r.ok || !data?.summaryMarkdown)
        throw new Error(data?.error || "Could not build the session brief");
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "briefSummaryEditor",
          content: `Here's your session brief, built from your Brand info. Edit anything you want changed, then approve to lock it in — everything I write next will follow these rules.`,
          draft: plainifyBriefMarkdown(data.summaryMarkdown),
        },
      });
      dispatch({ type: "SET_PHASE", phase: "editBriefSummary" });
    } catch (e: any) {
      removeMsg(typingId);
      if (briefStageClosedRef.current) return;
      appendError(
        `Couldn't build your session brief: ${e.message}. Continuing with your Brand info as-is.`,
      );
      appendAi(brandSnapshot());
      if (!appendFormatPills()) dispatch({ type: "SET_PHASE", phase: "askFormat" });
    } finally {
      briefBuildInFlightRef.current = false;
    }
  }

  const brandLoadInFlight = useRef<string | null>(null);
  async function confirmBrand(msgId: string, brandId: string) {
    const msg = state.messages.find((m) => m.id === msgId);
    if (!msg || msg.kind !== "brandPicker") return;
    if ((msg as any).confirmed) return; // prevent double-click double-fire
    const brand = (msg.brands || []).find((b) => b.id === brandId);
    if (!brand) return;
    dispatch({ type: "SET_BRAND", id: brand.id, name: brand.name });
    dispatch({
      type: "UPDATE_MSG",
      id: msgId,
      patch: { selectedId: brandId, confirmed: true } as any,
    });
    appendUser(`Scripting for ${brand.name}.`);
    await loadAdminBrandContext(brand.id, brand.name);
  }

  async function loadAdminBrandContext(brandId: string, brandName: string) {
    // Guard: if a load is already in-flight for this brand, skip duplicate.
    if (brandLoadInFlight.current === brandId) return;
    brandLoadInFlight.current = brandId;
    // Remove any prior session brief editor messages so only one box ever shows.
    const stale = state.messages.filter((m) => m.kind === "briefSummaryEditor").map((m) => m.id);
    for (const id of stale) removeMsg(id);
    dispatch({ type: "SET_PHASE", phase: "loadingBrandContext" });
    const typingId = appendTyping("Reading the brand brief and the last posts on file…");
    try {
      const r = await fetch("/api/admin-brand-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          brandName,
          accessCode,
          builderPrompt: prompts?.briefReader || "",
          analysisReport: state.seedReport ?? null,
        }),
      });
      const text = await r.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* upstream returned non-JSON (timeout/proxy error) */
      }
      const fallbackError = text.trim().startsWith("<!DOCTYPE")
        ? "Brand context service returned an HTML error page instead of JSON. Please retry."
        : (text && text.slice(0, 120)) || "Could not load brand context";
      removeMsg(typingId);
      // If the user switched brands while this was in flight, drop this response.
      if (brandLoadInFlight.current !== brandId) return;
      if (!r.ok || !data) throw new Error(data?.error || fallbackError);
      // Stash the posts digest now so it gets included in every prompt downstream.
      dispatch({
        type: "SET_ADMIN_SUMMARY",
        summary: data.summaryMarkdown || null,
        digest: data.postsDigest || null,
      });

      if (!data.summaryMarkdown) {
        // No brief on file — ask for one. After upload, we'll re-run this function.
        dispatch({
          type: "APPEND",
          msg: {
            id: uid(),
            role: "ai",
            kind: "askBriefCta",
            content: `I don't see a brand brief on file for ${brandName}. Attach the brand brief PDF (you can add more than one) so I can build the session do's and don'ts.`,
          },
        });
        dispatch({ type: "SET_PHASE", phase: "askBrief" });
        return;
      }

      // Otherwise present the editable session brief summary.
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "briefSummaryEditor",
          content: `Here's a session brief for ${brandName} built from the brand brief on file and the last 30 posts. Edit anything you want changed, then approve to lock it in. Everything I write next will follow these rules.`,
          draft: plainifyBriefMarkdown(data.summaryMarkdown),
        },
      });
      dispatch({ type: "SET_PHASE", phase: "editBriefSummary" });
    } catch (e: any) {
      removeMsg(typingId);
      if (brandLoadInFlight.current !== brandId) return;
      appendError(`Couldn't load brand context: ${e.message}. Continuing without it.`);
      if (!appendFormatPills()) dispatch({ type: "SET_PHASE", phase: "askFormat" });
    } finally {
      if (brandLoadInFlight.current === brandId) brandLoadInFlight.current = null;
    }
  }

  async function uploadAdminBrief(file: File) {
    if (!state.brandId) return;
    if (file.size > 5 * 1024 * 1024) {
      appendError("File must be under 5MB (Airtable limit).");
      return;
    }
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "user",
        kind: "fileChip",
        content: { name: file.name, label: "Brand brief uploaded" },
      },
    });
    const typingId = appendTyping("Uploading the brief and reading it…");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1]);
        r.onerror = () => reject(new Error("File read failed"));
        r.readAsDataURL(file);
      });
      const up = await fetch("/api/brand-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: state.brandId,
          base64,
          filename: file.name,
          contentType: file.type || "application/pdf",
          accessCode,
        }),
      });
      const upData = await up.json();
      removeMsg(typingId);
      if (!up.ok) throw new Error(upData?.error || "Upload failed");
      await loadAdminBrandContext(state.brandId, state.brandName || "this brand");
    } catch (e: any) {
      removeMsg(typingId);
      appendError(`Upload failed: ${e.message}`);
    }
  }

  function approveBriefSummary(msgId: string) {
    const msg = state.messages.find((m) => m.id === msgId);
    if (!msg || msg.kind !== "briefSummaryEditor") return;
    const draft = sessionBriefDraftRef.current[msgId] ?? msg.draft;
    dispatch({ type: "SET_ADMIN_SUMMARY", summary: draft, digest: state.recentPostsDigest });
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { draft, approved: true } as any });
    appendUser("Session brief approved.");
    if (!appendFormatPills()) dispatch({ type: "SET_PHASE", phase: "askFormat" });
  }

  function updateBriefSummaryDraft(msgId: string, draft: string) {
    sessionBriefDraftRef.current[msgId] = draft;
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { draft } as any });
  }

  // Legacy non-admin existing-brief picker handlers (kept for non-admin flow).
  async function useExistingBrief(msgId: string, brandId: string, filename: string, _url: string) {
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { resolved: "used" } as any });
    appendUser(`Using brief on file: ${filename}`);
    try {
      const r = await fetch(
        `/api/brief-file?b=${encodeURIComponent(brandId)}&n=${encodeURIComponent(filename)}`,
        { headers: { "x-access-code": accessCode } },
      );
      if (!r.ok) throw new Error(`Download failed (${r.status})`);
      const blob = await r.blob();
      const file = new File([blob], filename, { type: blob.type || "application/pdf" });
      await handleBriefFile(file);
    } catch (e: any) {
      appendError(`Couldn't load the stored brief: ${e.message}. Upload a new one.`);
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "askBriefCta",
          content: "Attach a brand brief so I can ground the batch.",
        },
      });
      dispatch({ type: "SET_PHASE", phase: "askBrief" });
    }
  }

  async function replaceBrief(msgId: string, brandId: string) {
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { resolved: "replaced" } as any });
    appendUser("Remove the stored brief and upload a new one.");
    try {
      await fetch("/api/brand-brief", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, accessCode }),
      });
    } catch {}
    dispatch({ type: "SET_EXISTING_BRIEF", brief: null });
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "ai",
        kind: "askBriefCta",
        content: "Removed. Attach the new brand brief PDF.",
      },
    });
    dispatch({ type: "SET_PHASE", phase: "askBrief" });
  }

  // Build the scripting brief from the Brand info form (client users only).
  function briefFromBrandInfo(): Brief | null {
    const f = guidance?.briefFields;
    if (!f) return null;
    const order = [
      ["My Brand in Nutshell", "BRAND & OFFER"],
      ["My Niche/Industry", "NICHE / INDUSTRY"],
      ["My Target Audience", "TARGET AUDIENCE"],
      ["Pain Points", "PAIN POINTS"],
      ["Topics", "TOPICS OF EXPERTISE"],
      ["My Competitive Edge", "COMPETITIVE EDGE"],
      ["My Tone of Voice", "TONE OF VOICE"],
    ] as const;
    const sections = order
      .filter(([k]) => String(f[k] || "").trim())
      .map(([k, label]) => `${label}\n${String(f[k]).trim()}`);
    if (!sections.length) return null;
    return {
      text: sections.join("\n\n"),
      name: `${guidance?.brandName || clientName || "Brand"} — Brand info`,
      loading: false,
      topicsToPrioritize: String(f["Topics"] || ""),
      languageToIncorporate: String(f["My Tone of Voice"] || ""),
      languageToAvoid: "",
    } as Brief;
  }

  // Short, readable recap of the brand info the bot will script from.
  function brandSnapshot(): string {
    const f = guidance?.briefFields || {};
    const clip = (v: string, n = 220) => {
      const s = String(v || "")
        .replace(/\s+/g, " ")
        .trim();
      return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
    };
    const rows: Array<[string, string]> = [
      ["Brand", clip(f["My Brand in Nutshell"])],
      ["Niche", clip(f["My Niche/Industry"], 120)],
      ["Audience", clip(f["My Target Audience"])],
      ["Pain points", clip(f["Pain Points"])],
      ["Topics", clip(f["Topics"])],
      ["Edge", clip(f["My Competitive Edge"])],
      ["Tone", clip(f["My Tone of Voice"], 140)],
    ];
    const lines = rows.filter(([, v]) => v).map(([k, v]) => `• ${k}: ${v}`);
    const who = guidance?.brandName || clientName || "your brand";
    return `I've read your Brand info for ${who} — no upload needed. Here's the snapshot I'll script from:\n\n${lines.join("\n")}`;
  }

  // API helpers ----------------------------------------------------------

  const briefBody = () => {
    const state = sessionSnapshot.current.state;
    return {
      text: state.brief?.text || "",
      name: state.brief?.name || "Brief",
      topicsToPrioritize: state.brief?.topicsToPrioritize || "",
      languageToIncorporate: state.brief?.languageToIncorporate || "",
      languageToAvoid: state.brief?.languageToAvoid || "",
      adminSummary: state.adminBriefSummary || "",
      // Recent posts are an admin/strategist input only — client users never send them.
      recentPostsDigest: isAdmin ? state.recentPostsDigest || "" : "",
      // "Recommended strategy" from the brand's table — always sent to scripting calls.
      recommendedStrategy: guidance?.strategy || "",
    };
  };

  async function fetchTopics(reprompt?: string) {
    const typingId = appendTyping("Researching topic angles…");
    dispatch({ type: "SET_PHASE", phase: "researching" });
    try {
      const r = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: briefBody(),
          count: state.count,
          prompts,
          reprompt,
          accessCode,
        }),
      });
      const raw = await r.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          r.status >= 500 || r.status === 0
            ? "Topic research took too long. Please try again."
            : `Unexpected response (${r.status}). Please try again.`,
        );
      }
      removeMsg(typingId);
      if (!r.ok || !data.topics) throw new Error(data.error || "Topic generation failed");
      dispatch({ type: "SET_TOPICS", topics: data.topics });
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "topicList",
          content: `Pick the ${state.count} topics you want me to write, then approve.`,
          topics: data.topics,
          selected: [],
        },
      });
      dispatch({ type: "SET_PHASE", phase: "approveTopics" });
    } catch (e: any) {
      removeMsg(typingId);
      appendError(`Topic research failed: ${e.message}`);
      appendPills("Want me to try again?", [
        { label: "Retry", value: "__retry_step__:researching", tone: "primary" },
      ]);
      dispatch({ type: "SET_PHASE", phase: "askTopicsMode" });
    }
  }

  async function fetchHooks(
    selectedTopics: Topic[],
    reprompt?: string,
    opts?: { thenWrite?: boolean; deferCta?: boolean },
  ): Promise<Hook[] | null> {
    // Background preparation (deferCta) stays silent so it never sits above the user's CTA reply.
    const typingId = opts?.deferCta ? "" : appendTyping("Preparing your script options…");
    dispatch({ type: "SET_PHASE", phase: "generatingHooks" });
    try {
      const r = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: selectedTopics,
          brief: briefBody(),
          prompts,
          reprompt,
          designSubtype: sessionSnapshot.current.state.designSubtype || undefined,
          format: sessionSnapshot.current.state.format,
          accessCode,
          perTopic: 2,
        }),
      });
      const data = await r.json();
      removeMsg(typingId);
      if (!r.ok || !data.hooks) throw new Error(data.error || "Hook generation failed");
      // No hook approval step: both hooks per topic each get a full script.
      dispatch({ type: "SET_HOOKS", hooks: data.hooks });
      if (!opts?.deferCta) askCtaQuestion();
      return data.hooks as Hook[];
    } catch (e: any) {
      removeMsg(typingId);
      appendError(`Hook generation failed: ${e.message}`);
      appendPills("Want me to try again?", [
        { label: "Try again", value: "__retry_hooks__", tone: "primary" },
      ]);
      return null;
    }
  }

  async function generateOneScript(
    index: number,
    isSample: boolean,
    scriptTypeOverride?: "fleshed" | "framework",
    reprompt?: string,
    autoApprove = false,
    variantLabel?: string,
    opts?: {
      hook?: Hook;
      group?: number;
      skipPush?: boolean;
      replaceId?: string;
      deferAppend?: boolean;
      onReady?: (message: Extract<Message, { kind: "script" }>) => void;
    },
  ) {
    const state = sessionSnapshot.current.state;
    const topic = state.topics[state.selectedTopics[index]];
    const rawHook = opts ? opts.hook : state.hooks[index];
    const hook = rawHook || {
      topicIndex: index + 1,
      topicTitle: topic?.title || "",
      visual: "",
    };
    const scriptType = scriptTypeOverride || state.scriptType || "fleshed";
    const needsHook = state.format !== "broll";
    if (!topic || (needsHook && !rawHook)) {
      const missing = [!topic && "topic", needsHook && !rawHook && "hook"]
        .filter(Boolean)
        .join(", ");
      appendError(
        `I lost track of ${missing} before writing script #${index + 1}. Try the previous step again.`,
      );
      return null;
    }
    const writingId = opts?.replaceId || uid();
    if (opts?.group === undefined)
      dispatch({
        type: "APPEND",
        msg: {
          id: writingId,
          role: "ai",
          kind: "scriptWriting",
          index,
          total: state.selectedTopics.length,
          topic: topic.title,
        },
      });
    const credit = await consumeScriptCredit();
    if (!credit.ok) {
      if (opts?.group !== undefined)
        appendError(credit.message || "Running out of credits. Contact admin");
      else
        dispatch({
          type: "UPDATE_MSG",
          id: writingId,
          patch: {
            role: "ai",
            kind: "creditError",
            content: credit.message || "Running out of credits. Contact admin",
            retry: { index, isSample, scriptType },
          } as any,
        });
      return null;
    }
    try {
      const r = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          hook,
          scriptType,
          brief: briefBody(),
          prompts,
          reprompt,
          format: state.format,
          designSubtype: state.designSubtype || undefined,
          cta: state.cta || ctaRef.current,
          accessCode,
          singleOverlay: opts?.group !== undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.script) throw new Error(data.error || "Script generation failed");
      const scriptDoc: ScriptDoc = applySelectedCta(
        { ...data.script, topic: topic.title },
        state.cta || ctaRef.current,
      );
      const scriptMessage = {
        id: writingId,
        role: "ai",
        kind: "script",
        index,
        total: state.selectedTopics.length,
        topic: topic.title,
        script: scriptDoc,
        status: autoApprove ? "approved" : "sample",
        scriptType,
        variantLabel,
        editCount: 0,
        ...(opts?.group !== undefined ? { variantGroup: opts.group } : {}),
      } as Message;
      if (opts?.deferAppend && scriptMessage.kind === "script") opts.onReady?.(scriptMessage);
      else if (opts?.group !== undefined && !opts.replaceId)
        dispatch({ type: "APPEND", msg: scriptMessage });
      else dispatch({ type: "UPDATE_MSG", id: writingId, patch: scriptMessage });
      if (!opts?.skipPush) dispatch({ type: "PUSH_SCRIPT", script: scriptDoc });
      return scriptDoc;
    } catch (e: any) {
      if (opts?.group !== undefined) appendError(`Script failed: ${e.message}`);
      else
        dispatch({
          type: "UPDATE_MSG",
          id: writingId,
          patch: { role: "ai", kind: "error", content: `Script failed: ${e.message}` } as any,
        });
      return null;
    }
  }

  /**
   * Writes the script(s) for one topic. When the user picked "both", one fleshed
   * and one framework script are written for the same topic.
   */
  async function generateScript(
    index: number,
    isSample: boolean,
    scriptTypeOverride?: "fleshed" | "framework" | "both",
    reprompt?: string,
    autoApprove = false,
  ) {
    const t = scriptTypeOverride || state.scriptType || "fleshed";
    if (t === "both") {
      const a = await generateOneScript(
        index,
        isSample,
        "fleshed",
        reprompt,
        autoApprove,
        "Fleshed",
      );
      const b = await generateOneScript(
        index,
        isSample,
        "framework",
        reprompt,
        autoApprove,
        "Framework",
      );
      return b || a;
    }
    return generateOneScript(index, isSample, t, reprompt, autoApprove);
  }

  async function generateNextScript(index: number) {
    if (writingRef.current) return;
    writingRef.current = true;
    const total = state.selectedTopics.length;
    const reprompt = state.pendingBatchReprompt || undefined;
    let written: ScriptDoc | null = null;
    try {
      written = await generateScript(index, false, state.scriptType || "fleshed", reprompt, false);
    } finally {
      writingRef.current = false;
    }

    if (!written) {
      // Never leave the batch stuck: offer an explicit retry for this script.
      appendPills(`Script ${index + 1} of ${total} didn't come through. Try again?`, [
        {
          label: `Write script ${index + 1}`,
          value: `__next__:${index}`,
          tone: "primary" as const,
        },
      ]);
      dispatch({ type: "SET_PHASE", phase: "writingBatch" });
      return;
    }

    // The decision lives in the chat bubble below the card, never on the card.
    dispatch({ type: "SET_PHASE", phase: "approveTone" });
    offerScriptDecision(index, total);
  }

  /**
   * Asks for the approve / rewrite decision in a chat bubble under the script
   * card, so the card itself only holds the copy.
   */
  function offerScriptDecision(index: number, totalOverride?: number) {
    const total = totalOverride ?? state.selectedTopics.length;
    const isLast = index + 1 >= total;
    appendPills(
      isLast
        ? `Script ${index + 1} of ${total} is ready. Happy with it?`
        : `Script ${index + 1} of ${total} is ready. Happy with it?`,
      [
        {
          label: isLast ? "Write captions" : "Write next",
          value: "__approve_script__",
          tone: "approval" as const,
        },
        { label: "Reprompt", value: "__reprompt_script__" },
      ],
    );
  }

  async function runBatch() {
    await generateNextScript(1);
  }

  async function fetchCaptions() {
    const typingId = appendTyping("Writing captions for all four platforms…");
    try {
      const captionPrompts = {
        framework: prompts.framework,
        captionInstagram: prompts.captionInstagram,
        captionFacebook: prompts.captionFacebook,
        captionTiktok: prompts.captionTiktok,
        captionYoutube: prompts.captionYoutube,
        outputCaptions: prompts.outputCaptions,
        qaChecklistCaptions: prompts.qaChecklistCaptions,
      };
      const baseScripts = state.scripts.map((s, i) => ({
        ...s,
        captions: (s as any).captions || state.captions[i] || undefined,
      }));
      const captions: Caption[] = [];
      const visualHooks: string[] = [];
      for (let start = 0; start < baseScripts.length; start += 4) {
        const chunk = baseScripts.slice(start, start + 4);
        const chunkTitles = new Set(
          chunk
            .map((s) =>
              String(s.topic || "")
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean),
        );
        const chunkTopics = state.topics.filter((t) =>
          chunkTitles.has(
            String(t.title || "")
              .trim()
              .toLowerCase(),
          ),
        );
        const payload = JSON.stringify({
          // Always resend every script together with whatever captions already
          // exist for it, so the model has the full batch context.
          scripts: chunk,
          topics: chunkTopics,
          brief: briefBody(),
          prompts: captionPrompts,
          cta: state.cta || ctaRef.current,
          accessCode,
        });
        let r: Response | null = null;
        let raw = "";
        let lastNetworkError: unknown = null;
        for (let attempt = 0; attempt < 2 && !r; attempt++) {
          try {
            r = await fetch("/api/captions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
            });
            raw = await r.text();
          } catch (err) {
            lastNetworkError = err;
            if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 900));
          }
        }
        if (!r) {
          throw new Error(
            lastNetworkError instanceof Error
              ? `${lastNetworkError.message}. Please retry captions — the request was interrupted before the server responded.`
              : "The captions request was interrupted before the server responded. Please retry captions.",
          );
        }
        let data: any = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error(
            `Caption service returned an invalid response (${r.status}). Please retry.`,
          );
        }
        if (!r.ok || !data.captions) throw new Error(data.error || "Caption generation failed");
        captions.push(...data.captions);
        const hooks: string[] = Array.isArray(data.visualHooks) ? data.visualHooks : [];
        for (let i = 0; i < data.captions.length; i++) visualHooks.push(String(hooks[i] || ""));
      }
      removeMsg(typingId);
      // The visual hook (on-screen text overlay) for talking videos is written
      // here, from the approved script, so it sells the same promise as the
      // captions.
      const hookFor = (s: ScriptDoc, i: number) => {
        const hook = (visualHooks[i] || "").trim();
        if (!hook || s.kind !== "video" || s.format !== "talkingVideo") return null;
        return hook;
      };
      let scriptIdx = 0;
      state.messages.forEach((m) => {
        if (m.kind === "script" && !m.discarded && m.status === "approved") {
          const idx = m.variantGroup !== undefined ? m.index : scriptIdx++;
          const cap = captions[idx];
          const doc = (m as any).script as ScriptDoc | undefined;
          const hook = doc ? hookFor(doc, idx) : null;
          if (cap)
            dispatch({
              type: "UPDATE_MSG",
              id: m.id,
              patch: {
                captions: cap,
                ...(hook && doc ? { script: { ...doc, visualHook: hook } } : {}),
              } as any,
            });
        }
      });
      // Also attach captions onto the stored ScriptDoc list so PDF export includes them.
      state.scripts.forEach((s, i) => {
        const cap = captions[i];
        const hook = hookFor(s, i);
        if (cap)
          dispatch({
            type: "REPLACE_SCRIPT",
            index: i,
            script: { ...s, captions: cap, ...(hook ? { visualHook: hook } : {}) } as ScriptDoc,
          });
      });
      dispatch({ type: "SET_CAPTIONS", captions });
      appendAi("Captions are in. Here are all your scripts with their captions:");
      // Resend the scripts by moving every script card below this message.
      dispatch({ type: "MOVE_SCRIPTS_LAST" });
      offerFinalStep();
    } catch (e: any) {
      removeMsg(typingId);
      appendError(`Captions failed: ${e.message}`);
    }
  }

  function offerFinalStep() {
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "ai",
        kind: "finalActions",
        content: "All scripts and captions are ready. Ship them:",
        gdoc: { status: "idle" },
        pdf: { status: "idle" },
        production: { status: "idle" },
      } as any,
    });
    dispatch({ type: "SET_PHASE", phase: "offerPdf" });
  }

  async function createGoogleDoc(msgId: string) {
    const scriptMsgs = state.messages.filter((m: any) => m.kind === "script");
    if (!scriptMsgs.length) {
      appendError("No scripts to export.");
      return;
    }
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { gdoc: { status: "loading" } } as any });
    try {
      const payload = {
        accessCode,
        clientName,
        brandName: state.brandName || clientName,
        format: state.format,
        scripts: scriptMsgs.map((m: any) => ({
          topic: m.topic,
          scriptNumber: m.index + 1,
          script: m.script,
          captions: m.captions,
        })),
      };
      const r = await fetch("/api/create-google-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.webViewLink) throw new Error(data?.error || "Doc creation failed");
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { gdoc: { status: "done", url: data.webViewLink } } as any,
      });
      offerNextFormat();
    } catch (e: any) {
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { gdoc: { status: "error", error: e.message } } as any,
      });
    }
  }

  async function downloadPdfAction(msgId: string) {
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pdf: { status: "loading" } } as any });
    try {
      await buildAndDownloadPdf();
      dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pdf: { status: "done" } } as any });
      offerNextFormat();
    } catch (e: any) {
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { pdf: { status: "error", error: e.message } } as any,
      });
    }
  }

  /** After a download or a production hand-off, roll straight into another format. */
  function offerNextFormat(
    prefix = "Downloaded.",
    productionUpdate?: { format: Format; addedPipeline: number },
  ) {
    const already = state.messages.some(
      (m: any) =>
        m.kind === "pills" &&
        typeof m.content === "string" &&
        m.content.includes("Want to script another format next?"),
    );
    if (already) return;
    const metricsForRanking =
      productionUpdate && guidance?.formatMetrics
        ? {
            ...guidance.formatMetrics,
            [productionUpdate.format]: {
              posted: guidance.formatMetrics[productionUpdate.format]?.posted ?? 0,
              pipeline:
                (guidance.formatMetrics[productionUpdate.format]?.pipeline ?? 0) +
                productionUpdate.addedPipeline,
            },
          }
        : guidance?.formatMetrics;
    const nextFormat = getHighestNeedFormat(metricsForRanking, {
      broll: guidance?.broll ?? 0,
      talkingVideo: guidance?.talking ?? 0,
      graphic: guidance?.graphic ?? 0,
      carousel: guidance?.carousel ?? 0,
    });
    const optionFor = (format: Format) => ({
      label:
        nextFormat === format
          ? `Next: ${FORMAT_BALANCE_LABELS[format]}`
          : FORMAT_BALANCE_LABELS[format],
      value: `__newformat__:${format}`,
      tone: nextFormat === format ? ("priority" as const) : undefined,
    });
    appendPills(
      `${prefix} Want to script another format next?`,
      [
        optionFor("talkingVideo"),
        optionFor("broll"),
        optionFor("carousel"),
        optionFor("graphic"),
        { label: "I'm done for now", value: "__newformat__:none" },
      ],
      2,
    );
    dispatch({ type: "SET_PHASE", phase: "offerPdf" });
  }

  /**
   * Starts a fresh batch for another format, keeping the already-approved
   * session brief so the user skips that step entirely.
   */
  function startNextFormat(format: Format, count?: number) {
    dispatch({ type: "NEW_FORMAT_BATCH", format });
    ctaRef.current = "";
    slidesRef.current = 0;
    setProdStatus({});
    const nextCount = count && count > 0 ? count : recommendedCountForFormat(format);
    if (nextCount > 0) {
      dispatch({ type: "SET_COUNT", count: nextCount });
      appendPills("Do you already have topics in mind, or want me to suggest?", [
        { label: "Suggest some", value: "suggest" },
        { label: "I have topics", value: "have" },
      ]);
      dispatch({ type: "SET_PHASE", phase: "askTopicsMode" });
      return;
    }
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "ai",
        kind: "pills",
        content: "How many scripts do you want in this batch?",
        options: Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
        gridCols: 6,
      },
    });
    dispatch({ type: "SET_PHASE", phase: "askCount" });
  }

  async function addToProductionAction(
    msgId: string,
    opts?: { assigneeId?: string; assignTo?: "risevoice" },
  ) {
    dispatch({
      type: "UPDATE_MSG",
      id: msgId,
      patch: { production: { status: "loading" } } as any,
    });
    const res = await sendAllToProduction(opts);
    if (res.ok) {
      dispatch({ type: "UPDATE_MSG", id: msgId, patch: { production: { status: "done" } } as any });
      offerNextFormat(
        "Sent to production.",
        state.format && res.sentCount
          ? { format: state.format, addedPipeline: res.sentCount }
          : undefined,
      );
    } else {
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { production: { status: "error", error: res.error } } as any,
      });
    }
  }

  /** "Edit myself": download the ZIP, then explain the next steps. */
  async function editMyselfAction(msgId: string) {
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pdf: { status: "loading" } } as any });
    try {
      await buildAndDownloadPdf();
      dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pdf: { status: "done" } } as any });
      appendAi(
        "Your scripts are downloaded. Here's how to finish them yourself:\n\n1. Unzip the folder you just downloaded — it holds one PDF per script plus a combined PDF.\n2. Go to the “Create Yourself” tab and submit one request per post, attaching the matching script PDF and your raw files.",
      );
      offerNextFormat("Downloaded.");
    } catch (e: any) {
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { pdf: { status: "error", error: e.message } } as any,
      });
    }
  }

  async function sendAllToProduction(opts?: {
    assigneeId?: string;
    assignTo?: "risevoice";
  }): Promise<{ ok: boolean; error?: string; sentCount?: number }> {
    const scriptMsgs = state.messages.filter((m: any) => m.kind === "script");
    if (!scriptMsgs.length) {
      appendError("No scripts to send.");
      return { ok: false, error: "No scripts to send." };
    }
    const progressId = uid();
    dispatch({
      type: "APPEND",
      msg: {
        id: progressId,
        role: "ai",
        kind: "progress",
        label: "Adding scripts to production",
        current: 0,
        total: scriptMsgs.length,
      } as any,
    });
    let ok = 0;
    let failed = 0;
    let firstError = "";
    for (let i = 0; i < scriptMsgs.length; i++) {
      const m: any = scriptMsgs[i];
      const body = JSON.stringify({
        topic: m.topic,
        scriptNumber: m.index + 1,
        script: m.script,
        captions: m.captions,
        clientName,
        scriptType: m.scriptType,
        format: state.format,
        brandId: state.brandId,
        brandName: state.brandName,
        accessCode,
        sessionId: activeSession?.id,
        requestId: activeSession?.id
          ? `writer:${activeSession.id}:${m.index}`
          : `writer-card:${m.id}`,
        assigneeId: opts?.assigneeId,
        assignTo: opts?.assignTo,
      });
      let lastErr = "";
      let sent = false;
      // Retry only temporary network/server failures. Validation errors need a
      // field-mapping fix and should not create three identical requests.
      for (let attempt = 0; attempt < 3 && !sent; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800 * attempt));
        try {
          const r = await fetch("/api/send-to-production", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          const raw = await r.text();
          let data: any = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = {};
          }
          if (!r.ok) {
            const isTemporary = r.status === 408 || r.status === 429 || r.status >= 500;
            const serverMessage = typeof data?.error === "string" ? data.error : "";
            lastErr = serverMessage || `Production service unavailable (${r.status})`;
            if (isTemporary && attempt < 2) continue;
            break;
          }
          sent = true;
        } catch (e: any) {
          lastErr = e?.message || "Could not reach the production service";
        }
      }
      if (sent) {
        ok++;
        setProdStatus((s) => ({ ...s, [m.id]: "sent" }));
        dispatch({ type: "UPDATE_MSG", id: m.id, patch: { status: "approved" } as any });
      } else {
        failed++;
        if (!firstError) firstError = lastErr;
        setProdStatus((s) => ({ ...s, [m.id]: "error" }));
      }
      dispatch({ type: "UPDATE_MSG", id: progressId, patch: { current: i + 1 } as any });
    }
    removeMsg(progressId);
    // One Slack notification per batch when cards land in "To Edit | Design".
    if (ok > 0 && state.format && state.format !== "talkingVideo") {
      fetch("/api/notify-edit-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, brandName: clientName || state.brandName, count: ok }),
      }).catch(() => {});
    }
    if (ok > 0 && state.format) {
      const currentFormat = state.format;
      setGuidance((current) => {
        if (!current) return current;
        const metrics = { ...(current.formatMetrics || {}) } as NonNullable<
          typeof current.formatMetrics
        >;
        const previous = metrics[currentFormat] || { posted: 0, pipeline: 0 };
        metrics[currentFormat] = {
          posted: previous.posted,
          pipeline: previous.pipeline + ok,
        };
        return { ...current, formatMetrics: metrics };
      });
    }
    if (failed === 0) {
      appendAi(`✓ Added ${ok} script${ok === 1 ? "" : "s"} to production.`);
      return { ok: true, sentCount: ok };
    }
    const msg = `Sent ${ok} of ${ok + failed}. ${failed} failed${firstError ? `: ${firstError}` : ". Please try again."}`;
    appendError(msg);
    return { ok: false, error: msg };
  }

  function formatLabel(f: Format | null | undefined) {
    return f === "talkingVideo"
      ? "Talking Video"
      : f === "broll"
        ? "B-roll"
        : f === "carousel"
          ? "Carousel"
          : f === "graphic"
            ? "Graphic"
            : "Scripts";
  }

  /** e.g. "4 talking videos" — used by the sticky scripting banner. */
  function scriptingLabel() {
    const n = state.selectedTopics.length || state.count;
    const f = state.format;
    const noun =
      f === "talkingVideo"
        ? "talking video"
        : f === "broll"
          ? "B-roll"
          : f === "carousel"
            ? "carousel"
            : f === "graphic"
              ? "graphic"
              : "script";
    const plural = n === 1 || f === "broll" ? noun : `${noun}s`;
    const variant = state.scriptType === "both" ? " · fleshed + framework" : "";
    return `${n} ${plural}${variant}`;
  }

  /** Build a jsPDF doc. `only` = index of a single script (undefined = all scripts + cover). */
  function makeScriptPdf(only?: number) {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usable = pageWidth - margin * 2;
    const writeBlock = (label: string, body: string, opts: { y: number }) => {
      let y = opts.y;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(label.toUpperCase(), margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20);
      const lines = doc.splitTextToSize(body || "—", usable);
      for (const ln of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(ln, margin, y);
        y += 14;
      }
      return y + 8;
    };

    const brandLabel = state.brandName || clientName || "Risevoice";
    const fmtLabel = formatLabel(state.format);
    const todayLong = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (only === undefined) {
      // Cover page: title + "Generated DATE by USER"
      const docTitle = `${brandLabel} — ${fmtLabel} — ${todayLong}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(20);
      const titleLines = doc.splitTextToSize(docTitle, usable);
      let coverY = margin + 20;
      for (const ln of titleLines) {
        doc.text(ln, margin, coverY);
        coverY += 24;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text(`Generated ${todayLong} by ${clientName || "—"}`, margin, coverY + 4);
    }

    const total = state.scripts.length;
    const entries =
      only === undefined
        ? state.scripts.map((s, idx) => ({ s, idx }))
        : [{ s: state.scripts[only], idx: only }];

    entries.forEach(({ s, idx }, seq) => {
      if (only === undefined || seq > 0) doc.addPage();
      let y = margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(20);
      doc.text(`Script ${String(idx + 1)} of ${String(total)}`, margin, y);
      y += 22;

      const fmt = (s.format as FormatKey) || "talkingVideo";
      // "Format: <label>" — small and grey, so the exported file states what it is.
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Format: ${FORMAT_DOC_LABEL[fmt] || "Talking Video"}`, margin, y);
      y += 18;
      doc.setTextColor(20);

      y = writeBlock("Title", (s as any).topic || "—", { y });

      const spec = FORMAT_SPEC[fmt];
      const fields: FieldKey[] = spec?.fields ?? [];
      for (const f of fields) {
        if (!isAdmin && (f === "inspo" || f === "filmingInstructions")) continue;
        const val = readExportFieldValue(f, fmt, s as unknown as Record<string, any>);
        if (!val && (f === "filmingInstructions" || f === "inspo")) continue;
        y = writeBlock(getDocHeading(f, fmt), val, { y });
      }
      if (s.assignees && s.assignees.length) {
        const role = spec?.autoAssignRole === "designer" ? "Designer" : "Editor";
        y = writeBlock(role, s.assignees.map((a) => a.name).join(", "), { y });
      }

      if (s.captions) {
        if (y > pageHeight - margin - 40) {
          doc.addPage();
          y = margin;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(20);
        doc.text("Captions", margin, y);
        y += 18;
        y = writeBlock("Instagram", s.captions.instagram, { y });
        y = writeBlock("Facebook", s.captions.facebook, { y });
        y = writeBlock("TikTok", s.captions.tiktok, { y });
        y = writeBlock("YouTube", s.captions.youtube, { y });
      }
    });

    return doc;
  }

  /** Download a ZIP: one combined PDF with every script + one PDF per script. */
  async function buildAndDownloadPdf() {
    const brandLabel = state.brandName || clientName || "Risevoice";
    const fmtLabel = formatLabel(state.format);
    const today = new Date().toISOString().slice(0, 10);
    const safeBrand = brandLabel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    const safeFmt = fmtLabel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    const base = `${safeBrand}-${safeFmt}-${today}`;

    // Single script → no need for a zip.
    if (state.scripts.length <= 1) {
      makeScriptPdf().save(`${base}.pdf`);
      return;
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    zip.file(`${base}-all-scripts.pdf`, makeScriptPdf().output("blob"));
    const folder = zip.folder("individual-scripts");
    state.scripts.forEach((_, idx) => {
      const n = String(idx + 1);
      folder?.file(`${base}-script-${n}.pdf`, makeScriptPdf(idx).output("blob"));
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // Brief attach (shared by inline button & paperclip) -------------------
  async function handleBriefFile(file: File) {
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "user",
        kind: "fileChip",
        content: { name: file.name, label: "Brand brief attached" },
      },
    });
    dispatch({ type: "SET_BRIEF", brief: { text: "", name: file.name, loading: true } });
    dispatch({ type: "SET_PHASE", phase: "parsingBrief" });
    const typingId = appendTyping("Reading the brief…");
    const slowTimer = window.setTimeout(() => {
      dispatch({
        type: "UPDATE_MSG",
        id: typingId,
        patch: { label: "Still reading the brief… give me a few more seconds." } as any,
      });
    }, 10000);
    try {
      const { text, summary, topicsToPrioritize, languageToIncorporate, languageToAvoid } =
        await extractBriefFromPDF(file);
      window.clearTimeout(slowTimer);
      removeMsg(typingId);
      dispatch({
        type: "SET_BRIEF",
        brief: {
          text,
          name: file.name,
          loading: false,
          summary,
          topicsToPrioritize,
          languageToIncorporate,
          languageToAvoid,
        },
      });
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "brandSnapshot",
          content:
            summary ||
            `Got "${file.name}" loaded — I'll use it for voice, audience, and angle as we go.`,
          topicsToPrioritize,
          languageToIncorporate,
          languageToAvoid,
        },
      });
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "pills",
          content: "How many scripts do you want in this batch?",
          options: Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
          gridCols: 6,
        },
      });
      dispatch({ type: "SET_PHASE", phase: "askCount" });
    } catch (e: any) {
      window.clearTimeout(slowTimer);
      removeMsg(typingId);
      appendError(`Could not read PDF: ${e.message}`);
      dispatch({ type: "SET_PHASE", phase: "askBrief" });
    }
  }

  function openBriefPicker() {
    hiddenFileRef.current?.click();
  }

  function askCtaQuestion() {
    dispatch({
      type: "APPEND",
      msg: {
        id: uid(),
        role: "ai",
        kind: "ctaDecision",
        content: "Choose the CTA these scripts should drive toward.",
      },
    });
    dispatch({ type: "SET_PHASE", phase: "askCta" });
  }

  function askSlidesQuestion() {
    appendPills(
      "On average, how many slides do you want per carousel? (counting the cover hook slide and the CTA slide)",
      Array.from({ length: 8 }, (_, i) => ({ label: String(i + 3), value: i + 3 })),
      4,
    );
    dispatch({ type: "SET_PHASE", phase: "askSlides" });
  }

  async function afterCta() {
    if (state.format === "carousel" && !slidesRef.current) {
      slidesRef.current = state.designSubtype === "insightful" ? 10 : 6;
    }
    dispatch({ type: "SET_SCRIPT_TYPE", value: "fleshed" });
    const pendingHooks = hookPreparationRef.current;
    const waitId = pendingHooks ? appendTyping("Preparing your script options…") : "";
    const preparedHooks = pendingHooks ? await pendingHooks : null;
    if (waitId) removeMsg(waitId);
    hookPreparationRef.current = null;
    if (preparedHooks === null && sessionSnapshot.current.state.hooks.length === 0) return;
    void writeVariations(0, undefined, preparedHooks || undefined);
  }

  // Two-variation loop ---------------------------------------------------
  async function writeVariations(index: number, reprompt?: string, preparedHooks?: Hook[]) {
    if (!beginWriterAction()) return;
    const cur = sessionSnapshot.current.state;
    const total = cur.selectedTopics.length;
    let [h1, h2] = hookPair(preparedHooks || cur.hooks, index);
    if (!h1 && cur.format !== "broll") {
      // Resumed sessions don't carry hooks; prepare them again before writing.
      const picked = cur.selectedTopics.map((i) => cur.topics[i]).filter(Boolean);
      const fresh = picked.length ? await fetchHooks(picked, undefined, { deferCta: true }) : null;
      if (fresh) [h1, h2] = hookPair(fresh, index);
    }
    if (!h1 && cur.format === "broll") {
      const t = cur.topics[cur.selectedTopics[index]];
      if (t) h1 = h2 = { topicIndex: index + 1, topicTitle: t.title, visual: "" };
    }
    writingRef.current = true;
    dispatch({ type: "SET_PHASE", phase: "writingBatch" });
    const loadingId = appendTyping(`Writing two variations of script ${index + 1} of ${total}…`);
    let results: (ScriptDoc | null)[] = [];
    const pending: Array<Extract<Message, { kind: "script" }> | null> = [null, null];
    try {
      results = await Promise.all(
        [h1, h2].map((h, v) =>
          generateOneScript(index, false, "fleshed", reprompt, false, `Variation ${v + 1}`, {
            hook: h,
            group: index,
            skipPush: true,
            deferAppend: true,
            onReady: (message) => {
              pending[v] = message;
            },
          }),
        ),
      );
    } finally {
      writingRef.current = false;
      endWriterAction();
      removeMsg(loadingId);
    }
    const pair = completeVariationPair(pending);
    if (results.some((result) => !result) || pair.length !== 2) {
      appendPills(`Script ${index + 1} didn't come through. Try again?`, [
        { label: "Try again", value: `__variations__:${index}`, tone: "primary" },
      ]);
      return;
    }
    dispatch({ type: "APPEND_MANY", messages: pair });
    dispatch({ type: "SET_PHASE", phase: "pickVariation" });
  }

  async function regenerateVariation(message: Extract<Message, { kind: "script" }>) {
    if (!beginWriterAction()) return;
    setRegeneratingId(message.id);
    try {
      const variant = message.variantLabel === "Variation 2" ? 1 : 0;
      const [first, second] = hookPair(sessionSnapshot.current.state.hooks, message.index);
      await generateOneScript(
        message.index,
        false,
        "fleshed",
        undefined,
        false,
        message.variantLabel,
        {
          hook: variant === 1 ? second : first,
          group: message.index,
          skipPush: true,
          replaceId: message.id,
        },
      );
      dispatch({ type: "SET_PHASE", phase: "pickVariation" });
    } finally {
      setRegeneratingId(null);
      endWriterAction();
    }
  }

  async function captionOne(
    doc: ScriptDoc,
  ): Promise<{ captions?: Caption; visualHook?: string; visualHookOptions?: string[] }> {
    const cur = sessionSnapshot.current.state;
    const r = await fetch("/api/captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scripts: [doc],
        topics: cur.topics.filter((t) => t.title === doc.topic),
        brief: briefBody(),
        prompts: {
          framework: prompts.framework,
          captionInstagram: prompts.captionInstagram,
          captionFacebook: prompts.captionFacebook,
          captionTiktok: prompts.captionTiktok,
          captionYoutube: prompts.captionYoutube,
          outputCaptions: prompts.outputCaptions,
          qaChecklistCaptions: prompts.qaChecklistCaptions,
        },
        cta: state.cta || ctaRef.current,
        accessCode,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.captions?.[0]) throw new Error(data.error || "Caption generation failed");
    const isTalking = doc.kind === "video" && doc.format === "talkingVideo";
    const options = cleanHookOptions(data.visualHookOptions?.[0], data.visualHooks?.[0]);
    return {
      captions: data.captions[0],
      visualHookOptions: isTalking && options.length ? options : undefined,
    };
  }

  async function approveVariation(index: number, chosenId?: string) {
    if (!beginWriterAction()) return;
    try {
      const group = liveVariations(sessionSnapshot.current.state.messages as any[], index);
      const chosen: any = group.find((m: any) => (chosenId ? m.id === chosenId : m.chosen));
      if (!chosen) return;
      group.forEach((m: any) =>
        dispatch({ type: "UPDATE_MSG", id: m.id, patch: { chosen: m.id === chosen.id } as any }),
      );
      group.forEach((m: any) => {
        if (m.id !== chosen.id)
          dispatch({ type: "UPDATE_MSG", id: m.id, patch: { discarded: true } as any });
      });
      let doc: ScriptDoc = chosen.script;
      if (
        doc?.kind === "video" &&
        doc.format === "broll" &&
        doc.hookVariants?.length &&
        doc.selectedHookVariant === undefined
      ) {
        doc = { ...doc, selectedHookVariant: 0, script: doc.hookVariants[0] } as ScriptDoc;
      }
      dispatch({
        type: "UPDATE_MSG",
        id: chosen.id,
        patch: { status: "approved", script: doc } as any,
      });
      dispatch({ type: "SET_PHASE", phase: "writingCaptions" });
      const typingId = appendTyping("Writing captions for this script…");
      try {
        const { captions, visualHookOptions } = await captionOne(doc);
        removeMsg(typingId);
        const final = {
          ...doc,
          captions,
          ...(visualHookOptions ? { visualHookOptions, visualHook: "" } : {}),
        } as ScriptDoc;
        dispatch({
          type: "UPDATE_MSG",
          id: chosen.id,
          patch: { status: "approved", captions, script: final } as any,
        });
        dispatch({ type: "UPDATE_MSG", id: chosen.id, patch: { completed: true, chosen: true } });
        dispatch({ type: "PUSH_SCRIPT", script: final });
      } catch (e: any) {
        removeMsg(typingId);
        appendError(`Captions failed: ${e.message}`);
        appendPills("Try the captions again?", [
          { label: "Write captions", value: `__approve_variation__:${index}`, tone: "primary" },
        ]);
        dispatch({ type: "SET_PHASE", phase: "pickVariation" });
        return;
      }
      dispatch({ type: "SET_PHASE", phase: "addToPlanner" });
    } finally {
      endWriterAction();
    }
  }

  async function regenerateCaptions(
    message: Extract<Message, { kind: "script" }>,
    target: "captions" | "hooks" = "captions",
  ) {
    if (!beginWriterAction()) return;
    try {
      dispatch({ type: "SET_PHASE", phase: "writingCaptions" });
      const typingId = appendTyping(
        target === "hooks"
          ? "Writing new visual hook options…"
          : "Rewriting captions for this script…",
      );
      try {
        const { captions, visualHookOptions } = await captionOne(message.script);
        const script = (
          target === "hooks"
            ? {
                ...message.script,
                ...(visualHookOptions ? { visualHookOptions, visualHook: "" } : {}),
              }
            : { ...message.script, captions }
        ) as ScriptDoc;
        const nextCaptions = target === "hooks" ? message.captions : captions;
        dispatch({ type: "UPDATE_MSG", id: message.id, patch: { captions: nextCaptions, script } });
        const scriptIndex = state.scripts.findIndex((doc) => doc.topic === message.topic);
        if (scriptIndex >= 0) dispatch({ type: "REPLACE_SCRIPT", index: scriptIndex, script });
      } catch (error) {
        appendError(
          `Captions failed: ${error instanceof Error ? error.message : "Please try again"}`,
        );
      } finally {
        removeMsg(typingId);
        dispatch({ type: "SET_PHASE", phase: "addToPlanner" });
      }
    } finally {
      endWriterAction();
    }
  }

  function offerPlannerStep(index: number, afterDownload = false) {
    const total = sessionSnapshot.current.state.selectedTopics.length;
    const plannerLabel = plannerActionLabel(index, total);
    appendPills(
      afterDownload
        ? "Downloaded. Ready for the planner?"
        : `Script ${index + 1} of ${total} is ready with its captions.`,
      [
        ...(afterDownload ? [] : [{ label: "Download PDF", value: `__pdf_one__:${index}` }]),
        { label: plannerLabel, value: `__planner__:${index}`, tone: "primary" as const },
      ],
    );
    dispatch({ type: "SET_PHASE", phase: "addToPlanner" });
  }

  async function submitPlanner(index: number, choice: PlannerChoice): Promise<string | null> {
    if (!beginWriterAction()) return "Another action is still running. Please wait.";
    try {
      const cur = sessionSnapshot.current.state;
      const m: any = [...cur.messages]
        .reverse()
        .find(
          (x: any) =>
            x.kind === "script" &&
            x.variantGroup === index &&
            (x.completed || (x.chosen && !x.discarded)),
        );
      if (!m) return "I couldn't find the approved script.";
      let plannerRecordId: string | undefined;
      let designStarted = false;
      try {
        const r = await fetch("/api/send-to-production", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: m.topic,
            scriptNumber: index + 1,
            script: m.script,
            captions: m.captions,
            clientName,
            scriptType: m.scriptType,
            format: cur.format,
            brandId: cur.brandId,
            brandName: cur.brandName,
            accessCode,
            sessionId: activeSession?.id,
            selectedCta: state.cta || ctaRef.current,
            requestId: activeSession?.id ? `writer:${activeSession.id}:${index}` : undefined,
            planner: choice,
          }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return data?.error || "Could not add this post to the planner.";
        plannerRecordId = data.recordId;
        // "Produce now, I'll do it myself" for a carousel/graphic starts the AI design right away.
        if (
          choice.action === "produce" &&
          (choice as any).handler === "self" &&
          data.design?.id &&
          /carousel|graphic/i.test(String(data.design.postType || cur.format || ""))
        ) {
          const design = data.design;
          designStarted = true;
          void startAiDesign(design, {
            accessCode,
            setStatus: async (status) => {
              const res = await fetch("/api/dwy-client-content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-access-code": accessCode },
                body: JSON.stringify({ id: design.id, fields: { clientStatus: status } }),
              });
              if (!res.ok) throw new Error("Could not update the post.");
            },
            onAttached: () => {},
          });
        }
      } catch (e: any) {
        return e?.message || "Could not add this post to the planner.";
      }
      dispatch({ type: "UPDATE_MSG", id: m.id, patch: { plannerAdded: true } });
      cur.messages
        .filter((x: any) => x.kind === "script" && x.variantGroup === index && x.chosen)
        .forEach((x: any) =>
          dispatch({ type: "UPDATE_MSG", id: x.id, patch: { plannerAdded: true } }),
        );
      setPlannerFor(null);
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "user",
          kind: "text",
          plannerRecordId,
          content:
            choice.action === "queue"
              ? "Added to the production queue."
              : `Produce now, ${choice.handler === "self" ? "I'll do it myself" : "Risevoice team handles it"}.${designStarted ? " Designing the slides now. Follow the progress on the planner card." : ""}`,
        },
      });
      if (index + 1 < cur.selectedTopics.length) {
        setTimeout(() => writeVariations(index + 1), 30);
      } else {
        finishBatch();
      }
      return null;
    } finally {
      endWriterAction();
    }
  }

  function finishBatch() {
    const n = sessionSnapshot.current.state.selectedTopics.length;
    appendPills(`Done! All ${n} script${n === 1 ? " is" : "s are"} written and in your planner.`, [
      { label: "Download all scripts in PDF", value: "__pdf_all__" },
      {
        label: writeMode === "single" ? "Write another script" : "Write next batch",
        value: "__next_batch__",
        tone: "primary",
      },
    ]);
    dispatch({ type: "SET_PHASE", phase: "sessionDone" });
    if (activeSession && accessCode) {
      void fetch(`/api/writer-sessions?id=${encodeURIComponent(activeSession.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify({ status: "Done" }),
      })
        .then(() => {
          setActiveSession((session) => (session ? { ...session, status: "Done" } : session));
          setSessionsRefresh((k) => k + 1);
        })
        .catch(() => {});
    }
  }

  /** Single script: one topic from the user's idea, straight to two variations. */
  function startSingle(input: { idea: string; format: Format }) {
    const b = briefFromBrandInfo();
    if (!b && !state.brief) {
      appendError(
        "I couldn't read your Brand info. Complete it in the Brand info tab, then come back.",
      );
      return;
    }
    if (b && !state.brief) dispatch({ type: "SET_BRIEF", brief: b });
    dispatch({ type: "START_SCRIPTING" });
    dispatch({ type: "PICK_FORMAT", format: input.format });
    ensureWriterSession("single", input.format);
    const title = deriveSingleScriptTopic(input.idea);
    const topic: Topic = { title, rationale: input.idea.trim() } as Topic;
    const topics = input.format === "carousel" ? assignBalancedCarouselSubtypes([topic]) : [topic];
    dispatch({ type: "SET_COUNT", count: 1 });
    dispatch({ type: "SET_TOPICS", topics });
    dispatch({ type: "SET_SELECTED_TOPICS", indices: [0] });
    dispatch({ type: "SET_SCRIPT_TYPE", value: "fleshed" });
    appendUser(`${FORMAT_BALANCE_LABELS[input.format]}: ${input.idea.trim()}`);
    if (input.format === "graphic")
      dispatch({ type: "SET_DESIGN_SUBTYPE", value: "insightful" as DesignSubtype });
    setTimeout(() => {
      if (input.format === "broll") {
        dispatch({ type: "SET_HOOKS", hooks: [{ topicIndex: 1, topicTitle: title, visual: "" }] });
        askCtaQuestion();
      } else {
        fetchHooks(topics, undefined, { thenWrite: true });
      }
    }, 30);
  }

  // Pill handlers --------------------------------------------------------
  function handlePillPick(msgId: string, phase: ChatPhase, value: any, userLabel: string) {
    if (actionLock.current.busy || writingRef.current) return;
    // Only the newest question set is live. Older, unanswered pill sets are
    // stale: routing them through the current phase used to jump the flow back
    // to an earlier step (e.g. re-asking the format question).
    const latestPills = [...state.messages].reverse().find((m: any) => m.kind === "pills") as any;
    if (latestPills && latestPills.id !== msgId) return;
    if (UNDOABLE_PHASES.includes(phase)) {
      dispatch({ type: "CHECKPOINT", label: DECISION_LABELS[phase] || "last step" });
    }
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pickedValue: value } as any });
    appendUser(userLabel);

    // Value-first routing: these answers are unambiguous regardless of the
    // phase we happen to be sitting in when the click lands.
    if (typeof value === "string" && value.startsWith("__newformat__:")) {
      const picked = value.split(":")[1];
      if (picked === "none") {
        appendAi("All good. Come back whenever you want the next batch.");
        return;
      }
      startNextFormat(picked as Format);
      return;
    }
    if (typeof value === "string" && value.startsWith("__")) {
      const [key, arg] = value.split(":");
      const i = Number(arg);
      if (key === "__variations__") return void writeVariations(i);
      if (key === "__regen_variations__") {
        liveVariations(state.messages as any[], i).forEach((m: any) =>
          dispatch({
            type: "UPDATE_MSG",
            id: m.id,
            patch: { discarded: true, chosen: false } as any,
          }),
        );
        return void writeVariations(i);
      }
      if (key === "__approve_variation__") return void approveVariation(i);
      if (key === "__pdf_one__") {
        const st = sessionSnapshot.current.state;
        const pos = st.scripts.length - 1;
        try {
          makeScriptPdf(pos).save(
            `${(state.brandName || clientName || "Risevoice").replace(/[^a-z0-9]+/gi, "-")}-script-${i + 1}.pdf`,
          );
        } catch (e: any) {
          appendError(`PDF failed: ${e.message}`);
        }
        offerPlannerStep(i, true);
        return;
      }
      if (key === "__planner__") {
        setPlannerFor(i);
        // Keep the button usable if the window is closed without confirming.
        dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pickedValue: undefined } as any });
        return;
      }
      if (key === "__pdf_all__") {
        void buildAndDownloadPdf().catch((e) => appendError(`PDF failed: ${e.message}`));
        dispatch({ type: "UPDATE_MSG", id: msgId, patch: { pickedValue: undefined } as any });
        return;
      }
      if (key === "__retry_step__") {
        const st = sessionSnapshot.current.state;
        if (arg === "researching") return void fetchTopics();
        if (arg === "generatingHooks")
          return void fetchHooks(
            st.selectedTopics.map((x) => st.topics[x]),
            undefined,
            { thenWrite: writeMode === "single" },
          );
        // Writing: resume the first script that has no approved variation yet,
        // or write captions for an approved one still missing them.
        const chosen = st.messages.filter(
          (m: any) => m.kind === "script" && m.chosen && !m.discarded,
        ) as any[];
        const needsCaptions = chosen.find((m) => !m.captions);
        if (arg === "writingCaptions" && needsCaptions)
          return void approveVariation(needsCaptions.variantGroup, needsCaptions.id);
        const next = chosen.length;
        liveVariations(st.messages as any[], next).forEach((m: any) =>
          dispatch({ type: "UPDATE_MSG", id: m.id, patch: { discarded: true } as any }),
        );
        return void writeVariations(next);
      }
      if (key === "__retry_hooks__") {
        const st = sessionSnapshot.current.state;
        return void fetchHooks(
          st.selectedTopics.map((x) => st.topics[x]),
          undefined,
          { thenWrite: writeMode === "single" },
        );
      }
      if (key === "__next_batch__") {
        const mode = writeMode || "batch";
        startNewBatch();
        setWriteMode(mode);
        if (mode === "batch") ensureWriterSession("batch");
        return;
      }
    }

    if (phase === "askFormat") {
      ensureWriterSession(writeMode || "batch", value as Format);
      dispatch({ type: "PICK_FORMAT", format: value as Format });
      if (value === "graphic") {
        appendPills(`What kind of ${value} is this?`, [
          { label: "Quote", value: "quote" },
          { label: "Insightful", value: "insightful" },
        ]);
        dispatch({ type: "SET_PHASE", phase: "askDesignSubtype" });
        return;
      }
      if (isAdmin && state.adminBriefSummary) {
        // Admin has already approved the session brief; jump straight to the batch size question.
        dispatch({
          type: "APPEND",
          msg: {
            id: uid(),
            role: "ai",
            kind: "pills",
            content: "How many scripts do you want in this batch?",
            options: Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
            gridCols: 6,
          },
        });
        dispatch({ type: "SET_PHASE", phase: "askCount" });
      } else if (!isAdmin) {
        // Client users: the session brief was already approved before the format
        // question, so just make sure the Brand info brief is loaded.
        if (!state.brief) {
          const b = briefFromBrandInfo();
          if (!b) {
            appendError(
              "I couldn't read your Brand info. Complete it in the Brand info tab, then come back.",
            );
            return;
          }
          dispatch({ type: "SET_BRIEF", brief: b });
          if (!state.adminBriefSummary) appendAi(brandSnapshot());
        }

        dispatch({
          type: "APPEND",
          msg: {
            id: uid(),
            role: "ai",
            kind: "pills",
            content: "How many scripts do you want in this batch?",
            options: Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
            gridCols: 6,
          },
        });
        dispatch({ type: "SET_PHASE", phase: "askCount" });
      } else if (state.existingBrief && state.brandId) {
        dispatch({
          type: "APPEND",
          msg: {
            id: uid(),
            role: "ai",
            kind: "existingBriefPicker",
            content: `I found a brand brief on file for ${state.brandName || "this client"}. Want to use it, or upload a new one?`,
            filename: state.existingBrief.filename,
            brandId: state.brandId,
          },
        });
        dispatch({ type: "SET_PHASE", phase: "askBrief" });
      } else {
        dispatch({
          type: "APPEND",
          msg: {
            id: uid(),
            role: "ai",
            kind: "askBriefCta",
            content:
              "Cool. I'll need your brand brief first so the whole batch sits on solid context.",
          },
        });
        dispatch({ type: "SET_PHASE", phase: "askBrief" });
      }
    } else if (phase === "askDesignSubtype") {
      dispatch({ type: "SET_DESIGN_SUBTYPE", value: value as DesignSubtype });
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "ai",
          kind: "pills",
          content: "How many scripts do you want in this batch?",
          options: Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
          gridCols: 6,
        },
      });
      dispatch({ type: "SET_PHASE", phase: "askCount" });
    } else if (phase === "askCount") {
      dispatch({ type: "SET_COUNT", count: value });
      appendPills("Do you already have topics in mind, or want me to suggest?", [
        { label: "Suggest some", value: "suggest" },
        { label: "I have topics", value: "have" },
      ]);
      dispatch({ type: "SET_PHASE", phase: "askTopicsMode" });
    } else if (phase === "askTopicsMode") {
      dispatch({ type: "SET_TOPICS_MODE", mode: value });
      if (value === "suggest") {
        fetchTopics();
      } else {
        appendAi("Drop the topics here — one per line — and I'll line them up.");
      }
    } else if (phase === "approveHooks") {
      if (value === "retry") {
        const picked = state.selectedTopics.map((i) => state.topics[i]);
        fetchHooks(picked);
      } else {
        const latestHookMsg = [...state.messages].reverse().find((mm) => mm.kind === "hookList");
        if (latestHookMsg) approveSelectedHooks(latestHookMsg.id);
        else askCtaQuestion();
      }
    } else if (phase === "askCta") {
      if (value === "__skip__") {
        ctaRef.current = "";
        dispatch({ type: "SET_CTA", value: "" });
        void afterCta();
      }
    } else if (phase === "askSlides") {
      slidesRef.current = Number(value) || 0;
      void afterCta();
    } else if (phase === "askScriptType") {
      const picked = value as "fleshed" | "framework" | "both";
      dispatch({ type: "SET_SCRIPT_TYPE", value: picked });
      appendAi(
        picked === "both"
          ? "Writing script #1 in both a fleshed and a framework version so you can compare."
          : "Writing script #1 first so you can sanity-check the tone.",
      );
      dispatch({ type: "SET_PHASE", phase: "writingSample" });
      setTimeout(() => {
        (async () => {
          const s = await generateScript(0, true, picked);
          if (s) {
            dispatch({ type: "SET_PHASE", phase: "approveTone" });
            offerScriptDecision(0);
          }
        })();
      }, 50);
    } else if (phase === "writingBatch") {
      if (typeof value === "string" && value.startsWith("__next__:")) {
        const idx = parseInt(value.split(":")[1], 10);
        if (!Number.isNaN(idx)) {
          // Moving on to the next script auto-approves every previous one; only
          // the final script needs a manual approval.
          state.messages.forEach((m: any) => {
            if (m.kind === "script" && m.status !== "approved") {
              dispatch({ type: "UPDATE_MSG", id: m.id, patch: { status: "approved" } as any });
            }
          });
          dispatch({ type: "SET_PHASE", phase: "writingBatch" });
          setTimeout(() => {
            generateNextScript(idx);
          }, 50);
        }
      } else if (value === "__pause__") {
        appendAi("Paused. Let me know when you'd like the next one.");
      }
    } else if (phase === "approveTone") {
      const lastScript = [...state.messages]
        .reverse()
        .find((mm: any) => mm.kind === "script") as any;
      if (!lastScript) return;
      if (value === "__reprompt_script__") {
        appendAi("Tell me what to change and I'll rewrite it.");
        return;
      }
      if (value === "__approve_script__") {
        const doc = lastScript.script;
        // B-roll: if the user never ticked an overlay option, lock the first
        // one in instead of dead-ending the flow.
        if (
          doc?.format === "broll" &&
          !!doc?.hookVariants?.length &&
          doc.selectedHookVariant === undefined
        ) {
          editScript(lastScript.id, lastScript.index, {
            ...doc,
            selectedHookVariant: 0,
            script: doc.hookVariants[0],
          } as ScriptDoc);
        }
        approveAndNext(lastScript.id, lastScript.index);
      }
    } else if (phase === "offerCaptions") {
      if (value === "captions" || value === true) {
        dispatch({ type: "SET_PHASE", phase: "writingCaptions" });
        fetchCaptions();
      } else {
        offerFinalStep();
      }
    }
  }

  // Retry a script after a credit error -----------------------------------
  async function retryScript(
    msgId: string,
    retry: { index: number; isSample: boolean; scriptType: "fleshed" | "framework" },
  ) {
    removeMsg(msgId);
    const s = await generateScript(retry.index, retry.isSample, retry.scriptType);
    if (s && retry.isSample) {
      dispatch({ type: "SET_PHASE", phase: "approveTone" });
      offerScriptDecision(retry.index);
    }
  }

  // Topic approval -------------------------------------------------------
  function approveTopics(msgId: string, indices: number[]) {
    if (indices.length === 0) return;
    dispatch({ type: "CHECKPOINT", label: "topic selection" });
    const nextTopics =
      state.format === "carousel"
        ? (() => {
            const assigned = assignBalancedCarouselSubtypes(
              indices.map((index) => state.topics[index]),
            );
            const byIndex = new Map(indices.map((index, position) => [index, assigned[position]]));
            return state.topics.map((topic, index) => byIndex.get(index) || topic);
          })()
        : state.topics;
    dispatch({ type: "SET_TOPICS", topics: nextTopics });
    dispatch({ type: "SET_SELECTED_TOPICS", indices });
    dispatch({
      type: "UPDATE_MSG",
      id: msgId,
      patch: { selected: indices, approved: true } as any,
    });
    appendUser(`Picked ${indices.length} topic${indices.length === 1 ? "" : "s"}.`);
    const picked = indices.map((i) => nextTopics[i]);
    // B-roll has no separate hook step — the hook is the first beat of the
    // text overlay sequence, written together with the script. Skip straight
    // to the CTA question.
    if (state.format === "broll") {
      const stubHooks: Hook[] = picked.map((t, i) => ({
        topicIndex: i + 1,
        topicTitle: t.title,
        visual: "",
      }));
      dispatch({ type: "SET_HOOKS", hooks: stubHooks });
      askCtaQuestion();
      return;
    }
    hookPreparationRef.current = fetchHooks(picked, undefined, { deferCta: true });
    askCtaQuestion();
  }

  /**
   * One decision at a time: approving a script immediately writes the next one.
   * On the final script it approves everything and generates the captions,
   * which resends all scripts below the last message.
   */
  function approveAndNext(msgId: string, index: number) {
    const total = state.selectedTopics.length;
    const isLast = index + 1 >= total;
    // Approve this card plus any earlier card still waiting.
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { status: "approved" } as any });
    state.messages.forEach((m: any) => {
      if (m.kind === "script" && m.id !== msgId && m.status !== "approved") {
        dispatch({ type: "UPDATE_MSG", id: m.id, patch: { status: "approved" } as any });
      }
    });

    if (isLast) {
      appendUser("Approved. Write the captions.");
      dispatch({ type: "SET_PHASE", phase: "writingCaptions" });
      setTimeout(() => {
        fetchCaptions();
      }, 50);
      return;
    }
    appendUser(`Approved script ${index + 1}. Write the next one.`);
    dispatch({ type: "SET_PHASE", phase: "writingBatch" });
    setTimeout(() => {
      generateNextScript(index + 1);
    }, 50);
  }

  /**
   * Rewrite triggered from the inline panel in the decision bubble: rewrites the
   * latest script in place and re-offers the approve / rewrite decision.
   */
  async function runScriptReprompt(pillsMsgId: string, instructions: string) {
    const lastScript = [...state.messages].reverse().find((m: any) => m.kind === "script") as any;
    if (!lastScript) return;
    dispatch({
      type: "UPDATE_MSG",
      id: pillsMsgId,
      patch: { repromptBusy: true } as any,
    });
    await repromptScript(lastScript.id, lastScript.index, instructions);
    dispatch({
      type: "UPDATE_MSG",
      id: pillsMsgId,
      patch: { repromptBusy: false, repromptOpen: false } as any,
    });
    dispatch({ type: "SET_PHASE", phase: "approveTone" });
    offerScriptDecision(lastScript.index);
  }

  async function repromptScript(msgId: string, index: number, instructions: string) {
    appendUser(`Reprompt script ${index + 1}: ${instructions}`);
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { kind: "scriptWriting" } as any });
    const topic = state.topics[state.selectedTopics[index]];
    const hook = state.hooks[index];
    if (!topic || !hook) return;
    try {
      const r = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          hook,
          scriptType: state.scriptType || "fleshed",
          brief: briefBody(),
          prompts,
          reprompt: instructions,
          format: state.format,
          cta: state.cta || ctaRef.current,
          accessCode,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.script) throw new Error(data.error || "Failed");
      const scriptDoc: ScriptDoc = { ...data.script, topic: topic.title };
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { kind: "script", script: scriptDoc, editCount: 0 } as any,
      });
      dispatch({ type: "REPLACE_SCRIPT", index, script: scriptDoc });
    } catch (e: any) {
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { kind: "error", content: `Reprompt failed: ${e.message}` } as any,
      });
    }
  }

  function editScript(msgId: string, index: number, next: ScriptDoc) {
    const msg = state.messages.find((m) => m.id === msgId);
    if (!msg || msg.kind !== "script") return;
    dispatch({
      type: "UPDATE_MSG",
      id: msgId,
      patch: {
        script: next,
        ...(next.captions ? { captions: next.captions } : {}),
        editCount: msg.editCount + 1,
      } as any,
    });
    dispatch({ type: "REPLACE_SCRIPT", index, script: { ...next, topic: msg.topic } });
  }

  // Per-hook editing / approval / regeneration ---------------------------
  function getHookMsg(msgId: string) {
    const m = state.messages.find((x) => x.id === msgId);
    return m && m.kind === "hookList" ? m : null;
  }

  function editHook(msgId: string, i: number, patch: Partial<Hook>) {
    const msg = getHookMsg(msgId);
    if (!msg) return;
    const next = msg.hooks.map((h, idx) => (idx === i ? { ...h, ...patch } : h));
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { hooks: next } as any });
    dispatch({ type: "SET_HOOKS", hooks: next });
  }

  function toggleHookApproved(msgId: string, i: number) {
    const msg = getHookMsg(msgId);
    if (!msg) return;
    const flags = (msg.approvedFlags ?? msg.hooks.map(() => false)).slice();
    const groupOf = (idx: number) =>
      msg.hooks[idx]?.topicIndex ?? msg.hooks[idx]?.topicTitle ?? idx;
    if (!flags[i]) {
      // One pick per topic: selecting an option replaces the previous pick
      // for that same topic instead of consuming another topic's slot.
      const g = groupOf(i);
      msg.hooks.forEach((_, idx) => {
        if (groupOf(idx) === g) flags[idx] = false;
      });
      flags[i] = true;
    } else {
      flags[i] = false;
    }
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { approvedFlags: flags } as any });
  }

  function setHookReprompt(msgId: string, i: number | null) {
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { repromptOpen: i } as any });
  }

  async function regenerateHook(msgId: string, i: number, instructions: string) {
    const msg = getHookMsg(msgId);
    if (!msg) return;
    const hook = msg.hooks[i];
    const originalTopicIdx =
      hook?.topicIndex != null
        ? state.selectedTopics[hook.topicIndex - 1]
        : state.selectedTopics[i];
    const topic = originalTopicIdx != null ? state.topics[originalTopicIdx] : null;
    if (!topic) return;
    dispatch({
      type: "UPDATE_MSG",
      id: msgId,
      patch: { regenIndex: i, repromptOpen: null } as any,
    });
    try {
      const r = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: [topic],
          brief: briefBody(),
          prompts,
          reprompt:
            [hook?.angle ? `Keep the same angle: ${hook.angle}.` : "", instructions || ""]
              .filter(Boolean)
              .join(" ") || undefined,
          format: state.format,
          accessCode,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.hooks?.[0]) throw new Error(data.error || "Hook regeneration failed");
      const newHook: Hook = {
        ...data.hooks[0],
        angle: hook?.angle ?? data.hooks[0]?.angle,
        topicTitle: topic.title,
        topicIndex: hook?.topicIndex ?? i + 1,
      } as Hook;
      const nextHooks = msg.hooks.map((h, idx) => (idx === i ? newHook : h));
      const flags = (msg.approvedFlags ?? msg.hooks.map(() => false)).slice();
      flags[i] = false;
      dispatch({
        type: "UPDATE_MSG",
        id: msgId,
        patch: { hooks: nextHooks, approvedFlags: flags, regenIndex: null } as any,
      });
    } catch (e: any) {
      dispatch({ type: "UPDATE_MSG", id: msgId, patch: { regenIndex: null } as any });
      appendError(`Hook regen failed: ${e.message}`);
    }
  }

  function approveSelectedHooks(msgId: string) {
    const msg = getHookMsg(msgId);
    if (!msg) return;
    const flags = msg.approvedFlags ?? msg.hooks.map(() => false);
    const pickedIdxs = flags.map((f, i) => (f ? i : -1)).filter((i) => i >= 0);
    if (!pickedIdxs.length) return;
    dispatch({ type: "CHECKPOINT", label: "hook selection" });
    const picked = pickedIdxs.map((i) => msg.hooks[i]);
    // Re-derive selectedTopics from each picked hook's original topicIndex
    const newSelectedTopics = picked.map((h, i) => {
      const ti =
        h.topicIndex != null ? state.selectedTopics[h.topicIndex - 1] : state.selectedTopics[i];
      return ti ?? state.selectedTopics[0];
    });
    const newHooks: Hook[] = picked.map((h, i) => ({ ...h, topicIndex: i + 1 }));
    dispatch({ type: "UPDATE_MSG", id: msgId, patch: { approved: true } as any });
    dispatch({ type: "SET_SELECTED_TOPICS", indices: newSelectedTopics });
    dispatch({ type: "SET_HOOKS", hooks: newHooks });
    askCtaQuestion();
  }

  // Paperclip attach -----------------------------------------------------
  async function onAttach(kind: AttachKind, file: File | null) {
    if (kind === "brief" && file) {
      if (isAdmin && state.brandId) await uploadAdminBrief(file);
      else await handleBriefFile(file);
    } else if (kind === "report") {
      if (state.seedReport) appendAi("The analysis report is already attached.");
      else
        appendAi("No analysis report available — run Analyze mode first, then 'Send to scripts'.");
    } else if (kind === "transcript" && file) {
      dispatch({
        type: "APPEND",
        msg: {
          id: uid(),
          role: "user",
          kind: "fileChip",
          content: { name: file.name, label: "Transcript attached" },
        },
      });
      appendAi("Transcript noted. I'll reference it for tone alignment.");
    }
  }

  // Phase-aware free-text ------------------------------------------------
  function onSendFreeText(text: string) {
    appendUser(text);
    const phase = state.phase;

    if (phase === "askTopicsMode" && state.topicsMode === "have") {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const rawTopics: Topic[] = lines.map((title) => ({ title, rationale: "" }));
      const topics =
        state.format === "carousel"
          ? assignBalancedCarouselSubtypes(rawTopics.slice(0, state.count))
          : rawTopics;
      dispatch({ type: "SET_TOPICS", topics });
      const indices = topics.map((_, i) => i).slice(0, state.count);
      dispatch({ type: "SET_SELECTED_TOPICS", indices });
      appendAi(
        `Got ${topics.length} topics. Preparing the first ${indices.length} script options…`,
      );
      fetchHooks(indices.map((i) => topics[i]));
      return;
    }

    if (phase === "approveTopics") {
      appendAi("Got it — regenerating topics with that in mind.");
      fetchTopics(text);
      return;
    }

    if (phase === "approveHooks") {
      appendAi(
        state.format === "graphic" || state.format === "carousel"
          ? "Reworking the cover hooks. One sec."
          : "Reworking the hooks. One sec.",
      );
      const picked = state.selectedTopics.map((i) => state.topics[i]);
      fetchHooks(picked, text);
      return;
    }

    if (phase === "askCta") {
      ctaRef.current = text.trim();
      dispatch({ type: "SET_CTA", value: text.trim() });
      void afterCta();
      return;
    }

    if (phase === "approveTone") {
      appendAi("Got it. Rewriting in that direction.");
      (async () => {
        const lastScript = [...state.messages].reverse().find((m) => m.kind === "script") as any;
        if (lastScript) {
          await repromptScript(lastScript.id, lastScript.index, text);
          // Re-offer the approve / change decision so the batch can continue.
          dispatch({ type: "SET_PHASE", phase: "approveTone" });
          offerScriptDecision(lastScript.index);
        }
      })();
      return;
    }

    if (phase === "writingBatch" || phase === "writingSample") {
      const lastScript = [...state.messages].reverse().find((mm) => mm.kind === "script") as any;
      if (lastScript) {
        appendAi(`Rewriting script ${lastScript.index + 1} with that direction.`);
        dispatch({ type: "SET_BATCH_REPROMPT", v: text });
        (async () => {
          await repromptScript(lastScript.id, lastScript.index, text);
        })();
      } else {
        dispatch({ type: "SET_BATCH_REPROMPT", v: text });
        appendAi(
          "Got it — I'll factor that in as soon as the first script is ready so you can sanity-check it.",
        );
      }
      return;
    }

    if (phase === "askBrief" || phase === "parsingBrief") {
      appendAi(
        "Attach the brand brief PDF using the button above (or the paperclip below) so I have the audience context.",
      );
      return;
    }

    if (phase === "askFormat") {
      appendAi(
        "Tap one of the format options above to get started — Talking Video, B-roll, Carousel, or Graphic.",
      );
      return;
    }

    if (phase === "askCount") {
      const n = parseInt(text, 10);
      if (!isNaN(n) && n > 0 && n <= 20) {
        dispatch({ type: "SET_COUNT", count: n });
        appendPills("Do you already have topics in mind, or want me to suggest?", [
          { label: "Suggest some", value: "suggest" },
          { label: "I have topics", value: "have" },
        ]);
        dispatch({ type: "SET_PHASE", phase: "askTopicsMode" });
      } else {
        appendAi("Pick a number between 1 and 20, or tap one of the suggestions above.");
      }
      return;
    }

    if (phase === "offerCaptions" || phase === "offerPdf" || phase === "done") {
      appendAi("Anything else you'd like me to revisit on the scripts above?");
      return;
    }

    appendAi(
      `Hmm, I'm in the middle of ${phaseLabel(phase)} — let me finish this step first, then we can adjust.`,
    );
  }

  // Render ---------------------------------------------------------------
  const strategyStrip = (pickable: boolean) => (
    <StrategyStrip
      guidance={guidance}
      loading={guidanceLoading}
      compact={false}
      view={pickable ? "writer" : "details"}
      accessCode={accessCode}
      auditReport={state.seedReport}
      auditMeta={{ profile: seedAccount, createdAt: seedCreatedAt }}
      onStrategySaved={(update) =>
        setGuidance((current) => (current ? { ...current, ...update } : current))
      }
      onPickFormat={
        pickable && !state.hasStarted
          ? (pick) =>
              startScripting({
                format: pick.format as Format,
                count: Math.min(24, Math.max(1, pick.count)),
                label: pick.label,
              })
          : undefined
      }
    />
  );
  function renderTranscript(messages: Message[], readOnly = false) {
    const renderScript = (m: Extract<Message, { kind: "script" }>) => {
      const group = m.variantGroup;
      if (!readOnly && regeneratingId === m.id) {
        return (
          <ScriptCardWriting
            key={m.id}
            scriptNumber={m.index + 1}
            totalScripts={m.total}
            topic={m.topic}
            variationLabel={m.variantLabel}
            rewriting
          />
        );
      }
      return (
        <div key={m.id} className={m.discarded ? "min-w-0 opacity-45" : "min-w-0"}>
          <ScriptCard
            scriptNumber={m.index + 1}
            totalScripts={m.total}
            topic={m.topic}
            script={m.script}
            status={m.status}
            scriptType={m.scriptType}
            variantLabel={m.variantLabel}
            editCount={m.editCount}
            captions={m.captions}
            onEdit={(next) => editScript(m.id, m.index, next)}
            editableAfterCaptions={messages.some((item) => item.id === "repurpose-context")}
            isAdmin={isAdmin}
            assigneeOptions={assigneeOptions}
            discarded={m.discarded}
            completed={m.completed}
            busy={
              actionBusy ||
              state.loading ||
              plannerFor !== null ||
              state.phase === "writingCaptions"
            }
            onRegenerate={
              readOnly ||
              group === undefined ||
              messages.some((item) => item.id === "repurpose-context")
                ? undefined
                : () => void regenerateVariation(m)
            }
            onApproveAndCaption={
              readOnly || group === undefined ? undefined : () => void approveVariation(group, m.id)
            }
            onRegenerateCaptions={
              readOnly || !m.completed ? undefined : () => void regenerateCaptions(m)
            }
            onRegenerateVisualHooks={
              readOnly || !m.completed ? undefined : () => void regenerateCaptions(m, "hooks")
            }
            onAddNext={
              readOnly || !m.completed
                ? undefined
                : () => {
                    if (needsVisualHookChoice(m.script)) return;
                    if (!actionLock.current.busy) setPlannerFor(m.index);
                  }
            }
            addNextLabel={plannerActionLabel(m.index, m.total)}
          />
          {m.discarded && <p className="mt-1 text-xs text-brand-ink-soft">Not used</p>}
        </div>
      );
    };
    const renderedGroups = new Set<number>();
    return (
      <TranscriptReadOnly.Provider value={readOnly}>
        <fieldset disabled={readOnly || actionBusy} className="min-w-0 space-y-6 border-0 p-0">
          {messages.map((m, messageIndex) => {
            if (m.role === "user" && m.kind === "fileChip") {
              return (
                <UserBubble key={m.id} clientName={clientName}>
                  <div className="inline-flex items-center gap-2 text-[12px] text-[#2A2A2E]">
                    <FileText className="w-3.5 h-3.5 text-[#5A5860]" />
                    <span className="font-medium">{m.content.name}</span>
                    <span className="text-[#9B9BA1]">· {m.content.label}</span>
                  </div>
                </UserBubble>
              );
            }
            if (m.role === "user")
              return (
                <UserBubble key={m.id} clientName={clientName}>
                  <div className="flex flex-col items-start gap-2">
                    <span className="block">{m.content}</span>
                    {m.kind === "text" && m.plannerRecordId && (
                      <a
                        href={`/?planner=${encodeURIComponent(m.plannerRecordId)}`}
                        onClick={(e) => { e.preventDefault(); window.location.assign(`/?planner=${encodeURIComponent(m.plannerRecordId!)}`); }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-accent no-underline hover:bg-brand-wash"
                      >
                        View post in Planner <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </UserBubble>
              );
            if (m.role === "ai" && m.kind === "text")
              return <AiBubble key={m.id}>{m.content}</AiBubble>;
            if (m.role === "ai" && m.kind === "ctaDecision")
              return (
                <AiBubble key={m.id}>
                  <p>{m.content}</p>
                  {m.completed ? (
                    <p className="mt-3 text-sm font-semibold text-brand-accent">{m.selectedCta}</p>
                  ) : (
                    <CtaDecisionCard
                      disabled={readOnly}
                      onConfirm={(cta) => {
                        ctaRef.current = cta;
                        dispatch({ type: "SET_CTA", value: cta });
                        dispatch({
                          type: "UPDATE_MSG",
                          id: m.id,
                          patch: { completed: true, selectedCta: cta },
                        });
                        appendUser(cta);
                        afterCta();
                      }}
                    />
                  )}
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "brandPicker") {
              return (
                <AiBubble key={m.id}>
                  <p className="mb-3">{m.content}</p>
                  {m.loading && <p className="text-[12px] text-[#5A5860]">Loading brands…</p>}
                  {m.error && <p className="text-[12px] text-[#9b2c2c]">{m.error}</p>}
                  {!m.loading && !m.error && m.brands && (
                    <div className="flex flex-col gap-2 max-w-md">
                      <select
                        value={m.selectedId || ""}
                        disabled={m.confirmed}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_MSG",
                            id: m.id,
                            patch: { selectedId: e.target.value } as any,
                          })
                        }
                        className="bg-white border border-[#E5E5E8] rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[#4F6BFF] disabled:opacity-60"
                      >
                        <option value="">Select a brand…</option>
                        {m.brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {!m.confirmed && (
                        <button
                          onClick={() => m.selectedId && confirmBrand(m.id, m.selectedId)}
                          disabled={!m.selectedId}
                          className="self-start bg-[#4F6BFF] text-white px-4 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[#6C7BFF] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Confirm brand
                        </button>
                      )}
                      {m.confirmed && (
                        <span className="text-[12px] text-[#4F6BFF]">✓ Brand selected</span>
                      )}
                    </div>
                  )}
                </AiBubble>
              );
            }
            if (m.role === "ai" && m.kind === "typing")
              return <TypingIndicator key={m.id} label={m.label} />;
            if (m.role === "ai" && m.kind === "progress") {
              const pct = m.total > 0 ? Math.round((m.current / m.total) * 100) : 0;
              return (
                <AiBubble key={m.id}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[12px] text-[#5A5860] whitespace-nowrap">
                      {m.label} — {m.current} of {m.total}
                    </span>

                    <span className="text-[12px] font-semibold text-[#1A1A1D]">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F0F0F2] overflow-hidden">
                    <div
                      className="h-full bg-[#4F6BFF] transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </AiBubble>
              );
            }
            if (m.role === "ai" && m.kind === "error")
              return (
                <AiBubble key={m.id}>
                  <div className="flex items-start gap-2 text-[#9b2c2c]">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>{m.content}</span>
                  </div>
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "creditError")
              return (
                <AiBubble key={m.id}>
                  <div className="flex items-start gap-2 text-[#9b2c2c]">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>{m.content}</span>
                  </div>
                  <button
                    onClick={() => retryScript(m.id, m.retry)}
                    className="mt-3 inline-flex items-center gap-2 bg-[#1A1A1D] text-[#F6F6F7] rounded-full px-4 py-2 text-[12px] font-medium hover:bg-black transition-colors"
                  >
                    Re-try
                  </button>
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "newBatchCta")
              return (
                <AiBubble key={m.id}>
                  <p>{m.content}</p>
                  <button
                    disabled={actionBusy || state.loading || plannerFor !== null}
                    onClick={() => startNewBatch()}
                    className="mt-3 inline-flex items-center gap-2 bg-[#4F6BFF] text-white rounded-full px-4 py-2 text-[12px] font-semibold hover:bg-[#6655d0] transition-colors"
                  >
                    Generate a new batch
                  </button>
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "askBriefCta")
              return (
                <AiBubble key={m.id}>
                  <p>{m.content}</p>
                  <button
                    onClick={openBriefPicker}
                    className="mt-3 inline-flex items-center gap-2 bg-[#1A1A1D] text-[#F6F6F7] rounded-full px-4 py-2 text-[12px] font-medium hover:bg-black transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach brand brief (PDF)
                  </button>
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "existingBriefPicker")
              return (
                <AiBubble key={m.id}>
                  <p>{m.content}</p>
                  <div className="mt-2 inline-flex items-center gap-2 text-[12px] text-[#5A5860]">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-medium text-[#1A1A1D]">{m.filename}</span>
                  </div>
                  {!m.resolved && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          state.existingBrief &&
                          useExistingBrief(m.id, m.brandId, m.filename, state.existingBrief.url)
                        }
                        className="inline-flex items-center gap-2 bg-[#4F6BFF] text-white rounded-full px-4 py-2 text-[12px] font-semibold hover:bg-[#6C7BFF] transition-colors"
                      >
                        Use this brief
                      </button>
                      <button
                        onClick={() => replaceBrief(m.id, m.brandId)}
                        className="inline-flex items-center gap-2 border border-[#E5E5E8] text-[#1A1A1D] rounded-full px-4 py-2 text-[12px] font-medium hover:border-[#1A1A1D] transition-colors"
                      >
                        Remove & upload a new one
                      </button>
                    </div>
                  )}
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "briefSummaryEditor")
              return (
                <AiBubble key={m.id}>
                  <p
                    className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1] mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                  >
                    Session brief · editable
                  </p>
                  <p className="mb-3">{m.content}</p>
                  <SessionBriefDraftEditor
                    value={m.draft}
                    disabled={readOnly || m.approved}
                    onInputValue={(draft) => {
                      sessionBriefDraftRef.current[m.id] = draft;
                    }}
                    onCommit={(draft) => updateBriefSummaryDraft(m.id, draft)}
                  />
                  {!m.approved ? (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#9B9BA1]">
                        Edit freely. Nothing is sent to the AI until you approve.
                      </span>
                      <button
                        onClick={() => approveBriefSummary(m.id)}
                        disabled={!m.draft.trim()}
                        className="bg-progress-high text-brand-surface px-4 py-1.5 rounded-lg text-[12px] font-medium hover:bg-progress-high/90 transition disabled:opacity-40"
                      >
                        Approve & continue
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-[12px] text-progress-high">✓ Session brief locked in</p>
                  )}
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "brandSnapshot")
              return (
                <AiBubble key={m.id}>
                  <p
                    className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1] mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                  >
                    Brand snapshot
                  </p>
                  <p>{m.content}</p>
                  {(m.topicsToPrioritize || m.languageToIncorporate || m.languageToAvoid) && (
                    <div className="mt-4 space-y-3">
                      {m.topicsToPrioritize && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-[.14em] text-[#4F6BFF] mb-1"
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                          >
                            Topics to prioritize
                          </p>
                          <p className="text-[13px] text-[#1A1A1D]">{m.topicsToPrioritize}</p>
                        </div>
                      )}
                      {m.languageToIncorporate && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-[.14em] text-[#16A34A] mb-1"
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                          >
                            Language to incorporate
                          </p>
                          <p className="text-[13px] text-[#1A1A1D]">{m.languageToIncorporate}</p>
                        </div>
                      )}
                      {m.languageToAvoid && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-[.14em] text-[#DC2626] mb-1"
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                          >
                            Language to avoid
                          </p>
                          <p className="text-[13px] text-[#1A1A1D]">{m.languageToAvoid}</p>
                        </div>
                      )}
                    </div>
                  )}
                </AiBubble>
              );
            if (m.role === "ai" && m.kind === "finalActions")
              return (
                <FinalActionsCard
                  key={m.id}
                  msg={m}
                  onGdoc={() => createGoogleDoc(m.id)}
                  onPdf={() => downloadPdfAction(m.id)}
                  onProduction={(opts) => addToProductionAction(m.id, opts)}
                  onEditMyself={() => editMyselfAction(m.id)}
                  format={state.format}
                  assignees={clientAssignees}
                  isAdmin={isAdmin}
                />
              );
            if (m.role === "ai" && m.kind === "pills") {
              const lastPillsId = [...messages].reverse().find((x: any) => x.kind === "pills")?.id;
              const isStale = m.id !== lastPillsId;
              return (
                <AiBubble key={m.id}>
                  {m.content && <p>{m.content}</p>}
                  {m.gridCols && (isStale || m.pickedValue !== undefined) ? null : m.gridCols ? (
                    <div
                      className="mt-5 grid gap-3"
                      style={{ gridTemplateColumns: `repeat(${m.gridCols}, minmax(0, 1fr))` }}
                    >
                      {m.options.map((o, i) => {
                        const isPicked = m.pickedValue !== undefined && m.pickedValue === o.value;
                        const isDisabled = m.pickedValue !== undefined || isStale;
                        return (
                          <button
                            key={i}
                            disabled={isDisabled}
                            onClick={() => handlePillPick(m.id, state.phase, o.value, o.label)}
                            className={`px-3 py-1.5 min-w-[40px] text-center rounded-full text-[12px] font-medium border transition-colors ${
                              isPicked
                                ? "bg-[#1A1A1D] text-[#F6F6F7] border-[#1A1A1D]"
                                : isDisabled
                                  ? "bg-white text-[#9B9BA1] border-[#E5E5E8] cursor-not-allowed"
                                  : o.tone === "primary"
                                    ? "bg-progress-high text-brand-surface border-progress-high hover:bg-progress-high/90 hover:border-progress-high"
                                    : o.tone === "priority"
                                      ? "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B] hover:border-[#D92D20] hover:text-[#D92D20]"
                                      : "bg-white text-[#1A1A1D] border-[#E5E5E8] hover:border-[#4F6BFF] hover:text-[#4F6BFF]"
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <QuickReplyPills
                      key={`${m.id}-${String(m.pickedValue)}-${m.repromptOpen ? "r" : ""}`}
                      options={m.options}
                      picked={m.pickedValue}
                      disabled={isStale}
                      onPick={(v) => {
                        if (v === "__reprompt_script__") {
                          dispatch({
                            type: "UPDATE_MSG",
                            id: m.id,
                            patch: { repromptOpen: !m.repromptOpen } as any,
                          });
                          return;
                        }
                        const opt = m.options.find((o) => o.value === v);
                        handlePillPick(m.id, state.phase, v, opt?.label || String(v));
                      }}
                    />
                  )}
                  {m.repromptOpen && (
                    <ScriptRepromptPanel
                      busy={m.repromptBusy}
                      onCancel={() =>
                        dispatch({
                          type: "UPDATE_MSG",
                          id: m.id,
                          patch: { repromptOpen: false } as any,
                        })
                      }
                      onSubmit={(text) => runScriptReprompt(m.id, text)}
                    />
                  )}
                </AiBubble>
              );
            }

            if (m.role === "ai" && m.kind === "topicList") {
              const approved = m.approved;
              const atCap = m.selected.length >= state.count;
              return (
                <AiBubble key={m.id}>
                  <p className="mb-3">
                    {m.content ||
                      `Pick the ${state.count} topics you want me to write, then approve.`}
                  </p>
                  <DocCard
                    label="Topic shortlist"
                    trailing={
                      atCap && !approved
                        ? `Max ${state.count} selected`
                        : `${m.topics.length} options`
                    }
                  >
                    <ul className="m-0 list-none space-y-3 p-0 [&>li]:list-none [&>li]:before:hidden">
                      {m.topics.map((t, i) => {
                        const checked = m.selected.includes(i);
                        const disabled = approved || (!checked && atCap);
                        return (
                          <li
                            key={i}
                            className={`flex gap-3 ${disabled && !checked ? "opacity-40" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                if (approved) return;
                                dispatch({ type: "TOGGLE_TOPIC", msgId: m.id, index: i });
                              }}
                              className={`mt-1 ${disabled && !checked ? "cursor-not-allowed" : ""}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[14px] leading-snug text-[#1A1A1D]"
                                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                              >
                                {t.title}
                              </p>
                              {t.rationale && (
                                <p
                                  className="text-[12px] text-[#5A5860] mt-1 leading-snug"
                                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
                                >
                                  {renderRationale(t.rationale)}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {!approved && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[12px] text-[#9B9BA1]">
                          {m.selected.length} of {state.count} selected
                        </span>
                        <button
                          disabled={m.selected.length === 0}
                          onClick={() => approveTopics(m.id, m.selected)}
                          className="bg-progress-high text-brand-surface px-4 py-1.5 rounded-lg text-[12px] font-medium hover:bg-progress-high/90 transition disabled:opacity-40"
                        >
                          Approve picks
                        </button>
                      </div>
                    )}
                  </DocCard>
                </AiBubble>
              );
            }
            if (m.role === "ai" && m.kind === "hookList") {
              const flags = m.approvedFlags ?? m.hooks.map(() => false);
              const locked = !!m.approved;
              return (
                <AiBubble key={m.id}>
                  <DocCard
                    label={
                      state.format === "graphic" || state.format === "carousel"
                        ? "Cover Hook draft"
                        : "Hooks draft"
                    }
                    trailing={`Pick ${state.selectedTopics.length || state.count} of ${m.hooks.length}`}
                  >
                    {(() => {
                      const groups: { topic: string; items: { h: any; i: number }[] }[] = [];
                      m.hooks.forEach((h, i) => {
                        const topic = h.topicTitle || "Topic";
                        const last = groups[groups.length - 1];
                        if (last && last.topic === topic) last.items.push({ h, i });
                        else groups.push({ topic, items: [{ h, i }] });
                      });
                      // One pick per topic: a new tick swaps within its topic,
                      // so nothing is ever blocked by a global cap.
                      const atHookCap = false;
                      const isCover = state.format === "graphic" || state.format === "carousel";
                      return (
                        <div className="space-y-8">
                          {groups.map((g, gi) => (
                            <div key={gi}>
                              <p
                                className="text-[11px] uppercase tracking-[.16em] text-[#1A1A1D] mb-2"
                                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                              >
                                {g.topic}
                              </p>
                              <ul className="m-0 list-none space-y-3 p-0 [&>li]:list-none [&>li]:before:hidden">
                                {g.items.map(({ h, i }, vi) => {
                                  const isApproved = flags[i];
                                  const disabled = locked || (!isApproved && atHookCap);
                                  const useSpoken = h.spoken !== undefined;
                                  const value = useSpoken ? h.spoken || "" : h.visual;
                                  return (
                                    <li
                                      key={i}
                                      className={`flex gap-3 ${disabled && !isApproved ? "opacity-40" : ""}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!!isApproved}
                                        disabled={disabled}
                                        onChange={() => {
                                          if (locked) return;
                                          toggleHookApproved(m.id, i);
                                        }}
                                        className={`mt-1 ${disabled && !isApproved ? "cursor-not-allowed" : ""}`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1] mb-1"
                                          style={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Variation {vi + 1}
                                        </p>
                                        <div
                                          contentEditable={!locked}
                                          suppressContentEditableWarning
                                          onBlur={(e) =>
                                            editHook(
                                              m.id,
                                              i,
                                              useSpoken
                                                ? {
                                                    spoken: (e.target as HTMLDivElement).innerText,
                                                  }
                                                : {
                                                    visual: (e.target as HTMLDivElement).innerText,
                                                  },
                                            )
                                          }
                                          className="text-[14px] leading-snug text-[#1A1A1D] outline-none focus:bg-[#4F6BFF]/[.04] hover:bg-[#4F6BFF]/10 rounded px-1 -mx-1"
                                          style={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontWeight: 400,
                                          }}
                                        >
                                          {value}
                                        </div>
                                        {isCover && (
                                          <p className="text-[11px] text-[#9B9BA1] mt-1">
                                            Cover hook
                                          </p>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {!locked && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-[12px] text-[#9B9BA1]">
                            {flags.filter(Boolean).length} of{" "}
                            {state.selectedTopics.length || state.count} selected
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_MSG",
                                  id: m.id,
                                  patch: { globalRepromptOpen: !m.globalRepromptOpen } as any,
                                })
                              }
                              className="border border-[#E5E5E8] text-[#1A1A1D] px-4 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[#F6F6F7] transition"
                            >
                              Regenerate
                            </button>
                            <button
                              disabled={
                                flags.filter(Boolean).length !==
                                (state.selectedTopics.length || state.count)
                              }
                              onClick={() => approveSelectedHooks(m.id)}
                              className="bg-progress-high text-brand-surface px-4 py-1.5 rounded-lg text-[12px] font-medium hover:bg-progress-high/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Approve {state.selectedTopics.length || state.count} &amp; continue
                            </button>
                          </div>
                        </div>
                        {m.globalRepromptOpen && (
                          <HookRepromptBox
                            onCancel={() =>
                              dispatch({
                                type: "UPDATE_MSG",
                                id: m.id,
                                patch: { globalRepromptOpen: false } as any,
                              })
                            }
                            onSubmit={(text) => {
                              if (!text) return;
                              dispatch({
                                type: "UPDATE_MSG",
                                id: m.id,
                                patch: { globalRepromptOpen: false } as any,
                              });
                              appendUser(`Reprompt hooks: ${text}`);
                              const picked = state.selectedTopics.map((i) => state.topics[i]);
                              fetchHooks(picked, text);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </DocCard>
                </AiBubble>
              );
            }
            if (m.role === "ai" && m.kind === "scriptWriting")
              return (
                <ScriptCardWriting
                  key={m.id}
                  scriptNumber={m.index + 1}
                  totalScripts={m.total}
                  topic={m.topic}
                />
              );
            if (m.role === "ai" && m.kind === "script") {
              if (m.discarded) return null;
              const approved = messages.some(
                (candidate) =>
                  candidate.kind === "script" &&
                  candidate.variantGroup === m.variantGroup &&
                  candidate.chosen,
              );
              if (
                m.completed ||
                m.variantGroup === undefined ||
                approved ||
                messages.some((item) => item.id === "repurpose-context")
              )
                return (
                  <AiBubble key={m.id} wide>
                    {renderScript(m)}
                  </AiBubble>
                );
              if (renderedGroups.has(m.variantGroup)) return null;
              renderedGroups.add(m.variantGroup);
              const pair = orderedVariations(
                messages.filter(
                  (candidate): candidate is Extract<Message, { kind: "script" }> =>
                    candidate.kind === "script",
                ),
                m.variantGroup,
              );
              return (
                <AiBubble key={m.id} wide>
                  <p className="mb-4 text-sm text-brand-ink">
                    Approve the variation you prefer to write its captions.
                  </p>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-variation-pair>
                    {pair.map(renderScript)}
                  </div>
                </AiBubble>
              );
            }
            return null;
          })}
        </fieldset>
      </TranscriptReadOnly.Provider>
    );
  }
  const [sessionFormat, setSessionFormat] = useState<Format | null>(null);
  const singleSession = writeMode === "single";
  const setupCompleted = singleSession
    ? 1 + Number(state.hasStarted)
    : 1 +
      Number(briefStageClosedRef.current) +
      Number(state.selectedTopics.length > 0) +
      Number(state.hooks.length > 0);
  const sessionProgress = writerProgress(
    state.messages,
    singleSession ? 1 : state.selectedTopics.length || state.count,
    setupCompleted,
    singleSession ? 2 : 4,
  );
  const sessionProgressTone = progressTone(sessionProgress.completed, sessionProgress.total);
  const transcriptActivity = state.messages
    .map(
      (message) =>
        `${message.id}:${message.kind === "script" ? `${message.status}:${!!message.captions}:${!!message.completed}` : message.kind}`,
    )
    .join("|");
  // The only "back" in the flow: change type (Single/Batch) or change brand.
  const flowHeader = writeMode ? (
    <div className="flex flex-wrap items-center gap-2 px-6 pt-6 text-[13px] text-brand-ink-soft md:px-8">
      <span className="font-semibold text-brand-ink">
        {[writeMode === "single" ? "Single script" : "Batch", scriptBrand?.name]
          .filter(Boolean)
          .join(" · ")}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-brand-accent"
        onClick={() => {
          setSessionFormat(null);
          setWriteMode(null);
        }}
      >
        Change type
      </Button>
      {scriptBrand && scriptBrands.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-brand-accent"
          onClick={() => {
            setSessionFormat(null);
            setScriptBrand(null);
          }}
        >
          Change brand
        </Button>
      )}
    </div>
  ) : null;
  const body = (
    <section className="bg-social-feed min-h-full flex flex-col">
      {sessionSaveError && (
        <p role="alert" className="px-6 py-3 text-destructive">
          {sessionSaveError}
        </p>
      )}
      {activeSession && (
        <div
          className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-5 border-b border-brand-line bg-brand-surface px-6 pt-6 pb-4 md:px-8 md:pt-8"
          data-session-header
        >
          <div className="min-w-0 flex-1 text-brand-accent">
            <p className="text-sm font-semibold">
              This session:{" "}
              {writeMode === "single" ? 1 : state.selectedTopics.length || state.count}{" "}
              {writeMode === "single" || (state.selectedTopics.length || state.count) === 1
                ? "script"
                : "scripts"}{" "}
              - {formatLabel(state.format || sessionFormat)}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <progress
                aria-label="Session progress"
                value={sessionProgress.completed}
                max={sessionProgress.total}
                className={`h-1.5 w-40 max-w-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-progress-track [&::-webkit-progress-value]:rounded-full ${sessionProgressTone === "high" ? "[&::-webkit-progress-value]:bg-progress-high" : sessionProgressTone === "mid" ? "[&::-webkit-progress-value]:bg-progress-mid" : "[&::-webkit-progress-value]:bg-progress-low"}`}
              />
              <span className="text-xs">
                {sessionProgress.completed} / {sessionProgress.total} steps
              </span>
            </div>
          </div>
          <Button
            size="sm"
            disabled={actionBusy || state.loading || plannerFor !== null}
            onClick={() => startNewBatch()}
            className="gap-1.5 bg-brand-accent text-white hover:bg-brand-accent/90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Start new session
          </Button>
        </div>
      )}

      {briefBlocked && <BrandInfoGate onGoToBrief={onGoToBrief} />}
      {!briefBlocked && !isAdmin && !state.hasStarted && !writeMode && (
        <ModeQuestion onPick={(mode) => setWriteMode(mode)} />
      )}
      {!briefBlocked && !isAdmin && !state.hasStarted && writeMode && !scriptBrand && (
        <div>
          {flowHeader}
          <ScriptBrandPicker
            title={
              writeMode === "single" ? "Which brand is this script for?" : "Which brand are these scripts for?"
            }
            brands={scriptBrands}
            loading={brandsQuery.isLoading}
            onPick={setScriptBrand}
          />
        </div>
      )}
      {!briefBlocked && !isAdmin && !state.hasStarted && writeMode === "single" && scriptBrand && (
        <div>
          {flowHeader}
          <SingleScriptForm
            onFormat={(format) => {
              setSessionFormat(format);
              ensureWriterSession("single", format);
            }}
            selectedFormat={sessionFormat}
            onSubmit={startSingle}
          />
        </div>
      )}
      {!briefBlocked && !isAdmin && !state.hasStarted && writeMode === "batch" && scriptBrand && (
        <div>
          {flowHeader}
          {strategyStrip(true)}
        </div>
      )}

      <input
        ref={hiddenFileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (isAdmin && state.brandId) uploadAdminBrief(f);
            else handleBriefFile(f);
          }
          if (e.target) e.target.value = "";
        }}
      />

      <div
        className={`flex-1 bg-social-feed ${briefBlocked || (!isAdmin && !state.hasStarted) ? "hidden" : ""}`}
      >
        <ChatThread activityKey={transcriptActivity}>{renderTranscript(state.messages)}</ChatThread>
      </div>

      {canUndo && (
        <div className="px-4 pt-2 flex justify-start">
          <button
            onClick={() => dispatch({ type: "UNDO" })}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#5A5860] border border-[#E5E5E8] bg-white px-3 py-1.5 rounded-full hover:border-[#4F6BFF] hover:text-[#4F6BFF] transition-colors"
          >
            ← Go back to {state.history[state.history.length - 1]?.label || "the last step"}
          </button>
        </div>
      )}

      {!briefBlocked &&
        !(!isAdmin && !state.hasStarted) &&
        (state.phase === "askBrief" ||
          (state.phase === "askTopicsMode" && state.topicsMode === "have") ||
          state.phase === "approveTone") && (
          <ChatInput
            onSend={onSendFreeText}
            onAttach={onAttach}
            disabled={
              state.loading ||
              state.messages.some((m) => m.kind === "scriptWriting" || m.kind === "typing")
            }
            briefOnly={state.phase === "askBrief"}
            placeholder={
              state.phase === "askBrief"
                ? "Attach your brand brief (PDF) using the button above →"
                : state.phase === "askTopicsMode" && state.topicsMode === "have"
                  ? "Paste your topics, one per line…"
                  : "Write feedback on the script…"
            }
          />
        )}
      <AddToPlannerDialog
        open={plannerFor !== null}
        isVideo={state.format === "broll" || state.format === "talkingVideo"}
        postType={state.format || undefined}
        accessCode={accessCode}
        onClose={() => setPlannerFor(null)}
        onSubmit={(choice) =>
          plannerFor === null ? Promise.resolve(null) : submitPlanner(plannerFor, choice)
        }
      />
    </section>
  );
  if (isAdmin) return body;
  return (
    <ScriptShell
      view={railView}
      onView={(view) => {
        if (view.kind === "writer") {
          // My Scriptwriter always starts over at Single / Batch.
          if (
            (actionBusy || state.loading) &&
            !window.confirm("A script is still being written. Leave and stop this session?")
          )
            return;
          startNewBatch();
          return;
        }
        // Switch instantly; saving happens in the background.
        setRailView(view);
        void saveCurrentSession().catch(() => {});
      }}
      accessCode={accessCode}
      refreshKey={sessionsRefresh}
      activeSession={activeSession}
      onDeleted={(id) => {
        if (id === activeSessionRef.current?.id) startNewBatch({ skipSave: true });
        else if (railView.kind === "session" && railView.id === id) setRailView({ kind: "writer" });
      }}
      compactOnPhone={state.messages.some((m) => m.id === "repurpose-context")}
      brands={scriptBrands}
    >
      {railView.kind === "writer" && body}
      {railView.kind === "strategy" && (
        <div>
          {!scriptBrand ? (
            <ScriptBrandPicker
              title="Which brand's strategy do you want to see?"
              brands={scriptBrands}
              loading={brandsQuery.isLoading}
              onPick={setScriptBrand}
            />
          ) : briefBlocked ? (
            <BrandInfoGate onGoToBrief={onGoToBrief} />
          ) : (
            <>
              {scriptBrands.length > 1 && (
                <div className="px-6 pt-6 md:px-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScriptBrand(null)}
                    className="text-brand-ink-soft"
                  >
                    {scriptBrand.name} · Change brand
                  </Button>
                </div>
              )}
              {strategyStrip(false)}
            </>
          )}
        </div>
      )}
      {openingSession && (
        <p role="status" className="p-8 text-sm text-brand-ink-soft">
          Opening Repurpose…
        </p>
      )}
      {!openingSession && railView.kind === "session" && activeSession?.id === railView.id && body}
      {!openingSession && railView.kind === "session" && activeSession?.id !== railView.id && (
        <SessionView
          id={railView.id}
          accessCode={accessCode}
          onBack={() => setRailView({ kind: "writer" })}
          renderTranscript={(messages) => renderTranscript(messages as Message[], true)}
          onRepurpose={repurposeSession}
          liveSession={activeSession?.id === railView.id ? activeSession : null}
          liveTranscript={activeSession?.id === railView.id ? state.messages : undefined}
          onContinue={() => setRestoreSessionId(railView.id)}
          brands={scriptBrands}
        />
      )}
    </ScriptShell>
  );
}
