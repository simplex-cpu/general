# AI prompts: where they are and how to change them

## Prompts you can edit in the app (no code)

Staff can change these from the **gear icon → Settings**. Each save becomes a new version in the Airtable **Prompt Versions** table (Rise Voice base), so older versions can be restored. The starting text is in `src/lib/simplex/prompts.ts`.

| Group | Prompts |
|---|---|
| Global | Global Voice & Tone (`framework`), Session Brief Builder (`briefReader`), Topic Research (`topicResearch`) |
| Hooks | Talking Video, B-roll Text Overlay, Carousel, Graphic |
| Video scripts | Talking Script Fleshed / Framework, B-roll script, Video On-Screen CTA |
| Carousel & graphic | Carousel Slides, Graphic Copy, Carousel CTA, Graphic CTA, Production Creative Instructions |
| Captions | Instagram, Facebook, TikTok, YouTube Shorts |
| QA checklists | One per format, plus topics, hooks and captions |
| Output formats | The exact shape the AI must return. **Don't change these without a developer.** The app reads these shapes, so the wrong shape breaks it |

**How a scripting request is built:** `src/lib/slate/envelope.ts` puts together the role, the brand details, your guideline prompts, the output format and the QA checklist, in that order, for every topic, hook, script and caption request. To change the voice everywhere, edit **Global Voice & Tone**. To change one format, edit that format's prompt.

## Prompts written into the code (need a code change)

| Feature | File |
|---|---|
| Topic research (web search) | `src/routes/api/topics.ts` |
| Hooks / scripts / captions call setup | `src/routes/api/hooks.ts`, `script.ts`, `captions.ts` |
| Account analysis report | `src/routes/api/analyse.ts` |
| Brand strategy | `src/routes/api/brand-strategy.ts` |
| Carousel AI design (art direction) | `src/routes/api/ai-design.ts` (`SYSTEM`, `PLAN_SYSTEM`) |
| Divide scripts | `src/lib/divideScripts.shared.ts` |
| Repurposing your own posts | `src/lib/ownPostClaude.server.ts` |
| Inspo find / read / repurpose | `src/routes/api/inspo-find.ts`, `src/lib/inspoRead.server.ts`, `src/routes/api/inspo-repurpose.ts` |
| Podcast clipping | `src/lib/slate/podcastClipping.ts` |
| Brief and script parsing | `src/routes/api/parse-brief.ts`, `parse-script.ts`, `client-session-brief.ts` |
| Post naming, tagging | `src/routes/api/send-to-production.ts`, `src/lib/postTagging.server.ts` |

Step 2 of [PLAN.md](PLAN.md) moves the writing prompts from this list into Settings.

## Which AI model each feature uses

All model choices live in one file, `src/lib/aiModels.ts`, one line per job (topics, hooks, script, captions, design and so on). To try a newer model for a job, change that one line. Jobs marked "forced tool call" need a small code change before moving to Claude Opus 5.5, Sonnet 5.5 or Fable 5.1, because those models reject forced tool calls.

## Safe way to test a prompt change

1. Change it in Settings. Note the version number Airtable gives it.
2. Run the same brand and topic in the Script tab before and after.
3. If it's worse, restore the previous version from Prompt Versions.
