# Roadmap: Simpler Script tab

## Structured script fields (October 21)
- [x] Persist format-specific script, hook, overlay, visual CTA and direction separately; retain legacy reads.
- [x] Map complete fields into the original Content and atomic Edit Yourself request; leave n8n unchanged.
- [x] Verify exact field names, compilation and 65 focused regression tests; document mapping in docs/script-field-mapping.md.
- [ ] Change Timestamps to long text in Client Content, Short forms and Edit Yourself (blocked: Airtable API rejects field-type changes; user must adjust existing fields).
- [ ] Real card save/readback and editing handoff (blocked: preview browser has no access-code session; no automation triggered).

## Content card redesign (October 21)
- [x] Long form page stacks from the top; one card with header controls, part rail, caption tabs, media-first, thin footer.
- [ ] Signed-in visual check (preview browser is access-code gated).

## Design freedom + clipper cleanup (October 21)
- [x] Brand-safe creative design prompt, per-slide brand backgrounds, tiny micro-copy, review pass removed.
- [x] Long form spacing, tag under title, shared table look with pinned Action, timestamps removed from row.
- [x] Separate Timestamps + Creative Direction fields (Airtable fields created) and Clipping handoff to Edit Yourself.
- [ ] Live clip send-to-editing check (needs signed-in session).

## Viral angle story-fit repair (October 21)
- [x] Generate and validate a source-story contract with concrete candidate beats, insights and payoff progression.
- [x] Carry the selected story plan into viral writing and saved continuation context; own-post generation unchanged.
- [x] 31 regression checks passed; live ranked-resource sample returned four complete three-beat angles with increasing written payoffs.
- [ ] Saved-post suggestion/selection/writing readback (blocked: testing browser is access-code gated; live sample is not an owned-record end-to-end check).

## Own-post repurpose repair (October 21)
- [x] Switch only own-post writing to Opus 5.5 with adaptive thinking and medium effort; native Messages live test returned 200.
- [x] Unify format-aware prompts/schema, route overflow detail to captions, and validate B-roll's 20-word overlay; live conversion returned 18 words with supporting details in the caption, 46 regression checks passed.
- [x] Enable repurposed script editing after captions, preserve original prompt/source in continuation context, and surface generated captions in the saved chat card.
- [ ] Signed-in own-post generation/edit/save/readback (blocked: preview test browser has no active access-code session).

## Repurpose final polish (October 21)
- [x] Lock viral format, label transcript for the writer, hook-fitting angles, Inspo link in chat card and planner, viral window play button and sizing, green progress; 370 checks pass.
- [ ] Live repurpose from a viral post and an own post (blocked: needs the user's signed-in session; no paid generation run by me).

## Organic viral repurposing (October 21)
- [x] Prioritize explicit hook template/framework, remove marketing brief inputs and source promotional CTAs; 17 focused regression tests pass.
- [ ] Verify a saved viral post through the user's repurpose screen (blocked: no active access-code browser session).

## Complete published post copy (October 20)
- [x] Save complete format-specific copy, ordered slides, dedicated cover/visual hook and hashtags; prefer owned planner copy. Six DWY Posts fields created.
- [x] Preserve source body on same-format repurpose; use scripting rules for faithful format changes.
- [x] Refine Performance spacing, gray controls and bottom-left update date; verified on Nina's real Home.
- [ ] Full mining/repurpose readback remains unverified: Nina has no imported posts because Instagram blocks the source. Video reader size limits and unreadable slides remain explicitly partial; no paid refresh/generation started.

## Planner round + editorial AI carousels (October 17)
- [x] Batch 1: header colour fill, brand filter, auto-sized resizable columns, floating dropdowns, row expand button.
- [x] Batch 2: three-dots menu on rows and card window, DIY/Assign Re-do, slide-by-slide carousel copy, teleprompter camera.
- [x] Batch 3: Design with AI in DIY Design (Claude SVG per slide, validated, fallback to standard layout); one live slide design passed.
- [ ] Signed-in click-through of the planner and a real AI carousel export (blocked: needs an access-code session).
- [ ] Production flow details (waiting on the user's message).

## TikTok search-quality QA (October 17)
- [x] Replace sentence truncation with complete niche-specific queries and one invalid-output correction; 236 regression tests pass, three live niche-generation checks pass. Real-account TikTok result relevance remains unverified; no paid Apify search started.

## Clipper layout and completion cleanup (October 15)
- [x] Clean table tabs/counts, compact footage links, centered fade-only modal and full TXT download; controlled desktop/phone checks passed.
- [x] Enforce coverage evidence/readback and gate generation; provider contract confirmed. Original result processed 1200s of a 3387.3s source (4686 words), so full coverage is not complete. Existing text/seven pieces preserved; no paid retranscription started.
- [x] 41 focused tests and controlled tabs/checklist/download/phone checks passed; TXT matches all 270036 test bytes.
- [ ] Live authenticated checks and full retranscription blocked: user access-code session and confirmation of the intended two-hour source/paid rerun required. Existing provider reports a 56-minute source, not two hours.

## Long-form completion batches (October 15)
- [ ] Batch 1 — Implemented, final integration verification blocked: private atomic leases, stable slot/Content keys, staged-write reconciliation and deletion-safe completion. Real lease concurrency/stale-token test passes; interrupted Airtable/board flow needs an authorized app session.
- [ ] Batch 2 — Implemented, live check blocked: user-confirmed speaker map, chunked original/word timing, coverage evidence validation and bounded whole-recording windows. Controlled desktop/phone speaker-save/readback passes; existing recording has no word details, actual two-hour coverage remains unverified.
- [ ] Batch 3 — Implemented, live handoff blocked: deterministic optional hesitation/repetition cleanup, preserved negation/emphasis, original comparison and ordered cuts in Content/DIY instructions. Focused rules and unavailable-timing UI checks pass; real source-cut/production readback still pending.
- [ ] Batch 4 — n8n handoff guide delivered (docs/n8n-production-handoff-guide.md, matches the fields the code writes). Live verification awaiting the user's access code: preview signed out; all four live AI calls passed on synthetic speech, controlled desktop/phone checks pass, but owned saved-record/production and real multi-hour transcription checks require signing in. n8n untouched; publishing not requested.

- [x] Current verification round: provenance checked against owned original transcripts, repeated passages rejected across formats, same-speaker cross-segment quotes accepted, naming failure retains URL. 37 tests and controlled desktop/phone progress/completion/recovery checks pass; n8n unchanged.

- [x] Long-form reference structures approved: one narrative carousel style for now, editorial BROLL overlay and headline-only podcast Graphic; ambiguous audio draft remains unverified.
- [x] Long-form first presentation delivery: readable secondary controls, regular-weight dropdowns, blank counts, white table, detail modal and owned transcript display. Sample table/modal/transcript checks and nine existing rule tests pass; live-account flow remains unverified.
- [x] Long-form keep-open completion: continuous detail progress, sequential polling/one-piece generation, blocked accidental exits and saved count targets; no Inngest. 11 rule tests and staged desktop/phone processing/completion/failure checks pass.
- [ ] Verify keep-open flow against a real owned long video and live AI generation (blocked: no active access-code account in the test browser). Private database leases now protect cross-window generation and board requests; the real lease test passes, while full Airtable recovery still awaits live-account QA.
- [x] Long-form source integrity: timed speaker transcription contract, chunked full text, completed naming, source-only Talking speech, quote validation, approved podcast templates and planner provenance. All four live writing calls passed on synthetic source speech; rule/sample UI checks pass; n8n unchanged.
- [ ] Verify multi-hour speaker transcription and production on a real owned video (blocked: active access-code account and real recording needed; external n8n must consume source-range instructions and omit invented podcast CTAs).

- [x] Visual Find Inspo progress/completion, repeat-run duplicate identity checks and immediate pre-save bank refresh; remove Analyze Competitors. 13 tests and sample streamed browser flow pass; live paid search/save remains unverified without an access-code session.

- [x] Refine Viral Kit into compact tool rows and move strategy back navigation beside the title; 1092px/390px sample browser navigation/layout checks and five availability tests pass, with no browser errors.

- [x] Apply Community spacing, slim brand actions, and continuous full-height Visual Style settings rail; sample browser checks cover both Community views, full-height video/graphic rails, editable fonts and mocked save.
- [x] Add Viral Kit navigation/gallery with the existing Analyze flow under Refine My Strategy and three unavailable Coming soon tools; sample desktop/phone, collapsed rail, active navigation and back checks pass; 32 focused tests pass with no browser page errors.
- [ ] Verify Refine My Strategy analysis-to-Script handoff on an authorized live account (blocked: no active access-code session; existing analysis flow unchanged).

- [x] Standardize My Brand, Home and Growth Path backgrounds; refine gray-indigo summary, readable locked milestones and neutral compact-on-scroll headers. Sample-data browser checks pass at 1092px and 390px, including scroll collapse/restore and back/reopen resets; 24 focused tests pass and build OK. Live access-code verification remains subject to the existing account blocker below.

- [x] Refine My Brand: single-column long brief fields, paired name/niche below the logo, darker section tabs and a lighter nonwhite Visual Style settings rail; sample-data browser layout and surface checks pass at 1092px, with no page errors and build OK.

- [x] Unify Community and brand-detail section backgrounds and add a soft divider above feed filters; sample-data browser checks confirm matching backgrounds, no page errors or narrow-screen overflow.
- [x] Prepare and approve the Visual Style redesign plan: fixed samples, format-specific previews, two-axis positioning, graphic fonts and combined solid/gradient backgrounds.
- [x] Implement the approved Visual Style redesign, shared saved preferences and production snapshots; 39 tests pass, sample-data save/reload and 1092/1440/390px checks pass, and PNG export verified at 1080x1350. Airtable preference field added; n8n unchanged.
- [ ] Verify Visual Style save/reload on an authorized live account (blocked: no active access-code session); browser save/readback checks currently use sample data.

- [x] Deliver My Brand gallery, creation, owned detail tabs and legacy default protection; Community strip matches feed and Home actions have room. 27 tests pass; sample-data gallery/detail desktop/phone checks pass.
- [ ] Verify brand creation/save isolation with a real access-code account (blocked: no active access-code session). New-brand social connections require a brand-specific connection destination; existing live Vista Social status reports invalid API key.

- [x] Shrink Home card titles to 16px and body text by 1-2px, and slim the card buttons to 128x32 desktop / 128x40 phone; 10 focused tests, build and sample-data desktop/phone checks pass.
- [x] Apply four Home cards and consistent action sizing; sample-data 1092/1440/390px layouts, filters, navigation and empty/loading/error states verified; 10 focused tests pass. Real-account verification remains blocked below.
- [x] Refine Home: top-right performance filters, unframed lighter welcome, title icons, close red/yellow status summary with extra space below, and indigo primary actions.

- [x] Redesign Home as a calmer performance-first dashboard; sample-data filters, four navigation callbacks, empty states and 1440/1092/390px layouts verified; six statistics tests pass. Real-account checks remain blocked below.

- [x] Apply approved blue milestone visuals, divider-free full-height community feed and 20% smaller headers; desktop/phone empty/single/long feed and 48px phone top bar verified
- [x] Build action-first Home with growth continuation, community targets and stored platform performance; fixture navigation/period/platform checks pass
- [x] Add and verify 36 per-platform fields on client Planner Client Content, reuse published links, preserve staff aggregates; automation mapping in docs/home-statistics-handoff.md
- [ ] Verify real-account Home target navigation and live statistics (blocked: no active access-code session; user-managed automation must confirm Client Content destination, write actual publication times/URLs and collect Apify metrics). 19 focused tests, fixture desktop/phone checks and signed-out 401 verified.

- [x] Apply approved wider community feed, compact composer/separate tabs, bright milestone thumbnails and gray-user/unframed-team chat; sample-data desktop/mobile checks and nine community tests pass; live posting/chat still requires an access-code session

- [x] Compact community posts, icon/count reactions, existing-style section tabs and safe author profile previews; nine contract tests pass, compact shell checked on desktop/mobile; live profile retrieval awaits an access-code session

- [x] Modernize Creator Circle with emoji composer, colored reactions and team-only Strategy ideas feed; UI checks and seven contract tests pass, real-account posting remains blocked below

- [x] Refine Community: full-width icon tabs, Creator Circle first, tidier social composer, Feed filters and no right descriptor

- [x] Move milestones to Growth Path and team chat to Community; deliver a persisted shared Community Leaders feed with tags, support requests, reactions and comments
- [ ] Verify real community post creation, reactions and comments with a signed-in access-code account (blocked: no active access-code session available in browser testing)

- [x] Unify production request records and preserve request-specific branding across all four formats; n8n triggering and sequence logic remain user-managed
- [x] Final QA and hardening for B-roll and Talking Video handoffs, retries, and approval return

- [x] Show raw-footage attachments and hide thumbnail attachments on production cards across tabs; green session brief confirmation

- [x] Clarify post-topic progress, speed the CTA-to-writing handoff, format Talking Videos into short paragraphs, preserve script copy beside captions, and standardize approval actions in green

- [x] Unify script anatomy: no duplicate spoken hook or separate CTA, format-correct CTA placement, and green approval action

- [x] Fix single-script B-roll selection, format-first setup, concise subtitle and derived topic titles

- [ ] Remove structural labels from graphic copy and deliver the premium safe-area mobile navigation shell

- [x] Current feedback: collapsed planner groups, disabled Style loading tab with tooltip, default full-overlay sample, font dropdown, compact approval media, production source media and DIY labels

- [x] Implement approved video workspace: real clip playback, Footage/Text/Style panels, branded text samples, locked creation and synchronization-only retries; verify media and submission flows

- [x] Skip n8n reconnection and automation investigation as requested; leave the external automation unchanged

- [x] Add modest top space to Scripting Hub and explicit collapse/expand icons; investigate the app's video editing flow and propose a standardized quality-first flow

- [x] Align Scripting Hub title/arrow, automatically collapse main rail on Script entry, fit planner action column to its buttons

- [x] Scripting Hub spacing/title, simplified collapsed rails, footer removal, compact audit actions and grouped video/image approvals

- [x] Desktop primary navigation rail, renamed client destinations, red waiting-production groups, compact headings, and DWY gradient loading/editing

- [x] Current planner refinement: To Approve label, wider dates, collapsible groups, blank assignees, genuine logo-only platforms, indigo actions and modern table styling

- [x] Planner polish: DWY-first actions, pinned action column, green Post, platform icons, status pills, four Production groups, and separate DWY/Risevoice paths

- [x] Planner/design correction: calm production activity, derived assignee, Attach/Teleprompt, unified labeled slide copy, and role-label cleanup

- [x] Design editor feedback: outlined secondary buttons, no cover body, fast slide navigation, larger editor with early side settings

- [x] Production planner actions, footage guidance, green approval, and high-end safe carousel rendering

- [x] Current feedback: unpadded numbering, aligned actions, structured captions, natural CTA transitions, final planner label, active History continuation, atomic variation pairs

- [x] Current feedback: in-place regeneration indicator, single-flight actions, authoritative CTA, saved planner-post link, clipped modal header

- [x] Current feedback: repair auto-scroll and captions; CTA reward; simplified same-card approval; bubble/button/modal readability; no Quote or selection labels

- [x] Feedback: guided CTA, in-card variation/completed actions, autoscroll, traffic-light progress, History names, planner contrast

- [x] Feedback: format-triggered session creation, fixed session progress header, rail labels/divider, unpadded numbers, artifact-leading instructions, single loading state, paired variations and card selection checkboxes

- [x] Feedback: Strategy Monthly Split/Strategy Brief tabs, four brief sections, spacious audit, original conversation History and new-session re-purpose

- [x] Script tab corrections: dedicated strategy content, writer-only prompts, full-height panels, collapsible rail, beginning button, immediate History entry

- [x] Batch 2: Chat sessions Airtable fields + save/list/read/update endpoint
- [x] Batch 2: add-to-planner (status, footage, Request type, session link); captions already accept one script; 2 variations = 2 parallel script calls from the flow
- [x] Do-it-myself request record from the flow
- [ ] Instagram/TikTok inspo video reading (2 credits)
- [x] Batch 3: side rail, Strategy details page, History (read-only)
- [x] Batch 4: batch flow rebuild (2 variations, pick, captions per script, planner window, loop, end screen)
- [x] Batch 5: single script flow (idea + format)
- [ ] Batch 5: inspo video reading
- [x] Batch 6: re-purpose into a new session + conversation preservation tests
- [x] Batch 6: batch PDF (end-of-batch download)

- [x] Extra QA round: video and static production paths, field contracts, retries, and approval return

- [x] Bank of Inspo tool: Airtable table, table view, add/delete, Repurpose to Script
- [x] Refine Bank of Inspo: gray three-field form, URL metadata, owned table editing, compact actions and structured Repurpose continuation; 56 tests, live Fable parser and sample browser flow verified.
- [ ] Verify Bank of Inspo add/repurpose on an authorized live account (blocked: no access-code session)
- [ ] Import inspo from other tables (later)

- [x] Find Inspo (TikTok search), Status field, red Delete

- [x] Bank of Inspo New/Repurposed tabs
- [x] Long form Clipper: Airtable Long forms/Short forms, gallery, Add new, generation, short-form table, Add to board

- [x] Clipper: live transcription %, Drive footage copy, Review/To Edit|Designed/Ready to Post/Posted tabs, status under title
- [x] Clipper: accept Dropbox/Drive footage folders (folder = footage, transcribe chosen mix file)

- [x] Home: top performing topic, brand dropdown (Performance); step-by-step Add long form with no defaults

## Corrections round (Oct 17) — done
- [x] Home: Top posts removed; coverage line bottom-right; top performing format added
- [x] Visual Style: no preview, full-width form, large background cards, fixed font dropdowns
- [x] Hook backing none + transcription colour = footage ink on every save
- [x] Carousels: cover + closing dark/gradient, middle light, centered by default (position editable in design preview)
- [x] QA: 221 tests pass (live signed-in click-through not done)

## AI design (Oct 17)
- [x] AI design runs in the background from DIY Design, progress on card/row, slides attached to Media to Post, moves to To Approve
- [x] Better designs: Claude Opus 5.5 high effort, series art direction, craft rules, look-and-fix review
- [ ] Live end-to-end run on a real post (needs signed-in planner)
- [x] Zernio connect links in Connected Accounts (short button labels: Connect / Reconnect / Sign in / Remove)

## Clean-up round (Oct 20)
- [x] Find Viral Posts gallery (thumbnail, handle, Discard)
- [x] Planner always grouped; Prepare Footage by type
- [x] Shared post window blocks: folding slides/captions, one Attach box, media carousel, 9:16 / 4:5 frames
- [ ] Signed-in click-through of every post window (preview needs access code)

## Posting targets (October 21)
- [x] Brand, brand-only account picker and formats on the card; saved to Airtable and checked on save.
- [ ] Zernio schedule/post call for TikTok, Instagram, Facebook (next round).
