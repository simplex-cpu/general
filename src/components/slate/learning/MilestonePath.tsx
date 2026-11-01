import {
  BarChart3,
  BookOpen,
  Brain,
  Camera,
  Check,
  ChevronRight,
  Clapperboard,
  Compass,
  FilePenLine,
  Filter,
  Lightbulb,
  Lock,
  Megaphone,
  MonitorPlay,
  Palette,
  PlayCircle,
  Rocket,
  Search,
  Target,
  TrendingUp,
  Users,
  WandSparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseCounts, fmtDate, type Milestone } from "./types";
import { Progress, progressTone } from "./ui";

function milestoneIcon(milestone: Milestone): LucideIcon {
  const name = milestone.name.toLowerCase();
  const overview = milestone.overview.toLowerCase();
  const match = (pattern: RegExp) => pattern.test(name) || (!name.match(pattern) && pattern.test(overview));

  // Explicit Learning-path icons, matched by milestone name first.
  if (/foundation|toolkit|basics/.test(name)) return Wrench;
  if (/consistent|analyze|brain|learn/.test(name)) return Brain;
  if (/funnel|monetize|convert/.test(name)) return Filter;
  if (/scale|grow upward|set up to scale/.test(name)) return TrendingUp;
  if (/audit|optimize|refine/.test(name)) return Search;

  if (match(/brand|identity|visual style/)) return Palette;
  if (match(/film|camera|record|shoot/)) return Camera;
  if (match(/edit|production|produce/)) return Clapperboard;
  if (match(/course|learn|training|education/)) return BookOpen;
  if (match(/content|publish|social|distribution/)) return Megaphone;
  if (match(/audience|community|customer/)) return Users;
  if (match(/data|analytic|audit|measure|performance/)) return BarChart3;
  if (match(/strategy|goal|position|plan/)) return Compass;
  if (match(/script|writing|copy/)) return FilePenLine;
  if (match(/idea|creative|concept|story/)) return Lightbulb;
  if (match(/launch|growth|scale/)) return Rocket;
  if (match(/video|watch|media/)) return MonitorPlay;

  const fallbacks: LucideIcon[] = [Target, WandSparkles, BookOpen, Camera, BarChart3, Megaphone];
  return fallbacks[Math.abs((milestone.order || 1) - 1) % fallbacks.length] || Target;
}

function MilestoneVisual({ milestone }: { milestone: Milestone }) {
  const Icon = milestoneIcon(milestone);
  const palette = milestone.locked ? "bg-learning-disabled text-learning-disabled-accent" : "bg-milestone-blue-surface text-milestone-blue";

  return (
    <div
      className={`relative flex min-h-24 w-full shrink-0 flex-col items-center justify-center gap-2 overflow-hidden px-3 py-3 sm:w-28 ${palette}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 112 96" className="pointer-events-none absolute inset-0 h-full w-full text-current opacity-10" fill="none"><path d="M0 72H112M24 0V96M88 0V96" stroke="currentColor" /><path d="M6 56L35 27L63 56L93 26" stroke="currentColor" strokeWidth="2" /><rect x="33" y="25" width="46" height="46" rx="6" stroke="currentColor" /></svg>
      <div className="relative grid h-12 w-12 place-items-center rounded-lg border border-current/15 bg-brand-surface/80 shadow-sm">
        <Icon size={26} strokeWidth={1.5} />
        {milestone.locked && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-current/15 bg-brand-surface"><Lock size={10} /></span>}
      </div>
      <span className="relative text-[9px] font-semibold tracking-normal">
        Milestone {milestone.order || ""}
      </span>
    </div>
  );
}

export function MilestonePath({
  milestones,
  next,
  onOpenMilestone,
  onContinue,
}: {
  milestones: Milestone[];
  next?: { milestoneId: string; courseId: string } | null;
  onOpenMilestone: (id: string) => void;
  onContinue: () => void;
}) {
  const totals = milestones.reduce(
    (acc, m) => {
      const c = courseCounts(m);
      return { total: acc.total + c.total, complete: acc.complete + c.complete };
    },
    { total: 0, complete: 0 },
  );
  const overall = totals.total ? Math.round((totals.complete / totals.total) * 100) : 0;
  const nextMilestone = next ? milestones.find((m) => m.id === next.milestoneId) : null;
  const nextCourse = nextMilestone
    ? nextMilestone.missions.flatMap((mi) => mi.modules).find((c) => c.id === next?.courseId)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      {/* Summary strip */}
      <div className="rounded-lg border border-brand-line bg-brand-surface px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink-soft">Your learning path</div>
            <div className="mt-3 text-[15px] font-semibold leading-snug text-brand-ink">
              {overall >= 100 && totals.total
                ? "Every course complete"
                : nextCourse
                  ? nextCourse.name
                  : "Your plan is being prepared"}
            </div>
            <div className="mt-3 max-w-xs">
              <div className="h-1 w-full overflow-hidden rounded-full bg-brand-line">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${overall}%`, backgroundColor: progressTone(overall) }}
                />
              </div>
            </div>
          </div>
          {nextCourse && (
            <Button
              type="button"
              onClick={onContinue}
              className="h-10 inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-brand-accent/20 bg-brand-surface/70 px-3 py-2 text-xs font-semibold text-brand-accent transition hover:bg-brand-surface sm:self-auto"
            >
              <PlayCircle size={14} /> Continue learning
            </Button>
          )}
        </div>
      </div>

      {/* Path */}
      <div className="relative mt-10">
        <div className="absolute left-[15px] top-2 bottom-2 hidden w-px bg-brand-line sm:block" />
        <div className="space-y-3">
          {milestones.map((m, i) => {
            const c = courseCounts(m);
            const complete = c.total > 0 && c.complete === c.total;
            return (
              <div key={m.id} className="relative flex gap-4">
                <div
                  className={`z-10 hidden h-8 w-8 shrink-0 self-center items-center justify-center rounded-full border-2 text-[11px] font-semibold sm:flex ${
                    m.locked
                      ? "border-brand-line bg-brand-surface text-brand-ink-soft"
                      : complete
                        ? "border-progress-high bg-progress-high text-brand-surface"
                        : "border-progress-mid bg-brand-surface text-progress-mid"
                  }`}
                >
                  {m.locked ? <Lock size={12} /> : complete ? <Check size={14} /> : m.order || i + 1}
                </div>

                <Button
                  type="button"
                  disabled={m.locked}
                  onClick={() => onOpenMilestone(m.id)}
                  variant="ghost"
                  className={`group h-auto min-w-0 flex-1 justify-start whitespace-normal p-0 overflow-hidden rounded-lg border text-left transition ${
                    m.locked
                      ? "cursor-not-allowed border-brand-line bg-learning-disabled hover:bg-learning-disabled disabled:opacity-100"
                      : "border-brand-line bg-brand-surface hover:bg-brand-surface hover:-translate-y-0.5 hover:border-brand-accent/40 hover:shadow-sm"
                  }`}
                >
                  <div className="flex w-full flex-col sm:flex-row">
                    <MilestoneVisual milestone={m} />

                  <div className="flex min-w-0 flex-1 flex-col p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                    <div className="min-w-0">
                      {m.locked ? (
                        <>
                        <div className="text-[13px] font-semibold leading-snug text-brand-ink-soft">{m.name}</div>
                        <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-ink-soft"><Lock size={12} />Locked</span>
                        </>
                      ) : (
                        <>
                          <div className="text-[13px] font-semibold leading-snug text-brand-ink">{m.name}</div>
                          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-brand-ink-soft">
                            {m.dueDate && <span className="font-semibold text-brand-ink-mid">Due {fmtDate(m.dueDate)}</span>}
                          </div>
                        </>
                      )}
                    </div>

                    {!m.locked && (
                      <div className="mt-3 flex items-center gap-3 sm:mt-0 sm:flex-1 sm:justify-end">
                        <div className="w-32 sm:w-40">
                          <div
                            className="mb-1.5 text-[10px] font-semibold"
                            style={{ color: progressTone(m.completionPercent) }}
                          >
                            {Math.max(c.total - c.complete, 0)} {Math.max(c.total - c.complete, 0) === 1 ? "course" : "courses"} pending
                          </div>
                          <Progress percent={m.completionPercent} />
                        </div>
                        <ChevronRight size={28} className="shrink-0 text-brand-ink-grey transition group-hover:text-brand-ink/50" />
                      </div>
                    )}
                  </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {!milestones.length && (
        <div className="mt-8 rounded-2xl border border-black/[0.07] bg-brand-surface px-6 py-10 text-center text-sm text-brand-ink/50">
          Your learning plan will appear here once it's assigned.
        </div>
      )}
    </div>
  );
}
