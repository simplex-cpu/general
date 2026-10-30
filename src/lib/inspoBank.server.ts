// Bank of Inspo = Airtable table in the DWY base; one row per saved post, owned via "Created by".
import type { AccessRecord } from "./accessCode.server";
import {
  resolveOwnerIdentity,
  linkContainsName,
  ownsRecord,
  linkedRecordIds,
} from "./owner.server";
import type { InspoPost } from "./slate/inspoBank";
import { derivePostTitle } from "./slate/inspoBank";

const BASE = "appf1QABtQbAENYDz";
export const INSPO_TABLE = "tblPwEu3sRyarNWfc"; // Bank of Inspo
const url = (id = "") => `https://api.airtable.com/v0/${BASE}/${INSPO_TABLE}${id ? `/${id}` : ""}`;

export async function inspoCtx(access: AccessRecord) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN not configured");
  const owner = await resolveOwnerIdentity(access, token);
  if (!owner) throw new Error("No user is linked to this access code");
  return {
    token,
    owner,
    h: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  };
}
type Ctx = Awaited<ReturnType<typeof inspoCtx>>;

function toPost(rec: any): InspoPost {
  const f = rec.fields || {};
  return {
    id: rec.id,
    title: String(f["Post title"] || ""),
    copy: String(f["Post Copy"] || ""),
    url: String(f.URL || ""),
    platform: String(f.Platform || ""),
    format: String(f.Format || ""),
    handle: String(f["Creator handle"] || ""),
    topic: String(f.Topic || ""),
    whyItWorks: String(f["Why it works"] || ""),
    postedDate: String(f["Posted date"] || ""),
    thumbnail: String(f.Thumbnail?.[0]?.thumbnails?.large?.url || f.Thumbnail?.[0]?.url || ""),
    views: typeof f.Views === "number" ? f.Views : null,
    likes: typeof f.Likes === "number" ? f.Likes : null,
    comments: typeof f.Comments === "number" ? f.Comments : null,
    createdDate: String(f["Created date"] || rec.createdTime || ""),
    repurposedSessions: linkedRecordIds(f.Repurpose),
    status: f.Status === "Repurposed" || linkedRecordIds(f.Repurpose).length ? "Repurposed" : "New",
  };
}

async function airtable(ctx: Ctx, path: string, init?: RequestInit) {
  const r = await fetch(path, { ...init, headers: ctx.h });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Airtable [${r.status}]: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

export async function listInspo(ctx: Ctx): Promise<InspoPost[]> {
  const out: InspoPost[] = [];
  let offset = "";
  do {
    const qs = new URLSearchParams({
      filterByFormula: linkContainsName("Created by", ctx.owner.name),
      pageSize: "100",
    });
    qs.append("sort[0][field]", "Created date");
    qs.append("sort[0][direction]", "desc");
    if (offset) qs.set("offset", offset);
    const data = await airtable(ctx, `${url()}?${qs}`);
    for (const rec of data.records || [])
      if (ownsRecord(rec.fields?.["Created by"], ctx.owner.id)) out.push(toPost(rec));
    offset = data.offset || "";
  } while (offset);
  return out;
}

export async function getOwnedInspo(ctx: Ctx, id: string): Promise<InspoPost | null> {
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return null;
  const r = await fetch(url(id), { headers: ctx.h });
  if (!r.ok) return null;
  const rec: any = await r.json();
  return ownsRecord(rec.fields?.["Created by"], ctx.owner.id) ? toPost(rec) : null;
}

export type NewInspo = Omit<InspoPost, "id" | "createdDate" | "repurposedSessions" | "status">;
export async function createInspo(ctx: Ctx, p: NewInspo): Promise<InspoPost> {
  const fields: Record<string, unknown> = {
    "Post title": derivePostTitle(
      p.title,
      p.copy || (p.handle ? `Post by @${p.handle.replace(/^@/, "")}` : ""),
    ),
    "Post Copy": p.copy,
    URL: p.url || undefined,
    Platform: p.platform || undefined,
    Format: p.format || undefined,
    "Creator handle": p.handle,
    Topic: p.topic,
    "Why it works": p.whyItWorks,
    "Posted date": p.postedDate || undefined,
    Thumbnail: p.thumbnail ? [{ url: p.thumbnail }] : undefined,
    Views: p.views ?? undefined,
    Likes: p.likes ?? undefined,
    Comments: p.comments ?? undefined,
    "Created date": new Date().toISOString(),
    "Created by": [ctx.owner.id],
    Status: "New",
  };
  const data = await airtable(ctx, url(), {
    method: "POST",
    body: JSON.stringify({ fields, typecast: true }),
  });
  return toPost(data);
}

export async function deleteInspo(ctx: Ctx, id: string): Promise<boolean> {
  if (!(await getOwnedInspo(ctx, id))) return false;
  await airtable(ctx, url(id), { method: "DELETE" });
  return true;
}

export async function updateInspo(
  ctx: Ctx,
  id: string,
  patch: Partial<NewInspo>,
): Promise<InspoPost | null> {
  if (!(await getOwnedInspo(ctx, id))) return null;
  const names: Record<keyof NewInspo, string> = {
    title: "Post title",
    copy: "Post Copy",
    url: "URL",
    platform: "Platform",
    format: "Format",
    handle: "Creator handle",
    topic: "Topic",
    whyItWorks: "Why it works",
    postedDate: "Posted date",
    thumbnail: "Thumbnail",
    views: "Views",
    likes: "Likes",
    comments: "Comments",
  };
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as (keyof NewInspo)[])
    fields[names[key]] = key === "thumbnail" ? (patch.thumbnail ? [{ url: patch.thumbnail }] : null) : (patch[key] ?? null);
  const data = await airtable(ctx, url(id), {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  });
  return toPost(data);
}

export async function linkRepurpose(ctx: Ctx, post: InspoPost, sessionId: string) {
  await airtable(ctx, url(post.id), {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        Status: "Repurposed",
        Repurpose: Array.from(new Set([...post.repurposedSessions, sessionId])),
      },
    }),
  });
}
