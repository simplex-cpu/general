import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { installExternalLinkRouting } from "@/lib/slate/externalLink";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Risevoice Creators Hub" },
      { name: "description", content: "AI content studio for social media — reels, carousels, and performance analysis." },
      { property: "og:title", content: "Risevoice Creators Hub" },
      { property: "og:description", content: "AI content studio for social media — reels, carousels, and performance analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Risevoice Creators Hub" },
      { name: "twitter:description", content: "AI content studio for social media — reels, carousels, and performance analysis." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;700;900&family=Montserrat:wght@700;800&family=Playfair+Display:wght@700&family=Space+Grotesk:wght@500;700&display=swap" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@700&family=Archivo+Black&family=DM+Sans:wght@700&family=Manrope:wght@800&family=Plus+Jakarta+Sans:wght@800&family=Sora:wght@700&family=Outfit:wght@700&family=Syne:wght@800&family=Raleway:wght@800&family=Work+Sans:wght@700&family=Lato:wght@900&family=DM+Serif+Display&family=Fraunces:wght@700&family=Lora:wght@700&family=Libre+Baskerville:wght@700&family=Cormorant+Garamond:wght@700&family=Abril+Fatface&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
      }),
  );
  useEffect(() => installExternalLinkRouting(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
