export type Course = {
  id: string;
  name: string;
  status: string;
  type: string;
  instructions: string;
  videoUrl: string;
  thumbnail: string;
  resources: { url: string; filename: string; type?: string }[];
  locked: boolean;
};

export type Mission = {
  id: string;
  name: string;
  order: number;
  status: string;
  notes: string;
  locked: boolean;
  modules: Course[];
};

export type Milestone = {
  id: string;
  name: string;
  order: number;
  overview: string;
  description?: string;
  goal?: string;
  dueDate: string;
  thumbnail: string;
  locked: boolean;
  completionPercent: number;
  missionsTotal: number;
  missionsCompleted: number;
  missions: Mission[];
};

export type LearningPayload = {
  milestones: Milestone[];
  next?: { milestoneId: string; courseId: string } | null;
};

export const done = (s: string) => /^completed$/i.test((s || "").trim());

export function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function courseCounts(m: Milestone) {
  const total = m.missions.reduce((n, mi) => n + mi.modules.length, 0);
  const complete = m.missions.reduce((n, mi) => n + mi.modules.filter((c) => done(c.status)).length, 0);
  return { total, complete };
}

/** Flat, ordered course list for a milestone with its step context. */
export function flatCourses(m: Milestone) {
  const out: { course: Course; mission: Mission; stepIndex: number; indexInStep: number }[] = [];
  m.missions.forEach((mi, s) => {
    mi.modules.forEach((c, i) => out.push({ course: c, mission: mi, stepIndex: s + 1, indexInStep: i }));
  });
  return out;
}
