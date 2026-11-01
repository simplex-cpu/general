// Reads the access code that ClientGate persisted after server validation.
const ACCESS_KEY = "simplex_access";
export function getStoredAccessCode(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = sessionStorage.getItem(ACCESS_KEY);
    if (!raw) return "";
    return JSON.parse(raw).code || "";
  } catch {
    return "";
  }
}
