# Learning tab: milestones and courses

A new tab called **Learning** after "Approve and Post", visible to client accounts only. It shows the client's milestones, and opening a milestone reveals the courses (training modules) they need to complete.

## What already exists in your records

Learning content is already fully modelled — nothing new needs to be created:

- **Client Milestones** — one set per client, with order, overview text, due date, thumbnail/logo, lock status (Locked / Unlocked) and a completion percentage.
- **Client Missions** — the steps inside each milestone (order, status Locked / Pending / In progress / Completed, notes).
- **Client Modules** — the actual courses: name, instructions (rich text), video link, thumbnail, reference resources, status.
- **Users** — links the client's milestones, missions and modules together; access codes link to a Brand, which links to the User record.

So the work is a read layer, plus one small write for marking a course complete.

## What users will see

1. **Milestone list** — cards in order, each with thumbnail, name, due date and a progress bar. Locked milestones appear greyed out with a lock badge and can't be opened.
2. **Milestone detail** — the milestone overview, then its missions in order, each listing its courses.
3. **Course view** — the training video, the written instructions, any reference files, and a "Mark as complete" button.
4. Marking a course complete updates progress immediately, and the milestone/mission progress reflects it on refresh.

## Backend changes

All against the existing Airtable base `appf1QABtQbAENYDz`; no database migration needed.

1. `src/lib/learning.server.ts`
   - `resolveUserRecordId(accessRecord)` — read `Users (from Brand)` off the access-code record (fallback: look up the Brand record's Users link).
   - Table/field id constants for Client Milestones (`tbllbW1O2vKSuDte9`), Client Missions (`tblwoAevAwDzLOFe7`), Client Modules (`tblWhRzSz1Ieiy3tF`).
   - Normalisers that map raw fields to lean client-safe shapes (strip Airtable noise via the existing `toText` / `toNumber` helpers, keep only the first thumbnail URL, keep completion percent as a number).

2. `GET /api/learning` (`src/routes/api/learning.ts`)
   - Guarded by `requireAccessCode` on the `x-access-code` header, same pattern as `/api/my-brief`.
   - Resolves the caller's User record, then fetches that user's milestones (sorted by Milestone Order), their missions, and their modules in three filtered queries — never a whole-table scan.
   - Returns a single nested payload: `milestones[] -> missions[] -> modules[]`, each with status, order, lock state and completion.
   - Locked items are returned with content withheld (name, thumbnail, lock flag only) so locked material can be shown greyed out without leaking it.

3. `POST /api/learning/module-status` (`src/routes/api/learning.module-status.ts`)
   - Guarded the same way. Body: `{ moduleId, status: "In progress" | "Completed" }`.
   - Verifies the module's `User` link matches the caller's User record before patching — a client can never update someone else's module.
   - PATCHes only the `Status` field, then returns the refreshed module plus its milestone's new completion.

4. Attachment/video URLs from Airtable expire, so they are always read fresh on each `GET /api/learning` request and never cached client-side beyond the session.

## Frontend changes

- `ModeTabs.tsx` — add a `learning` mode after `approve-post`, shown only when the signed-in account is a client (same gating already used for the Brand Info tab).
- `SlateApp.tsx` — render the new mode; block staff/admin from selecting it.
- New `src/components/slate/LearningMode.tsx` plus small `MilestoneCard` / `CourseCard` pieces, using the existing indigo sub-tab and container styling. Data is loaded with TanStack Query so completing a course refetches progress.

## Notes

- Locked milestones and courses are shown greyed out with a lock badge, per your choice.
- Missions aren't marked complete directly by the client in this first pass; mission and milestone progress is derived from the courses inside them, which is how your records already calculate it. If you'd also like a "mark mission complete" button, that's a small follow-up.
