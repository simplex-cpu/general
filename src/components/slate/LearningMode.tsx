import { SectionHeader } from "./SectionHeader";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CourseView } from "./learning/CourseView";
import { MilestoneDetail } from "./learning/MilestoneDetail";
import { MilestonePath } from "./learning/MilestonePath";
import { learningQueryOptions } from "@/lib/slate/learningQuery";
export type LearningTarget = { milestoneId: string; courseId: string };

function LearningPath({ accessCode, initialTarget, scrollContainerRef }: { accessCode: string; initialTarget?: LearningTarget | null; scrollContainerRef: RefObject<HTMLDivElement | null> }) {
  const qc = useQueryClient();
  const [openMilestone, setOpenMilestone] = useState<string | null>(initialTarget?.milestoneId || null);
  const [openCourse, setOpenCourse] = useState<string | null>(initialTarget?.courseId || null);
  const appliedTarget = useRef<string | null>(null);


  const { data, isLoading, error } = useQuery(learningQueryOptions(accessCode));

  useEffect(() => {
    if (!initialTarget || !data || appliedTarget.current === initialTarget.courseId) return;
    const milestone = data.milestones.find((item) => item.id === initialTarget.milestoneId && !item.locked);
    const course = milestone?.missions.filter((mission) => !mission.locked).flatMap((mission) => mission.modules).find((item) => item.id === initialTarget.courseId && !item.locked);
    appliedTarget.current = initialTarget.courseId;
    if (milestone && course) { setOpenMilestone(milestone.id); setOpenCourse(course.id); }
    else { setOpenMilestone(null); setOpenCourse(null); }
  }, [initialTarget, data]);

  const setStatus = async (moduleId: string, status: "In progress" | "Completed") => {
    const res = await fetch("/api/learning/module-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-access-code": accessCode },
      body: JSON.stringify({ moduleId, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Could not update this course");
    return json;
  };

  const complete = useMutation({
    mutationFn: async ({ moduleId, status }: { moduleId: string; status: "In progress" | "Completed" }) =>
      setStatus(moduleId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learning", accessCode] }),
  });

  const bulk = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "In progress" | "Completed" }) => {
      for (const id of ids) await setStatus(id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learning", accessCode] }),
  });


  const milestones = data?.milestones || [];
  const milestone = useMemo(
    () => milestones.find((m) => m.id === openMilestone) || null,
    [milestones, openMilestone],
  );

  // Keep the view valid if data refreshes and a course disappears.
  useEffect(() => {
    if (!openCourse || !milestone) return;
    const exists = milestone.missions.some((mi) => mi.modules.some((c) => c.id === openCourse));
    if (!exists) setOpenCourse(null);
  }, [milestone, openCourse]);

  // Scroll to top when the view changes.
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [openMilestone, openCourse, scrollContainerRef]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 md:px-8">
        <div className="flex items-center gap-2 text-sm text-[#1A1A1D]/60">
          <Loader2 size={14} className="animate-spin" /> Loading your learning plan…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 md:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(error as Error).message}
        </div>
      </div>
    );
  }

  if (milestone && openCourse) {
    return (
      <CourseView
        milestone={milestone}
        courseId={openCourse}
        onBackToMilestone={() => setOpenCourse(null)}
        onOpenCourse={(id) => setOpenCourse(id)}
        onComplete={(id) => complete.mutate({ moduleId: id, status: "Completed" })}
        completing={complete.isPending}
        completeError={complete.error ? (complete.error as Error).message : null}
      />
    );
  }

  if (milestone) {
    return (
      <MilestoneDetail
        scrollContainerRef={scrollContainerRef}
        milestone={milestone}
        onBack={() => setOpenMilestone(null)}
        onOpenCourse={(id) => setOpenCourse(id)}
        onSetStatus={(ids, status) => bulk.mutateAsync({ ids, status })}
        statusPending={bulk.isPending}
        statusError={bulk.error ? (bulk.error as Error).message : null}
      />
    );
  }


  return (
    <MilestonePath
      milestones={milestones}
      next={data?.next}
      onOpenMilestone={(id) => {
        setOpenCourse(null);
        setOpenMilestone(id);
      }}
      onContinue={() => {
        if (!data?.next) return;
        setOpenMilestone(data.next.milestoneId);
        setOpenCourse(data.next.courseId);
      }}
    />
  );
}

export function LearningMode({ accessCode, initialTarget }: { accessCode: string; initialTarget?: LearningTarget | null }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="group/learn flex h-full min-h-0 flex-col bg-social-feed text-brand-ink">
      <SectionHeader title="Growth Path" className="bg-social-feed group-has-[[data-milestone-header]]/learn:bg-brand-surface" />
      <div ref={scrollContainerRef} data-learning-scroll className="min-h-0 flex-1 overflow-y-auto bg-social-feed">
        <LearningPath accessCode={accessCode} initialTarget={initialTarget} scrollContainerRef={scrollContainerRef} />
      </div>
    </div>
  );
}

