import { z } from "zod";

export const reactionKinds = ["like", "celebrate", "support"] as const;
export const communityProfileInput = z.object({ accessCode: z.string().min(1).max(200), postId: z.string().uuid() });
export type CommunityProfile = { name: string; photo: string; bio: string; website: string; instagram: string };

export function safeProfileLink(value: unknown, instagram = false): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const raw = value.trim();
  const candidate = instagram && /^@?[\w.]+$/.test(raw) ? `https://www.instagram.com/${raw.replace(/^@/, "")}/` : raw;
  try {
    const url = new URL(candidate);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return "";
    if (instagram && !["instagram.com", "www.instagram.com"].includes(url.hostname)) return "";
    return url.href;
  } catch { return ""; }
}

export function publicCommunityProfile(fields: Record<string, unknown>, fallbackName: string): CommunityProfile {
  const pics = fields["Profile Picture"];
  const pic = Array.isArray(pics) ? pics[0] : undefined;
  return {
    name: typeof fields["Client Name"] === "string" ? fields["Client Name"] : fallbackName,
    photo: safeProfileLink(pic && typeof pic === "object" ? pic.url : ""),
    bio: typeof fields["Community Bio"] === "string" ? fields["Community Bio"] : "",
    website: safeProfileLink(fields["Community Website"]),
    instagram: safeProfileLink(fields["Community Instagram"], true),
  };
}
export const communityInput = z.object({
  accessCode: z.string().min(1).max(200),
  action: z.enum(["feed", "post", "react", "comment", "delete"]),
  postId: z.string().uuid().optional(),
  body: z.string().trim().min(1).max(4000).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).optional(),
  supportUrl: z.string().url().refine((url) => new URL(url).protocol === "https:", "Use an HTTPS link").optional(),
  reaction: z.enum(reactionKinds).nullable().optional(),
  before: z.string().datetime().optional(),
  filter: z.enum(["all", "support", "strategy", "mine"]).optional(),
  category: z.enum(["general", "strategy"]).optional(),
}).superRefine((value, ctx) => {
  if (["react", "comment", "delete"].includes(value.action) && !value.postId) ctx.addIssue({ code: "custom", message: "Post required" });
  if (["post", "comment"].includes(value.action) && !value.body) ctx.addIssue({ code: "custom", message: "Write a message first" });
  if (value.action === "comment" && (value.body?.length ?? 0) > 2000) ctx.addIssue({ code: "custom", message: "Comment is too long" });
  if (value.action === "react" && value.reaction === undefined) ctx.addIssue({ code: "custom", message: "Reaction required" });
});

export type CommunityPost = {
  id: string; authorName: string; body: string; tags: string[]; supportUrl: string | null; createdAt: string; mine: boolean; category: "general" | "strategy";
  reactions: Record<(typeof reactionKinds)[number], number>;
  myReaction: (typeof reactionKinds)[number] | null;
  comments: { id: string; authorName: string; body: string; createdAt: string }[];
};

export function extractHashtags(body: string, tags: string[]) {
  return [...new Set([...tags, ...Array.from(body.matchAll(/#([\p{L}\p{N}_]+)/gu), (match) => match[1])].map((tag) => tag.replace(/^#/, "").toLowerCase()))].filter(Boolean).slice(0, 8);
}

export function ownsCommunityPost(authorId: string, viewerId: string) { return authorId === viewerId; }

export function canPostStrategy(userType: string) {
  return ["admin", "strat", "strats", "strategist"].includes(userType.trim().toLowerCase());
}

export function assertCommunityPostPermission(category: "general" | "strategy", userType: string) {
  if (category === "strategy" && !canPostStrategy(userType)) throw new Error("Only the team can post strategy ideas.");
}