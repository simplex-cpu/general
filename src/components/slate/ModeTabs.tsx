import {
  Home,
  BookOpen,
  Sparkles,
  PenLine,
  Scissors,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  Route,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Markblock } from "./Markblock";
import { primaryNavigationMode } from "@/lib/slate/viralKit";

export type Mode =
  | "learning"
  | "growth"
  | "community"
  | "brief"
  | "analyze"
  | "inspo"
  | "clipper"
  | "viral-kit"
  | "script"
  | "divide"
  | "design-edit"
  | "approve-post";

const TABS: { id: Mode; label: string; icon: LucideIcon; home?: boolean; soon?: boolean }[] = [
  { id: "learning", label: "Home", icon: Home, home: true },
  { id: "growth", label: "Growth Path", icon: Route, soon: true },
  { id: "community", label: "Community", icon: Users },
  { id: "brief", label: "My Brand", icon: BookOpen },
  { id: "viral-kit", label: "Viral Kit", icon: Sparkles },
  { id: "script", label: "Script", icon: PenLine },
  { id: "divide", label: "Divide scripts", icon: Scissors },
  { id: "approve-post", label: "Planner", icon: CalendarDays },
];

export function ModeTabs({
  mode,
  onChange,
  showDivide = false,
  showBrief = false,
  showLearning = false,
  clientName,
  avatarUrl,
  scriptsLeft,
  reportsLeft,
  onMyAccount,
  onSettings,
  display = "both",
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  showDivide?: boolean;
  showBrief?: boolean;
  showLearning?: boolean;
  clientName: string;
  avatarUrl?: string;
  scriptsLeft: number | null;
  reportsLeft: number | null;
  onMyAccount?: () => void;
  onSettings?: () => void;
  display?: "desktop" | "mobile" | "both";
}) {
  const [collapsed, setCollapsed] = useState(mode === "script");
  useEffect(() => {
    if (mode === "script") setCollapsed(true);
  }, [mode]);
  const tabs = TABS.filter((t) => {
    if (t.id === "divide" && !showDivide) return false;
    if (t.id === "brief" && !showBrief) return false;
    if (t.id === "growth" && !showLearning) return false;
    return true;
  });

  return (<>
    {display !== "mobile" && <aside className={`sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-brand-line bg-brand-surface transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-64"}`}>
      <div className={`flex h-16 items-center border-b border-brand-line ${collapsed ? "justify-center" : "px-6"}`}>
        {collapsed ? <Markblock className="h-[19px] w-[19px]" /> : <img src="/brand/wordmark-dark.svg" alt="Risevoice" className="h-[19px] w-auto max-w-[136px]" />}
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" aria-label="Primary navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = primaryNavigationMode(mode) === tab.id;
          return (
            <Button key={tab.id} variant="ghost" type="button" aria-current={active ? "page" : undefined} title={tab.soon ? "Coming soon" : collapsed ? tab.label : undefined} disabled={tab.soon} onClick={() => !tab.soon && onChange(tab.id)} className={`h-11 disabled:pointer-events-auto disabled:cursor-not-allowed w-full justify-start rounded-lg px-3 ${active ? "bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/15" : "text-brand-ink-mid hover:bg-brand-wash hover:text-brand-ink"} ${collapsed ? "justify-center" : ""}`}>
              <Icon className="shrink-0" />
              {!collapsed && <span className="truncate font-medium">{tab.label}</span>}
            </Button>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-brand-line p-3">
        {!collapsed && (scriptsLeft !== null || reportsLeft !== null) && (
          <div className="rounded-lg border border-brand-line bg-brand-wash p-3 text-xs text-brand-ink-mid">
            <div className="flex justify-between"><span>Scripts left</span><strong className="text-brand-ink">{scriptsLeft ?? "—"}</strong></div>
            <div className="mt-1.5 flex justify-between"><span>Reports left</span><strong className="text-brand-ink">{reportsLeft ?? "—"}</strong></div>
          </div>
        )}
        {onSettings && <Button variant="ghost" type="button" title="Admin settings" onClick={onSettings} className={`h-10 w-full text-brand-ink-mid hover:bg-brand-wash ${collapsed ? "justify-center px-0" : "justify-start"}`}><Settings />{!collapsed && "Settings"}</Button>}
        {onMyAccount && <Button variant="ghost" type="button" title="My account" onClick={onMyAccount} className={`h-auto min-h-11 w-full text-brand-ink hover:bg-brand-wash ${collapsed ? "justify-center px-0" : "justify-start"}`}>
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-wash"><User size={15} /></span>}
          {!collapsed && <span className="min-w-0 text-left"><span className="block truncate text-xs font-semibold">{clientName || "My account"}</span><span className="block text-[10px] font-normal text-brand-ink-soft">My account</span></span>}
        </Button>}
        <Button variant="ghost" size="icon" type="button" onClick={() => setCollapsed((value) => !value)} className={`${collapsed ? "mx-auto flex" : "ml-auto flex"} h-10 w-10 text-brand-ink hover:bg-brand-wash [&_svg]:size-[22px]`} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed}>
          {collapsed ? <PanelLeftOpen strokeWidth={1.5} /> : <PanelLeftClose strokeWidth={1.5} />}
        </Button>
      </div>
    </aside>}
    {display !== "desktop" && <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-brand-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-xl md:hidden" aria-label="Primary navigation">
      <div className="mx-auto grid h-[4.5rem] w-full grid-flow-col auto-cols-[minmax(62px,1fr)] overflow-x-auto px-1.5">
          {tabs.map((t) => {
            const active = primaryNavigationMode(mode) === t.id;
            const Icon = t.icon;
            return (
              <Button
                variant="ghost"
                key={t.id}
                type="button"
                title={t.soon ? "Coming soon" : undefined}
                disabled={t.soon}
                onClick={() => !t.soon && onChange(t.id)}
                aria-current={active ? "page" : undefined}
                className={`relative h-full disabled:pointer-events-auto disabled:cursor-not-allowed min-w-0 flex-col gap-1 rounded-none px-1 py-2 text-[10px] font-medium active:scale-[0.97] ${active ? "text-brand-accent hover:bg-brand-wash hover:text-brand-accent" : "text-brand-ink-soft hover:bg-brand-wash hover:text-brand-ink"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-brand-accent/10" : ""}`}><Icon size={20} strokeWidth={active ? 2.4 : 1.8} /></span>
                <span className="block max-w-full truncate leading-none">{t.label}</span>
              </Button>
            );
          })}
      </div>
    </nav>}
  </>
  );
}
