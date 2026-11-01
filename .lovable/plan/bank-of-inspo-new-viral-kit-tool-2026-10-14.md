# Bank of Inspo (new Viral Kit tool)

## What you will get
- A fifth Viral Kit row, **Bank of Inspo**, that you can open the same way as Refine My Strategy. It uses the same compact row, the back arrow beside the title, the gray page and white cards.
- A white table where each row is one saved post. Columns: Post title (a short summary of the post), Post URL, Platform, Format, Creator Handle, Post age, Topic, Why it Works. A last column stays pinned to the right edge and holds two buttons: **Repurpose** (indigo) and **Delete** (outlined). The table scrolls sideways on narrow screens and those two buttons stay visible.
- An **Add inspo** button in the header. It opens a short form: URL, platform, format, creator handle, post copy, topic, posted date and why it works. If you leave the post title empty, the app writes a short one from the post copy.
- Each person sees only the posts they saved. Delete asks you to confirm first.
- **Repurpose** writes a new script for the brand you pick. It uses everything saved about the inspo post plus the brand brief: brand in a nutshell, target audience, pain points, topics, competitive edge, tone of voice and funnel. The prompt explains how to use each detail: copy the post's format and the reasons it worked, but write in the brand's voice, aimed at its audience and pain points. The script follows the same language rules as the scriptwriter. The result opens in the Script tab as a new session, where you can approve it, write captions and add it to the planner as usual. The session is also linked back to the inspo post.
- Posts can also be added to this table from other tables later. That is not part of this round.

## Airtable
New table **Bank of Inspo** in the base that already holds Chat sessions, with these fields:
Post Copy (long text), Created date (created time), URL (url), Post title (text), Created by (text: the saving user's access-code record), Creator handle (text), Topic (text), Format (single select: Talking Video, B-roll, Carousel, Graphic), Platform (single select: Instagram, TikTok, YouTube, LinkedIn, Other), Posted date (date), Post age (formula: days since Posted date), Why it works (long text), Repurpose (link to Chat sessions).

## Technical details
- Create the table through the Airtable connection after approval, and record its ID in a new `inspoBank.server.ts`.
- New API route `/api/inspo-bank` for listing, creating and deleting posts. It checks the access code, keeps everything scoped to the caller's own records, and verifies ownership before a delete.
- New route `/api/inspo-repurpose`. It checks the access code and brand ownership, loads the brief fields, then streams a call to `anthropic/claude-fable-5-1` on the gateway's Messages endpoint with adaptive thinking. Language rules come from the existing scripting prompts in `prompts.ts`, the CTA rules from `scriptCta.ts`, and Talking Video paragraph formatting from the shared helper. It creates a Chat sessions record through `writerSessions.server.ts`, links it in Repurpose, and returns the session id.
- Add `inspo` to `VIRAL_KIT_TOOLS` with its own mode, plus an `InspoBankMode` component. SlateApp opens ScriptMode on the returned session through the existing History continuation.
- Gateway errors are shown as plain messages (403 denials, 402 credits, 429 rate limits). The Repurpose button is locked while a script is being written.
- Tests: viralKit availability and destination for the new tool, plus ownership filtering in the server helper.
- Update AGENTS.md with one rule for Bank of Inspo storage and repurposing, and add the task to roadmap.md.

## Verification
- Check that the table and fields exist in Airtable. Check the layout at 1092px and 390px, including the pinned action column.
- Make one live Fable call and confirm a script comes back. A full end-to-end test (add, repurpose, open in Script) needs a signed-in access-code session, which is still not available.
