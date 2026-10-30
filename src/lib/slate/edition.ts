/**
 * Product editions.
 * - "agency-v1": staff (admin / strategist) tool. Script + Divide scripts still read
 *   brands, briefs and content from the Rise Voice base; these are slated to move to DWY.
 * - "creators-v1": the regular client app, fully on the DWY System base.
 */
export type Edition = "agency-v1" | "creators-v1";

export const EDITION_LABEL: Record<Edition, string> = {
  "agency-v1": "Agency V1",
  "creators-v1": "Creators V1",
};

const STAFF_ROLES = new Set(["admin", "strat", "strats", "strategist"]);

export function editionForRole(userType: string): Edition {
  return STAFF_ROLES.has(userType.trim().toLowerCase()) ? "agency-v1" : "creators-v1";
}
