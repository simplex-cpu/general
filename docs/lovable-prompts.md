# Prompts for Lovable

Paste one prompt at a time into Lovable, after the pull request with the server side has been merged. Each prompt says which files to touch, so Lovable doesn't change anything else. Copy for every screen is in `docs/launch-copy.md`.

---

## 1. Landing page for visitors who aren't logged in

> Build a public landing page shown at "/" to visitors who are not logged in. Logged-in users keep seeing the app exactly as today.
>
> - Where: `src/components/simplex/ClientGate.tsx` currently shows the access-code box when there's no session. Show the new landing page instead, and move the existing access-code form behind a "Log in" button (a dialog or a separate view). Don't change how the access code is checked or stored.
> - Put the landing page in a new file, `src/components/simplex/LandingPage.tsx`.
> - Style: match the app. Poppins, white background, accent #4F6BFF, ink #1A1A1D, generous spacing, rounded 10–14px corners.
> - Sections and copy: use "Landing page" in `docs/launch-copy.md` exactly: navigation, hero, proof line, how it works (5 steps), two feature rows, plans (no prices), questions, closing band, footer.
> - Images: `public/landing/planner.jpg` (hero, full width under the buttons, with a soft shadow), `public/landing/send-to-avatar.jpg` and `public/landing/refine.jpg` (feature rows).
> - Buttons: "Start free trial" opens the sign-up screen (prompt 2). "Get it done for you" and "Apply for done for you" open [GHL application form link] in a new tab. "Log in" opens the access-code form.
> - It must work on phones: single column, no horizontal scrolling.

## 2. Sign-up screen

> Add a free-trial sign-up screen, opened from "Start free trial" on the landing page.
>
> - New file: `src/components/simplex/SignupForm.tsx`. Same look as today's access-code screen (dark background, RISEVOICE wordmark, rounded inputs, accent button).
> - Fields: Your name, Email, Instagram handle (optional). Also add a hidden text input named `website` (visually hidden, not focusable) and send its value too.
> - On submit, POST to `/api/signup` with JSON `{ name, email, instagram, website }`.
> - On success the response is `{ ok: true, code, clientName, userType }`. Save it exactly the way ClientGate saves a login: `sessionStorage.setItem("simplex_access", JSON.stringify({ code, clientName, userType, validatedAt: Date.now() }))`. Then show the success message from `docs/launch-copy.md` with the code, and a "Start" button that reloads the page so the app opens.
> - On error the response is `{ error }`. Show that text under the button.
> - Disable the button while the request runs, with the text "Creating your account…".
> - Link under the button: "Already a client? Log in with your access code" opens the access-code form.

## 3. Refine buttons on scripts

> Add a "Refine" box under each editable text piece in two places: the script cards in the Script tab (`src/components/slate/chat/ScriptCard.tsx`) and the post window in the Planner (the Script tab of the post dialog in `src/components/slate/ApproveAndPostMode.tsx`).
>
> - The box has five chips: Shorter, Punchier, More like me, Different angle, Stronger CTA (ids `shorter`, `punchier`, `moreLikeMe`, `differentAngle`, `strongerCta`), plus a text input "Or tell it what to change…" and a "Refine" button.
> - Clicking a chip, or "Refine" with text typed, POSTs to `/api/refine` with JSON: `{ accessCode, piece, format, platform, text, preset, instruction, brief }`.
>   - `piece`: "hook", "script", "slides", "cta" or "caption", depending on which field the box sits under.
>   - `format`: "talkingVideo", "broll", "carousel" or "graphic" (the post's format).
>   - `platform`: only for captions: "instagram", "facebook", "tiktok" or "youtube".
>   - `text`: the field's current text. `preset`: the chip id, if a chip was clicked. `instruction`: the typed text, if any.
>   - `brief`: send the same brief object the Script tab already sends to `/api/script`. In the Planner, leave it out.
> - The response is `{ text }` or `{ error }`. Show the rewrite under the field with two buttons: "Use this" (replaces the field text and saves it exactly like a manual edit) and "Keep mine" (dismisses it).
> - While it runs, show "Refining…" and disable the chips.
> - Keep the box compact: one row of chips and one input row, as in `public/landing/refine.jpg`.

## 4. "Send to avatar" button (after the avatar pipeline is ready)

> *Send this once "To Avatar" has been added to Client Status in Airtable. The endpoint `/api/send-to-avatar` is ready.*
>
> On talking-video posts in the Planner's Prepare Footage tab (`src/components/slate/ApproveAndPostMode.tsx`), add a primary "Send to avatar" button before "Attach", and make "Attach" a secondary button, as in `public/landing/send-to-avatar.jpg`. It POSTs `{ accessCode, id }` to `/api/send-to-avatar`, then refreshes the row. The response is `{ ok, status }` or `{ error }`; show the error text if there is one. Posts with the status "To Avatar" show a pill "Avatar video · rendering".
