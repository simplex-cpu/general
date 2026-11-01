import { z } from "zod";
import { INSPO_FORMATS, INSPO_PLATFORMS } from "./inspoBank";

export const postUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((value) => {
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Enter a valid post URL");
export const inspoFields = z
  .object({
    title: z.string().trim().max(200).default(""),
    url: postUrl,
    platform: z.enum(INSPO_PLATFORMS),
    format: z.enum(INSPO_FORMATS).or(z.literal("")).default(""),
    handle: z.string().max(200).default(""),
    copy: z.string().max(20000).default(""),
    topic: z.string().max(300).default(""),
    whyItWorks: z.string().max(10000).default(""),
    thumbnail: z.string().trim().max(2000).refine((v) => !v || /^https:\/\//.test(v)).default(""),
    views: z.coerce.number().int().min(0).nullable().optional(),
    likes: z.coerce.number().int().min(0).nullable().optional(),
    comments: z.coerce.number().int().min(0).nullable().optional(),
    postedDate: z
      .string()
      .refine(
        (v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))),
        "Enter a valid date",
      )
      .default(""),
  })
  .strict();
export const inspoPatch = inspoFields.partial();

export function detectInspoPlatform(value: string): string {
  try {
    const host = new URL(value).hostname.toLowerCase();
    const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    if (is("instagram.com")) return "Instagram";
    if (is("tiktok.com")) return "TikTok";
    if (is("youtube.com") || host === "youtu.be") return "YouTube";
    if (is("linkedin.com")) return "LinkedIn";
  } catch {
    /* An incomplete URL is not a platform. */
  }
  return "";
}

export function metadataIsCurrent(requestUrl: string, currentUrl: string) {
  return requestUrl.trim() === currentUrl.trim();
}
