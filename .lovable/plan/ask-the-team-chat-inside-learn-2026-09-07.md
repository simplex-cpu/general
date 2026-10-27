# Ask the team: chat inside Learn

Add two sub-tabs under **Learn**:

- **Milestones** — the existing learning path, unchanged.
- **Ask the team** — a new chat room where the client talks to their strategist and creative team.

## How the chat behaves

- One shared room per client. Three voices only: **Me**, **My strategist**, **My creative team**. No real names anywhere.
- Newest messages at the bottom, grouped by day, with time stamps.
- Client types in a box at the bottom and hits send; the message appears immediately.
- The room refreshes itself every ~10 seconds while open, so replies show up without reloading.
- Text only for now (no file attachments).
- Empty room shows a short prompt: ask about your strategy, scripts, edits or designs.
- Unread cue: a small indigo dot on the "Ask the team" tab when there are messages the client hasn't seen yet (tracked per client in this browser).

## Where messages live

A new **Client Chat** table in the same base as the learning data, with fields:

- `Message` (long text)
- `Sender` (single select: `Client`, `Strategist`, `Creative team`)
- `User` (link to the users table — who the room belongs to)
- `Created` (created time)

The strategist and creative team reply by adding rows in that table and picking their sender. The app maps `Strategist` → "My strategist", `Creative team` → "My creative team", `Client` → "Me".

## Technical section

- Airtable: create table `Client Chat` in base `appf1QABtQbAENYDz` (same base as Client Milestones) with the fields above, linked to the users table `tblO9nM6xTdzJyyax`.
- New route `src/routes/api/team-chat.ts`:
  - `GET` — validates `x-access-code` via `requireAccessCode`, resolves the caller's user record id with the existing `resolveUserRecordId` helper from `learning.server.ts`, lists rows whose `User` link contains that id, sorted by `Created` ascending, returns `{ items: [{ id, text, sender, createdAt }] }`.
  - `POST` — same auth, body `{ text }` (trimmed, max ~4000 chars, non-empty), creates a row with `Sender: "Client"` and the caller's user link; returns the created message.
  - Server-side filtering by the caller's own user id only, so no cross-client reads. Reuses the existing Airtable token pattern (`AIRTABLE_TOKEN`).
- New `src/lib/teamChat.server.ts` for the table/field constants and row mapping.
- New `src/components/slate/learning/TeamChat.tsx`: TanStack Query `useQuery` with `refetchInterval: 10000`, `useMutation` for send with optimistic append + invalidate, auto-scroll on new messages, loading/error states, disabled send while pending.
- `src/components/slate/LearningMode.tsx`: add local sub-tab state (`milestones` | `ask`) and render the sub-tab bar above the content, reusing the compact squared segmented-tab styling already used for audit scope / visual style selectors. Milestones content path stays exactly as-is.
- Message bubbles reuse the existing chat look: client messages right-aligned in indigo `#4F6BFF`; team messages left-aligned on white with a hairline border and a small role label ("My strategist" / "My creative team") above the first message in a run.
- Unread dot: store last-seen message id/timestamp in `localStorage` keyed by access code, read behind a hydration-safe effect.
- Verify with `bunx tsgo --noEmit` and a signed-in browser check of send + reload.
