// Outside sites (Instagram, TikTok, Drive) often refuse pages opened straight from the app
// (especially inside the editor preview frame). Routing through our same-origin /go page
// makes the final hop a normal top-level visit those sites accept.
export function externalHref(url: string): string {
  const raw = (url || "").trim();
  if (!/^https?:\/\//i.test(raw)) return raw;
  if (typeof window !== "undefined") {
    try {
      if (new URL(raw).origin === window.location.origin) return raw;
    } catch {
      return raw;
    }
  }
  return `/go?u=${encodeURIComponent(raw)}`;
}

/** Same rule for code that opens links imperatively. */
export function openExternal(url: string): Window | null {
  return window.open(url, "_blank");
}

/**
 * One app-wide rule: every outside link (anchors with target=_blank and window.open)
 * goes through /go, so no screen can bypass it. Returns an uninstall function.
 */
export function installExternalLinkRouting(): () => void {
  if (typeof window === "undefined" || window.location.pathname === "/go") return () => {};
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || a.hasAttribute("download")) return;
    const next = externalHref(a.href);
    if (next === a.href || !next.startsWith("/go")) return;
    e.preventDefault();
    window.open(next, "_blank");
  };
  const original = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const s = url == null ? "" : String(url);
    return original(s && !s.startsWith("/go") ? externalHref(s) : s, target, features);
  }) as typeof window.open;
  document.addEventListener("click", onClick, true);
  return () => {
    document.removeEventListener("click", onClick, true);
    window.open = original;
  };
}
