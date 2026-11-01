# Script field contract

The client writer already creates structured scripts. The save adapter, not a second AI call, maps those pieces to Airtable. Agency Content retains its independent existing contract.

| Format / piece | Client Content | Edit Yourself |
| --- | --- | --- |
| Talking Video spoken words (including natural spoken closing) | Script Text | Source speech |
| Talking Video visual hook | Visual Hook | Visual Hook |
| Talking Video visual CTA | visual cta | CTA |
| BROLL on-screen words | Text overlay | Text Overlay |
| Editor notes | Creative Direction | Creative Direction |
| Clip ranges | Timestamps | Timestamps |
| Carousel / Graphic | Cover Copy, Slides Copy, CTA Copy (existing slide contract) | Copy / ordered Slide copy fields |

Captions stay in the four existing platform-caption fields. BROLL has no spoken script, visual hook or visual CTA; its selected CTA belongs in captions. Talking Video's spoken CTA remains part of natural speech; the separate visual CTA is the editor's on-screen copy, not a second spoken paragraph.

`contentScriptFields.ts` owns field names, legacy labeled-prose compatibility, and format mapping. New card edits write explicit fields, including clears. Old labeled rows are read non-destructively and rewritten into separate fields on save. Unlabeled old scripts cannot yield a missing hook reliably; the user must supply it.

DIY creation keeps ownership, original Content linkage, request identity, footage and preferences in the existing atomic Edit Yourself write. This change does not trigger or modify n8n. Production review reads the separate fields; long-form videos retain Clipping style and their timing/direction.

## Required manual Airtable adjustment

The Airtable Metadata API rejected changing field types (HTTP 422: changing a field's type is not currently supported). In **Client Content**, **Short forms**, and **Edit Yourself**, change **Timestamps** from single-line text to long text. Keep the existing names and values; do not create replacement columns. The app sends one `HH:MM:SS-HH:MM:SS` range per line, but multiline preservation in these existing single-line fields remains unverified until that adjustment.

## Verification

65 focused regression tests cover mapping, legacy labels, explicit clears, timestamp normalization, captions/design copy compatibility, source scripts, preferences and submission retries. Preview compilation passes. The browser reaches the access-code gate with no runtime errors; authenticated card save/readback and live Edit Yourself creation remain unverified. No paid generation or external editing run was started.