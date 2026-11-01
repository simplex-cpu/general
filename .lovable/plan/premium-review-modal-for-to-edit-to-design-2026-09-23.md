# Premium review modal for "To Edit" / "To Design"

Replace the current two-button choice popup and the full-screen workspace takeover with a single, compact review modal that sits on top of the Posts Planner. The client reviews the post, checks the filmed material, then chooses who produces it.

## What the client sees

Clicking **To Edit** (videos) or **To Design** (graphics/carousels) in the To Film tab opens a centered modal card — roughly 560px wide, rounded, soft shadow, the planner still visible behind it. Not full screen.

Inside, top to bottom:

1. Post name, type badge, and posting date.
2. A preview panel showing the written words for that post: visual hook / text overlay for videos, slide copy for graphics and carousels. Rendered in the same phone-frame look already used elsewhere so it reads as a finished piece, not a form.
3. Captions per platform and the platforms it will go out on, shown as read-only text.
4. A **Filmed material** block: the raw files link and thumbnail when present, shown as a tidy row with a link out to the folder.
5. Two actions side by side:
   - **Request edit** / **Request design** — primary, filled indigo.
   - **Do it yourself** — secondary outline.

Nothing in this modal is editable.

## When no material is attached

If the post has no raw files link and no attachments, the Filmed material block shows an amber warning ("Add your filmed material before requesting an edit") and both action buttons are disabled. For graphics and carousels, which need no footage, the block is skipped and the buttons stay enabled.

## What each action does

- **Request edit / Request design**: sends the post to production and moves it to the Editing | Designing tab. The modal then switches in place to a confirmation state — a check mark, "Your request is in", one line on what happens next, and a Close button. The planner refreshes behind it.
- **Do it yourself**: same destination tab, but first walks the client through the extra self-serve steps. It opens the existing design/edit workspace preloaded with this post's words, exactly as it does today, and once finished the record lands in Editing | Designing.

## Technical notes

- Rework the `routeFor` modal in `src/components/slate/ApproveAndPostMode.tsx` from a two-button chooser into this review card, with local state for `submitting`, `submitted`, and `error`.
- Preview reuses the existing phone-preview component used by the design/edit screens; slide copy and hook come from the planner payload fields already returned (`script`, captions, `rawFilesLink`, `thumbnail`, `platforms`, `postType`).
- `Request edit` posts to the existing production endpoint used by the Risevoice request lane and patches `Client Status` to the Editing | Designing value via `clientBoardStatus()`, so no new Airtable columns are needed.
- The full-screen `studio` overlay stays for the `Do it yourself` lane only; remove nothing from `DesignAndEditMode`.
- Raw-material gate reads `rawFilesLink` plus attachments; video post types are gated, graphic/carousel types are not.
