// Server-only helper to validate an access code against Airtable.
// Used by every protected API route to prevent unauthenticated callers
// from triggering paid AI work or reading/mutating client data.

const AIRTABLE_BASE = "appf1QABtQbAENYDz";
const AIRTABLE_TABLE = "tbl1Sc1qn5MhXc0Ta";

export type AccessRecord = {
  id: string;
  code: string;
  clientName: string;
  userType: string; // "Admin" | "User" | ...
  active: boolean;
  fields: Record<string, any>;
};

function json(body: unknown, status: number, cors = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cors) {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function lookupCode(code: string, token: string): Promise<AccessRecord | null> {
  const safe = code.replace(/'/g, "\\'");
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(
    `{Code}='${safe}'`,
  )}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Airtable lookup failed: ${r.status}`);
  const data = await r.json();
  const rec = data.records?.[0];
  if (!rec) return null;
  const f = rec.fields || {};
  return {
    id: rec.id,
    code,
    clientName: String(f["Client Name"] || ""),
    userType: String(f["User type"] || "User").trim(),
    active: f.Active === true,
    fields: f,
  };
}

export type AuthOpts = {
  /** Require the caller's User type to equal "Admin". */
  adminOnly?: boolean;
  /** Require Admin or Strat user type. */
  staffOnly?: boolean;
  /** Send CORS headers on error responses. */
  cors?: boolean;
};

export type AuthResult =
  | { ok: true; record: AccessRecord }
  | { ok: false; response: Response };

/**
 * Validate an access code that was sent in a request body or query string.
 * On failure returns a Response the route can return directly.
 */
export async function requireAccessCode(
  code: string | null | undefined,
  opts: AuthOpts = {},
): Promise<AuthResult> {
  const cors = !!opts.cors;
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    return { ok: false, response: json({ error: "Server misconfigured" }, 500, cors) };
  }
  const trimmed = typeof code === "string" ? code.trim() : "";
  if (!trimmed || trimmed.length > 200) {
    return { ok: false, response: json({ error: "Access code required" }, 401, cors) };
  }
  let record: AccessRecord | null;
  try {
    record = await lookupCode(trimmed, token);
  } catch (e) {
    console.error("[accessCode] lookup failed:", e);
    return { ok: false, response: json({ error: "Auth lookup failed" }, 502, cors) };
  }
  if (!record) {
    return { ok: false, response: json({ error: "Invalid access code" }, 401, cors) };
  }
  if (!record.active) {
    return { ok: false, response: json({ error: "Access code deactivated" }, 403, cors) };
  }
  const roleLower = record.userType.toLowerCase();
  if (opts.adminOnly && roleLower !== "admin") {
    return { ok: false, response: json({ error: "Admin access required" }, 403, cors) };
  }
  if (opts.staffOnly) {
    const isStaff = roleLower === "admin" || roleLower === "strat" || roleLower === "strats" || roleLower === "strategist";
    if (!isStaff) {
      return { ok: false, response: json({ error: "Staff access required" }, 403, cors) };
    }
  }
  return { ok: true, record };
}
