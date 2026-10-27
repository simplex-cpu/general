# Show speaker-labelling progress

## Status of your long form
It's still running, and it's working: speaker labelling just reached 10% (19:12 UTC). On your last video this step went faster once it reached 10%, at about 2–3 minutes per 10%. At that pace this one should finish around 19:50 UTC (13:50 your time). You don't need to do anything.

## The problem
The service reports speaker-labelling progress only in its detailed log, not in its status line. So the app sits at "Labelling speakers… (90%)" for 30+ minutes, which looks stuck.

## Change
- During the speaker step, the bar moves with the service's real progress. For example, "Labelling speakers: 40%" maps to 85–98% of the overall bar.
- The "No progress for 20 min" warning also resets when the speaker percentage moves, so a slow but working step doesn't show a false warning.

## Technical details
- While the run status message says "labelling speakers", `checkLongTranscription` also reads the end of the Apify run log (`/actor-runs/{id}/log`, last few KB). It appends the latest `diarization N%` line to the returned message.
- `transcriptionProgress` parses `diarization N%` and maps it to `85 + N * 0.13`. Add a test for this.
- No other behavior changes.
