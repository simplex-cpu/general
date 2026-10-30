import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Clapperboard,
  Mic,
  Image,
  LayoutGrid,
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import {
  getFormatBalanceTone,
  getFormatDifference,
  type FormatBalanceStats,
  type FormatBalanceTone,
} from "@/lib/slate/formatBalance";
import type { Report } from "@/lib/slate/analyseHelpers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type BrandGuidance = {
  briefSubmitted: boolean;
  strategy: string;
  broll: number | null;
  talking: number | null;
  graphic?: number | null;
  carousel?: number | null;
  strategyPlatform?: string;
  brandName?: string;
  briefFields?: Record<string, string>;
  formatMetrics?: FormatBalanceStats;
};

export function useBrandGuidance(accessCode: string, briefId?: string | null) {
  const [data, setData] = useState<BrandGuidance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!accessCode) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const q = briefId ? `?brief=${encodeURIComponent(briefId)}` : "";
        const r = await fetch(`/api/brand-guidance${q}`, { headers: { "x-access-code": accessCode } });
        const j = await r.json();
        if (!alive) return;
        if (r.ok) {
          setData({
            briefSubmitted: Boolean(j.briefSubmitted),
            strategy: String(j.strategy || ""),
            broll: j.broll ?? null,
            talking: j.talking ?? null,
            graphic: j.graphic ?? null,
            carousel: j.carousel ?? null,
            strategyPlatform: String(j.strategyPlatform || ""),
            brandName: String(j.brandName || ""),
            briefFields: j.briefFields || {},
            formatMetrics: j.formatMetrics || undefined,
          });
        }
      } catch {
        /* ignore — fail open */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessCode, briefId]);

  return { guidance: data, loading, setGuidance: setData };
}

export function BrandInfoGate({ onGoToBrief }: { onGoToBrief?: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-16">
      <div className="max-w-xl rounded-2xl border border-[#F0C0B4] bg-[#FEF6F3] p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#D92D20]/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#D92D20]" />
          </div>
          <div>
            <h2
              className="text-[15px] text-[#1A1A1D]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Add your brand info first
            </h2>
            <p className="mt-2 text-[13px] text-[#5A5860] leading-relaxed">
              Scripting needs your brand brief to write anything that sounds like you. Complete your
              brand info and come back — it only takes a couple of minutes.
            </p>
            {onGoToBrief && (
              <button
                onClick={onGoToBrief}
                className="mt-4 inline-flex items-center gap-1.5 bg-[#1A1A1D] text-[#F6F6F7] text-[12px] px-3.5 py-2 rounded-lg hover:bg-[#2A2A2E] transition-colors"
              >
                Go to Brand info
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type CountKey = "broll" | "talking" | "graphic" | "carousel";

/** Traffic-light colour for the progress bar under each script button. */
const toneBarColor: Record<FormatBalanceTone, string> = {
  green: "#12854A",
  yellow: "#D89B16",
  red: "#D92D20",
};

const toneClasses: Record<
  FormatBalanceTone,
  { box: string; icon: string; text: string; arrow: string }
> = {
  green: {
    box: "border-[#BFE3CB] bg-[#F4FBF6] hover:border-[#12854A] hover:bg-[#EDF8F0]",
    icon: "bg-[#E7F5EC] text-[#12854A]",
    text: "text-[#12854A]",
    arrow: "text-[#12854A]",
  },
  yellow: {
    box: "border-[#F4DFA7] bg-[#FFF9E9] hover:border-[#D89B16] hover:bg-[#FFF4D4]",
    icon: "bg-[#FFF1C2] text-[#A15C00]",
    text: "text-[#A15C00]",
    arrow: "text-[#A15C00]",
  },
  red: {
    box: "border-[#F3C8C2] bg-[#FEF6F4] hover:border-[#D92D20] hover:bg-[#FFF0EE]",
    icon: "bg-[#FEE4E2] text-[#D92D20]",
    text: "text-[#D92D20]",
    arrow: "text-[#D92D20]",
  },
};

const stripMd = (s: string) =>
  s
    .replace(/^#+\s*/, "")
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^\*\*(.*?)\*\*:?$/, "$1")
    .trim();

function formatInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*.*?\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
}

type Section = {
  heading: string;
  kind: "do" | "dont" | "plain";
  lines: Array<{ text: string; bullet: boolean }>;
};

function classify(heading: string): "do" | "dont" | "plain" {
  const h = heading.toLowerCase();
  if (/(don'?t|do not|dont|avoid|stop|never|pitfall|mistake)/.test(h)) return "dont";
  if (/(double down|more of|lean into|what works)/.test(h)) return "do";
  if (/^(do'?s?\b|do\b|keep)/.test(h)) return "do";
  return "plain";
}

/**
 * Older strategies came back as one long paragraph with the section labels
 * inline ("DO topics: ... Hooks to test: ... DON'Ts: ..."). Turn those into
 * labelled headings with one item per line so they read as a list. Slashes,
 * number ranges and quoted phrases are never used as split points.
 */
const STRATEGY_LABELS = [
  "topics to double down on",
  "do topics",
  "topics",
  "hooks to test",
  "hook formulas to test",
  "hooks",
  "words and phrases to use",
  "phrases to use",
  "use phrases",
  "words and phrases",
  "don'ts",
  "donts",
  "don't",
  "dont",
  "avoid",
];

function splitIntoItems(body: string): string[] {
  return body
    .split(/;\s+|(?<=[.!?])\s+(?=[A-Z"“'])/)
    .map((s) =>
      s
        .trim()
        .replace(/^[-•*]\s*/, "")
        .replace(/[;,]$/, ""),
    )
    .filter((s) => s.length > 1);
}

/** Split a list on commas/semicolons that sit outside quotes and brackets. */
function splitTopLevel(body: string): string[] {
  const items: string[] = [];
  let buf = "";
  let depth = 0;
  let quote = false;
  for (const ch of body) {
    if (ch === '"' || ch === "“" || ch === "”")
      quote = ch === "“" ? true : ch === "”" ? false : !quote;
    else if (!quote && (ch === "(" || ch === "[")) depth++;
    else if (!quote && (ch === ")" || ch === "]")) depth = Math.max(0, depth - 1);
    if (!quote && depth === 0 && (ch === "," || ch === ";")) {
      items.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  items.push(buf);
  return items
    .map((s) =>
      s
        .trim()
        .replace(/^(and|or)\s+/i, "")
        .replace(/^[-•*]\s*/, "")
        .replace(/[.;,]$/, "")
        .trim(),
    )
    .filter((s) => s.length > 2);
}

function normalizeStrategyText(raw: string): string {
  const text = String(raw || "")
    .replace(/\\n/g, "\n")
    .trim();
  if (!text) return "";
  const labelAlt = STRATEGY_LABELS.map((l) =>
    l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]"),
  ).join("|");
  const labelRe = new RegExp(`(?:^|\\s)(${labelAlt})(\\s*:)`, "gi");

  const out: string[] = [];
  for (const block of text.split(/\n+/)) {
    const line = block.trim();
    if (!line) continue;
    // Already a heading or a bullet: keep as-is.
    if (/^([-*•]|\d+[.)]|#+)\s/.test(line) || /:$/.test(line)) {
      out.push(line);
      continue;
    }
    const marked = line.replace(
      labelRe,
      (_m, label: string, colon: string) => `\n${label}${colon}\n`,
    );
    for (const chunk of marked.split(/\n+/)) {
      const part = chunk.trim();
      if (!part) continue;
      if (/:$/.test(part) && part.length < 80) {
        out.push(part);
        continue;
      }
      let items = splitIntoItems(part);
      if (items.length < 2) {
        const commaItems = splitTopLevel(part);
        if (commaItems.length > 1) items = commaItems;
      }
      if (items.length > 1) out.push(...items.map((i) => `- ${i}`));
      else out.push(part);
    }
  }
  return out.join("\n");
}

function parseStrategy(text: string): Section[] {
  const lines = normalizeStrategyText(text)
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sections: Section[] = [];
  let current: Section = { heading: "", kind: "plain", lines: [] };
  for (const raw of lines) {
    const bullet = /^([-*•]|\d+[.)])\s+/.test(raw);
    const clean = stripMd(raw);
    if (!clean) continue;
    const isHeading = !bullet && (/^#+\s/.test(raw) || (/:$/.test(clean) && clean.length < 80));
    if (isHeading) {
      if (current.heading || current.lines.length) sections.push(current);
      const heading = clean.replace(/:$/, "");
      current = { heading, kind: classify(heading), lines: [] };
      continue;
    }
    current.lines.push({ text: clean, bullet });
  }
  if (current.heading || current.lines.length) sections.push(current);
  return sections;
}

function SectionCard({ section }: { section: Section }) {
  const tone =
    section.kind === "do"
      ? {
          border: "border-[#BFE3CB]",
          bg: "bg-[#F4FBF6]",
          dot: "bg-[#12854A]",
          label: "text-[#12854A]",
        }
      : section.kind === "dont"
        ? {
            border: "border-[#F3C8C2]",
            bg: "bg-[#FEF6F4]",
            dot: "bg-[#D92D20]",
            label: "text-[#D92D20]",
          }
        : {
            border: "border-[#E5E5E8]",
            bg: "bg-white",
            dot: "bg-[#4F6BFF]",
            label: "text-[#5A5860]",
          };

  return (
    <div className={`min-w-0 rounded-xl border ${tone.border} ${tone.bg} p-3.5`}>
      {section.heading && (
        <p
          className={`break-words text-[11px] uppercase tracking-[.12em] ${tone.label}`}
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
        >
          {section.kind === "do"
            ? `Do — ${section.heading}`
            : section.kind === "dont"
              ? `Don't — ${section.heading}`
              : section.heading}
        </p>
      )}
      <div className={`min-w-0 space-y-1.5 ${section.heading ? "mt-2" : ""}`}>
        {section.lines.map((l, i) =>
          l.bullet ? (
            <div key={i} className="flex min-w-0 gap-2.5">
              <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
              <p className="min-w-0 break-words text-[13px] leading-relaxed text-[#2A2A2E]">
                {formatInline(l.text)}
              </p>
            </div>
          ) : (
            <p key={i} className="min-w-0 break-words text-[13px] leading-relaxed text-[#2A2A2E]">
              {formatInline(l.text)}
            </p>
          ),
        )}
      </div>
    </div>
  );
}

/** Renders strategy rationale separately from Do/Don't guidance. */
function StrategyBreakdownBody({ text }: { text: string }) {
  const sections = parseStrategy(text);
  const dos = sections.filter((s) => s.kind === "do");
  const donts = sections.filter((s) => s.kind === "dont");
  const rationale = sections.filter((s) => s.kind === "plain");

  return (
    <div className="min-w-0 space-y-4">
      {rationale.length > 0 && (
        <div className="min-w-0 space-y-3">
          {rationale.map((s, i) => (
            <SectionCard key={`r${i}`} section={s} />
          ))}
        </div>
      )}
      {(dos.length > 0 || donts.length > 0) && (
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <div className="min-w-0 space-y-3">
            {dos.map((s, i) => (
              <SectionCard key={`d${i}`} section={s} />
            ))}
          </div>
          <div className="min-w-0 space-y-3">
            {donts.map((s, i) => (
              <SectionCard key={`x${i}`} section={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderAdviceLink(text: string): ReactNode[] {
  if (!text) return [];
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

function AuditInsightsBox({
  report,
  meta,
}: {
  report: Report;
  meta?: { profile?: string; createdAt?: string } | null;
}) {
  const scorecard = report.scorecard || {};
  const formatComparison = report.formatComparison || {};
  const topicPillars = Array.isArray(report.topicPillars) ? report.topicPillars : [];
  const topPosts = (Array.isArray(report.topPosts) ? report.topPosts : []).slice(0, 5);

  const topTopic = String(scorecard.topPerformingTopic || "").trim();
  const topTopicPillars = topTopic
    ? topicPillars.filter((p) =>
        String(p.topicPillar || "")
          .toLowerCase()
          .includes(topTopic.toLowerCase()),
      )
    : topicPillars.slice(0, 2);

  const formatStats: Array<{
    label: string;
    stats?: {
      posts: number;
      avgViews: string;
      avgLikes: string;
      avgComments: string;
      reactionRate: string;
    };
  }> = [
    { label: "Talking video", stats: formatComparison.speaksToCamera },
    { label: "B-roll", stats: formatComparison.musicOrMovement },
  ];

  const metaText =
    meta?.profile || meta?.createdAt
      ? [
          meta.profile || "",
          meta.createdAt
            ? new Date(meta.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";

  return (
    <section className="min-w-0 py-8 sm:py-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
        <p
          className="min-w-0 text-lg text-brand-ink"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
        >
          Audit insights
        </p>
        {metaText && <p className="text-xs text-brand-ink-soft">{metaText}</p>}
      </div>
      <div className="mt-8 min-w-0 space-y-10">
        {topTopic && (
          <div className="border-b border-brand-line pb-8">
            <p className="text-sm font-medium text-brand-ink-soft">
              Top performing topic
            </p>
            <p
              className="mt-3 text-lg text-brand-ink"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
            >
              {topTopic}
            </p>
            {topTopicPillars.length > 0 && (
              <div className="mt-5 max-w-3xl space-y-5">
                {topTopicPillars.map((p, i) => (
                  <div key={i} className="space-y-2 text-sm leading-7 text-brand-ink-mid">
                    <p className="font-medium text-[#1A1A1D]">{p.topicPillar}</p>
                    {p.bestResult && <p className="text-[#5A5860]">{p.bestResult}</p>}
                    {p.whyItConnects && <p className="text-[#5A5860]">{p.whyItConnects}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {formatComparison && (
          <div className="border-b border-brand-line pb-8">
            <p className="text-sm font-semibold text-brand-ink">
              Format comparison
            </p>
            {formatComparison.winner && (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-ink-mid">
                <span className="font-medium">Winner:</span> {formatComparison.winner}
                {formatComparison.winnerReason ? ` — ${formatComparison.winnerReason}` : ""}
              </p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {formatStats.map((f, i) =>
                f.stats ? (
                  <div key={i} className="rounded-lg border border-brand-line bg-brand-wash p-5 sm:p-6">
                    <p className="text-sm font-medium text-brand-ink-soft">
                      {f.label}
                    </p>
                    <p className="mt-3 text-xl text-brand-ink font-semibold">
                      {f.stats.posts} posts
                    </p>
                    <p className="mt-3 text-sm leading-7 text-brand-ink-soft">Avg views: {f.stats.avgViews}</p>
                    <p className="text-sm leading-7 text-brand-ink-soft">
                      Reaction rate: {f.stats.reactionRate}
                    </p>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        )}

        {topPosts.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-brand-ink">
              Top-performing posts
            </p>
            <ul className="mt-5 divide-y divide-brand-line">
              {topPosts.map((post, i) => (
                <li key={i} className="py-5 text-sm leading-7 text-brand-ink-mid">
                  <span className="text-[#9B9BA1]">#{i + 1}</span>{" "}
                  <span className="font-medium text-[#1A1A1D]">{post.format}</span>{" "}
                  {post.views && <span className="text-[#5A5860]">· {post.views} views</span>}{" "}
                  {post.reactions && (
                    <span className="text-[#5A5860]">· {post.reactions} reactions</span>
                  )}
                  {post.description && (
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-ink-soft">
                      {renderAdviceLink(post.description)}
                    </p>
                  )}
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block text-[12px] text-[#4F6BFF] hover:underline"
                    >
                      View post
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/** Slide-over panel used for the full strategy and the full audit findings. */
function DetailPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-2xl overflow-y-auto bg-[#FAFAFB] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5E5E8] bg-white px-6 py-4">
          <p
            className="text-[13px] uppercase tracking-[.12em] text-[#1A1A1D]"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5A5860] transition hover:bg-[#F0F0F3] hover:text-[#1A1A1D]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function StrategyContainer({ inline, onClose, children }: { inline: boolean; onClose: () => void; children: ReactNode }) {
  return inline ? <div className="pb-6">{children}</div> : <DetailPanel title="Your strategy" onClose={onClose}>{children}</DetailPanel>;
}

/** Two or three headline facts from the audit, nothing more. */
function AuditSummaryBox({
  report,
  meta,
  onOpen,
}: {
  report: Report;
  meta?: { profile?: string; createdAt?: string } | null;
  onOpen: () => void;
}) {
  const scorecard = report.scorecard || {};
  const formatComparison = report.formatComparison || {};
  const topPost = (Array.isArray(report.topPosts) ? report.topPosts : [])[0];
  const topTopic = String(scorecard.topPerformingTopic || "").trim();

  const metaText = [
    meta?.profile ? `@${String(meta.profile).replace(/^@/, "")}` : "",
    meta?.createdAt
      ? new Date(meta.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const facts: Array<{ label: string; value: string }> = [
    topTopic ? { label: "Top topic", value: topTopic } : null,
    formatComparison.winner
      ? { label: "Best format", value: String(formatComparison.winner) }
      : null,
    topPost
      ? {
          label: "Best post",
          value: [topPost.format, topPost.views ? `${topPost.views} views` : ""]
            .filter(Boolean)
            .join(" · "),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="flex min-w-0 flex-col border-t border-[#E5E5E8] bg-white p-4 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p
          className="text-[11px] uppercase tracking-[.14em] text-[#5A5860]"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
        >
          Audit insights
        </p>
        {metaText && <p className="text-[11px] text-[#9B9BA1]">{metaText}</p>}
      </div>

      <div className="mt-4 min-w-0 space-y-3">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <p className="text-[11px] uppercase tracking-[.1em] text-[#9B9BA1]">{f.label}</p>
            <p className="mt-0.5 break-words text-[13px] leading-relaxed text-[#1A1A1D]">
              {f.value}
            </p>
          </div>
        ))}
        {facts.length === 0 && (
          <p className="text-[13px] italic text-[#9B9BA1]">
            Run an audit to see your findings here.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-auto flex h-9 items-center gap-1.5 self-end rounded-md px-2.5 text-[12px] text-[#4F6BFF] transition-colors hover:bg-[#EEF1FF]"
      >
        See all findings
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** First lines of the strategy plus a Do/Don't count, nothing more. */
function StrategySummaryBody({ text }: { text: string }) {
  const sections = parseStrategy(text);
  const plain = sections.filter((s) => s.kind === "plain");
  const intro = plain
    .flatMap((s) => s.lines.map((l) => ({ heading: s.heading, text: l.text })))
    .slice(0, 3);

  return (
    <div className="min-w-0 space-y-3">
      {intro.length > 0 && (
        <div className="min-w-0 space-y-2">
          {intro.map((item, i) => (
            <div key={i} className="min-w-0">
              {item.heading && (i === 0 || intro[i - 1]?.heading !== item.heading) && (
                <p className="break-words text-[11px] uppercase tracking-[.1em] text-[#9B9BA1]">
                  {item.heading}
                </p>
              )}
              <p className="min-w-0 break-words text-[13px] leading-relaxed text-[#2A2A2E]">
                {formatInline(item.text)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One short sentence of strategy context for the collapsed bar. */
function strategyOneLiner(text: string): string {
  const sections = parseStrategy(text);
  for (const s of sections) {
    if (s.kind !== "plain") continue;
    for (const l of s.lines) {
      const t = String(l.text || "").trim();
      if (t.length > 3) return t.length > 130 ? `${t.slice(0, 127)}…` : t;
    }
  }
  return "";
}

/** One short sentence of audit context for the collapsed bar. */
function auditOneLiner(report: any): string {
  if (!report) return "";
  const scorecard = report.scorecard || {};
  const topTopic = String(scorecard.topPerformingTopic || "").trim();
  const winner = String(report.formatComparison?.winner || "").trim();
  const parts = [topTopic ? `Top topic: ${topTopic}` : "", winner ? `Best format: ${winner}` : ""].filter(Boolean);
  return parts.join(" · ");
}

export type FormatPick = "broll" | "talkingVideo" | "graphic" | "carousel";

export function StrategyStrip({
  guidance,
  loading,
  compact = false,
  accessCode = "",
  auditReport,
  auditMeta,
  onStrategySaved,
  onPickFormat,
  view = "combined",
}: {
  guidance: BrandGuidance | null;
  loading: boolean;
  compact?: boolean;
  view?: "combined" | "writer" | "details";
  accessCode?: string;
  auditReport?: Report | null;
  auditMeta?: { profile?: string; createdAt?: string } | null;
  onStrategySaved?: (update: {
    strategy: string;
    broll: number;
    talking: number;
    graphic: number;
    carousel: number;
  }) => void;
  /** When provided, the format chips become clickable and kick off scripting. */
  onPickFormat?: (pick: { format: FormatPick; count: number; label: string }) => void;
}) {
  const [strategyDraft, setStrategyDraft] = useState("");
  const [buttonCounts, setButtonCounts] = useState<Record<CountKey, number>>({
    broll: 0,
    talking: 0,
    graphic: 0,
    carousel: 0,
  });
  // Format Split shows how many pieces are still MISSING this month (the
  // difference), not the monthly target. The user can nudge that number before
  // scripting without touching the saved monthly split.
  const [countOverrides, setCountOverrides] = useState<Partial<Record<CountKey, number>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [strategyPanelOpen, setStrategyPanelOpen] = useState(false);
  const [auditPanelOpen, setAuditPanelOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState("monthly");
  const strategyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (guidance) {
      setStrategyDraft(normalizeStrategyText(guidance.strategy || ""));
      setButtonCounts({
        broll: guidance.broll ?? 0,
        talking: guidance.talking ?? 0,
        graphic: guidance.graphic ?? 0,
        carousel: guidance.carousel ?? 0,
      });
      setCountOverrides({});
      setDirty(false);
    }
  }, [guidance]);

  useEffect(() => {
    if (!editingStrategy || !strategyInputRef.current) return;
    const input = strategyInputRef.current;
    input.style.height = "0px";
    input.style.height = `${input.scrollHeight + 2}px`;
    input.focus();
  }, [editingStrategy, strategyDraft]);

  const save = useCallback(async () => {
    if (!accessCode) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = { strategy: strategyDraft.trim(), ...buttonCounts };
      const response = await fetch("/api/brand-guidance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-access-code": accessCode },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((result as any)?.error || "Could not save the strategy.");
      onStrategySavedRef.current?.(payload);
      setDirty(false);
      setSavedAt(new Date());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the strategy.");
    } finally {
      setSaving(false);
    }
  }, [accessCode, strategyDraft, buttonCounts]);

  const onStrategySavedRef = useRef(onStrategySaved);
  useEffect(() => {
    onStrategySavedRef.current = onStrategySaved;
  }, [onStrategySaved]);

  // Autosave: debounce any local edit to the strategy text or the counts.
  useEffect(() => {
    if (!dirty || !accessCode) return;
    const t = setTimeout(() => {
      save();
    }, 1200);
    return () => clearTimeout(t);
  }, [dirty, accessCode, strategyDraft, buttonCounts, save]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9B9BA1]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading your strategy…
        </div>
      </div>
    );
  }
  if (!guidance) return null;
  const { strategy, broll, talking, graphic = null, carousel = null } = guidance;
  type Chip = { icon: typeof Clapperboard; value: number; label: string; format: FormatPick };
  const counts: Chip[] = [
    { icon: Clapperboard, value: broll ?? 0, label: "BROLL", format: "broll" },
    { icon: Mic, value: talking ?? 0, label: "Talking Video", format: "talkingVideo" },
    { icon: Image, value: graphic ?? 0, label: "Graphic", format: "graphic" },
    { icon: LayoutGrid, value: carousel ?? 0, label: "Carousel", format: "carousel" },
  ];
  if (view === "combined" && !strategy && counts.every((chip) => chip.value === 0)) return null;

  const countChips = (
    <div className="flex flex-col gap-2.5">
      {counts.map((chip) => {
        const Icon = chip.icon;
        const key: CountKey = chip.format === "talkingVideo" ? "talking" : chip.format;
        const monthlyTarget = buttonCounts[key];
        const missing = Math.max(
          0,
          getFormatDifference(guidance.formatMetrics, chip.format, monthlyTarget),
        );
        const currentValue = countOverrides[key] ?? missing;
        const tone = getFormatBalanceTone(guidance.formatMetrics, chip.format, monthlyTarget);
        const toneClass = toneClasses[tone];
        // Share of this month's target already covered, shown as the bar below the name.
        const coveredPct =
          monthlyTarget > 0
            ? Math.max(0, Math.min(1, (monthlyTarget - missing) / monthlyTarget))
            : 1;
        // Nothing covered yet still needs a visible (red) bar, otherwise the row looks broken.
        const progressPct = coveredPct === 0 ? 1 : coveredPct;

        if (!onPickFormat) {
          return (
            <div
              key={chip.label}
              className={`inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 ${toneClass.box}`}
            >
              <Icon className={`w-4 h-4 ${toneClass.text}`} />
              <span
                className="text-[14px] text-[#1A1A1D]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              >
                {currentValue}
              </span>
              <span className="text-[12px] text-[#5A5860]">{chip.label}</span>
            </div>
          );
        }

        return (
          <button
            key={chip.label}
            type="button"
            title={`Script ${currentValue} ${chip.label}`}
            onClick={() =>
              currentValue > 0 &&
              onPickFormat?.({ format: chip.format, count: currentValue, label: chip.label })
            }
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-[#EDEDF0] bg-[#FAFAFB] px-4 py-2.5 transition-colors hover:border-[#4F6BFF] ${currentValue === 0 ? "opacity-60" : ""}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-[#4F6BFF]" />
              <div className="min-w-0 flex-1 text-left">
                <p
                  className="truncate text-[13px] text-[#1A1A1D]"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  Script {chip.label}
                </p>
                <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[#EDEDF0]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(progressPct * 100)}%`,
                      backgroundColor: toneBarColor[tone],
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={24}
                value={currentValue}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onChange={(event) => {
                  const v = Math.max(0, Math.min(24, Math.round(Number(event.target.value) || 0)));
                  setCountOverrides((prev) => ({ ...prev, [key]: v }));
                }}
                className="w-12 text-center rounded-lg border border-[#D8D8DE] bg-white px-1 py-1 text-[14px] text-[#1A1A1D] outline-none focus:border-[#4F6BFF]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              />
              <ArrowRight
                className={`w-5 h-5 text-[#4F6BFF] ${currentValue === 0 ? "opacity-40" : ""}`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );

  const monthlyPieces = counts
    .map((chip) => {
      const key: CountKey = chip.format === "talkingVideo" ? "talking" : chip.format;
      return buttonCounts[key] > 0 ? `${buttonCounts[key]} ${chip.label}` : "";
    })
    .filter(Boolean);
  const monthlyLine = monthlyPieces.length
    ? `Your strategy: ${monthlyPieces.join(", ")} this month`
    : "Your strategy is ready.";

  if (compact) {
    if (counts.length === 0) return null;
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">{countChips}</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
      <div className="min-w-0 p-0">
        <div className="flex items-start justify-end gap-3">
          <p className="shrink-0 text-right text-[11px] text-[#9B9BA1]">
            {saving
              ? "Saving…"
              : savedAt
                ? `Autosaved at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : dirty
                  ? "Unsaved changes…"
                  : ""}
          </p>
        </div>

        {view === "details" && <>
          <h2 className="mb-6 text-2xl font-semibold text-brand-ink">Strategy</h2>
          <Tabs value={detailsTab} onValueChange={setDetailsTab} className="mb-8">
            <TabsList aria-label="Strategy sections" className="h-auto w-full justify-start gap-6 rounded-none border-b border-brand-line bg-transparent p-0 text-brand-ink-soft">
              <TabsTrigger value="monthly" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-brand-accent data-[state=active]:bg-transparent data-[state=active]:text-brand-accent data-[state=active]:shadow-none">Monthly Split</TabsTrigger>
              <TabsTrigger value="brief" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-brand-accent data-[state=active]:bg-transparent data-[state=active]:text-brand-accent data-[state=active]:shadow-none">Strategy Brief</TabsTrigger>
            </TabsList>
          </Tabs>
        </>}
        {view === "combined" && <div className="rounded-xl bg-[#EEF1FF] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-[#3A3F63]">
              {monthlyLine}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingStrategy(false);
                  setStrategyPanelOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6BFF] px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-[#3F58E0]"
              >
                Strategy
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              {auditReport && (
                <button
                  type="button"
                  onClick={() => setAuditPanelOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4F6BFF] bg-transparent px-3 py-1.5 text-[12px] text-[#4F6BFF] transition-colors hover:bg-white"
                >
                  Audit findings
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {saveError && <p className="mt-2 text-[12px] text-[#D92D20]">{saveError}</p>}
        </div>}

        {(view === "details" || strategyPanelOpen) && (
          <StrategyContainer inline={view === "details"} onClose={() => { setStrategyPanelOpen(false); setEditingStrategy(false); }}>
            {(view !== "details" || detailsTab === "monthly") && <div role={view === "details" ? "tabpanel" : undefined} aria-label="Monthly Split" className="mb-6 pb-5">
              <p
                className="text-[11px] uppercase tracking-[.14em] text-[#5A5860]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              >
                Monthly split
              </p>
              <p className="mt-1 text-[12px] text-[#9B9BA1]">
                How many of each format the strategy calls for every month.
              </p>
              <div className="mt-3 space-y-2">
                {counts.map((chip) => {
                  const key: CountKey = chip.format === "talkingVideo" ? "talking" : chip.format;
                  return (
                    <div
                      key={chip.label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E5E8] bg-white px-3 py-2"
                    >
                      <span className="text-[13px] text-[#2A2A2E]">{chip.label}</span>
                      <input
                        type="number"
                        min={0}
                        max={45}
                        value={buttonCounts[key]}
                        onChange={(event) => {
                          const v = Math.max(
                            0,
                            Math.min(45, Math.round(Number(event.target.value) || 0)),
                          );
                          setButtonCounts((prev) => ({ ...prev, [key]: v }));
                          setDirty(true);
                        }}
                        className="w-14 rounded-lg border border-[#D8D8DE] bg-white px-1 py-1.5 text-center text-[14px] text-[#1A1A1D] outline-none focus:border-[#4F6BFF]"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>}
            {(view !== "details" || detailsTab === "brief") && <div role={view === "details" ? "tabpanel" : undefined} aria-label="Strategy Brief">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#9B9BA1]">
                {saving
                  ? "Saving…"
                  : dirty
                    ? "Unsaved changes…"
                    : savedAt
                      ? `Autosaved at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : ""}
              </p>
              <Button variant="ghost" size="sm"
                type="button"
                onClick={() => setEditingStrategy((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[#4F6BFF] transition-colors hover:bg-[#EEF1FF]"
              >
                {editingStrategy ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
                {editingStrategy ? "Done" : "Edit"}
              </Button>
            </div>
            {editingStrategy ? (
              <textarea
                ref={strategyInputRef}
                value={strategyDraft}
                onChange={(event) => {
                  setStrategyDraft(event.target.value);
                  setDirty(true);
                }}
                placeholder="Your strategy will appear here once generated."
                className="min-h-60 w-full overflow-hidden rounded-lg border border-[#D8D8DE] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#2A2A2E] outline-none focus:border-[#4F6BFF] resize-none"
              />
            ) : strategyDraft.trim() ? (
              <StrategyBreakdownBody text={strategyDraft} />
            ) : (
              <p className="text-[13px] italic text-[#9B9BA1]">
                Your strategy will appear here once generated.
              </p>
            )}
            {saveError && <p className="mt-3 text-[12px] text-[#D92D20]">{saveError}</p>}
            </div>}
          </StrategyContainer>
        )}

        {view === "details" && detailsTab === "brief" && auditReport && (
          <div className="mt-6 border-t border-brand-line pb-8">
            <AuditInsightsBox report={auditReport} meta={auditMeta} />
          </div>
        )}

        {auditPanelOpen && auditReport && (
          <DetailPanel title="Audit findings" onClose={() => setAuditPanelOpen(false)}>
            <AuditInsightsBox report={auditReport} meta={auditMeta} />
          </DetailPanel>
        )}

        {view !== "details" && counts.length > 0 && (
          <div className="mt-5 min-w-0 pb-8">
            <div className="min-w-0">
              <p
                className="text-[18px] text-[#1A1A1D]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
              >
                Write scripts
              </p>
            </div>

            <div className="mt-6">{countChips}</div>
          </div>
        )}
      </div>
    </div>
  );
}
