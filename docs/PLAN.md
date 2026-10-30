# Plan

Agreed direction and order of work. Tick items off as they're done, and add the date and who did it.

## Direction (decided 30 Oct 2026)

**The two real problems:**
1. The app is hard to change. Improving outputs or making a targeted fix means wading through a lot of code.
2. Design and video editing fall behind what Claude can do, because our own fixed rules sit between the client and the model.

**What we're doing:**
- **No MCP connector.** It didn't solve either problem. The code that was built is parked on the branch `archive/risevoice-mcp`, not deployed.
- **Keep the Script tab.** Add three changes that make it easy to improve and flexible: one switch for AI models, every prompt editable in Settings, and a "Refine" box on every card.
- **Brand kit plus the client's own request** for design and editing, instead of fixed design rules. The client gives us a website or a brand kit. We pull out colours, fonts, logo and tone, then send the brand kit and their request to the latest Claude. Only basic format checks stay (size, slide count, text fits).
- **Video:** Claude decides the edit (cuts, caption style, on-screen text, timing). The n8n editors still render it, so the final look depends on their templates. Changing the rendering tool is a separate, later decision.

## Who does what

| Work | Who |
|---|---|
| Server code, prompts, model switch, AI calls, clean-up | Claude Code, as pull requests on the Lovable-connected repository |
| Screens: Settings dropdown, Refine box, brand kit upload in My Brand | Lovable, using the prompts in this file |
| New Airtable fields (for example, brand kit fields) | Karen (only Karen, Sarah or Jennifer may create fields) |
| n8n changes for video (sending the brand kit and the edit plan to the editors) | Claude Code via n8n, once the "Video edits — … v3" workflows are made available to it |

**Rule:** Lovable and Claude Code never work on the same files at the same time. Claude Code goes first on each item (server side), then Lovable does the screen.

## Step 0: one source of truth

- [x] Lovable connected to GitHub.
- [ ] Tell Claude Code the name of the repository Lovable created, so changes can go there as pull requests.
- [ ] Copy `README.md`, `CLAUDE.md` and `docs/` into that repository, then archive `simplex-cpu/general`.

## Step 1: one switch for AI models

**Why:** the model is hard-coded in about 10 files, in a mix of versions. Captions still use a 2025 model (`claude-sonnet-4-5-20250929` in `src/routes/api/captions.ts`), while hooks and scripts use `claude-fable-5-1`. Staying current with Claude should be one change, not a hunt through the code.

- [ ] Claude Code: create one settings file (for example `src/lib/aiModels.ts`) that names the model for each job (topics, hooks, scripts, captions, design, analysis, brand kit). Make every AI call read from it. Upgrade captions to a current model.
- [ ] Lovable: add a staff-only "AI models" section in Settings that shows the current choice for each job. This is optional at first; changing the file is enough.
- Done when: switching the scripting model is a one-line change, and tests pass.

## Step 2: every prompt editable in Settings

- [ ] Claude Code: move the hard-coded prompts listed in `docs/PROMPTS.md` (design, analysis, brand strategy, divide scripts, own-post repurpose, inspo, podcast clipping) into `src/lib/simplex/prompts.ts`. They then show up in Settings and get version history in Airtable. Keep the wording exactly as it is.
- Done when: every prompt that shapes client-facing copy can be edited from Settings.

## Step 3: "Refine" on every card

- [ ] Claude Code: add one endpoint, `/api/refine`, that takes a piece (hook, script, slide, caption) plus a short instruction ("shorter", "more like my voice") and rewrites only that piece, following the brand and the format rules.
- [ ] Lovable: add a small "Refine" box with a few quick chips (Shorter · Punchier · More like me · Different angle) to the hook, script and caption cards in the Script tab, and to the post window in the Planner.
- Done when: a client can change one piece without regenerating everything or editing by hand.

## Step 4: brand kit

- [ ] Karen: add brand kit fields to the Brand briefs table if the existing visual style fields aren't enough. Likely fields: logo, colours, fonts, tone notes, source website.
- [ ] Claude Code: add `/api/brand-kit`. It takes a website address or uploaded files (PDF, images), extracts colours, fonts, logo and tone with Claude, and returns them for the client to check before saving.
- [ ] Lovable: in My Brand, add "Import from website" and "Upload brand kit", show the extracted kit with edit boxes, then save.
- Done when: a new client gets a usable brand kit from a website link in under a minute.

## Step 5: design from brand kit plus request

- [ ] Claude Code: simplify `src/routes/api/ai-design.ts`. Replace the fixed art-direction rules with the brand kit, the slide copy and the client's request, sent to the model chosen in Step 1. Keep only format checks (canvas size, slide count, text fits, no missing slides).
- [ ] Lovable: add an optional "Describe the look" box beside the design button in the Planner.
- Done when: a carousel designed this way looks on-brand, and switching to a newer model visibly improves it with no other change.

## Step 6: video edits from brand kit plus request

- [ ] Karen: in n8n, turn on "Available in MCP" for the four "Video edits — … v3" workflows, so Claude Code can read and update them.
- [ ] Claude Code: when a client sends a video to editing, add the brand kit and their request to the saved `video_edit` request. Have Claude produce an edit plan (cuts, caption style, on-screen text, timing) that the n8n editors follow.
- [ ] Lovable: add an optional "How should it feel?" box to the edit request in the Planner.
- Done when: the brand kit and request visibly shape the edit, and nothing breaks for requests without them.

## Later: clean-up

- [ ] Remove the code the app no longer shows (listed in `docs/APP_MAP.md` → "Code the app no longer shows"), after the team confirms "Request edits" isn't coming back.

## Questions under review

- **Mass production:** see the notes below; to be decided after Steps 1–3.
- **HeyGen avatars:** possible through HeyGen's API and the same Airtable → n8n pattern; to be decided.

### Mass production notes
- Weekly autopilot: each Monday, for each active client, generate the week's scripts to match their strategy split, and put them in the Planner as "To Approve". Run overnight through Claude's batch processing, which is cheaper and isn't time-sensitive.
- Bottlenecks to check before scaling: Airtable request limits (about 5 requests a second per base), n8n and rendering capacity, and human approval time.

### HeyGen notes
- New format "Avatar video": an approved script triggers an n8n workflow that sends it to HeyGen's API with the client's avatar and voice. HeyGen calls back when the video is ready. The video is saved to Drive and the Planner post moves to "To Approve".
- Each client's own avatar needs their consent and is set up in HeyGen. HeyGen usage is billed per video minute, so it needs its own credits in the app.
