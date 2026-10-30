# Add the 5 posted-content fields to Client Content

## What happens
Create these long-text fields in the **Client Content** table (the one Home and Planner read):
- Posted Caption
- Posted Transcript
- Posted Hook
- Posted Cover
- Posted Slide Copy

Nothing else in Airtable changes. No existing fields are renamed or touched.

## How
- Use your connected Airtable account through the Airtable connection, calling its "create field" action once per field on base `appf1QABtQbAENYDz`, table `tblucGgVsDiDGdyyK`, type Long text.
- If a field with that name already exists, skip it.
- If no Airtable connection is available, or it isn't allowed to change the table's structure, I'll show the connect card (or tell you which permission it needs) instead of guessing.

## Check
- Read the table's field list back to confirm all 5 exist.
- Then "Refresh stats" on Home will start filling them; no app changes needed.
