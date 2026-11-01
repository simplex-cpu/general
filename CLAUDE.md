Read `README.md`, `AGENTS.md` and `docs/APP_MAP.md` before changing code. Follow `docs/PLAN.md` for the current step.

- Run `bun test` and `npx tsc --noEmit` before every commit. Both must pass.
- Never edit `src/routeTree.gen.ts` by hand; it's generated.
- Never commit `.env` or secrets.
- When a screen, endpoint, prompt or Airtable table is added, moved or renamed, update `docs/APP_MAP.md` or `docs/PROMPTS.md` in the same change.
- Lovable syncs the default branch (`main-risevoice`). Code changes go on a separate branch and are merged with a pull request; docs-only changes can go straight to `main-risevoice`.
