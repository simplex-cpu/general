# Home statistics automation handoff

## Destination
Home and the client Planner read **Client Content**, not staff Content or Analysis Reports. Publishing must update the same Client Content record shown in Planner. Staff Content's aggregate metrics/formulas remain unchanged. 36 fields were added: nine per platform. Existing posted-link and Vista published-ID fields are reused.

## Publishing writeback
After each platform confirms publication, write its public URL and actual publication time to the existing record:

| Platform | Existing URL | Existing ID | New publication time |
|---|---|---|---|
| Instagram | Instagram Posted link | Vista Published ID Instagram | Instagram Published At |
| TikTok | TikTok Posted link | Vista Published ID TikTok | TikTok Published At |
| Facebook | Facebook Posted link | Vista Published ID Facebook | Facebook Published At |
| YouTube | YouTube Posted link | Vista Published ID YouTube | YouTube Published At |

Use ISO UTC actual publication time, not scheduling time. Preserve the meaning of Vista ID fields if they identify scheduler jobs rather than final platform posts. Treat each platform success independently; do not mark the entire post published after only one selected platform succeeds.

## User-managed Apify sequence
No n8n workflow has been inspected or changed.
1. Start the appropriate Actor with the saved platform URL.
2. Read its completed dataset and verify the returned post matches that URL.
3. Normalize available metrics to non-negative whole numbers. Unsupported/unavailable metrics stay blank; confirmed zero stays zero.
4. PATCH the existing Client Content record with `{Platform} Likes`, `Comments`, `Saves`, `Shares`, `Views`, `Stats Updated At`, `Stats Status`, `Stats Error` (all prefixed with the platform).

Status text convention: Pending, Collected, Partial, Unavailable, Error. The writable Stats Updated At stores successful collection time; clear errors on success. Errors must not contain credentials.

Example below is illustrative, not seed data or confirmed Actor output:
```json
{"records":[{"id":"EXISTING_CLIENT_CONTENT_RECORD_ID","fields":{
  "Instagram Posted link":"https://www.instagram.com/p/ACTUAL_POST_CODE/",
  "Instagram Published At":"2026-10-14T12:00:00.000Z",
  "Instagram Likes":124,"Instagram Comments":8,"Instagram Saves":null,
  "Instagram Shares":null,"Instagram Views":2400,
  "Instagram Stats Updated At":"2026-10-15T12:00:00.000Z",
  "Instagram Stats Status":"Partial",
  "Instagram Stats Error":"Saves and shares were not returned by the collector."
}}]}
```

## Reliability
- Key updates by Client Content record + platform + public post identity; overwrite snapshots, never create another content record per refresh.
- Apply a result only if the record still references the same URL. Clear old metrics/timestamps when publication identity changes.
- Serialize runs for each post or reject older results to prevent stale overwrites.
- Clear an unavailable metric to null on a successful refresh rather than mix old/new measurements.
- On total collection failure, retain the previous successful metrics/time and update status/error only. Bound retries with backoff and stop permanent failures.
- Verify Actor output for each platform/content format; do not assume saves/shares or static-post views are supplied.
- Collection scheduling/provider costs stay in the user-managed automation. Home never starts Actors.

## Home interpretation and verification
Home defaults to publication dates in the last 30 days. URLs without actual publication timestamps are excluded from period totals and flagged as pending metadata. Platform totals/rankings remain separate, unknown metrics show a dash, and each metric exposes its measured-post count. Format comparisons use average views with sample sizes, not unsupported growth claims. Freshness shows the oldest known collection among measured results.

Confirm the publishing sequence writes Client Content. If it writes staff Content, resolve the corresponding owned Client Content record before writeback. Publish and collect one real post, then verify its URL/date/metrics in Home. Until this occurs, external collection and live statistics remain unverified.
