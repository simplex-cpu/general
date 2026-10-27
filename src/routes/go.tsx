import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Same-origin redirect interstitial.
 *
 * Opening instagram.com straight from the embedded preview lands in a context
 * the site refuses to render (ERR_BLOCKED_BY_RESPONSE). Opening this page
 * instead gives us a same-origin document that can perform its own top-level
 * navigation, which the target site does allow. If we somehow end up framed,
 * we fall back to a manual button + copyable URL.
 */
export const Route = createFileRoute("/go")({
  ssr: false,
  component: GoPage,
  head: () => ({
    meta: [
      { title: "Opening link — Slate" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Open a social post from your Risevoice content workspace." },
      { property: "og:title", content: "Opening post — Risevoice" },
      { property: "og:description", content: "Open a social post from your Risevoice content workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function GoPage() {
  const [url, setUrl] = useState("");
  const [framed, setFramed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("u") || "";
    let target = "";
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") target = parsed.toString();
    } catch {
      target = "";
    }
    if (!target) return;
    setUrl(target);

    if (window.top !== window.self) {
      setFramed(true);
      return;
    }
    window.location.replace(target);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-lg font-semibold text-foreground">
          {url ? "Opening the post…" : "No link provided"}
        </h1>
        {url && (
          <>
            <p className="text-sm text-muted-foreground break-all">{url}</p>
            <div className="flex items-center justify-center gap-2">
              <a
                href={url}
                target="_top"
                rel="noreferrer"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Open post
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(url).then(() => setCopied(true));
                }}
                className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            {framed && (
              <p className="text-xs text-muted-foreground">
                If nothing happens, copy the link and paste it into a new browser tab.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
