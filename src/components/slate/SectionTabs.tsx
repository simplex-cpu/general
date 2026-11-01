import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SectionTabItem = { id: string; label: string; icon: LucideIcon };

export function SectionTabs({
  items,
  active,
  onChange,
  ariaLabel,
}: {
  items: SectionTabItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`grid gap-1 rounded-lg bg-brand-tab-container p-1`}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <Button
            key={id}
            variant="ghost"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`h-12 min-w-0 flex-col gap-1 rounded-md px-1 text-[10px] sm:h-10 sm:flex-row sm:gap-2 sm:text-xs ${
              isActive
                ? "bg-brand-surface font-semibold text-brand-ink shadow-sm hover:bg-brand-surface"
                : "text-brand-ink-soft hover:bg-brand-surface/50"
            }`}
          >
            <Icon size={16} />
            <span className="whitespace-normal leading-tight">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
