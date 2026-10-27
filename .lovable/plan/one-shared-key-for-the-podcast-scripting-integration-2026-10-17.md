# One shared key for the podcast scripting integration

## What changes
- Requests sent to n8n use the header `X-Scripting-Callback-Key` instead of `X-Scripting-Key`.
- The secret `N8N_SCRIPTING_KEY` (the password you saved in n8n) is used to send jobs and to check callbacks. `N8N_CALLBACK_TOKEN` is no longer read.
- The webhook URL is set to `https://simplexmedia.app.n8n.cloud/webhook/podcast-scripts-v1` by updating the `N8N_PODCAST_WEBHOOK_URL` secret through the secure form, because a secret that already exists can't be overwritten silently.
- The v1 payload, job tracking, duplicate protection and callback matching stay the same. No new password is generated, and the key never appears in chat, logs or the browser.

## Technical details
- `src/lib/podcastJobs.server.ts`: change the submit header name.
- `src/routes/api/public/podcast-scripts-callback.ts`: read `process.env.N8N_SCRIPTING_KEY` and keep the HMAC timing-safe comparison as it is.
- `src/routes/api/podcast-script-jobs.ts`: no logic change.
- Add a test that the submit request uses `X-Scripting-Callback-Key`, then run `bun test src/lib/podcastJobs.test.ts` and the full slate suite.
- Update the AGENTS.md n8n rule to say one shared key covers both directions.
- `N8N_CALLBACK_TOKEN` stays saved but unused, and can be deleted later if you want.
- No live generation run.
