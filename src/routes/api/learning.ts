import { createFileRoute } from "@tanstack/react-router";
import { requireAccessCode } from "@/lib/accessCode.server";
import {
  airtableHeaders,
  attachments,
  fetchByIds,
  fetchUserRecord,
  firstAttachmentUrl,
  firstUrl,
  isCompleted,
  isLocked,
  num,
  resolveUserRecordId,
  selectAll,
  str,
  T_MILESTONES,
  T_MISSIONS,
  T_MODULES,
  T_TEMPLATES,
  type LearningMilestone,
  type LearningMission,
  type LearningModule,
} from "@/lib/learning.server";

export const Route = createFileRoute("/api/learning")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const h = airtableHeaders();
        if (!h) return Response.json({ error: "Server misconfigured" }, { status: 500 });

        const auth = await requireAccessCode(request.headers.get("x-access-code") || "");
        if (!auth.ok) return auth.response;

        try {
          const userId = await resolveUserRecordId(auth.record, h);
          if (!userId) return Response.json({ milestones: [] });

          // Linked-record fields can't be filtered by record id in Airtable formulas,
          // so read the milestone table and keep the caller's own rows.
          const allMilestones = await selectAll(T_MILESTONES, h);
          let milestoneRecs = allMilestones.filter((m) =>
            (Array.isArray(m.fields.User) ? m.fields.User : []).includes(userId),
          );

          if (!milestoneRecs.length) {
            const user = await fetchUserRecord(userId, h);
            const linked: string[] = Array.isArray(user?.["Client Milestones"]) ? user!["Client Milestones"] : [];
            milestoneRecs = linked.length ? await fetchByIds(T_MILESTONES, linked, h) : [];
          }
          if (!milestoneRecs.length) return Response.json({ milestones: [] });

          const missionIds = milestoneRecs.flatMap((m) =>
            Array.isArray(m.fields["Client Missions"]) ? m.fields["Client Missions"] : [],
          );
          const missionRecs = missionIds.length ? await fetchByIds(T_MISSIONS, missionIds, h) : [];

          const moduleIds = missionRecs.flatMap((m) =>
            Array.isArray(m.fields["Client Modules"]) ? m.fields["Client Modules"] : [],
          );
          const moduleRecs = moduleIds.length ? await fetchByIds(T_MODULES, moduleIds, h) : [];

          const templateIds = moduleRecs.flatMap((m) =>
            Array.isArray(m.fields["Resources"]) ? m.fields["Resources"] : [],
          );
          const templateRecs = templateIds.length ? await fetchByIds(T_TEMPLATES, templateIds, h) : [];
          const templateById = new Map(templateRecs.map((r) => [r.id, r]));

          const moduleById = new Map(moduleRecs.map((r) => [r.id, r]));
          const missionById = new Map(missionRecs.map((r) => [r.id, r]));

          const milestones: LearningMilestone[] = milestoneRecs
            .map((mRec) => {
              const f = mRec.fields;
              const locked = isLocked(str(f["Lock status"]));

              const missions: LearningMission[] = (Array.isArray(f["Client Missions"]) ? f["Client Missions"] : [])
                .map((id: string) => missionById.get(id))
                .filter(Boolean)
                .map((rec: any) => {
                  const mf = rec.fields;
                  const missionLocked = locked || isLocked(str(mf.Status));
                  const modules: LearningModule[] = (Array.isArray(mf["Client Modules"]) ? mf["Client Modules"] : [])
                    .map((id: string) => moduleById.get(id))
                    .filter(Boolean)
                    .map((mod: any) => {
                      const df = mod.fields;
                      const tpl = (Array.isArray(df.Resources) ? df.Resources : [])
                        .map((id: string) => templateById.get(id))
                        .filter(Boolean)[0] as any | undefined;
                      const modLocked = missionLocked || isLocked(str(df.Status));
                      const base = {
                        id: mod.id,
                        name: str(df["Modules Name"]) || "Untitled course",
                        status: str(df.Status) || "Pending",
                        type: str(df.Type),
                        thumbnail: firstAttachmentUrl(df.Thumbnail),
                        locked: modLocked,
                      };
                      // Locked courses expose no content.
                      if (modLocked) {
                        return { ...base, instructions: "", videoUrl: "", resources: [], sortKey: num(tpl?.fields?.["Module number"]) } as LearningModule;
                      }
                      return {
                        ...base,
                        instructions: str(df.Instructions),
                        videoUrl: firstUrl(df["Action Link"]) || firstUrl(tpl?.fields?.["Video File"]),
                        resources: attachments(tpl?.fields?.["Reference files"]),
                        sortKey: num(tpl?.fields?.["Module number"]) || num(df["Milestone #"]),
                      } as LearningModule;
                    })
                    .sort(
                      (a: LearningModule, b: LearningModule) =>
                        (a.sortKey || 0) - (b.sortKey || 0) || a.name.localeCompare(b.name),
                    );

                  return {
                    id: rec.id,
                    name: str(mf["Mission Name"]) || "Untitled mission",
                    order: num(mf["Mission order"]),
                    status: str(mf.Status) || "Pending",
                    notes: missionLocked ? "" : str(mf.Notes),
                    locked: missionLocked,
                    modules,
                  } as LearningMission;
                })
                .sort((a, b) => a.order - b.order);

              const missionsCompleted = missions.filter((m) => isCompleted(m.status)).length;
              const totalModules = missions.reduce((n, m) => n + m.modules.length, 0);
              const doneModules = missions.reduce(
                (n, m) => n + m.modules.filter((c) => isCompleted(c.status)).length,
                0,
              );
              const percent = totalModules
                ? Math.round((doneModules / totalModules) * 100)
                : missions.length
                  ? Math.round((missionsCompleted / missions.length) * 100)
                  : num(f["Milestone Completion (% only)"]);

              return {
                id: mRec.id,
                name: str(f.Milestone) || "Untitled milestone",
                order: num(f["Milestone Order"]),
                overview: locked ? "" : str(f["Milestone Overview"]),
                description: locked ? "" : str(f["Milestone Description"]),
                goal: locked ? "" : str(f["Milestone Goal"]),
                dueDate: str(f["Milestone Due Date"]),
                thumbnail: firstAttachmentUrl(f["Milestone Thumbnail"]),
                locked,
                completionPercent: percent,
                missionsTotal: missions.length,
                missionsCompleted,
                missions,
              } as LearningMilestone;
            })
            .sort((a, b) => a.order - b.order);

          // First unlocked, unfinished course across the whole path.
          let next: { milestoneId: string; courseId: string } | null = null;
          for (const ms of milestones) {
            if (ms.locked) continue;
            for (const mi of ms.missions) {
              if (mi.locked) continue;
              const c = mi.modules.find((m) => !m.locked && !isCompleted(m.status));
              if (c) {
                next = { milestoneId: ms.id, courseId: c.id };
                break;
              }
            }
            if (next) break;
          }

          return Response.json({ milestones, next });
        } catch (e: any) {
          console.error("[learning] read failed", e?.message || e);
          return Response.json({ error: String(e?.message || e) }, { status: 502 });
        }
      },
    },
  },
} as any);
