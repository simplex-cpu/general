# Long Form Clipper: keep-open processing with clear progress

## Decision
Skip Inngest and closed-page completion. Require the processing screen to stay open until transcription and requested short forms finish. Keep the approved podcast templates and source-fidelity work as separate stages; leave n8n unchanged.

## What will change
1. **One continuous processing screen.** After adding a video, open its detail modal automatically and stay there through transcription and short-form creation. Do not show completion buttons while work is still running.
2. **Clear progress.** Show ordered stages: video saved, transcribing, preparing transcript, creating requested formats, complete. Show the active stage, elapsed time, completed stages and actual generated counts against requested counts. Use an indeterminate indicator when the transcription provider supplies no percentage; never invent progress or a finish time.
3. **Prevent accidental exits.** Disable the modal close button, Escape, outside-click dismissal and in-app section navigation while processing. Display “Keep this page open until processing finishes.” Ask for the browser’s leave-page warning when supported.
4. **Honest limitations.** Browsers cannot be forced to remain open, and device sleep may suspend processing. If the page is closed or refreshed, reopening the saved long form should check its last recorded state and offer to continue unfinished work without duplicating existing pieces. Do not promise background completion.
5. **Clear completion and errors.** Completion shows the transcript and created pieces, with a visible success state. Errors stop loading, identify the failed stage and allow an explicit safe recovery or exit; no permanently locked screen.

## Technical details
- The current detail screen checks transcription every 15 seconds using an asynchronous interval. Replace this with sequential polling so checks never overlap; stop on terminal results or errors and back off only for transient failures.
- Maintain one active processing operation across the Add modal, detail modal and app navigation. Guard repeated clicks and duplicate generation requests.
- Persist enough stage/count information to resume from saved results after an interrupted session. Verify server-side generation limits and partial-save behavior before choosing generation batch size; do not rely on a long-running status request completing uninterrupted.
- Preserve existing AI models, provider error handling and Airtable ownership checks. No new external service connection.

## QA
- Exercise save → transcription → requested generation → success with realistic staged responses.
- Verify close icon, Escape, outside click and section navigation are blocked only during active work.
- Verify failed transcription/generation releases the loading state and permits recovery.
- Check slow transcription, interrupted/reopened sessions, repeated clicks and partial results without duplicate pieces.
- Check desktop and phone layouts; live long-video processing requires a provider run and is reported separately from simulated progress checks.