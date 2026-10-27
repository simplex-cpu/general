# Plan

Agreed direction and order of work. Tick items off as they're done, and add the date and who did it.

## Direction

**Claude does the creating. The app keeps the brand, the rules and the pipeline.**

- Clients and staff write scripts, design carousels and request video edits **in their own Claude**, through a Risevoice connector (an MCP server).
- The Risevoice **engine** gives Claude the brand brief and our writing guidelines. It checks what Claude sends back, then saves it to Airtable exactly as the app does today. Airtable and n8n carry on unchanged.
- The **app gets slimmer**:
  - It keeps the screens where people review, approve and track: Home, Planner, My Brand, Community, Growth Path.
  - The creation screens (Script, Viral Kit, design and editing forms) are retired one at a time, once each works well in Claude.

**Why:**
1. It's **simpler for us**. The creation screens are the biggest, hardest-to-control part of the code.
2. We **ride Claude's progress**. Every improvement in Claude's writing and design reaches our clients without us shipping anything.
3. It **saves AI credits**. The writing and design are paid for by the user's Claude plan.

**What it looks like:** the visual walk-throughs are private pages; ask the project owner for access.
- Real screenshots of today's app beside mock-ups of the same jobs done in Claude: https://claude.ai/artifact/ASpbp463f378MTUaKQyMGK
- How the pieces connect behind the scenes: https://claude.ai/artifact/QrzXzNKTQDmf2jquW7gmxv

### What happens to each screen

| Screen | Future |
|---|---|
| Home | Stays in the app |
| Planner | Stays in the app. Everything made in Claude lands here, labelled "Claude" |
| My Brand | Stays in the app. Claude also reads it |
| Community, Growth Path | Stays in the app |
| Script | Moves to Claude, then retired from the app |
| Carousel / graphic design | Moves to Claude, then retired from the app |
| Video editing request | Moves to Claude. The n8n editors still do the edit, and the result shows in the Planner |
| Viral Kit (Analyze, Inspo, Long-form clipper) | Moves to Claude. Scraping and transcription still run on our side |
| Divide scripts (staff) | Moves to Claude. This is the first pilot |
| Settings (prompts) | Stays. It becomes the source of the guidelines Claude follows |

### Who pays for what

- **The user's Claude plan:** all the thinking, writing, design and back-and-forth. So **MCP tools must never call our AI gateway** (`LOVABLE_API_KEY` / `ANTHROPIC_API_KEY`). They only read data and save results.
- **Us:**
  - video rendering (the n8n editors)
  - account scraping (Apify)
  - posting (Vista Social)
  - storage (Airtable, Drive) and hosting
- In-app credits (Stripe) are kept for these costs.

### Rules for the engine

- Each tool goes through the **same app endpoints** the screens use today, so the checks and Airtable writes stay in one place. Nothing is copied.
- Save tools **check what Claude sends before saving**, using the existing rules: slide fields, the caption contract, CTA rules and `video_edit` v1. Badly formed content goes back to Claude with the reason, and is never saved.
- Editing stays behind **one tool, `request_edit`**. Today it creates the "To Edit" record that n8n picks up. If Claude or another service can edit video later, only what's behind that tool changes.
- **Don't build for Claude features that don't exist yet.** Today Claude writes and designs. It doesn't render video.
- Our guidelines become **visible to users** through `get_writing_guidelines`. Decide which guidance is shared in full and which is summarised.

## Who does what

| Work | Who |
|---|---|
| Connect Lovable to GitHub, test access code, Cloudflare account | You |
| Build, test and deploy the connector (Step 3) | Claude Code |
| Move hard-coded prompts into Settings (Step 2) | Claude Code, as a pull request Lovable picks up |
| Screen changes: "Create with Claude" box, "Claude" label in the Planner | Lovable |
| Retiring screens and removing unused code (Step 6) | Claude Code, one pull request each |
| Writing and tuning the guidelines in Settings | You and the strategists |

**Rule:** Lovable and Claude Code never work on the same files at the same time. Lovable does screens; Claude Code does the connector, endpoints and clean-up.

## Timeline (compressed)

| When | What |
|---|---|
| Week 1 | GitHub connected. Connector built with the read tools and `save_to_planner`, tested on the test account |
| Week 2 | `request_edit` and comments added. Staff pilot starts. Prompts moved into Settings |
| Week 3 | Lovable adds the "Create with Claude" box and Planner label. Client pilot with 3–5 clients |
| After the pilot | Retire Script, then design, then Viral Kit, one at a time |

## Step 0: one source of truth

- [ ] Connect the Lovable project to GitHub (instructions in [README](../README.md#connecting-lovable-and-github)).
- [ ] Copy `README.md`, `CLAUDE.md` and `docs/` into the repository Lovable creates.
- [ ] Archive the old upload repository so nobody edits it by mistake.

## Step 1: map the app

- [x] `docs/APP_MAP.md`: screens, files, endpoints, data, and the editing pipeline.
- [x] `docs/PROMPTS.md`: where every prompt lives.
- [ ] Have someone who uses the app daily check the map for mistakes in naming.
- [ ] Turn on "Available in MCP" for the four "Video edits — … v3" n8n workflows, so their steps can be documented. This only allows reading them.

## Step 2: every writing prompt editable from Settings

- [ ] Move the hard-coded writing prompts listed in `docs/PROMPTS.md` (analysis, brand strategy, AI design, divide scripts, own-post repurpose, inspo, podcast clipping) into `src/lib/simplex/prompts.ts`, so they appear in Settings and are versioned in Airtable.
- [ ] Keep the current wording exactly. This step moves prompts; it doesn't change them.
- Done when: every prompt that shapes client-facing copy can be edited from Settings, and the tests pass. These prompts are what `get_writing_guidelines` hands to Claude in Step 3.

## Step 3: build the connector

**Shape (fastest route):**
- A **separate small program**, `risevoice-mcp`, hosted on Cloudflare Workers at its own address (for example `https://mcp.risevoice.app/mcp`). It lives in its own folder or repository, so Lovable never touches it and it never touches the app's screens.
- It **calls the app's existing endpoints** with the signed-in user's access code, exactly as if they'd clicked the button. So the access-code checks, ownership rules and Airtable writes are the ones already in use, and nothing is copied.
  - Brand brief: `/api/my-brief`
  - Guidelines: `/api/prompts`
  - Planner: `/api/dwy-client-content`
  - Edits: `/api/dwy-edit-yourself`, `/api/check-footage-link`
  - Comments: `/api/dwy-comments`
- **Sign-in:** when someone adds the connector in Claude, Claude opens a Risevoice page that asks for their access code (OAuth, which Claude connectors require). The connector remembers the code for that user.
- If a tool needs something the endpoints don't offer, add a small endpoint to the app, rather than putting Airtable logic in the connector.

**Tools, in build order:**
1. `list_my_brands`, `get_brand_brief`: brand voice, audience, colours, fonts.
2. `get_writing_guidelines(format)`: the Settings prompts and QA checklist for a format.
3. `list_planner`, `get_post`: read the Planner.
4. `save_to_planner(format, copy, captions, date)`: creates the same Client Content record the app creates.
5. `check_footage_link`, `request_edit(post, footage, hook, cta, style)`: creates the same Edit Yourself request, with Status "To Edit", that the Planner creates today.
6. `add_comment(post, text)`.
7. Later: `get_post_stats`, `analyze_account`, `find_inspo`.

- Done when: a test account goes from idea to a Planner post, and from footage link to an edited video, entirely through Claude, and the Airtable records match ones made in the app.

**Needed before building:**
- [ ] The live app address (the published Lovable URL or custom domain).
- [ ] A test client access code, with a test brand, in Airtable.
- [ ] A Cloudflare account to host the connector. The free plan is enough.

## Step 4: staff pilot

- [ ] Strategists use the connector for Divide scripts, scripting and planning.
- [ ] Track what goes wrong and tighten the guidelines and save checks.
- Done when: staff prefer Claude for scripting and the save checks catch every malformed result.

## Step 5: client pilot

- [ ] Invite a handful of friendly clients who already pay for Claude.
- [ ] Add a "Create with Claude" box in the app with set-up instructions.
- [ ] In the Planner, label posts made in Claude.
- Done when: pilot clients complete a full week of content through Claude without help.

## Step 6: slim the app

- [ ] Remove the code the app no longer shows (listed in `docs/APP_MAP.md` → "Code the app no longer shows"), after the team confirms "Request edits" isn't coming back.
- [ ] Retire the creation screens one at a time, each in its own pull request with tests passing. Script goes first, then carousel and graphic design, then Viral Kit. Keep each one until most clients create through Claude.
- [ ] After each removal, update `docs/APP_MAP.md`.

## Not doing

- **Splitting the very large screen files** (`ScriptMode.tsx`, 5,324 lines; `AnalyzeMode.tsx`, 2,260 lines). They're being retired, so we only fix bugs in them.
- **A full folder reorganisation.** Once Step 6 is done, the remaining app is small enough to group by feature (`src/features/planner/`, and so on) in one go.

## Open decisions

- Which guidelines are shared with Claude in full, and which are summarised?
- When does a client need a Claude plan? Is it optional at first, or required once Script is retired?
- How are in-app credits priced once AI writing no longer uses them?
