// Single source of truth for the team's Airtable Content table location.
export const CONTENT_BASE_ID = "appOttHso6hYjBXhw";
export const CONTENT_TABLE_ID = "tblQHZQtxSzkeqsCQ";

/** Link to the Content table; overridable with AIRTABLE_CONTENT_URL. */
export function contentTableUrl(): string {
  return (
    process.env.AIRTABLE_CONTENT_URL ||
    `https://airtable.com/${CONTENT_BASE_ID}/${CONTENT_TABLE_ID}`
  );
}
