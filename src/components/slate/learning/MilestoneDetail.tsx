import { useEffect, useState, type RefObject } from "react";
import { ArrowLeft, Check, ChevronDown, Flag, Info, Loader2, Lock, PlayCircle } from "lucide-react";
import { courseCounts, done, type Milestone } from "./types";
import { LessonText } from "./LessonText";
import { Button } from "@/components/ui/button";
import { StatusPill, progressTone } from "./ui";

type StatusValue = "In progress" | "Completed";

export function MilestoneDetail({
  milestone,
  scrollContainerRef,
  onBack,
  onOpenCourse,
  onSetStatus,
  statusPending = false,
  statusError = null,
}: {
  milestone: Milestone;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onOpenCourse: (id: string) => void;
  onSetStatus?: (ids: string[], status: StatusValue) => Promise<unknown>;
  statusPending?: boolean;
  statusError?: string | null;
}) {
  const counts = courseCounts(milestone);
  const [collapsed, setCollapsed] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [busyStep, setBusyStep] = useState<string | null>(null);


  useEffect(() => {
    const panel = scrollContainerRef.current;
    if (!panel) return;
    // Reserve expanded header space so collapse cannot pull scrollTop backwards.
    setCollapsed(false);
    setBriefOpen(false);
    const onScroll = () => setCollapsed((previous) => {
      const next = panel.scrollTop > (previous ? 40 : 90);
      if (next) setBriefOpen(false);
      return next;
    });
    onScroll();
    panel.addEventListener("scroll", onScroll, { passive: true });
    return () => panel.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef, milestone.id]);

  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpenSteps((s) => ({ ...s, [id]: !s[id] }));

  const description = (milestone.description || "").trim();
  const goal = (milestone.goal || "").trim();
  const fallback = !description && !goal ? (milestone.overview || "").trim() : "";
  const percent = Math.max(0, Math.min(100, milestone.completionPercent));

  return (
    <div className="bg-social-feed pb-16">
      <div className="sticky top-0 z-30 pointer-events-none" data-milestone-header data-collapsed={collapsed}>
        <header className={`pointer-events-auto border-b border-brand-line bg-brand-surface transition-[height] duration-200 motion-reduce:transition-none ${collapsed ? "h-14" : ""}`}>
          <div className="mx-auto flex h-full max-w-4xl flex-col justify-center px-4 py-3 sm:px-6 md:px-8">
            {collapsed ? <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} aria-label="All milestones" className="size-9 shrink-0 text-brand-ink-mid"><ArrowLeft size={16} /></Button>
              <h1 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-brand-ink">{milestone.name}</h1>
              <ProgressRing percent={percent} size={30} />
            </div> : <>
              <Button variant="ghost" onClick={onBack} className="mb-2 h-9 self-start gap-1.5 px-0 text-xs text-brand-accent hover:bg-transparent"><ArrowLeft size={14} />All milestones</Button>
              <p className="text-[10px] font-medium text-brand-ink-soft">Milestone {milestone.order || ""}</p>
              <div className="mt-1 flex items-center gap-4">
                <h1 className="line-clamp-2 min-w-0 flex-1 text-lg font-semibold leading-snug text-brand-ink">{milestone.name}</h1>
                <ProgressRing percent={percent} size={44} />
              </div>
              <p className="h-auto px-0 mt-1 text-[11px] text-brand-ink-soft">{counts.complete} of {counts.total} courses complete</p>
              {(description || goal || fallback) && <div className="mt-3 border-t border-brand-line pt-2">
                <Button variant="ghost" aria-expanded={briefOpen} aria-controls="milestone-brief" onClick={() => setBriefOpen((v) => !v)} className="h-8 gap-1.5 px-2 -ml-2 text-xs font-medium text-brand-ink-mid hover:bg-brand-wash">
                  <Info size={14} className="text-brand-accent" />About this milestone{goal ? " & your goal" : ""}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${briefOpen ? "rotate-180" : ""}`} />
                </Button>
                <div id="milestone-brief" className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${briefOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="grid gap-x-10 gap-y-4 pb-1 pt-3 md:grid-cols-2">
                      {(description || fallback) && <BriefBlock label="About this milestone" text={description || fallback} />}
                      {goal && <BriefBlock label="Your goal" text={goal} goal />}
                    </div>
                  </div>
                </div>
              </div>}
            </>}
          </div>
        </header>
      </div>
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 md:px-8">
        <div className="mt-6 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink-soft">
            Steps
          </span>
          <span className="h-px flex-1 bg-brand-line" />
          <span className="text-[11px] text-brand-ink-soft">{milestone.missions.length}</span>
        </div>


      <div className="mt-4 space-y-2.5">
        {milestone.missions.map((mi, s) => {
          const total = mi.modules.length;
          const complete = mi.modules.filter((c) => done(c.status)).length;
          const finished = total > 0 && complete === total;
          const open = !!openSteps[mi.id] && !mi.locked;
          return (
            <div
              key={mi.id}
              className={`overflow-hidden rounded-lg border transition ${
                mi.locked
                  ? "border-brand-line bg-learning-disabled"
                  : open
                    ? "border-brand-line bg-brand-surface shadow-sm"
                    : "border-transparent bg-social-feed hover:bg-brand-line"
              }`}
            >
              <Button variant="ghost"
                type="button"
                disabled={mi.locked}
                onClick={() => toggle(mi.id)}
                className="h-auto whitespace-normal flex w-full items-center gap-3.5 px-4 py-3 text-left disabled:cursor-not-allowed"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    mi.locked
                      ? "bg-brand-line text-brand-ink-soft"
                      : finished
                        ? "bg-progress-high text-brand-surface"
                        : complete > 0
                          ? "bg-progress-mid/10 text-progress-mid"
                          : "bg-progress-low/10 text-progress-low"
                  }`}
                >
                  {mi.locked ? <Lock size={12} /> : finished ? <Check size={14} /> : s + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-ink-soft">
                    Step {s + 1}
                  </div>
                  <div className={`truncate text-[15px] font-semibold leading-snug ${mi.locked ? "text-brand-ink-soft" : "text-brand-ink"}`}>
                    {mi.name}
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                  <span className="text-[11px] text-brand-ink-soft">
                    {mi.locked ? "Locked" : `${complete}/${total}`}
                  </span>
                  {!mi.locked && (
                    <ChevronDown
                      size={16}
                      className={`text-brand-ink-soft transition ${open ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </Button>

              {open && (
                <div className="border-t border-brand-line bg-social-feed p-5">
                  <section className="rounded-lg border border-brand-line bg-brand-surface p-4">
                    <div className="flex items-center gap-3 border-b border-brand-line pb-2.5">
                      <div className="flex-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink-soft">
                        Courses to complete · {complete} of {total} done
                      </div>
                      {onSetStatus && !finished && total > 0 && (
                        <Button variant="ghost"
                          type="button"
                          disabled={statusPending}
                          onClick={() => {
                            const ids = mi.modules
                              .filter((c) => !c.locked && !done(c.status))
                              .map((c) => c.id);
                            if (!ids.length) return;
                            setBusyStep(mi.id);
                            void onSetStatus(ids, "Completed").finally(() => setBusyStep(null));
                          }}
                          className="h-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-accent px-2.5 py-1.5 text-[11px] font-semibold text-brand-surface transition hover:bg-brand-blue-light disabled:opacity-60"
                        >
                          {busyStep === mi.id && statusPending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} strokeWidth={3} />
                          )}
                          Mark step complete
                        </Button>
                      )}
                    </div>

                    <div className="-mx-1 mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {mi.modules.map((c) => {
                        const isDone = done(c.status);
                        return (
                          <div
                            key={c.id}
                            role="button"
                            tabIndex={c.locked ? -1 : 0}
                            onClick={() => !c.locked && onOpenCourse(c.id)}
                            onKeyDown={(e) => {
                              if (c.locked) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onOpenCourse(c.id);
                              }
                            }}
                            className={`group w-[180px] shrink-0 snap-start rounded-lg border p-2.5 text-left transition ${
                              c.locked
                                ? "cursor-not-allowed border-brand-line bg-learning-disabled"
                                : "cursor-pointer border-brand-line bg-brand-surface hover:border-brand-accent/40 hover:shadow-sm"
                            }`}
                          >
                            <div className="relative block h-[86px] w-full overflow-hidden rounded-lg bg-brand-wash">
                              {c.thumbnail ? (
                                <img
                                  src={c.thumbnail}
                                  alt=""
                                  loading="lazy"
                                  className={`h-full w-full object-cover ${c.locked ? "opacity-40 grayscale" : ""}`}
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-brand-ink-grey">
                                  {c.locked ? <Lock size={16} /> : <PlayCircle size={20} />}
                                </span>
                              )}
                              <Button variant="ghost"
                                type="button"
                                disabled={c.locked || !onSetStatus || statusPending}
                                aria-label={isDone ? "Mark course not complete" : "Mark course complete"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!onSetStatus || c.locked) return;
                                  void onSetStatus([c.id], isDone ? "In progress" : "Completed");
                                }}
                                className={`absolute right-1.5 top-1.5 flex p-0 h-[20px] w-[20px] items-center justify-center rounded-full border backdrop-blur-sm transition ${
                                  c.locked
                                    ? "cursor-not-allowed border-brand-line bg-brand-surface/70 text-brand-ink-soft"
                                    : isDone
                                      ? "border-progress-high bg-progress-high text-brand-surface"
                                      : "border-brand-line bg-brand-surface/85 text-transparent hover:border-progress-high hover:text-progress-high/50"
                                }`}
                              >
                                {c.locked ? <Lock size={10} /> : <Check size={11} strokeWidth={3} />}
                              </Button>
                            </div>
                            <div className={`mt-2 block text-[12.5px] font-medium leading-snug line-clamp-2 ${c.locked ? "text-brand-ink-soft" : "text-brand-ink"}`}>
                              {c.name}
                            </div>
                            <div className="mt-1.5">
                              <StatusPill status={c.status} locked={c.locked} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!mi.modules.length && (
                      <div className="py-2 text-[12px] text-brand-ink-soft">No courses yet.</div>
                    )}
                    {statusError && busyStep === mi.id && (
                      <div className="mt-2 text-[11.5px] text-destructive">{statusError}</div>
                    )}
                  </section>

                  {mi.notes && (
                    <section className="mt-4 rounded-lg border border-brand-line bg-brand-surface p-4">
                      <div className="border-b border-brand-line pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink-soft">
                        About this step
                      </div>
                      <LessonText
                        text={mi.notes}
                        className="mt-3 max-w-[62ch] text-[12.5px] leading-[1.7] text-brand-ink-mid"
                      />
                    </section>
                  )}
                </div>
              )}

            </div>
          );
        })}

        {!milestone.missions.length && (
          <div className="rounded-lg border border-brand-line bg-brand-surface px-6 py-8 text-center text-sm text-brand-ink-soft">
            {milestone.locked ? "This milestone unlocks later." : "No steps have been added yet."}
          </div>
        )}
        </div>
      </div>
    </div>

  );
}

/** Compact progress indicator on the neutral milestone header. */
function ProgressRing({ percent, size = 52 }: { percent: number; size?: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  return <div className="relative shrink-0" style={{ width: size, height: size }}>
    <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90" aria-hidden="true">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="var(--color-brand-line)" strokeWidth="3" />
      <circle cx="22" cy="22" r={radius} fill="none" stroke="var(--color-brand-accent)" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - p / 100)} strokeLinecap="round" />
    </svg>
    <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-brand-ink-mid">{p}%</span>
  </div>;
}

/** Readable milestone introduction outside the sticky header. */
function BriefBlock({ label, text, goal = false }: { label: string; text: string; goal?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 220;
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink-soft">
        {goal && <Flag size={11} />} {label}
      </div>
      <LessonText
        text={text}
        className={`mt-1.5 max-w-[60ch] text-[12.5px] leading-[1.65] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${
          !expanded && long ? "line-clamp-3" : ""
        }`}
      />
      {long && (
        <Button variant="ghost"
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="h-auto px-0 mt-1 text-[11px] font-semibold text-brand-accent transition hover:text-brand-blue-light"
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      )}
    </div>
  );
}
