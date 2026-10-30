# Podcast reference review — approved structures

These uploads are independent presentation references, not excerpts from the existing Long form record. Do not reuse their copy or speaker identities in generated posts.

## BROLL

Visible overlay (visually verified):

> Every man who was told "men don't cry" as a boy needs to hear this

The supplied video is approximately 5.12 seconds. The inspected frame shows podcast footage with one complete audience-specific editorial hook in a compact light backing. It does not show a multi-card overlay sequence. The audio parser returned “Welcome to my channel”; this has not been independently verified and must not be treated as an exact approved soundtrack transcript.

Proposed rule: select relevant podcast footage and write one editorial overlay that identifies the audience and the tension/value of the source moment. Keep overlay separate from any spoken quote. Do not claim the overlay was spoken. Preserve accurate source range and speaker provenance for the footage.

## Graphic

Exact visible copy:

> your shame is dressed as anger!

Two podcast participants flank a dominant central headline; “dressed” has an emphasized backing. No subtitle is visible. Without the source recording, whether this is a literal quote cannot be established.

Proposed rule: one concise source-supported headline, optionally emphasize a phrase, with optional speaker imagery/attribution. Only mark it as a quotation when verified against the source. No mandatory visible subtitle for this podcast-specific template.

## Carousel — supplied eight-slide example

Exact primary text, visually checked in numbered order:

1. Death has nothing to do with age
2. Someone dies peacefully in their sleep at 45, and everyone asks how it could happen.
3. Celebrity psychic Dr Tamanna C says we misunderstand death.
4. “People associate death with suffering. People associate death with illness or sickness.”
5. “Death has got nothing to do with sickness or age. That can show up at any time.”
6. It’s why she says we shouldn’t hold them back with guilt or anger once they’ve gone.
7. So love the people around you now, while they’re here.
8. Want the full conversation? / Comment KARMA for the episode

Slide 1 also includes the visible speaker label @tamannac.psychic and “Celebrity Psychic & Karmic Coach”. These identify this example only.

This is not an all-quote carousel: it combines an editorial hook, context, explicit speaker introduction, two marked quotations, interpretation, takeaway and an editorial conversation CTA. Images alternate between the participants. Image choice alone does not prove who spoke the overlaid quotation.

Proposed sequence: hook → source context → speaker introduction → supported quotations → clearly editorial interpretation → takeaway → optional genuine conversation CTA. Retain exact quotations with approved light cleanup only. The final CTA must use a user-supplied destination/keyword; never invent KARMA or an offer. This example contains eight slides, so it needs an approved podcast-specific schema rather than silently cutting its final slide under the existing cover-plus-six limit.

Second carousel style: missing. Do not invent it or enable automatic two-style mixing until it is supplied and verified.

## Talking Video

Visually verified opening editorial hook:

> You can love someone with everything and still leave like they never existed

Visible speaker label: @sara, “Narcissism & Love Expert”. The frames show the same participant speaking, with changing short uppercase transcription fragments. This reference demonstrates a separate opening editorial hook and timed spoken subtitles, not an invented new script.

Audio parser draft (not certified exact; questionable phrases remain uncorrected):

> I can love you so deeply, but I can leave you as if you never existed. You already fed it as a human, now you have to feed your soul. So I'm very disciplined even with my pain, but I can love you like you are everything to me, but leave you like you never existed. I prayed and I prayed for God, teach me the attachment. Not because I wanna be cold, not because I'm stoic or I don't care about people, but if I feel like it's not reciprocated, not respected, I will leave like you never existed. I've processed it and made peace with pain because it's a teacher, not a punishment.

“You already fed it as a human” and “teach me the attachment” may be recognition errors. Do not silently correct them and call the result verbatim. Obtain a verified transcript or subtitle evidence for these passages before using this draft as an exact-copy fixture.

Proposed rule: select the actual speaker’s coherent source passage, preserve source words and ordered cuts, allow only approved filler/repetition removal. New editorial visual hook is separate. Timed subtitles derive from the same retained source words. No appended spoken CTA.

## Required approval

Approve the supplied carousel as a mixed editorial-and-quote narrative, with eight slides allowed only in its podcast template; approve BROLL editorial overlay and headline-only Graphic as separate podcast templates. Keep second-style mixing blocked until its reference arrives. Talking Video source words remain authoritative, and the parser draft is not an exact-copy test fixture.

## Implementation and handoff

The approved structures now apply to clipper generation only. Talking Video speech is assembled directly from consecutive source segments; the writing model selects a passage and supplies a separate editorial visual hook. Source quotations must match original words and their speaker. No spoken CTA is invented. Podcast carousel copy keeps eight slides through the planner handoff; standard scripting templates are unchanged.

Long-video transcription explicitly requests speaker labels, word timing, original language, and the documented 600-minute safety cap (previous default: 120). Diarization uses an 8 GB run with a longer service timeout. Speaker labels are automatic and may split one person into multiple labels; unknown identities remain unidentified. Multi-hour transcript text is stored across ordered Transcript / Transcript 2–10 fields and joined on reads; oversized results are rejected, never silently truncated.

Source notes are kept after the structured Post copy for persistence but excluded from editable and rendered copy. Edits cannot replace source notes or introduce new spoken words. Planner handoff reads the owned short-form record rather than trusting a browser CTA exemption. Source ranges and speaker passages are passed as Creative Instructions to the Content/DIY request; n8n must interpret those instructions for actual footage cutting and should not append a podcast spoken CTA. n8n was not changed. Legacy untimed transcripts can support static posts, but video clipping requires a new timed transcription or an uploaded timed transcript.

Verification: all four real gateway generation calls passed source validation on synthetic timed speech; rule tests cover speaker attribution, source-only speech, edits, long text storage, and eight-slide handoff. Actual multi-hour diarization and owned-account production remain unverified.

## October 15 completion batches

- Private Cloud operation records protect one generation slot and one board handoff at a time. A staged Airtable save is reconciled by its operation key; an ambiguous write never starts a duplicate blindly. Definitively rejected writes can be corrected and resumed. Completed slots remain completed after a short-form deletion.
- `Long forms.Speaker names` stores a user-confirmed label-to-name map without rewriting the original transcript. `Transcript details` and numbered continuation fields retain coverage evidence and provider word timing. Missing coverage evidence remains visibly unverified. Large requests select bounded transcript windows across the recording, preserving original segment IDs.
- Optional Talking Video cleanup removes only standalone hesitation tokens and immediately repeated hesitation pronouns/conjunctions. Negations and meaningful emphasis remain. `Source notes.cleanup` retains original speech, cleaned speech, retained words and ordered word-derived cuts. Without exact word alignment, cleanup is refused rather than guessing timing.
- Client Content gets `Clipper operation key`, `Short forms` and `Long forms` links at creation. Retried queue/production handoffs reuse this record. Edit Yourself retains the existing Request ID, brand links and style snapshot, plus `Source speech` and `Source cuts` for Talking Video. Production instructions include immutable source notes and confirmed speaker names.
- **User-managed sequence requirements:** when cleanup exists, use `Source speech` for the retained spoken subtitles and cut `Source cuts` in order; otherwise use the original timed segment ranges. Keep the editorial Visual Hook separate from recorded speech. Do not append a spoken CTA. Consume the complete request once using Request ID and return output/status to the linked Content record. No n8n changes were made or verified.
- Live-account limitation: the preview is signed out and managed session restoration reported no auth users. The existing long-form record was found, but lacks stored word-timing details. Its full coverage, real source-to-post saves and production links remain unverified; signing in through the app is required for the final owned-record checks.