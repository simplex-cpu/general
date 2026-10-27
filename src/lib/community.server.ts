import type { AccessRecord } from "./accessCode.server";
import { airtableHeaders, resolveUserRecordId, LEARNING_BASE, T_USERS, T_BRANDS } from "./learning.server";
import { communityInput, extractHashtags, ownsCommunityPost, canPostStrategy, assertCommunityPostPermission, type CommunityPost } from "./community";
import type { z } from "zod";
import { publicCommunityProfile } from "./community";

export async function getCommunityProfile(postId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: post, error } = await db.from("community_posts").select("author_id, author_name").eq("id", postId).maybeSingle();
  if (error || !post) throw new Error("This profile is no longer available.");
  const headers = airtableHeaders();
  if (!headers) throw new Error("Profiles are temporarily unavailable.");
  const accessTable = "tbl1Sc1qn5MhXc0Ta";
  async function read(table: string, id: string): Promise<Record<string, unknown> | null> {
    if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return null;
    const response = await fetch(`https://api.airtable.com/v0/${LEARNING_BASE}/${table}/${id}`, { headers: headers || {} });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Could not load this profile. Please try again.");
    const result = await response.json() as { fields?: Record<string, unknown> };
    return result.fields || {};
  }
  const user = await read(T_USERS, post.author_id);
  let access = user ? null : await read(accessTable, post.author_id);
  if (user) {
    const brands = Array.isArray(user.Brands) ? user.Brands : [];
    for (const brandId of brands) {
      if (typeof brandId !== "string") continue;
      const brand = await read(T_BRANDS, brandId);
      const ids = brand?.["Access code user"];
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        if (typeof id !== "string") continue;
        const candidate = await read(accessTable, id);
        if (!candidate) continue;
        const identity = await resolveUserRecordId({ id, code: "", clientName: "", userType: "", active: true, fields: candidate }, headers);
        if (identity === post.author_id) { access = candidate; break; }
      }
      if (access) break;
    }
  }
  return publicCommunityProfile(access || {}, post.author_name);
}

export async function handleCommunity(input: z.infer<typeof communityInput>, record: AccessRecord) {
  const canPublishStrategy = canPostStrategy(record.userType);
  if (input.action === "post") assertCommunityPostPermission(input.category || "general", record.userType);
  const headers = airtableHeaders();
  const authorId = (headers ? await resolveUserRecordId(record, headers) : null) || record.id;
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const check = (error: { message: string } | null) => { if (error) { console.error("[community]", error.message); throw new Error("Community is unavailable. Please try again."); } };
  if (input.action === "feed") {
    let query = db.from("community_posts").select("*").order("created_at", { ascending: false }).limit(21);
    if (input.before) query = query.lt("created_at", input.before);
    if (input.filter === "strategy") query = query.eq("category", "strategy");
    if (input.filter === "support") query = query.not("support_url", "is", null);
    if (input.filter === "mine") query = query.eq("author_id", authorId);
    const { data, error } = await query;
    check(error);
    const rows = (data || []).slice(0, 20);
    const ids = rows.map((row) => row.id);
    if (!ids.length) return { items: [] as CommunityPost[], next: null, canPostStrategy: canPublishStrategy };
    const [reactions, comments] = await Promise.all([
      db.from("community_reactions").select("*").in("post_id", ids),
      db.from("community_comments").select("*").in("post_id", ids).order("created_at"),
    ]);
    check(reactions.error); check(comments.error);
    const items: CommunityPost[] = rows.map((row) => {
      const all = (reactions.data || []).filter((reaction) => reaction.post_id === row.id);
      const own = all.find((reaction) => reaction.author_id === authorId)?.reaction;
      return {
        id: row.id, authorName: row.author_name, body: row.body, tags: row.tags, supportUrl: row.support_url, createdAt: row.created_at,
        mine: ownsCommunityPost(row.author_id, authorId),
        category: row.category === "strategy" ? "strategy" : "general",
        reactions: { like: all.filter((r) => r.reaction === "like").length, celebrate: all.filter((r) => r.reaction === "celebrate").length, support: all.filter((r) => r.reaction === "support").length },
        myReaction: own === "like" || own === "celebrate" || own === "support" ? own : null,
        comments: (comments.data || []).filter((c) => c.post_id === row.id).map((c) => ({ id: c.id, authorName: c.author_name, body: c.body, createdAt: c.created_at })),
      };
    });
    return { items, next: (data?.length ?? 0) > 20 ? rows.at(-1)?.created_at ?? null : null, canPostStrategy: canPublishStrategy };
  }
  if (input.action === "post" && input.body) {
    const { error } = await db.from("community_posts").insert({ author_id: authorId, author_name: record.clientName || "Risevoice member", body: input.body, tags: extractHashtags(input.body, input.tags || []), support_url: input.supportUrl || null, category: input.category || "general" });
    check(error);
  } else if (input.postId) {
    const { data: post, error } = await db.from("community_posts").select("author_id").eq("id", input.postId).maybeSingle();
    check(error);
    if (!post) throw new Error("This post is no longer available.");
    if (input.action === "delete") {
      if (!ownsCommunityPost(post.author_id, authorId)) throw new Error("You can only delete your own posts.");
      check((await db.from("community_posts").delete().eq("id", input.postId).eq("author_id", authorId)).error);
    } else if (input.action === "comment" && input.body) {
      check((await db.from("community_comments").insert({ post_id: input.postId, author_id: authorId, author_name: record.clientName || "Risevoice member", body: input.body })).error);
    } else if (input.action === "react") {
      if (input.reaction) check((await db.from("community_reactions").upsert({ post_id: input.postId, author_id: authorId, reaction: input.reaction }, { onConflict: "post_id,author_id" })).error);
      else check((await db.from("community_reactions").delete().eq("post_id", input.postId).eq("author_id", authorId)).error);
    }
  }
  return { items: [] as CommunityPost[], next: null, canPostStrategy: canPublishStrategy };
}