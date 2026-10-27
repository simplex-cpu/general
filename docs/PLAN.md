# Plan

Agreed order of work. Tick items off as they're done, and add the date and who did it.

## Step 0: one source of truth

- [ ] Connect the Lovable project to GitHub (instructions in [README](../README.md#connecting-lovable-and-github)).
- [ ] Copy `README.md`, `CLAUDE.md` and `docs/` into the repository Lovable creates.
- [ ] Archive the old upload repository so nobody edits it by mistake.

## Step 1: map the app

- [x] `docs/APP_MAP.md`: screens, files, endpoints, data.
- [x] `docs/PROMPTS.md`: where every prompt lives.
- [ ] Have someone who uses the app daily check the map for mistakes in naming.

## Step 2: every writing prompt editable from Settings

- [ ] Move the hard-coded writing prompts listed in `docs/PROMPTS.md` (analysis, brand strategy, AI design, divide scripts, own-post repurpose, inspo, podcast clipping) into `src/lib/simplex/prompts.ts`, so they appear in Settings and are versioned in Airtable.
- [ ] Keep the current wording exactly. This step moves prompts; it doesn't change them.
- Done when: every prompt that shapes client-facing copy can be edited from Settings, and the tests pass.

## Step 3: MCP server, so Claude can use the app

**Goal:** the user asks Claude, for example "write me three carousel ideas for my brand and put them in the planner". Claude then reads the brand, follows our prompts, writes the content, and saves it, instead of the user clicking through the app.

**Shape:**
- A new folder, `src/mcp/`, plus one endpoint (for example `/mcp`), on the same Cloudflare app.
- Sign-in: OAuth, which claude.ai connectors require. The user logs in with their existing access code, and the same ownership rules apply.
- Each tool calls the **same server code** the screens already use. Shared logic is pulled out of the endpoint files where needed. Nothing is copied.
- Claude does the writing. The app supplies brand context and guidelines, and saves the results.

**First tools, in order:**
1. `list_my_brands`, `get_brand_brief`: read brand voice, audience and visual style.
2. `get_writing_guidelines(format)`: the Settings prompts and QA checklist for a format.
3. `get_recent_posts`, `get_post_stats`: what's been posted and how it performed.
4. `list_planner`, `get_post`: read the planner.
5. `save_to_planner(format, copy, captions)`: creates the Client Content record exactly like Script → Send to production.
6. `request_edit(post, notes)` / `edit_yourself(...)`: create the same Airtable records that already trigger n8n.
7. `add_comment(post, text)`.

- Done when: a test client can go from idea to a planner post entirely through Claude, and the records look identical to ones made in the app.

## Step 4: clean up and split the very large files

- [ ] Remove the code the app no longer shows (listed in `docs/APP_MAP.md` → "Code the app no longer shows"), after the team confirms "Request edits" isn't coming back.

Do this one at a time, one pull request each, with tests passing every time. Biggest first:

| File | Lines | Split into |
|---|---|---|
| `src/components/slate/ScriptMode.tsx` | 5,324 | topic step, hook step, script step, captions step, history |
| `src/components/slate/ApproveAndPostMode.tsx` | 2,650 | calendar, post detail, upload, status actions |
| `src/components/slate/AnalyzeMode.tsx` | 2,260 | input, report, strategy |
| `src/components/slate/ProduceReviewModal.tsx` | 1,087 | per format |

Later, once Steps 3–4 are done: group files by feature (`src/features/script/`, `src/features/planner/`, and so on) and update `APP_MAP.md`.
