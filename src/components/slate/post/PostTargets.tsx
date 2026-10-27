import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrandMultiSelect, BrandSelect } from "../BrandSelect";
import { formatsFor } from "@/lib/slate/postTargets";

type Account = { id: string; platform: string; handle: string; status: string };
const chip = "[&>button]:h-6 [&>button]:px-1.5 [&>button]:text-[12px] [&>button]:font-medium [&>button]:text-[#374151]";
const multi = "w-auto min-w-[72px] text-xs [&>button]:mt-0 [&>button]:h-6 [&>button]:border-transparent [&>button]:bg-transparent [&>button]:py-0 [&>button]:text-[12px] [&>button]:shadow-none";

/** Card header controls: brand, the brand's connected accounts, and post formats. */
export function PostTargets({ accessCode, brands, brandId, accountIds, formats, icon, onBrand, onTargets }: {
  accessCode: string;
  brands: { id: string; name: string }[];
  brandId: string;
  accountIds: string[];
  formats: string[];
  icon: (platform: string) => ReactNode;
  onBrand: (brandId: string) => void;
  onTargets: (accountIds: string[], formats: string[]) => void;
}) {
  const accountsQuery = useQuery({
    queryKey: ["post-accounts", brandId, accessCode],
    enabled: Boolean(brandId && accessCode),
    staleTime: 60000,
    queryFn: async () => {
      const r = await fetch(`/api/post-accounts?brandId=${encodeURIComponent(brandId)}`, { headers: { "x-access-code": accessCode } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not load accounts");
      return (data.accounts || []) as Account[];
    },
  });
  const accounts = accountsQuery.data || [];
  const platformsOf = (ids: string[]) => [...new Set(accounts.filter((a) => ids.includes(a.id)).map((a) => a.platform))];
  const formatChoices = formatsFor(platformsOf(accountIds));
  const brandLabel = brands.find((b) => b.id === brandId)?.name;

  return (
    <>
      <BrandSelect className={chip} value={brandId} placeholder={brandLabel || "Brand"} options={brands.map((b) => ({ label: b.name, value: b.id }))} onChange={onBrand} />
      {brandId && (
        accountsQuery.isLoading ? <span className="px-1.5 text-[12px] text-[#9CA3AF]">Accounts…</span>
        : accounts.length === 0 ? <span title="Connect accounts for this brand in My Brand" className="px-1.5 text-[12px] text-[#9CA3AF]">No connected accounts</span>
        : <BrandMultiSelect className={multi} placeholder="Post to" values={accountIds}
            options={accounts.map((a) => ({ label: `@${a.handle || a.platform}${a.status && a.status !== "Active" ? " (signed out)" : ""}`, value: a.id, icon: icon(a.platform) }))}
            onChange={(next) => { const allowed = new Set(formatsFor(platformsOf(next))); onTargets(next, formats.filter((f) => allowed.has(f))); }} />
      )}
      {formatChoices.length > 0 && (
        <BrandMultiSelect className={multi} placeholder="Formats" values={formats}
          options={formatChoices.map((f) => ({ label: f, value: f }))}
          onChange={(next) => onTargets(accountIds, next)} />
      )}
    </>
  );
}
