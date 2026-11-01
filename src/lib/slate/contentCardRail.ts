// Left-rail parts of the content card per post format. Rows show section names only (no copy previews).
// Copy serialization stays in slideFields/splitScript.
export type CardShape = "carousel" | "graphic" | "broll" | "talking";
export type RailItem = { key: string; title: string };

export function railItems(shape: CardShape, parts: { slideTitles?: string[] }): RailItem[] {
  if (shape === "carousel") {
    const n = (parts.slideTitles || []).length;
    return Array.from({ length: n }, (_, i) => ({
      key: `s${i}`,
      title: i === 0 ? "Cover" : i === n - 1 && n > 2 ? "Closing slide" : `Slide ${i}`,
    }));
  }
  if (shape === "graphic") return [{ key: "s0", title: "Graphic" }];
  if (shape === "broll") return [{ key: "s0", title: "Text overlay" }];
  return [
    { key: "hook", title: "Visual hook" },
    { key: "script", title: "Script" },
  ];
}

export const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
