# App map

Which files belong to which part of the RiseVoice app. Read this before changing anything.

## How the app is put together

```
Browser (what users see)                 Server (runs on Cloudflare)              Outside services
src/components/slate/*Mode.tsx  ──────►  src/routes/api/*.ts  ──────────────►   Airtable (all business data)
  one file per screen                      one file per action                    AI gateway (Lovable)
  calls /api/<name>                        checks the access code first           Apify, Google Drive, Slack,
                                           shared rules live in src/lib/          Zernio / VistaSocial, Stripe
                                                                                  Supabase (a few job/community tables)
```

- A **screen** never talks to Airtable or the AI directly. It calls an **endpoint** (`/api/<name>`), and the endpoint does the work.
- The endpoint file name is the URL. `src/routes/api/hooks.ts` answers `/api/hooks`.
- **n8n is never called by the app.** The app writes or changes an Airtable record (for example, it sets a status like "To Edit"), and your n8n automations react to that. The only way back in is `src/routes/api/public/podcast-scripts-callback.ts`, where n8n posts finished podcast scripts.

## Screens

The menu label is what users see. The code name is what the code calls it (see `src/components/slate/ModeTabs.tsx`). All screen files are in `src/components/slate/` unless a path is given.

| Menu label | Code name | Who sees it | Screen file(s) | Endpoints it calls (`src/routes/api/`) |
|---|---|---|---|---|
| Home | `learning` | Clients | `HomeMode.tsx`, `HomePostsFeedModal.tsx` | `dwy-client-content`, `home-refresh-stats`, `post-repurpose` |
| Growth Path | `growth` | Clients (marked "coming soon") | `LearningMode.tsx`, `learning/*` | `learning`, `learning.module-status`, `team-chat` |
| Community | `community` | Everyone | `CommunityMode.tsx`, `CommunityProfileDialog.tsx` | none (reads Supabase via `src/lib/community.functions.ts`) |
| My Brand | `brief` | Clients | `MyBrandsMode.tsx`, `BriefMode.tsx`, `VisualStylePanel.tsx` | `my-brief`, `social-connect` |
| Viral Kit (menu page) | `viral-kit` | Everyone | `ViralKitMode.tsx` | none, it only links to the three tools below |
| Viral Kit → Analyze account | `analyze` | Everyone | `AnalyzeMode.tsx`, `StrategyStrip.tsx` | `scrape-posts`, `analyse`, `analysis-report`, `brand-strategy`, `brand-guidance`, `my-brief` |
| Viral Kit → Inspo Bank | `inspo` | Everyone | `InspoBankMode.tsx` | `inspo-bank`, `inspo-find`, `inspo-read`, `inspo-repurpose` |
| Viral Kit → Long-form clipper | `clipper` | Everyone | `LongFormClipperMode.tsx` | `long-forms`, `short-forms`, `podcast-script-jobs`, `send-to-production` |
| Script | `script` | Everyone | `ScriptMode.tsx`, `ScriptRail.tsx`, `chat/*` | `topics`, `hooks`, `script`, `captions`, `writer-sessions`, `client-session-brief`, `consume-credit`, `send-to-production`, `create-google-doc`, `dwy-assignees` (staff also: `admin-brand-context`, `brand-brief`, `list-brands`, `list-airtable-collaborators`, `notify-edit-design`) |
| Divide scripts | `divide` | Staff only | `DivideScriptsMode.tsx` | `divide-scripts.prepare`, `divide-scripts.section`, `send-to-production`, `notify-edit-design`, `list-brands`, `list-airtable-collaborators` |
| Planner | `approve-post` | Everyone | `ApproveAndPostMode.tsx`, `CommentsPanel.tsx`, `BrandSelect.tsx`, `CarouselCopyEditor.tsx`, `Teleprompter.tsx`, `post/*` | `dwy-client-content`, `dwy-comments`, `dwy-content-upload`, `dwy-edit-yourself`, `post-accounts`, `ai-design` (one-click carousel design, through `src/lib/slate/aiDesignJobs.ts`), `drive-upload-*` (through `src/lib/driveDirectUpload.ts`) |
| Planner → Produce / edit a post | (pop-up inside Planner) | Clients | `ProduceReviewModal.tsx`, `VideoProductionWorkspace.tsx`, `DesignPreview.tsx`, `VisualStylePanel.tsx` | `dwy-client-content`, `dwy-content-upload`, `dwy-edit-yourself`, `check-footage-link`, `ai-design`, `my-brief` |
| My account (side panel) | — | Everyone | `AccountRail.tsx` | `account-avatar` |
| Settings (gear icon) | — | Staff only | `src/components/simplex/SettingsModal.tsx` | `prompts` |
| Login | — | Everyone | `src/components/simplex/ClientGate.tsx` | `validate-code` |

The whole app shell (menu + which screen is showing) is `src/components/slate/SlateApp.tsx`.

## Code the app no longer shows

These files exist but no screen opens them. Confirm with the team before deleting; deleting them makes the codebase about 3,000 lines smaller.

| File(s) | Lines | Notes |
|---|---|---|
| `DesignAndEditMode.tsx`, `EditYourselfMode.tsx`, `RequestEditsMode.tsx` | 93 + 1,709 + 572 | The old standalone "Design & Edit" screen. Code name `design-edit` is still listed in `ModeTabs.tsx` but never displayed. Editing now happens in Planner → Produce. Only `LaneTabs` from `DesignAndEditMode.tsx` is used elsewhere, by the two files on this row. The `creative-requests` endpoint is only used here, so "Request edits" can't currently be reached in the app. |
| `src/components/simplex/CarouselPreview.tsx`, `UploadBar.tsx` | 481 + 99 | Not used anywhere |
| `src/components/slate/Header.tsx`, `Footer.tsx` | 44 + 31 | Not used anywhere |
| `src/lib/airtable.server.ts`, `src/lib/vistasocial.server.ts` | 106 + 100 | Not used anywhere |

Several files in `src/components/ui/` are also unused. That's normal: it's a ready-made kit, and unused pieces cost nothing.

## How editing and design work

**Video (B-roll, Talking Video, and both "from long form" versions):**
1. In Planner → Produce, the client adds footage (a Drive link or an upload), a hook, a CTA and a style.
2. `src/routes/api/dwy-edit-yourself.ts` saves **one** record in Airtable **Edit Yourself requests** (`tblS69GyGj3tpioTo`).
   - The full request goes in the **Editing preferences** field as a `video_edit` version 1 snapshot, built by `src/lib/slate/videoEditInput.ts`.
   - Then it sets **Status = To Edit**.
3. An **Airtable automation** sees "To Edit" and calls the n8n webhook `edityourself-auto-caption`. That's the n8n workflow **"Edit Yourself v2"**. An older `talkingvideo` webhook, the n8n workflow **"Talking Video"**, does the same job for Talking Video only.
4. Those two workflows are just **routers**. They read the record, check it's still "To Edit", and pass it to one of four editors:
   - `broll-v3`: n8n workflow "Video edits — BROLL v3"
   - `talking-video-v3`: n8n workflow "Video edits — Talking Video v3"
   - `long-form-clip-v1`: n8n workflow "Video edits — Talking video from long form v3"
   - `broll-from-long-form-v1`: n8n workflow "Video edits — B-roll from long form v3"
   - "Video edits — render completion and recovery v3" finishes the renders.
5. The editor renders the video, saves it to Drive, and writes it back to Client Content.
   - The request status then moves through Editing → Edited, or Error.
   - The post's Client Status moves to Approve.

**Carousels and graphics:**
- **One-click AI design** happens inside the app, not in n8n. `src/routes/api/ai-design.ts` asks Claude for slide designs and checks them (`src/lib/slate/aiDesign.ts`).
- **Done-for-you design** sets the status to **"To Edit | Design"**. `notify-edit-design.ts` posts a Slack message, and the design team does the work by hand.

**Posting:** the n8n workflow "Posting Automation" is triggered by an Airtable webhook. It schedules the post in Vista Social and writes the status back to the record.

**Rule:** the app never calls n8n directly. To change *what* gets edited, change the saved request. To change *how* it's edited, change the n8n editors.

## Who sees what

- Users log in with an **access code**, which is stored in the Airtable **Access codes** table.
- Its **User type** decides the edition (`src/lib/slate/edition.ts`):
  - Admin or strategist → **Agency V1** (staff).
  - Anyone else → **Creators V1** (clients).
- Every endpoint re-checks the code with `requireAccessCode` in `src/lib/accessCode.server.ts`.
- Data ownership (which posts and brands a user may touch) goes through `src/lib/owner.server.ts`.

## Folders

| Folder | What it holds | Edit it? |
|---|---|---|
| `src/components/slate/` | All app screens and their pieces | Yes, this is the app |
| `src/components/simplex/` | Login, Settings, staff brand-brief tools | Yes |
| `src/components/ui/` | Generic building blocks (buttons, dialogs, menus) from the shadcn/ui library | Rarely. They're shared by everything |
| `src/components/ai-elements/` | Generic chat building blocks | Rarely |
| `src/routes/api/` | Server endpoints, one per action | Yes |
| `src/routes/api/public/` | Endpoints called by outside services (n8n, Stripe). Each one checks its own secret | Carefully |
| `src/lib/` | Server-side helpers (`*.server.ts`) for Airtable, AI, ownership, and so on | Yes |
| `src/lib/slate/` | Shared rules used by both screens and server (formats, CTAs, slides, captions) | Yes. Each rule has a matching `*.test.ts` check |
| `src/lib/simplex/prompts.ts` | Default AI writing prompts. See [PROMPTS.md](PROMPTS.md) | Yes |
| `src/integrations/supabase/` | Supabase connection | Rarely |
| `drizzle/`, `supabase/` | Database change history (migrations) | Only through a migration |
| `src/routeTree.gen.ts` | **Generated automatically.** Never edit by hand | No |
| `public/` | Images and logos | Yes |
| `.lovable/plan/` | Lovable's own notes on recent redesigns | Reference only |

## Where data lives

**Airtable: DWY System base (`appf1QABtQbAENYDz`).** This is the main base for clients.

| Table | ID | Used for |
|---|---|---|
| Access codes | `tbl1Sc1qn5MhXc0Ta` | Logins, user type, credits |
| Brands | `tblho1mwlIMZfozue` | Client brands |
| Brand briefs | `tblkV5xOB2D1N5dNH` | My Brand answers, visual style |
| Users | `tblO9nM6xTdzJyyax` | People, used for ownership |
| Client Content | `tblucGgVsDiDGdyyK` | Planner posts, production status (drives n8n) |
| Edit Yourself requests | `tblS69GyGj3tpioTo` | DIY video edits (drives n8n) |
| Video requests | `tblg9GFFeGNrRvDQN` | Request edits |
| Chat sessions | `tblaPsRyOuniu1iYb` | Script history (one record per session) |
| Comments | `tblYoXhOiVQpqc9tX` | Planner comments |
| Long forms / Short forms | `tbl5WoHbjjmvgK2wn` / `tbloy1o3zhZOgKSCJ` | Long-form clipper |
| Inspo Bank | `tblPwEu3sRyarNWfc` | Saved inspiration |
| Milestones, Missions, Modules, Module Templates, Chat | `tbllbW1O2vKSuDte9`, `tblwoAevAwDzLOFe7`, `tblWhRzSz1Ieiy3tF`, `tblsrerLkCsKUKmVO`, `tblRR82prmL9pbBuX` | Growth Path and team chat |

**Airtable: Rise Voice base (`appOttHso6hYjBXhw`).** Staff tools use this base. It is slated to move into DWY.

| Table | ID | Used for |
|---|---|---|
| Prompt Versions | `tblKsQU7L5Vq313d0` | Every saved version of the AI prompts |
| Client Admin | `tblPm4VFwe6nTaYj4` | Staff brand list |
| Content | `tblQHZQtxSzkeqsCQ` | Staff production content |
| Team Roster | `tblu7ZGCkLPA9x1cp` | "Creative assigned" picker |

**Supabase.** These tables are only for jobs and community: `community_posts`, `community_comments`, `community_reactions`, `podcast_script_jobs`, `podcast_unmatched_events`, `long_form_operations`, `content_scrape_jobs`, `own_post_ai_access_blocks`.

## Secrets the server needs

These are set in Lovable Cloud (or the hosting dashboard), never in the code. Names only:

`AIRTABLE_TOKEN`, `AIRTABLE_API_KEY`, `AIRTABLE_CONTENT_URL`, `LOVABLE_API_KEY`, `ANTHROPIC_API_KEY`, `APIFY_API_TOKEN`, `GOOGLE_DRIVE_API_KEY`, `GOOGLE_DRIVE_SHARED_FOLDER_ID`, `GOOGLE_DOCS_API_KEY`, `SLACK_BOT_TOKEN`, `STRIPE_WEBHOOK_SECRET`, `VISTASOCIAL_API_KEY`, `UDC_ZERNIO_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The browser build also needs the `VITE_SUPABASE_*` values from `.env`.

## Glossary

| Word in the code | Means |
|---|---|
| Slate, Simplex | Old internal names for this app |
| Mode | A screen |
| DWY / DFY / DIY | Done-with-you / done-for-you / do-it-yourself service levels |
| Edition: Agency V1 / Creators V1 | Staff app / client app |
| Writer session | One Script-tab conversation, saved in "Chat sessions" |
| Envelope | The fixed wrapper every scripting prompt is sent in (`src/lib/slate/envelope.ts`) |
| Talking / B-roll / Carousel / Graphic | The four content formats |
| Inspo | Inspiration posts from other creators |
