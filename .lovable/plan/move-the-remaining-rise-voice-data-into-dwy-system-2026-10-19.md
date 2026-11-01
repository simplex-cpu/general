# Move the remaining Rise Voice data into DWY System

Today a few features still read from the **Rise Voice** Airtable base. This plan moves them to **DWY System**, so the app uses a single base.

## What moves

| Rise Voice table | Used by |
|---|---|
| Client Admin | Staff brand list, brand brief, brief files, admin brand context |
| Content (Simplex) | Admin brand context (content samples), staff content helpers |
| Prompt Versions | Writing prompts |
| Team Roster | Collaborator / assignee list |

## Steps

1. **Map each table.** Check whether DWY System already has a matching table. Client Admin likely maps to DWY's Brand/User tables, and Content to Client Content. Write a field-by-field map, and list any fields DWY is missing.
2. **Confirm with you.** Show you the map before anything changes. Some tables may be duplicates of each other, and some may be staff-only and better left where they are.
3. **Create missing tables or fields** in DWY System through the new "Simplex's Airtable" connection.
4. **Copy the records.** Copy every record from Rise Voice into DWY. Relink records by name or email, then check the counts match. Nothing in Rise Voice is deleted.
5. **Switch the app.** Point the affected features at DWY System, using the same ownership checks as everything else.
6. **Verify:** brand list, brief view, file download, prompts, and assignees all load from DWY. Then publish.

## Technical details

- Files: list-brands.ts, brand-brief.ts, brief-file.ts, admin-brand-context.ts, prompts.ts, list-airtable-collaborators.ts, airtable.server.ts (SIMPLEX_BASE), airtableContent.server.ts.
- Rise Voice stays read-only as a backup. Rollback means changing the base IDs back.
- The AI studio job tracker stays in the Lovable Cloud database. It is not Airtable data.
