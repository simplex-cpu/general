import { Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StatusStrip({
  clientName,
  scriptsLeft,
  scriptsBudget,
  reportsLeft,
  reportsBudget,
  onLogout,
  showAdmin,
  onGearClick,
  avatarUrl,
  onMyAccount,
}: {
  clientName: string;
  scriptsLeft: number | null;
  scriptsBudget: number | null;
  reportsLeft: number | null;
  reportsBudget: number | null;
  onLogout: () => void;
  analysisAccount?: string;
  onClearAnalysis?: () => void;
  showAdmin?: boolean;
  onGearClick?: () => void;
  avatarUrl?: string;
  onMyAccount?: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-brand-line bg-brand-surface/95 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-xl md:hidden">
      <div className="relative mx-auto grid h-[47px] max-w-lg grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-3">
        <div className="flex h-11 w-11 items-center justify-start">
          {showAdmin && onGearClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onGearClick}
              title="Admin settings"
              aria-label="Admin settings"
              className="h-11 w-11 rounded-full text-brand-ink-mid hover:bg-brand-wash hover:text-brand-accent"
            >
              <Settings size={20} />
            </Button>
          )}
        </div>
        <img src="/brand/wordmark-dark.svg" alt="Risevoice" className="mx-auto h-4 w-auto max-w-28" />
        <div className="flex h-11 w-11 items-center justify-end">
          {onMyAccount && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMyAccount}
                aria-label={clientName ? `Open ${clientName} account` : "Open my account"}
                title="My account"
                className="h-11 w-11 rounded-full p-0 hover:bg-brand-wash"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={clientName ? `${clientName} profile picture` : "Profile picture"}
                    className="h-9 w-9 rounded-full border border-brand-line object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line bg-brand-wash text-brand-ink-mid">
                    {clientName ? (
                      <span className="text-sm font-semibold">
                        {clientName.trim().charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User size={18} />
                    )}
                  </span>
                )}
              </Button>
          )}
        </div>
      </div>
    </header>
  );
}
