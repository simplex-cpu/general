import type { Format } from "@/lib/simplex/types";

export type FormatBalanceStats = Record<Format, { posted: number; pipeline: number }>;
export type FormatRecommendations = Record<Format, number>;
export type FormatBalanceTone = "green" | "yellow" | "red";

export const FORMAT_BALANCE_ORDER: Format[] = ["broll", "talkingVideo", "graphic", "carousel"];

export const FORMAT_BALANCE_LABELS: Record<Format, string> = {
  broll: "BROLL",
  talkingVideo: "Talking Video",
  graphic: "Graphic",
  carousel: "Carousel",
};

export function getFormatDifference(
  stats: FormatBalanceStats | undefined,
  format: Format,
  recommended: number,
) {
  const posted = Math.max(0, Math.round(Number(stats?.[format]?.posted) || 0));
  const pipeline = Math.max(0, Math.round(Number(stats?.[format]?.pipeline) || 0));
  const rec = Math.max(0, Math.round(Number(recommended) || 0));
  return rec - posted - pipeline;
}

export function getFormatBalanceTone(
  stats: FormatBalanceStats | undefined,
  format: Format,
  recommended: number,
): FormatBalanceTone {
  const rec = Math.max(0, Math.round(Number(recommended) || 0));
  const diff = getFormatDifference(stats, format, rec);
  if (diff <= 0) return "green";
  if (diff >= rec - 2) return "red";
  return "yellow";
}

export function getHighestNeedFormat(
  stats: FormatBalanceStats | undefined,
  recommendations: Partial<FormatRecommendations>,
): Format | null {
  let best: Format | null = null;
  let bestDiff = 0;
  for (const format of FORMAT_BALANCE_ORDER) {
    const diff = getFormatDifference(stats, format, recommendations[format] ?? 0);
    if (diff > bestDiff) {
      best = format;
      bestDiff = diff;
    }
  }
  return best;
}