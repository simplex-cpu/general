// Vista Social integration API helpers (server only).
// Base URL and auth header per Vista Social's integration API.

const BASE = "https://vistasocial.com/api/integration";

export type VsProfile = {
  id: number;
  name: string;
  network: string;
  network_code: string;
  username: string | null;
  nickname: string | null;
  profile_url: string | null;
  status: string;
  status_detail: string | null;
};

export type VsGroup = { id: string; name: string; type?: string };

function key() {
  return process.env.VISTASOCIAL_API_KEY || "";
}

export function vistaConfigured() {
  return !!key();
}

async function vsFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const k = key();
  if (!k) throw new Error("Vista Social is not configured on this project");
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  const r = await fetch(`${BASE}/${path}${qs}`, {
    headers: { "api-key": k, Accept: "application/json" },
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Vista Social request failed [${r.status}]: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Vista Social returned an unexpected response");
  }
}

export function listGroups(q?: string) {
  return vsFetch<VsGroup[]>("groups", q ? { q } : undefined);
}

export function listProfiles(groupId?: string) {
  return vsFetch<VsProfile[]>("profiles", groupId ? { group_id: groupId } : undefined);
}

// Airtable platform key -> Vista Social network_code values.
export const NETWORK_BY_PLATFORM: Record<string, string[]> = {
  Instagram: ["instagram"],
  Tiktok: ["tiktok"],
  Youtube: ["youtube"],
  Facebook: ["facebook", "facebook_group"],
  Linkedin: ["linkedin", "linkedin_profile", "linkedin_company"],
};

export type PlatformState = {
  status: "Connected" | "In Progress" | "To Connect" | "Needs attention";
  handle: string;
  profileUrl: string;
  detail: string;
};

// Turn the Vista Social profile list into one state per platform we surface.
export function mapProfilesToPlatforms(profiles: VsProfile[]): Record<string, PlatformState> {
  const out: Record<string, PlatformState> = {};
  for (const [platform, codes] of Object.entries(NETWORK_BY_PLATFORM)) {
    const matches = profiles.filter((p) => codes.includes(String(p.network_code || "").toLowerCase()));
    if (!matches.length) continue;
    const healthy = matches.find((p) => String(p.status).toLowerCase() === "ok");
    const chosen = healthy || matches[0];
    out[platform] = {
      status: healthy ? "Connected" : "Needs attention",
      handle: chosen.username || chosen.nickname || chosen.name || "",
      profileUrl: chosen.profile_url || "",
      detail: healthy ? "" : String(chosen.status_detail || "This profile needs to be reconnected."),
    };
  }
  return out;
}

// Pick the profile group that most likely belongs to a brand name.
export function matchGroupByName(groups: VsGroup[], brandName: string): VsGroup | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const target = norm(brandName || "");
  if (!target) return null;
  const exact = groups.find((g) => norm(g.name) === target);
  if (exact) return exact;
  const partial = groups.find((g) => {
    const n = norm(g.name);
    return n.includes(target) || target.includes(n);
  });
  return partial || null;
}
