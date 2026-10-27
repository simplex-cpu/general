export type ScriptBrand = { id: string; name: string; brandIds: string[] };

/** True when a History session belongs to the chosen brand. Sessions saved
 * before brand links existed (no brand) belong to the brand without links. */
export function sessionMatchesBrand(
  sessionBrandIds: string[] | undefined,
  brand: ScriptBrand | null,
  allBrands: ScriptBrand[],
): boolean {
  if (!brand) return true;
  const ids = sessionBrandIds || [];
  if (ids.some((id) => brand.brandIds.includes(id))) return true;
  if (brand.brandIds.length > 0) return false;
  // Legacy brand: claim sessions no other brand owns.
  return !ids.some((id) => allBrands.some((b) => b.brandIds.includes(id)));
}

/** A single owned brand is chosen automatically; otherwise the user picks. */
export function autoBrand(brands: ScriptBrand[]): ScriptBrand | null {
  return brands.length === 1 ? brands[0] : null;
}

/** Name of the brand a History session belongs to, shown in its title. */
export function sessionBrandName(
  sessionBrandIds: string[] | undefined,
  allBrands: ScriptBrand[],
): string {
  return allBrands.find((b) => sessionMatchesBrand(sessionBrandIds, b, allBrands))?.name || "";
}
