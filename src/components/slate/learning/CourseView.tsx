import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileText, Loader2 } from "lucide-react";
import { done, flatCourses, type Milestone } from "./types";
import { LessonText } from "./LessonText";
import { StatusPill } from "./ui";

export function CourseView({
  milestone,
  courseId,
  onBackToMilestone,
  onOpenCourse,
  onComplete,
  completing,
  completeError,
}: {
  milestone: Milestone;
  courseId: string;
  onBackToMilestone: () => void;
  onOpenCourse: (id: string) => void;
  onComplete: (id: string) => void;
  completing: boolean;
  completeError?: string | null;
}) {
  const flat = flatCourses(milestone);
  const idx = flat.findIndex((f) => f.course.id === courseId);
  const entry = idx >= 0 ? flat[idx] : null;
  if (!entry) return null;
  const { course, mission, stepIndex } = entry;
  const prev = flat.slice(0, idx).reverse().find((f) => !f.course.locked);
  const next = flat.slice(idx + 1).find((f) => !f.course.locked);
  const inStep = mission.modules.findIndex((c) => c.id === course.id) + 1;
  const isDone = done(course.status);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10 sm:pb-28 md:px-8">
      <button
        type="button"
        onClick={onBackToMilestone}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#1A1A1D]/60 transition hover:text-[#1A1A1D]"
      >
        <ArrowLeft size={13} /> {milestone.name}
      </button>

      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F6BFF]">
        Step {stepIndex} · Course {inStep} of {mission.modules.length}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-semibold leading-tight text-[#1A1A1D]">{course.name}</h1>
        <StatusPill status={course.status} locked={course.locked} />
      </div>

      {course.videoUrl && (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-black shadow-[0_18px_45px_-28px_rgba(15,17,40,0.6)]">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              key={course.id}
              src={course.videoUrl}
              poster={course.thumbnail || undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-video h-auto w-full bg-black"
            />
          </div>
          <a
            href={course.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#1A1A1D]/45 hover:text-[#4F6BFF]"
          >
            Open in a new tab <ExternalLink size={11} />
          </a>
        </div>
      )}

      {course.instructions && (
        <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <LessonText text={course.instructions} />
        </div>
      )}

      {course.resources.length > 0 && (
        <div className="mt-6 rounded-2xl border border-black/[0.07] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-3 text-[13px] font-semibold text-[#1A1A1D]">Reference files</div>
          <div className="flex flex-col gap-2">
            {course.resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-[#4F6BFF] hover:underline"
              >
                <FileText size={14} /> {r.filename} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      )}

      {completeError && <div className="mt-4 text-xs text-red-600">{completeError}</div>}

      {/* Footer action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.07] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && onOpenCourse(prev.course.id)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1A1A1D]/60 transition hover:text-[#1A1A1D] disabled:opacity-35"
          >
            <ArrowLeft size={13} /> Previous
          </button>

          <div className="flex items-center gap-2">
            {isDone ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#22C55E]/10 px-4 py-2 text-[12px] font-semibold text-[#22C55E]">
                <CheckCircle2 size={14} /> Completed
              </span>
            ) : (
              <button
                type="button"
                disabled={completing}
                onClick={() => onComplete(course.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F6BFF] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#4560e6] disabled:opacity-60"
              >
                {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Mark as complete
              </button>
            )}
            <button
              type="button"
              disabled={!next}
              onClick={() => next && onOpenCourse(next.course.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.1] px-4 py-2.5 text-[12px] font-semibold text-[#1A1A1D] transition hover:border-[#4F6BFF]/40 hover:text-[#4F6BFF] disabled:opacity-35"
            >
              Next course <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
