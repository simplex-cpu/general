import type { ReactNode } from "react";

/** Shared section title that sits on the bare page background (Home excluded). */
export function SectionHeader({ title, actions, leading, className = "bg-social-feed" }: { title: string; actions?: ReactNode; leading?: ReactNode; className?: string }) {
  return (
    <header className={`flex min-h-12 shrink-0 items-center justify-between gap-4 ${className} px-5 pb-2 pt-4 sm:px-8`}>
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <h1 className="text-lg font-semibold tracking-normal text-brand-ink">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
