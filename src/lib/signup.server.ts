// Creates a free-trial account in the DWY System base: a Users record, a Brand
// linked to it, an empty Brand brief, and an access code linked to the Brand.
// Ownership in the app runs Access code → Brand → Users, so all four are needed.
import { makeAccessCode, trialBrandName, type SignupInput } from "./signup";

const BASE = "appf1QABtQbAENYDz";
const USERS = "tblO9nM6xTdzJyyax";
const BRANDS = "tblho1mwlIMZfozue";
const BRIEFS = "tblkV5xOB2D1N5dNH";
const ACCESS_CODES = "tbl1Sc1qn5MhXc0Ta";

type Row = { id: string; fields: Record<string, any> };

async function airtable(token: string, path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Airtable ${path.split("?")[0]} failed [${res.status}]: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

const quote = (v: string) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export async function findUserByEmail(token: string, email: string): Promise<Row | null> {
  const formula = `LOWER({Email})='${quote(email.toLowerCase())}'`;
  const data = await airtable(token, `${USERS}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`);
  return data.records?.[0] || null;
}

async function codeExists(token: string, code: string): Promise<boolean> {
  const formula = `{Code}='${quote(code)}'`;
  const data = await airtable(token, `${ACCESS_CODES}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`);
  return Boolean(data.records?.length);
}

export async function createTrialAccount(
  token: string,
  input: SignupInput,
  credits: { scripts: number; reports: number },
): Promise<{ code: string; clientName: string }> {
  const create = (table: string, fields: Record<string, unknown>) =>
    airtable(token, table, { method: "POST", body: JSON.stringify({ fields, typecast: true }) }) as Promise<Row>;

  const brandName = trialBrandName(input);
  const user = await create(USERS, { "User name": input.name, Email: input.email });
  const brand = await create(BRANDS, { "Brand Name": brandName, Users: [user.id] });
  await create(BRIEFS, { "Brand Name": brandName, Brand: [brand.id] });

  let code = makeAccessCode();
  for (let tries = 0; tries < 3 && (await codeExists(token, code)); tries++) code = makeAccessCode();
  const access = await create(ACCESS_CODES, {
    Code: code,
    "Client Name": input.name,
    "User type": "User",
    Active: true,
    Brand: [brand.id],
  });

  // Credits are set separately: if these fields are formulas in this base the
  // write fails, and the account should still work.
  try {
    await airtable(token, `${ACCESS_CODES}/${access.id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: { "Scripts Budget": credits.scripts, "Reports Budget": credits.reports }, typecast: true }),
    });
  } catch (e) {
    console.warn("[signup] trial credits not set", e);
  }
  return { code, clientName: input.name };
}

/** Sends the new contact to GHL, which tags it and starts the nurture emails. Never blocks sign-up. */
export async function notifyGhl(url: string | undefined, payload: Record<string, unknown>): Promise<boolean> {
  if (!url) {
    console.warn("[signup] GHL_SIGNUP_WEBHOOK_URL not set; contact not sent to GHL");
    return false;
  }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 5000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctl.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) console.warn("[signup] GHL webhook", res.status);
    return res.ok;
  } catch (e) {
    console.warn("[signup] GHL webhook failed", e);
    return false;
  }
}
