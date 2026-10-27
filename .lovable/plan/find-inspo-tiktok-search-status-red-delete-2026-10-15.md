# Find Inspo (TikTok search) + Status + red Delete

## What you will get
- A **Find Inspo** button next to **Add inspo**.
- Clicking it opens a gray pop-up with two choices:
  - **I have search terms**: up to 5 terms, each 2 words max. The app blocks longer terms and tells you why.
  - **Generate them for me**: pick a brand. AI writes 5 TikTok search terms from that brand's target audience, using their pains and their goals, plus what is trending on social media. You can edit the terms before the search runs.
- The search looks at TikTok posts from the last 180 days. It checks up to 30 posts per term, sorted by engagement. For each term it keeps the top 5 posts with at least 10,000 views, or at least 200 likes for photo posts.
- Each post it keeps goes through the same reading as Add inspo: platform, creator handle, post age in days, transcript or on-screen text, format, topic, a topic-free "Why it works" and post copy. Posts are then saved straight to your bank. The pop-up shows progress ("Searching…", "Reading 3 of 12…") and how many posts were added. Posts already in your bank are skipped.
- A new **Status** column: **New** (yellow) for new posts and **Repurposed** (green) once a post has been repurposed.
- The Delete button in the table is red. The delete confirmation is gray like the other pop-ups, and its Delete button is red too. Delete is checked end to end so the row really goes away in Airtable.

## Airtable
- Add a **Status** single-select field to Bank of Inspo with the options New (yellow) and Repurposed (green). Existing rows count as New, or Repurposed if they already link to a repurposed session.

## Technical details
- New route `/api/inspo-find`, protected by access code, that streams progress events:
  - `generate` step: uses the shared Lovable Responses helper with the selected brief's audience, pain points and topics. Returns exactly 5 terms of 1–2 words each, validated with Zod.
  - `search` step: runs the Apify `clockworks~tiktok-scraper` with `searchQueries` (one run per term), `resultsPerPage: 30` and `searchSection` set to videos. Results are filtered to the last 180 days, sorted by engagement ((likes+comments+shares)/views, falling back to likes), and checked against the thresholds: views ≥ 10k for videos, likes ≥ 200 for photo/slideshow posts. The top 5 per term are kept, and duplicates are removed by URL across terms and against existing rows.
  - Each candidate goes through the existing `readInspo()` pipeline with limited concurrency (2), then `createInspo()` with Status New. If one post fails, it is skipped and reported without stopping the others.
- Validation shared in `inspoValidation.ts`: `searchTerms` (1–5 terms, ≤2 words each). Unit tests for the term rule, the threshold and age filter, and top-5 selection.
- `inspoBank.server.ts`: map `Status`. `linkRepurpose()` also sets Status to Repurposed.
- UI: `InspoBankMode.tsx` gets the Find Inspo button, the choice/terms/progress dialog (gray `bg-social-feed`), a Status badge column, a red destructive Delete icon button, and the AlertDialog restyled gray with a red action. The delete flow (`remove` → DELETE `/api/inspo-bank?id=`) is checked in the browser, including the error toast and removing the row from the list.
- Note: Apify searches use credits for each term, so one full run can take a few minutes.

## Verification
- Run one live Apify search with a sample term and confirm the filtering works. Check that the field exists in Airtable. Check the dialogs and colors in the browser with sample data. A real signed-in save still needs an access-code session.
