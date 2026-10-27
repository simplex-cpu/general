# RiseVoice Creators Hub

The RiseVoice app for clients and staff. Clients plan, script, produce and track short-form content. Staff script and divide content for clients. It was built with [Lovable](https://lovable.dev).

**New here? Read in this order:**
1. This page.
2. [docs/APP_MAP.md](docs/APP_MAP.md): which files belong to which screen, and where the data lives.
3. [docs/PROMPTS.md](docs/PROMPTS.md): where the AI instructions are and how to change them.
4. [docs/PLAN.md](docs/PLAN.md): what's being worked on now, in order.
5. [AGENTS.md](AGENTS.md): detailed design rules. AI coding tools read this automatically.

## What it's built with

- **Screens:** React + TypeScript, styled with Tailwind, with building blocks from shadcn/ui.
- **App framework:** TanStack Start. Every file in `src/routes/api/` is a server endpoint.
- **Hosting:** Cloudflare Workers (`wrangler.jsonc`), deployed by Lovable.
- **Data:** Airtable for all business data. Supabase only for community posts and background-job tracking.
- **AI:** Lovable's AI gateway (Claude, OpenAI and Google models). Prompts are explained in `docs/PROMPTS.md`.
- **Automations:** n8n. It reacts to Airtable status changes; the app never calls it directly.

## Running it on your computer

You need [Bun](https://bun.sh) installed.

```sh
bun install          # once, downloads the libraries
bun test             # runs the ~440 automated checks
npx tsc --noEmit     # checks the code fits together
bun run dev          # starts the app locally
```

Running locally needs the secrets listed in `docs/APP_MAP.md` → "Secrets the server needs". Ask an admin for them, and keep them in a `.env` file. `.env` is never committed.

## How we work

1. **One copy of the code.** The GitHub repository connected to Lovable is the only copy. Don't edit uploads or old copies.
2. **Small changes and look-and-feel → Lovable.** Lovable saves to the main branch automatically.
3. **Bigger changes (MCP, restructuring, prompts moved out of code) → Claude Code on GitHub.**
   - Work on a new branch and open a pull request.
   - Check that `bun test` and `npx tsc --noEmit` pass.
   - Merge. Lovable then picks the change up.
4. **Don't edit in Lovable and on a branch in the same area at the same time.** Finish and merge one first.
5. **Keep the map true.** If you add, move or rename a screen, endpoint, prompt or Airtable table, update `docs/APP_MAP.md` or `docs/PROMPTS.md` in the same change.
6. **Prompt wording changes go through Settings (gear icon), not code.** Settings keeps a version history.

## Connecting Lovable and GitHub

Do this once, from the **existing** Lovable project, so Lovable Cloud, secrets and hosting stay as they are.

1. Open the RiseVoice project in Lovable. Go to **Settings → GitHub** (also reachable from the GitHub button at the top right) → **Connect**.
2. Sign in to GitHub. When asked, **install the Lovable GitHub App** on the `simplex-cpu` account. Skipping this step is the most common reason the connection fails.
3. Let Lovable create the repository, and give it a clear name such as `risevoice-app`. From then on, Lovable and GitHub sync both ways on the default branch.
4. **Never rename, move or delete that repository afterwards.** That breaks the sync.
5. Copy `README.md`, `CLAUDE.md` and `docs/` from the current upload repository into the new one, then archive the upload repository. Claude Code can do this step.

## Taking over this project

Checklist for a new developer or agency:
- [ ] Access to the Lovable project, the GitHub repository, both Airtable bases, n8n, Supabase and Cloudflare.
- [ ] The list of secret values (see APP_MAP) from an admin.
- [ ] `bun install && bun test` passes on your machine.
- [ ] Read APP_MAP, PROMPTS and PLAN. Continue from the first unticked item in PLAN.
