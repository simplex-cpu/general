import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const names: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", facebook: "Facebook", linkedin: "LinkedIn" };

export const Route = createFileRoute("/connected")({
  validateSearch: (s: Record<string, unknown>) => ({ connected: typeof s.connected === "string" ? s.connected : undefined, error: typeof s.error === "string" ? s.error : undefined }),
  head: () => ({ meta: [
    { title: "Account connection | Risevoice" }, { name: "description", content: "Result of connecting a social account to your Risevoice brand." },
    { property: "og:title", content: "Account connection | Risevoice" }, { property: "og:description", content: "Result of connecting a social account to your Risevoice brand." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Connected,
});

function Connected() {
  const { connected, error } = Route.useSearch();
  const ok = !!connected && !error;
  const name = names[String(connected || "").toLowerCase()] || "Your account";
  return <main className="grid min-h-screen place-items-center bg-social-feed p-6 text-brand-ink">
    <section className="w-full max-w-sm rounded-lg border border-brand-line bg-brand-surface p-6 text-center">
      {ok ? <CheckCircle2 className="mx-auto text-progress-high" size={36} /> : <XCircle className="mx-auto text-destructive" size={36} />}
      <h1 className="mt-3 text-base font-semibold">{ok ? `${name} connected` : "Connection didn't finish"}</h1>
      <p className="mt-2 text-sm text-brand-ink-soft">{ok ? "You can close this tab. Your brand page updates on its own." : error ? `The platform said: ${error}` : "Please try again from your brand page."}</p>
      <Button asChild className="mt-5 h-10 w-full rounded-md bg-brand-accent text-xs text-brand-surface hover:bg-brand-blue-light"><Link to="/">Back to my brand</Link></Button>
    </section>
  </main>;
}
