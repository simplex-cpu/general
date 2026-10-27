# Production handoff contract repair

## Verified findings

The concern is correct: selected branding is not reliably sent as request-specific input.

- The app has two separate paths that create Edit Yourself records. They use different fields and statuses, can create duplicates, and do not consistently link to the original Content record.
- The current n8n entry receives only `record_id`. It reads the Edit Yourself row and falls back to the user’s current brand brief, so it does not preserve the exact style selected for that request.
- The active `Edit Yourself v2` workflow supports BROLL and hands Talking Video to a second workflow. Graphic and Carousel are unsupported there, yet recent design rows reached this video workflow and were marked Error for having no video footage.
- The video workflows create a new Content record after rendering instead of updating the linked original record. This can duplicate planner content and detach output from its request.
- Finished graphics/carousels are generated in the app, but an earlier placeholder Edit Yourself row can remain behind. Design work is also marked `Edited` instead of `Designed`.
- The existing `Original request` link is sufficient for the Content relationship, but it is not consistently populated. `Produced Files` is the real field behind the user-facing “Media to post” area, so no duplicate media field is needed.
- Content should use its existing `Approve` status. Edit Yourself already has the separate required statuses: `To Edit`, `To Design`, `Editing`, `Designing`, `Edited`, `Designed`, and `Error`.

## Fields to add to Edit Yourself

These request-scoped fields let n8n consume the exact approved choices instead of mutable brand defaults:

| Field | Type | Purpose |
|---|---|---|
| Request ID | Single line text | Stable idempotency key shared by every entry path |
| Brand brief | Linked record | Explicit brand used for this request |
| Production instructions | Long text | Request-specific instructions, kept separate from overlay copy |
| Style sample enabled | Checkbox | Records whether brand styling should be applied |
| Hook font | Single line text | Selected Talking Video hook font and weight |
| Hook text color | Single line text | Selected hook text color |
| Hook backing color | Single line text | Selected hook backing color |
| Hook backing opacity | Number | Selected hook backing opacity from 0–100 |
| Caption font | Single line text | Selected caption or BROLL overlay font and weight |
| Caption text color | Single line text | Selected caption or overlay color |
| Caption backing color | Single line text | Selected caption or overlay backing color |
| Caption backing opacity | Number | Selected caption or overlay backing opacity from 0–100 |
| Text position | Single select | Explicit overlay position, with center as fallback |
| Style snapshot | Long text | Versioned JSON backup for audit and replay |

Reuse existing fields for `Original request`, `Editing style`, footage, overlay, visual hook, CTA, music, copy, and slide copy. Do not create duplicates.

## Implementation

1. **Create one canonical request contract**
   - Centralize format, status, source Content ID, footage, copy, music, instructions, and style mapping.
   - Make “Produce now” and the DIY editor call the same request creator/updater.
   - Require `Request ID`; repeated submissions update the same request.

2. **Repair relationships and statuses**
   - Always populate `Original request` and `Brand brief`.
   - Video: `To Edit → Editing → Edited`.
   - Graphic/Carousel: `To Design → Designing → Designed`.
   - Move Content to `Approve` only after every output is confirmed.
   - Reuse the original Content record throughout.

3. **Send exact style choices**
   - Persist the selected hook/caption or overlay settings on the request without overwriting brand-wide defaults.
   - Use the brand brief only as fallback when a request field is empty.
   - Keep production instructions separate from `Text Overlay`.

4. **Correct workflow routing**
   - Prevent Graphic and Carousel from entering video workflows.
   - Validate style before changing status or checking footage.
   - Update BROLL and Talking Video workflows to read request fields first, then brand defaults.
   - Attach output to the original Content record and set it to `Approve`; never create a replacement.

5. **Make design completion atomic**
   - Create/update the request before rendering and mark it `Designing`.
   - Render one image per slide with the selected style.
   - Confirm every expected image before setting `Designed` and Content `Approve`.
   - On failure, set `Error`, retain the request, and support retry without duplication.

6. **QA coverage**
   - Add contract tests for all four formats and required fields/status transitions.
   - Test duplicate clicks, retries, missing footage, incomplete carousel uploads, style overrides, brand fallback, original-record updates, and instruction isolation.
   - Run pinned n8n tests for BROLL and Talking Video, plus negative routing tests for Graphic/Carousel.
   - Complete one end-to-end check per format and verify one Content record, one linked Edit Yourself record, correct output, and final `Approve` state.

## Result

Each request will have one traceable Content record and one linked Edit Yourself record. Automation will receive the exact selected branding, copy, footage, music, and instructions; video and design formats will follow separate valid paths; retries will not duplicate records.