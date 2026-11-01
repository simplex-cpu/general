import { createFileRoute } from "@tanstack/react-router";
import SlateApp from "@/components/slate/SlateApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Risevoice Creators Hub" },
      {
        name: "description",
        content: "AI content studio for social media — reels, carousels, and performance analysis.",
      },
      { property: "og:title", content: "Risevoice Creators Hub" },
      {
        property: "og:description",
        content: "AI content studio for social media — reels, carousels, and performance analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SlateApp,
});
