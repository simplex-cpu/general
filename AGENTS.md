# Architecture rules
Read subfolder AGENTS.md first.

- Gate Home/Growth/Community by access code and ownership; scope team-chat styles locally. Keep Home data/metrics separate from shared card controls.
- Manage My Brand via owned Brand links/shared brief fields. New briefs omit legacy User/access-code links to preserve other sections' default; validate legacy links for existing briefs.

- Keep carousel/graphic copy constraints in `designTemplates.ts`; writing, editing, rendering and persistence share rules.
- Use shared Responses text generation; own-post repurpose uses native Claude in ownPostClaude.server.ts, with medium adaptive thinking, durable denial blocking and no automatic retries.
- Store sessions only in Airtable "Chat sessions" via `writerSessions.server.ts`; History, re-purpose and planner share one record per session.
- Start writer sessions format-gated and single-flight; refresh History on creation to prevent duplicates and expose sessions before generation.
- Script tab: viewport-height shell, independently scrolling rail/content; chat scrolls its nearest Script container.
- Saved transcripts use the live renderer read-only (keeps layouts, drops old actions).
- Serialize session saves and reject oversized transcript arrays instead of truncating them; prevents stale writes and silent History loss.

- Keep pairing/progress in variationFlow; approval selects a variation. Group by saved group/order, never adjacency, and publish complete ordered pairs for live/History consistency.
- Update captions on the original selected message instead of appending a second card, so live rendering, History and planner share one script identity.
- Validate caption batches against the shared four-platform contract and request forced structured delivery on the existing caption provider; malformed responses never become blank captions.
- Guard writer actions with the shared synchronous action lock and replace regenerated messages in place; prevents overlaps, keeps variation positions.
- Keep selected CTA ownership and format-specific generation rules in scriptCta.ts; Talking Video bakes it into the script, Carousel keeps it on the final slide, and B-roll/Graphic reserve it for captions.
- Format Talking Video paragraph breaks at the shared script boundary; this keeps cards, History, exports, and production handoff equally scannable.
- Planner links use the same-origin planner param and open only owned records.
- Keep ScriptMode mounted across in-app section navigation and expose its active transcript through History; this prevents in-flight generation results from being discarded.
- Map graphics through brandVisualStyle and shared frames for previews, production and exports; keep graphic preferences separate from video fields.
- Use `slideFields.ts` alone to parse/serialize carousel copy across writing, handoff, editing, persistence and rendering; prevents stale copy and role-label leaks.
- Model production routing as explicit choice, DWY editor, and Risevoice confirmation states; this prevents one route's controls and previews from leaking into another.
- plannerPresentation owns grouping/actions; contentCardRail owns card rail parts per format.
- AI slide SVGs: aiDesign.ts validates palette, one accent-or-gradient highlight, photo:N slots, ≤22px micro-copy only; one retry, then designFrames.
- `contentScriptFields.ts` maps separate video copy and legacy reads for Content/editing; prevents prose leakage.
- One responsive navigation component keeps role filtering and section state.
- Playback/style sampling in VideoProductionWorkspace; brand mapping, request text, single-flight/retry in videoProduction.
- Persist every DIY production handoff as one idempotent Edit Yourself request linked to its original Content record, with request-scoped style fields taking precedence over brand defaults.
- Create or resolve the owned Content record before the final Edit Yourself write, and submit every required video input atomically so record-created automations never see partial requests.

- DWY Posts own stats/copy (Brand + optional Content). postCopy/minePostCopy reuse owned planner copy then mine blanks; slideFields preserves ordered source slides; same-format repurpose restores original bodies.
- envelope.ts appends audience/placeholder/topic rules to all scripting requests.
- `edition.ts`: staff=Agency V1, clients=Creators V1; Agency Script/Divide stay on Rise Voice.

- Route outside links via `externalLink.ts` to same-origin /go; Instagram refuses direct opens.
- `longFormTypes.ts` owns "from long form" types/styles; compare base formats.
- Edit Yourself videos save a `video_edit` v1 snapshot (videoEditInput.ts) in Editing preferences; Airtable "To Edit" is the only dispatcher, never direct n8n calls. Podcast callbacks map each field/caption separately.
- Card opening uses shared contentCardLoader (Home seeds a starter item, Planner refreshes opened row); one load path avoids divergent bugs.
