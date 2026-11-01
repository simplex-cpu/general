# My Brand gallery and Community refinements

## Scope
Restructure **My Brand only**. Do not add brand switching to Home, Script, or Planner, and do not change n8n. Keep the sidebar name **My Brand**.

## 1. Community and Home refinements
- Remove the outline around the Creator Circle / Ask your team tab strip.
- Use the same darker gray as the posts area for the strip and its surrounding band. Keep the selected tab clear, with its existing light surface and icons.
- Give **Open community** enough width for comfortable left/right spacing around the label and arrow. Preserve its slim height, bottom-left placement, indigo color, and existing button text size. Allow similarly long Home action labels enough room without enlarging the neutral filters.

## 2. My Brand gallery
- Always open My Brand on the gallery, including when the user has only one brand.
- Place the page title at the top left and an indigo **Add new brand** button at the top right.
- Each clickable card shows a contained logo thumbnail, brand name, brief completion percentage with a small progress bar, and connected platform icons with accessible labels.
- Use a tidy grid with restrained borders, consistent card dimensions, and a neutral logo placeholder when no logo exists.
- Include loading, retry, and empty states. The empty state offers the same Add new brand action.

## 3. Add a brand
- Open a compact dialog asking for a brand name and optional logo.
- Create the brand and its linked brief for the signed-in owner, then open the new brand's Brief tab.
- Prevent duplicate submissions, show saving/errors clearly, and refresh the gallery after creation.
- Do not require a completed brief or connected account to create a brand.

## 4. Brand detail
- Clicking a gallery card opens a full detail view for that brand, with a back arrow to My Brand, the brand logo/name, and three equal-width icon tabs:
  - **Brief** — existing brand questions and logo editing.
  - **Visual Style** — existing font, color, backing, layout, and preview controls.
  - **Connected Accounts** — existing platform handles, connection actions, and connection statuses.
- Match the revised Community tab styling.
- Scope every read, save, logo upload, and social connection action to the selected brand.
- Protect unsaved edits when changing brands or leaving the detail view; switching tabs must not discard the draft.
- Refresh the gallery's logo, name, completion, and connection indicators after changes.

## Completion rule
Use the nine existing Brief text fields, equally weighted. A trimmed nonempty field counts as filled; completion is the rounded filled-field percentage. Logo, Visual Style, and Connected Accounts do not count toward **brief** completion. Thus an empty brief is 0%, and all nine filled fields is 100%.

## Technical approach and safeguards
- Current code opens a single brief using an access-code lookup capped at one record. Introduce owned-brand listing and creation, plus explicit selected-brand reads/writes, rather than reusing that lookup for every card.
- First inspect the actual Airtable Brands/Brand brief ownership links and field types. Reuse verified existing relationships; add only the fields or links required for owned multi-brand management. Do not assume the live schema from source constants alone.
- Reuse stable user-record ownership checks on the server; deny access to unowned brand IDs. Gallery responses contain only presentation data, never account passwords or credentials.
- Keep the existing account-linked brand as the legacy default for other app sections. New brands must not accidentally become Script's or production's default because a query returns a different first record.
- Preserve existing records and connections; leave staff reference-document tools separate.
- Keep completion calculation and brand field definitions shared so gallery and detail cannot disagree. Reuse the existing style editor and connection service rather than introducing parallel behavior.
- A new brand without a configured connection destination must show an honest unavailable state, not a nonworking Connect button or another brand's connection link.

## Verification
- Test completion values for empty, partially filled, whitespace-only, and complete briefs.
- Test owned-brand access and rejection of another user's brand IDs; test single-flight creation.
- With a real signed-in account, create a brand, return to the gallery, reopen it, save its brief/style, and confirm the correct record reads back. Confirm editing one brand does not change another or the existing default used elsewhere.
- Check existing account connection/reconnect behavior; report any external setup needed for newly added brands separately.
- Check Community tab appearance and Home button spacing, plus gallery/detail layouts at desktop and phone widths, including long brand names and missing logos.
- Run focused tests and check preview errors before reporting completion. If real-account access is unavailable, explicitly report those checks as unverified.