# Plan

Agreed direction and order of work. Tick items off as they're done, and add the date and who did it.

Visual version (private, ask Karen for access): https://claude.ai/artifact/B7EmGWqhYDj72sdGa2pZFf

## Goal

- **5 November:** avatar content goes live on the **kashsocialmedia tips** account, with **Gretta** as account manager. This is the test of the done-for-you offer. The same day, viewers are invited to comment **CREATORS** to get a free trial.
- **19 November:** both offers fully live.
  - **Creator (DIY):** the tool only. Strategy → upload branding → set up your avatar → scripts (manual or Autopilot) → film with your avatar or yourself → approve.
  - **Done for you (DFY):** the tool plus an assigned account manager. The client only approves finished videos.
- Pricing is set after one full week of content (12 November).

## Who does what

| Person | Role |
|---|---|
| Gretta | Account manager for kashsocialmedia tips: scripts, prep, approvals, posting. Voice of the nurture emails |
| Karen | App development (with Lovable and Claude Code), Airtable fields, GHL sequences, ManyChat flows |
| Claude Code | Server code, n8n workflows, AI model switch, prompts, copy drafts (landing page, DMs, emails) |
| Lovable | Screens: landing page, sign-up, buttons |
| Kash | Not involved. His HeyGen avatar already exists |

Tools: GHL for email, ManyChat on the Instagram account, HeyGen for the avatar, n8n for automations, Airtable for data.

**Repository:** `simplex-cpu/general`, branch `main-risevoice`, connected to Lovable. Code changes go through a branch and a pull request; Karen merges. Docs-only changes can go straight to `main-risevoice`.

**Rule:** Lovable and Claude Code never work on the same files at the same time. Claude Code goes first on each item (the server side), then Lovable does the screen.

## Week 1: launch on Thursday 5 November

- [x] App code in GitHub, with app map, prompt guide and plan (Claude Code)
- [x] Lovable connected to GitHub (Karen)
- [x] Already in the app: single and batch scripting, Planner approvals and comments, staff view for client brands, scripting prompts editable in Settings with version history
- [x] HeyGen avatar for kashsocialmedia tips; ManyChat connected; domain live
- [ ] Check the Lovable ↔ GitHub sync works both ways: make one small edit in Lovable and confirm it appears in GitHub (Karen, 30 Oct)
- [ ] Airtable: avatar ID and voice ID on Brands; "Avatar video" post type; "To Avatar" status (Karen, 30 Oct)
- [ ] HeyGen API key saved as a credential in n8n (Karen, 30 Oct)
- [ ] Staff access code for Gretta; kashsocialmedia tips set up as a brand (Karen, 30 Oct)
- [ ] One switch for AI models — pull request [#2](https://github.com/simplex-cpu/general/pull/2) open (Claude Code, 30 Oct)
- [ ] Move captions, brand strategy and divide scripts off forced tool calls, then upgrade captions off the 2025 model (Claude Code, 1 Nov)
- [ ] HeyGen workflow in n8n: approved talking script → HeyGen → Drive → Planner "To Approve" (Claude Code, 1 Nov)
- [ ] Sign-up logic: creates the trial account in Airtable (user, brand, access code, trial credits) and sends the contact to GHL with the tag `creators-trial` (Claude Code, 1 Nov)
- [ ] Refine logic: `/api/refine` rewrites one piece from an instruction (Claude Code, 1 Nov)
- [ ] Landing page, ManyChat DM and nurture email copy drafted (Claude Code, 1 Nov)
- [ ] Landing page at risevoicetools.com for visitors who aren't logged in, with "Log in" for clients (Lovable, 2 Nov)
- [ ] Sign-up screen (Lovable, 2 Nov)
- [ ] "Send to avatar" button and avatar statuses in the Planner (Lovable, 2 Nov)
- [ ] Refine chips on script cards: Shorter · Punchier · More like me · Different angle (Lovable, 2 Nov)
- [ ] Week-1 scripts for kashsocialmedia tips, refining prompts in Settings as she goes (Gretta, 2 Nov)
- [ ] Remaining hard-coded prompts moved into Settings (Claude Code, 3 Nov)
- [ ] ManyChat "CREATORS" flow; GHL nurture emails 1–3 (Karen, 3 Nov)
- [ ] Full dry run: comment → DM → sign-up → email → log in → avatar video (everyone, 4 Nov)
- [ ] **Launch:** first avatar videos posted with the CREATORS call to action; trials open (Gretta, 5 Nov)

## Week 2 (6–12 November): Autopilot and proof

- [ ] **Activate Autopilot:** every Monday, a week of scripts that match the strategy lands in "To Approve" (Claude Code + Lovable)
- [ ] Brand kit import from a website or upload: colours, fonts, logo, tone, shown in My Brand to correct (Claude Code + Lovable; Karen adds fields if needed)
- [ ] "Done for you" diaries content series, 2 posts a week (Gretta)
- [ ] Nurture emails 4–5 (Karen)
- [ ] Funnel C: Re-Learn list sequence, 4 emails from Gretta (Karen, 10 Nov)
- [ ] ManyChat "DONE" flow, GHL application form and Gretta's booking calendar (Karen)
- [ ] Refine in the Planner post window; in-app "Want Gretta's team to run this for you?" for active trial users (Claude Code + Lovable)
- [ ] **12 November:** set pricing; tier-2 offer sequence live (everyone; Karen)

## Week 3 (13–19 November): brand kit design, edits, scale

- [ ] Prices on the landing page (Lovable)
- [ ] Design from brand kit plus the client's request, replacing the fixed design rules in `src/routes/api/ai-design.ts` (Claude Code + Lovable)
- [ ] Avatar setup for trial clients: self-serve if HeyGen's API allows it, otherwise Gretta sets it up from the client's footage (Claude Code + Karen)
- [ ] Video edit plan from brand kit plus request, sent to the n8n editors. Needs "Available in MCP" turned on for the four "Video edits — … v3" workflows (Karen, then Claude Code)
- [ ] Autopilot for every done-for-you client: mass production (Claude Code + Gretta)
- [ ] **19 November:** both offers fully live; first paying clients onboarded

## Funnels

- **A · Free trial (Creator):** avatar content → comment CREATORS → ManyChat DM → landing page → sign-up → GHL tag `creators-trial` → nurture (days 0, 1, 3, 5, 7) → tier-2 offer (days 8, 10, 12, 14).
- **B · Done for you:** "Done for you" diaries → comment DONE → ManyChat DM → GHL application → call with Gretta → onboarding. Also: in-app prompt for active trial users, and the tier-2 emails.
- **C · Re-Learn list:** people who requested an episode link → 4 emails from Gretta (episode and takeaways → the system behind the content → free trial → done-for-you) → join A or B.

Results numbers only appear on the landing page and in emails once they're real (after 12 November).

## Notes

- **Mass production:** Autopilot generates each client's week overnight. Before scaling, check Airtable's request limit (about 5 requests a second per base), n8n and rendering capacity, and approval time.
- **HeyGen:** avatar videos are billed per minute by HeyGen, so they need their own credits in the app. Each client's avatar needs their consent.
- **Parked:** the MCP connector built on 27 Oct is not deployed. If its code was saved, it's on the branch `archive/risevoice-mcp`.
- **Later clean-up:** remove the code the app no longer shows (see `docs/APP_MAP.md`), after the team confirms "Request edits" isn't coming back.
