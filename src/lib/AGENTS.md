# src/lib rules
- Clipper: copy-only source links (Drive copies open); coverage+readback completion; atomic leases; stepwise Drive copy; pieces auto-queue once via planner `scope`.
- Find Inspo: identities and generated-query validation in `inspoFind.ts`; never truncate queries, correct invalid output once; recheck owned rows before writes and reuse readInspo/createInspo.
- Viral repurpose inputs and continuation snapshots use `viralRepurposePrompt.ts` to separate hook/framework, audience-only context and cleaned source copy; this prevents marketing fields re-entering later edits.
- n8n studio jobs: `podcastJobs.server.ts` validates request/callback per contract; DB index allows one active job per long form; no invented bios; N8N_SCRIPTING_KEY is the single shared X-Scripting-Callback-Key for submit and callback.

- Own-post prompt/schema/parser live in ownPostRepurpose.ts; target limits win on conversion, detail moves to captions. Viral keeps repurposeRules.ts skeleton rules. Prevents contradictory assembly.
- Viral angles use repurposeAngles.ts source-story contracts and validated beat plans carried into writing/History, so topics fulfill the hook and payoff. Own-post bypasses angles. Both send labeled source and brand reality, open in chat; cards stay editable after captions, History stays read-only.
