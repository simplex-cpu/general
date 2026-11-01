// Free-trial sign-up rules, shared by /api/signup and its tests.

export type SignupInput = { name: string; email: string; instagram: string };

export const SIGNUP_LIMITS = { name: 80, email: 254 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;

/** "@maya.coaching", "instagram.com/maya.coaching/" and "maya.coaching" all become "maya.coaching". */
export function cleanInstagram(raw: unknown): string {
  let v = String(raw ?? "").trim();
  v = v.replace(/^https?:\/\//i, "").replace(/^(www\.)?instagram\.com\//i, "").replace(/^@/, "");
  v = v.split(/[/?#]/)[0] || "";
  return v;
}

export function cleanSignup(raw: unknown): { ok: true; value: SignupInput } | { ok: false; error: string } {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  // Hidden "website" field: people never fill it in, bots usually do.
  if (String(src.website ?? "").trim()) return { ok: false, error: "Sign-up failed. Please try again." };
  const name = String(src.name ?? "").trim().replace(/\s+/g, " ");
  const email = String(src.email ?? "").trim().toLowerCase();
  const instagram = cleanInstagram(src.instagram);
  if (!name) return { ok: false, error: "Add your name." };
  if (name.length > SIGNUP_LIMITS.name) return { ok: false, error: "That name is too long." };
  if (!EMAIL.test(email) || email.length > SIGNUP_LIMITS.email) return { ok: false, error: "Add a valid email address." };
  if (instagram && !HANDLE.test(instagram)) return { ok: false, error: "That Instagram handle doesn't look right." };
  return { ok: true, value: { name, email, instagram } };
}

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o, 1/l/i

/** A new access code such as "rv-k7m2q9xa": easy to read out, hard to guess. */
export function makeAccessCode(randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `rv-${out}`;
}

/** The brand a trial starts with: their Instagram handle, or their name. */
export function trialBrandName(input: SignupInput): string {
  return input.instagram ? `@${input.instagram}` : input.name;
}
