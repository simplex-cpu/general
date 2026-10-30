import { useState } from "react";
import { Copy, Download, MoreHorizontal, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScriptDoc, Caption, Assignee } from "@/lib/slate/scriptChat";
import { limitWords, wordCount } from "@/lib/slate/designTemplates";
import { completeVideoScript } from "@/lib/slate/scriptCta";
import { needsVisualHookChoice } from "@/lib/slate/captionBatch";
import { useTranscriptReadOnly } from "./TranscriptContext";

export type ScriptCardProps = {
  selectable?: boolean;
  selected?: boolean;
  discarded?: boolean;
  onSelect?: () => void;
  scriptNumber: number;
  totalScripts: number;
  topic: string;
  script: ScriptDoc;
  status: "sample" | "approved" | "queued";
  scriptType: "fleshed" | "framework";
  /** e.g. "Fleshed" / "Framework" when both versions were written for one topic. */
  variantLabel?: string;
  editCount?: number;
  onApprove?: () => void;
  onEdit?: (next: ScriptDoc) => void;
  onSave?: () => void;
  editableAfterCaptions?: boolean;
  captions?: Caption;
  isAdmin?: boolean;
  approveLabel?: string;
  assigneeOptions?: Assignee[];
  completed?: boolean;
  busy?: boolean;
  onRegenerate?: () => void;
  onApproveAndCaption?: () => void;
  onRegenerateCaptions?: () => void;
  onRegenerateVisualHooks?: () => void;
  onAddNext?: () => void;
  addNextLabel?: string;
};

const PLATFORM_LABELS: { key: keyof Caption; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
];

function Hairline({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[12px] tracking-[.04em] text-[#5A5860]">
      <span>{children}</span>
      <span className="flex-1 h-px bg-[#E5E5E8]" />
    </div>
  );
}

function Editable({
  value,
  onChange,
  pre,
}: {
  value: string;
  onChange: (v: string) => void;
  pre?: boolean;
}) {
  const readOnly = useTranscriptReadOnly();
  return (
    <div
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onBlur={(e) => onChange((e.target as HTMLDivElement).innerText)}
      className="mt-2 rounded-md px-1 -mx-1 outline-none focus:bg-[#4F6BFF]/[.04] hover:bg-[#4F6BFF]/10"
      style={pre ? { whiteSpace: "pre-line" } : undefined}
    >
      {value}
    </div>
  );
}

function CountedEditable({
  value,
  onChange,
  label,
  max,
  pre,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  max: number;
  pre?: boolean;
}) {
  const count = wordCount(value);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Hairline>{label}</Hairline>
        <span
          className={`shrink-0 text-[11px] ${count > max ? "font-semibold text-[#B42318]" : "text-[#8A8A93]"}`}
        >
          {count}/{max}
        </span>
      </div>
      <Editable value={value} onChange={(next) => onChange(limitWords(next, max))} pre={pre} />
    </div>
  );
}

function AssigneePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Assignee[];
  options: Assignee[];
  onChange: (next: Assignee[]) => void;
}) {
  const [pick, setPick] = useState("");
  const taken = new Set(value.map((v) => v.id));
  const available = options.filter((o) => !taken.has(o.id));
  return (
    <div>
      <Hairline>{label}</Hairline>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {value.map((a) => (
          <span
            key={a.id}
            className="inline-flex items-center gap-1.5 bg-[#4F6BFF]/10 text-[#1A1A1D] border border-[#4F6BFF]/20 px-2 py-0.5 rounded-full text-[12px]"
          >
            {a.name}
            <button
              onClick={() => onChange(value.filter((v) => v.id !== a.id))}
              className="text-[#4F6BFF]/70 hover:text-[#4F6BFF]"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {options.length === 0 ? (
          <span className="text-[12px] text-[#9B9BA1]">Loading team…</span>
        ) : available.length > 0 ? (
          <select
            value={pick}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const found = options.find((o) => o.id === id);
              if (found) onChange([...value, found]);
              setPick("");
            }}
            className="bg-white border border-[#E5E5E8] rounded-md px-2 py-1 text-[12px] focus:outline-none focus:border-[#4F6BFF]/50"
          >
            <option value="">+ Add {label.toLowerCase()}…</option>
            {available.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

export function ScriptCard(props: ScriptCardProps) {
  const {
    scriptNumber,
    totalScripts,
    topic,
    script,
    status,
    captions,
    editCount = 0,
    assigneeOptions = [],
    isAdmin = false,
  } = props;

  const idx = String(scriptNumber);
  const total = String(totalScripts);

  const statusLabel = props.completed
    ? "Approved"
    : status === "sample"
      ? ""
      : status === "queued"
        ? "Queued · waiting"
        : editCount > 0
          ? `Approved · ${editCount} edit${editCount === 1 ? "" : "s"}`
          : "Approved";

  const variantSuffix = "";
  const eyebrow =
    script.kind === "carousel"
      ? `${script.format === "graphic" ? "Graphic" : "Carousel"}${script.format === "carousel" ? ` · ${script.slides.length} slides` : ""} · Script ${idx} of ${total}${variantSuffix}`
      : `Script · ${idx} of ${total}${variantSuffix}`;

  const isVideo = script.kind === "video";
  const isGraphic = !isVideo;
  const assigneeLabel = "Creative Assigned";

  const sectionText = () => {
    const parts: string[] = [];
    if (isAdmin && script.inspo) parts.push(`Inspo:\n${script.inspo}`);
    if (isAdmin && isVideo && script.filmingInstructions)
      parts.push(`Filming Guidelines:\n${script.filmingInstructions}`);
    if (script.creativeInstructions)
      parts.push(`Creative Instructions:\n${script.creativeInstructions}`);
    if (script.assignees?.length)
      parts.push(`${assigneeLabel}: ${script.assignees.map((a) => a.name).join(", ")}`);
    return parts.join("\n\n");
  };

  const handleCopy = () => {
    let txt = "";
    if (script.kind === "video") {
      txt = completeVideoScript(script);
    } else {
      txt = script.slides
        .map((s) => `Slide ${s.position} [${s.role}]\n${s.headline}${s.body ? "\n" + s.body : ""}`)
        .join("\n\n");
    }
    const extras = sectionText();
    if (extras) txt += `\n\n---\n${extras}`;
    if (captions) {
      txt += `\n\n---\nInstagram:\n${captions.instagram}\n\nFacebook:\n${captions.facebook}\n\nTikTok:\n${captions.tiktok}\n\nYouTube:\n${captions.youtube}`;
    }
    navigator.clipboard.writeText(txt);
  };

  const handleDownload = () => {
    const scriptLabel =
      script.kind === "video" && script.format === "broll" ? "Text overlay" : "Script";
    const videoHtml =
      script.kind === "video"
        ? `<h2>${scriptLabel}</h2><pre>${completeVideoScript(script)}</pre>`
        : "";
    const metaHtml =
      (isAdmin && script.inspo ? `<h2>Inspo</h2><pre>${script.inspo}</pre>` : "") +
      (isAdmin && isVideo && script.filmingInstructions
        ? `<h2>Filming Guidelines</h2><pre>${script.filmingInstructions}</pre>`
        : "") +
      (script.creativeInstructions
        ? `<h2>Creative Instructions</h2><pre>${script.creativeInstructions}</pre>`
        : "") +
      (script.assignees?.length
        ? `<h2>${assigneeLabel}</h2><pre>${script.assignees.map((a) => a.name).join(", ")}</pre>`
        : "");
    const html =
      `<!doctype html><meta charset="utf-8"><title>${topic}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Cormorant+Garamond:ital,wght@1,600&display=swap" rel="stylesheet"><style>body{font-family:'Poppins',system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 24px;color:#1A1A1D;font-weight:400;line-height:1.65}h1{font-size:24px;font-weight:700;letter-spacing:-0.01em}h1::after{content:'';display:block;width:48px;height:3px;margin-top:10px;background:linear-gradient(90deg,#4F6BFF,#6C7BFF);border-radius:2px}h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.16em;color:#4F6BFF;margin-top:28px}pre{white-space:pre-wrap;font-family:inherit;font-size:14px;margin-top:8px}</style><h1>${topic}</h1>` +
      (script.kind === "video"
        ? videoHtml
        : script.slides
            .map(
              (s) =>
                `<h2>Slide ${s.position} · ${s.role}</h2><pre>${s.headline}${s.body ? "\n\n" + s.body : ""}</pre>`,
            )
            .join("")) +
      metaHtml;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${idx}-${topic.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editVideo = (key: "visualHook" | "spokenHook" | "script", value: string) => {
    if (script.kind !== "video") return;
    props.onEdit?.(
      key === "script" && script.format === "talkingVideo"
        ? { ...script, script: value, spokenHook: "" }
        : { ...script, [key]: value },
    );
  };

  const editSlide = (i: number, key: "headline" | "subtitle" | "body", value: string) => {
    if (script.kind !== "carousel") return;
    const slides = script.slides.map((s, idx2) => (idx2 === i ? { ...s, [key]: value } : s));
    props.onEdit?.({ ...script, slides });
  };

  return (
    <div className="bg-brand-surface border border-brand-line rounded-lg overflow-hidden w-full min-w-0 h-full flex flex-col">
      <div className="bg-brand-wash px-4 py-4 border-b border-brand-line flex items-start justify-between gap-3">
        <div className="min-w-0">
          {props.variantLabel && (
            <p className="mb-2 text-sm font-semibold text-brand-accent">{props.variantLabel}</p>
          )}
          <p
            className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1]"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h3
            className="text-base text-[#1A1A1D] tracking-tight mt-1"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            {topic}
          </h3>
          {script.inspoUrl && /^https?:\/\//i.test(script.inspoUrl) && (
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-brand-ink-mid">
              <span className="font-semibold uppercase tracking-[.14em] text-brand-ink-soft">Inspo</span>
              <a href={script.inspoUrl} target="_blank" rel="noopener" className="min-w-0 truncate text-brand-accent underline">Original post</a>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-brand-ink-soft">{statusLabel}</span>
        </div>
      </div>

      {status !== "queued" && (
        <div className="p-4 flex flex-1 flex-col gap-6 text-[14px] leading-[1.7] text-[#1A1A1D]">
          {/* Repurposed scripts stay editable; saved History remains read-only. */}
          {script.kind === "video" && (
            <>
              {script.format === "talkingVideo" &&
                !!script.visualHookOptions?.length &&
                captions && (
                  <div>
                    <Hairline>Pick a visual hook</Hairline>
                    <div
                      className="mt-2 flex flex-col gap-2"
                      role="radiogroup"
                      aria-label="Visual hook options"
                    >
                      {script.visualHookOptions.map((opt, i) => {
                        const on = script.visualHook?.trim() === opt;
                        return (
                          <button
                            key={i}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={props.busy || !props.onEdit}
                            onClick={() =>
                              props.onEdit?.({ ...script, visualHook: opt } as ScriptDoc)
                            }
                            className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-[14px] transition-colors ${
                              on
                                ? "border-progress-high bg-progress-high/10 text-brand-ink"
                                : "border-brand-line bg-brand-surface text-brand-ink hover:border-progress-high/60"
                            }`}
                          >
                            <span
                              className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${
                                on ? "border-progress-high bg-progress-high" : "border-brand-line"
                              }`}
                            />
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {needsVisualHookChoice(script) && (
                      <p className="mt-2 text-xs text-brand-ink-soft">
                        Choose one visual hook to add this script to the planner.
                      </p>
                    )}
                  </div>
                )}
              {script.format === "talkingVideo" &&
                !script.visualHookOptions?.length &&
                !!script.visualHook?.trim() && (
                  <div>
                    <Hairline>On-screen text</Hairline>
                    {captions && !props.editableAfterCaptions ? (
                      <p className="mt-2 whitespace-pre-line">{script.visualHook}</p>
                    ) : (
                      <Editable
                        value={script.visualHook}
                        onChange={(v) => editVideo("visualHook", v)}
                        pre
                      />
                    )}
                  </div>
                )}
              <div>
                <Hairline>{script.format === "broll" ? "Text overlay" : "Script"}</Hairline>
                {captions && !props.editableAfterCaptions ? (
                  <p className="mt-2 whitespace-pre-line">{completeVideoScript(script)}</p>
                ) : (
                  <Editable
                    value={completeVideoScript(script)}
                    onChange={(v) => editVideo("script", v)}
                    pre
                  />
                )}
              </div>
            </>
          )}

          {script.kind === "carousel" && (
            <div className="space-y-4">
              {script.slides.map((s, i) => {
                const insightful = script.designSubtype === "insightful";
                const isGraphicSlide = script.format === "graphic";
                const headlineLabel =
                  s.role === "cta"
                    ? "Closing statement"
                    : s.role === "hook"
                      ? "Cover title"
                      : "Title";
                const headlineMax =
                  s.role === "cta"
                    ? 12
                    : isGraphicSlide
                      ? insightful
                        ? 6
                        : 20
                      : s.role === "hook"
                        ? insightful
                          ? 8
                          : 9
                        : insightful
                          ? 6
                          : 20;
                const bodyLabel = s.role === "cta" ? "Invitation" : "Body";
                const bodyMax = s.role === "hook" ? 10 : 15;
                return (
                  <div key={i} className="border border-[#E5E5E8] rounded-lg p-4 bg-[#FAFAFB]">
                    <p
                      className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1] mb-2"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                    >
                      {isGraphicSlide ? "Graphic" : `Slide ${s.position}`}
                    </p>
                    <CountedEditable
                      value={s.headline}
                      onChange={(v) => editSlide(i, "headline", v)}
                      label={headlineLabel}
                      max={headlineMax}
                    />
                    {s.role !== "hook" && s.body !== undefined && (
                      <div className="mt-3">
                        <CountedEditable
                          value={s.body || ""}
                          onChange={(v) => editSlide(i, "body", v)}
                          label={bodyLabel}
                          max={bodyMax}
                          pre
                        />
                      </div>
                    )}
                    {s.role !== "cta" && (
                      <div className="mt-3">
                        <CountedEditable
                          value={s.subtitle || ""}
                          onChange={(v) => editSlide(i, "subtitle", v)}
                          label={s.role === "hook" ? "Cover label" : "Subtitle"}
                          max={10}
                          pre
                        />
                      </div>
                    )}
                    {s.role === "cta" && (
                      <div className="mt-3">
                        <CountedEditable
                          value={s.actionLabel || ""}
                          onChange={(v) => {
                            if (script.kind !== "carousel") return;
                            const slides = script.slides.map((slide, idx2) =>
                              idx2 === i ? { ...slide, actionLabel: v } : slide,
                            );
                            props.onEdit?.({ ...script, slides });
                          }}
                          label="CTA button"
                          max={1}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4 pt-2 border-t border-dashed border-[#E5E5E8]">
            {isAdmin && isVideo && (
              <div>
                <Hairline>Filming Guidelines</Hairline>
                <Editable
                  value={script.filmingInstructions || ""}
                  onChange={(v) => props.onEdit?.({ ...script, filmingInstructions: v })}
                  pre
                />
              </div>
            )}
            {isAdmin && (
              <AssigneePicker
                label={assigneeLabel}
                value={script.assignees || []}
                options={assigneeOptions}
                onChange={(next) => props.onEdit?.({ ...script, assignees: next })}
              />
            )}
          </div>

          {captions && (
            <div className="pt-2 space-y-3">
              <Hairline>Captions</Hairline>
              {PLATFORM_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <p
                    className="text-[10px] uppercase tracking-[.16em] text-[#9B9BA1]"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                  >
                    {label}
                  </p>
                  <Editable
                    value={captions[key]}
                    onChange={(v) =>
                      props.onEdit?.({ ...script, captions: { ...captions, [key]: v } })
                    }
                    pre
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-brand-line flex items-center justify-end flex-wrap gap-3">
            {!props.variantLabel && !props.completed && (
              <div className="flex items-center gap-4 text-[12px] text-brand-ink-mid">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 hover:text-[#4F6BFF]"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 hover:text-[#4F6BFF]"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            )}
            <div className="ml-auto flex items-center justify-end gap-2 flex-wrap">
              {props.onSave && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={props.busy}
                  onClick={props.onSave}
                  className="border-brand-line bg-brand-surface text-brand-accent"
                >
                  Save
                </Button>
              )}
              {props.completed ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={props.busy}
                        className="gap-1.5 bg-brand-line text-brand-ink-mid hover:bg-brand-line/80 hover:text-brand-ink"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {script.kind === "video" && script.format === "talkingVideo" && (
                        <DropdownMenuItem onSelect={() => props.onRegenerateVisualHooks?.()}>
                          Regenerate visual hooks
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => props.onRegenerateCaptions?.()}>
                        Regenerate captions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    size="sm"
                    disabled={props.busy || needsVisualHookChoice(script)}
                    title={needsVisualHookChoice(script) ? "Pick a visual hook first" : undefined}
                    onClick={props.onAddNext}
                    className="bg-progress-high text-brand-surface hover:bg-progress-high/90"
                  >
                    {props.addNextLabel || "Add this to Planner & Write Next"}
                  </Button>
                </>
              ) : (props.variantLabel || props.onApproveAndCaption) && !props.discarded ? (
                <>
                  {props.onRegenerate && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={props.busy}
                      onClick={props.onRegenerate}
                      className="text-brand-ink-mid hover:bg-brand-wash hover:text-brand-ink"
                    >
                      Regenerate
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={props.busy}
                    onClick={props.onApproveAndCaption}
                    className="bg-progress-high text-brand-surface hover:bg-progress-high/90"
                  >
                    Approve &amp; Write Captions
                  </Button>
                </>
              ) : (
                status === "approved" && (
                  <span className="rounded-md bg-brand-line px-3 py-1.5 text-[12px] font-medium text-brand-accent">
                    ✓ Approved
                  </span>
                )
              )}
              {(props.variantLabel || props.completed) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More script actions"
                      disabled={props.busy}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-brand-line bg-brand-surface text-brand-ink"
                  >
                    <DropdownMenuItem onSelect={handleDownload}>
                      <Download className="h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
