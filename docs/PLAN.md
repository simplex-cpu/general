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

- Each tool reuses the **same server code** the screens use today. Shared logic is moved out of the endpoint files where needed; nothing is copied.
- Save tools **check what Claude sends before saving**, using the existing rules: slide fields, the caption contract, CTA rules and `video_edit` v1. Badly formed content goes back to Claude with the reason, and is never saved.
- Editing stays behind **one tool, `request_edit`**. Today it creates the "To Edit" record that n8n picks up. If Claude or another service can edit video later, only what's behind that tool changes.
- **Don't build for Claude features that don't exist yet.** Today Claude writes and designs. It doesn't render video.
- Our guidelines become **visible to users** through `get_writing_guidelines`. Decide which guidance is shared in full and which is summarised.

## Step 0: one source of truth

- [ ] Connect the Lovable project to GitHub (instructions in [README](../README.md#connecting-lovable-and-github)).
- [ ] Copy `README.md`, `CLAUDE.md` and `docs/` into the repository Lovable creates.
- [ ] Archive the old upload repository so nobody edits it by mistake.

## Step 1: map the app

- [x] `docs/APP_MAP.md`: screens, files, endpoints, data, and the editing pipeline.
- [x] `docs/PROMPTS.md`: where every prompt lives.
- [ ] Have someone who uses the app daily check the map for mistakes in naming.
- [ ] Turn on "Available in MCP" for the four "Video edits — … v3" n8n workflows, so their steps can be documented. This only allows reading them.

## Step 2: know the costs

- [ ] Pull one month of bills and split them:
  - AI gateway (Lovable, and Anthropic if paid directly)
  - video rendering
  - Apify
  - Vista Social
  - hosting
- Done when: we know what share of spend is AI writing and design (which moves to the user's Claude) and what share stays ours. This sets expectations for the savings.

## Step 3: every writing prompt editable from Settings

- [ ] Move the hard-coded writing prompts listed in `docs/PROMPTS.md` (analysis, brand strategy, AI design, divide scripts, own-post repurpose, inspo, podcast clipping) into `src/lib/simplex/prompts.ts`, so they appear in Settings and are versioned in Airtable.
- [ ] Keep the current wording exactly. This step moves prompts; it doesn't change them.
- Done when: every prompt that shapes client-facing copy can be edited from Settings, and the tests pass. These prompts are what `get_writing_guidelines` hands to Claude in Step 4.

## Step 4: build the engine and the connector

**Shape:**
- A new folder, `src/mcp/`, and one endpoint (`/mcp`) on the same Cloudflare app.
- Sign-in is OAuth, which Claude connectors require. Users log in with their existing access code, and the same ownership rules apply (`src/lib/owner.server.ts`).
- Nothing in the existing screens changes in this step.

**Tools, in build order:**
1. `list_my_brands`, `get_brand_brief`: brand voice, audience, colours, fonts.
2. `get_writing_guidelines(format)`: the Settings prompts and QA checklist for a format.
3. `list_planner`, `get_post`: read the Planner.
4. `save_to_planner(format, copy, captions, date)`: creates the Client Content record exactly like Script → Send to production.
5. `check_footage_link`, `request_edit(post, footage, hook, cta, style)`: creates the same Edit Yourself request, with Status "To Edit", that the Planner creates today.
6. `get_recent_posts`, `get_post_stats`: what's been posted and how it performed.
7. `add_comment(post, text)`.
8. Later: `analyze_account` and `find_inspo`. These run our scraping and return the data for Claude to interpret.

- Done when: a test account can go from idea to a Planner post, and from footage link to an edited video, entirely through Claude, and the records look identical to ones made in the app.

## Step 5: staff pilot

- [ ] Strategists use the connector for Divide scripts, scripting and planning.
- [ ] Track what goes wrong and tighten the guidelines and save checks.
- Done when: staff prefer Claude for scripting and the save checks catch every malformed result.

## Step 6: client pilot

- [ ] Invite a handful of friendly clients who already pay for Claude.
- [ ] Add a "Create with Claude" box in the app with set-up instructions.
- [ ] In the Planner, label posts made in Claude.
- Done when: pilot clients complete a full week of content through Claude without help.

## Step 7: slim the app

- [ ] Remove the code the app no longer shows (listed in `docs/APP_MAP.md` → "Code the app no longer shows"), after the team confirms "Request edits" isn't coming back.
- [ ] Retire the creation screens one at a time, each in its own pull request with tests passing. Script goes first, then carousel and graphic design, then Viral Kit. Keep each one until most clients create through Claude.
- [ ] After each removal, update `docs/APP_MAP.md`.

## Not doing

- **Splitting the very large screen files** (`ScriptMode.tsx`, 5,324 lines; `AnalyzeMode.tsx`, 2,260 lines). They're being retired, so we only fix bugs in them.
- **A full folder reorganisation.** Once Step 7 is done, the remaining app is small enough to group by feature (`src/features/planner/`, and so on) in one go.

## Open decisions

- Which guidelines are shared with Claude in full, and which are summarised?
- When does a client need a Claude plan? Is it optional at first, or required once Script is retired?
- How are in-app credits priced once AI writing no longer uses them?
