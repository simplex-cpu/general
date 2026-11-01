# App and Airtable production handoff repair

## Scope

Implement the supplied field contract entirely in the app and Airtable handoff. Do not inspect, edit, publish, or trigger n8n; its sequence remains your responsibility.

## Confirmed contract

- Video requests must be fully saved before any external trigger: one original Content link, one matching User, exact `BROLL` or `Talking Video` style, footage, format-specific copy, selected brand/brief, and editing preferences.
- Talking Video preferences use separate nested `hook` and `captions` objects. The hook styling also controls the visual CTA; captions retain their own styling.
- BROLL preferences use the supplied flat object.
- Graphic and Carousel remain in the app’s design flow and never enter the video automation.
- Successful media belongs in the original Content record’s `Produced Files`; Content finishes at `Approve`.
- Current code still writes request styling through individual legacy fields and can attach an unverified Content ID before ownership validation. The planner path also creates a partially populated request before the editor has final footage and styling.
- Airtable metadata verification is currently blocked by that connection’s schema permissions, so implementation will treat the uploaded contract as authoritative and surface any missing-field error precisely rather than silently dropping data.

## Implementation

1. **Replace the request preference mapping**
   - Add `Brands`, linked `Brand brief`, and `Editing preferences` to the shared request field contract.
   - Serialize and validate the exact JSON shapes from the supplied contract.
   - Parse font family and weight separately, normalize colors to `#RRGGBB` or `none`, clamp opacity to 0–100, and deliberately map the existing preview size to the required 1–20 vmin range.
   - Keep production instructions separate from overlays, hooks, captions, and CTA.

2. **Resolve brand and brief explicitly**
   - Resolve the brand from the selected/original Content record.
   - Resolve the matching brief explicitly; never write a Brand record ID into `Brand brief` and never choose an arbitrary brief.
   - Save both linked-record arrays on each request when available.

3. **Secure and unify request persistence**
   - Validate the original Content record and ownership before creating or updating its linked request.
   - Require one stable Request ID and make retries update the same Edit Yourself row.
   - Whitelist every accepted request field; reject arbitrary client-supplied Airtable field names.
   - Keep videos at `To Edit` when handed off. Keep designs on `To Design → Designing → Designed`.

4. **Correct each format payload**
   - BROLL: ordered footage or clip links, full Text Overlay, music attachment/reference, and flat Editing preferences.
   - Talking Video: ordered footage or clip links, Visual Hook, CTA, and nested hook/caption Editing preferences with independent caption styling.
   - Graphic/Carousel: selected branding, design copy, source media, and app-rendered output only; no video-only fields or trigger behavior.

5. **Repair the two entry paths**
   - Planner “Produce now / Do it myself”: create the Content record and one linked pending Edit Yourself request without pretending an incomplete video is ready for automation.
   - Production editor: complete or update that same request with footage, exact selected preferences, brand/brief, and format copy.
   - Standalone editor: create its Content record first, then create one linked complete request using the same shared contract.

6. **Make design completion consistent**
   - Attach every rendered image to the original Content record’s `Produced Files`.
   - Confirm the full expected image count before setting Edit Yourself to `Designed` and Content to `Approve`.
   - Preserve `Error` and retry the same request when attachment synchronization fails.

7. **Schema and error handling**
   - Add or correct the three Airtable fields when schema access permits: linked `Brands`, linked `Brand brief`, and long-text `Editing preferences`.
   - If the Airtable credential still cannot modify schema, stop only that schema step and report the exact three manual field definitions; complete all code changes without touching n8n.
   - Return Airtable’s actual status and error body so missing fields or type mismatches are immediately identifiable.

8. **QA**
   - Add tests for all four formats, distinct Talking Video hook/caption styles, CTA inheritance, BROLL flat preferences, size/color/opacity normalization, ownership, retries, incomplete footage, incomplete carousel images, and instruction isolation.
   - Verify one request per Content record and the exact Airtable payload for every entry path.
   - Run project tests and checks. Do not call the webhook or modify n8n.

## Result

The app will hand Airtable one complete, idempotent, correctly linked request with the exact fields expected by your corrected workflows. Your n8n work can then handle triggering and sequence logic independently.
