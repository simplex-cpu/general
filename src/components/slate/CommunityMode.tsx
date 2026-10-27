import { SectionHeader } from "./SectionHeader";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Heart, MessageCircle, PartyPopper, HandHeart, Send, Trash2, Users, Loader2, Hash, Rss, UserRound, Plus, Lightbulb, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CommunityProfileDialog } from "./CommunityProfileDialog";
import { CommunityEmojiPicker } from "./CommunityEmojiPicker";
import { SectionTabs } from "./SectionTabs";
import { TeamChat } from "./learning/TeamChat";
import { communityAction } from "@/lib/community.functions";
import { reactionKinds, type CommunityPost } from "@/lib/community";

const icons = { like: Heart, celebrate: PartyPopper, support: HandHeart };
const reactionStyles = { like: "text-social-like hover:bg-social-like/10", celebrate: "text-social-celebrate hover:bg-social-celebrate/10", support: "text-social-support hover:bg-social-support/10" };
const reactionActive = { like: "bg-social-like/10", celebrate: "bg-social-celebrate/10", support: "bg-social-support/10" };
const labels = { like: "Like", celebrate: "Celebrate", support: "Support" };
const field = "w-full rounded-lg border border-brand-line bg-brand-surface px-3 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent placeholder:text-brand-ink-grey";
type Action = { action: "react" | "comment" | "delete"; postId: string; reaction?: "like" | "celebrate" | "support" | null; body?: string };

function PostCard({ post, pending, onAction, onProfile }: { post: CommunityPost; pending: boolean; onAction: (input: Action) => Promise<unknown>; onProfile: () => void }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const act = (input: Action) => { void onAction(input).catch(() => {}); };
  return <article id={`community-post-${post.id}`} className="overflow-hidden rounded-lg border border-brand-line bg-brand-surface transition-colors hover:border-brand-accent/25">
    <header className="flex items-center gap-2.5 px-4 pt-3.5"><Button variant="ghost" size="icon" aria-label={`View ${post.authorName} profile`} onClick={onProfile} className="h-8 w-8 shrink-0 rounded-full bg-brand-accent/10 text-xs font-semibold text-brand-accent hover:bg-brand-accent/20">{post.authorName.slice(0, 2).toUpperCase()}</Button><div className="min-w-0 flex-1"><Button variant="ghost" onClick={onProfile} className="h-auto max-w-full justify-start whitespace-normal break-words rounded-none p-0 text-[13px] font-semibold text-brand-ink hover:bg-transparent hover:text-brand-accent">{post.authorName}</Button>{post.category === "strategy" && <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-accent"><BadgeCheck size={13} />Risevoice news</span>}<time dateTime={post.createdAt} className="block text-xs text-brand-ink-soft">{new Date(post.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>{post.mine && <Button variant="ghost" size="icon" aria-label="Delete post" title="Delete post" disabled={pending} className="text-brand-ink-soft hover:bg-brand-wash" onClick={() => { if (window.confirm("Delete this community post?")) act({ action: "delete", postId: post.id }); }}><Trash2 size={16} /></Button>}</header>
    <p className="whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 text-brand-ink">{post.body}</p>
    {!!post.tags.length && <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 pb-3 text-xs font-medium text-brand-accent">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
    {post.supportUrl && <a href={post.supportUrl} target="_blank" rel="noopener noreferrer" className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-lg border border-brand-accent/20 bg-social-support/5 px-3 py-2 text-xs font-medium text-social-support"><span className="flex items-center gap-2"><HandHeart size={18} /> Support this post</span><ArrowUpRight size={18} /></a>}
    <div className="flex flex-wrap items-center gap-1 border-t border-brand-line px-3 py-1.5">{reactionKinds.map((kind) => { const Icon = icons[kind]; const active = post.myReaction === kind; return <Button key={kind} variant="ghost" size="sm" aria-label={labels[kind]} title={labels[kind]} aria-pressed={active} disabled={pending} onClick={() => act({ action: "react", postId: post.id, reaction: active ? null : kind })} className={`h-9 min-w-12 gap-1.5 px-2.5 text-xs ${reactionStyles[kind]} ${active ? reactionActive[kind] : ""}`}><Icon size={17} fill={active && kind === "like" ? "currentColor" : "none"} /><span className="min-w-3 tabular-nums">{post.reactions[kind]}</span></Button>; })}<Button variant="ghost" size="sm" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Comments" title="Comments" className="ml-auto h-9 gap-1.5 px-2.5 text-xs text-brand-ink-soft hover:bg-brand-wash"><MessageCircle size={16} />{post.comments.length}</Button></div>
    {open && <section className="space-y-4 border-t border-brand-line px-5 py-4" aria-label="Post comments">{post.comments.map((item) => <div key={item.id} className="border-l-2 border-brand-line pl-3"><p className="text-xs font-semibold text-brand-ink">{item.authorName}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-brand-ink-mid">{item.body}</p></div>)}<form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); if (!comment.trim() || pending) return; try { await onAction({ action: "comment", postId: post.id, body: comment.trim() }); setComment(""); } catch {} }}><input aria-label="Write a comment" placeholder="Write a comment…" className={field} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} /><Button type="submit" size="icon" aria-label="Send comment" disabled={!comment.trim() || pending} className="h-11 w-11 shrink-0 bg-brand-accent text-brand-surface hover:bg-brand-blue-light"><Send size={17} /></Button></form></section>}
  </article>;
}

function CommunityFeed({ accessCode, clientName, initialTarget }: { accessCode: string; clientName: string; initialTarget?: { postId: string; filter: "all" | "support" | "strategy" } | null }) {
  const call = useServerFn(communityAction);
  const qc = useQueryClient();
  const [author, setAuthor] = useState<{ postId: string; name: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "support" | "strategy" | "mine">(initialTarget?.filter || "all");
  const key = ["community-feed", accessCode, filter];
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [category, setCategory] = useState<"general" | "strategy">("general");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [support, setSupport] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const feed = useInfiniteQuery({ queryKey: key, initialPageParam: undefined as string | undefined, queryFn: ({ pageParam }) => call({ data: { accessCode, action: "feed", before: pageParam, filter } }), getNextPageParam: (page) => page.next || undefined, staleTime: 30_000 });
  const mutation = useMutation({ mutationFn: (input: Parameters<typeof communityAction>[0]["data"]) => call({ data: input }), onSuccess: () => qc.invalidateQueries({ queryKey: ["community-feed", accessCode] }), onError: (e) => setError(e.message) });
  async function act(input: Action) { setError(""); return mutation.mutateAsync({ ...input, accessCode }); }
  const posts = feed.data?.pages.flatMap((page) => page.items) || [];
  useEffect(() => {
    if (!initialTarget) return;
    const element = document.getElementById(`community-post-${initialTarget.postId}`);
    element?.scrollIntoView({ block: "center" });
  }, [initialTarget, feed.data]);
  const canPublishStrategy = feed.data?.pages[0]?.canPostStrategy === true;
  function insertEmoji(emoji: string) {
    const input = textarea.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? body.length;
    if (body.length - (end - start) + emoji.length > 4000) return;
    setBody(body.slice(0, start) + emoji + body.slice(end));
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + emoji.length, start + emoji.length); });
  }
  return <TooltipProvider><div className="flex min-h-full w-full flex-col bg-social-feed"><div className="w-full shrink-0 px-5 pt-4 pb-8 sm:px-8">
    <form className="overflow-hidden rounded-lg border border-brand-line bg-brand-surface" onSubmit={async (event) => { event.preventDefault(); if (mutation.isPending) return; setError(""); try { await mutation.mutateAsync({ accessCode, action: "post", category: canPublishStrategy ? category : "general", body: body.trim(), tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), supportUrl: support ? url.trim() : undefined }); setBody(""); setTags(""); setUrl(""); setSupport(false); setTagsOpen(false); setCategory("general"); } catch {} }}>
      <div className="flex items-start gap-2.5 px-4 pt-3.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-accent/10 text-sm font-semibold text-brand-accent" aria-hidden="true">{clientName.slice(0, 2).toUpperCase() || "RV"}</span><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-semibold text-brand-ink">{clientName || "Your community"}</p><textarea ref={textarea} aria-label="Community post" placeholder="Share a win, an idea, or what’s on your mind…" className="min-h-10 w-full resize-y bg-transparent text-sm leading-6 text-brand-ink outline-none placeholder:text-brand-ink-soft" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} required /></div></div>
      {tagsOpen && <div className="px-4 pb-3"><input autoFocus aria-label="Post tags" placeholder="Add tags, separated by commas" className={field} value={tags} onChange={(e) => setTags(e.target.value)} /></div>}
      {support && <div className="px-4 pb-3"><input autoFocus type="url" aria-label="Post to support" placeholder="Paste the post link · https://…" required className={field} value={url} onChange={(e) => setUrl(e.target.value)} /></div>}
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1"><div className="flex items-center gap-0.5"><CommunityEmojiPicker onSelect={insertEmoji} />{[
        { label: "Tags", icon: Hash, active: tagsOpen, toggle: () => setTagsOpen(!tagsOpen) },
        { label: "Ask for support", icon: HandHeart, active: support, toggle: () => setSupport(!support) },
        ...(canPublishStrategy ? [{ label: "Risevoice news", icon: Lightbulb, active: category === "strategy", toggle: () => setCategory(category === "strategy" ? "general" : "strategy") }] : []),
      ].map((action) => <Tooltip key={action.label}><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={action.label} aria-pressed={action.active} onClick={action.toggle} className={`h-10 w-10 sm:h-8 sm:w-8 ${action.active ? "bg-brand-accent/10 text-brand-accent" : "text-brand-ink-soft hover:bg-brand-wash"}`}><action.icon size={17} /></Button></TooltipTrigger><TooltipContent>{action.label}</TooltipContent></Tooltip>)}</div><Button type="submit" disabled={mutation.isPending || !body.trim() || (support && !url.trim())} className="h-10 gap-1.5 rounded-md bg-brand-accent px-3 text-xs text-brand-surface hover:bg-brand-blue-light sm:h-8">{mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Post</Button></div>
    </form>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div><section className="w-full flex-1 bg-social-feed pb-6"><div className="w-full px-5 sm:px-8"><div className="mb-3 grid grid-cols-4 border-t border-brand-ink-grey/25 pt-2" aria-label="Feed filters">{[{ id: "all" as const, label: "Feed", icon: Rss }, { id: "support" as const, label: "Support", icon: HandHeart }, { id: "strategy" as const, label: "Risevoice news", icon: Lightbulb }, { id: "mine" as const, label: "My Posts", icon: UserRound }].map((item) => <Button key={item.id} variant="ghost" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`h-11 min-w-0 flex-col gap-0.5 rounded-none border-b-2 px-1 text-[10px] sm:h-10 sm:flex-row sm:gap-1.5 sm:text-xs ${filter === item.id ? "border-brand-accent text-brand-accent" : "border-transparent text-brand-ink-soft"} hover:bg-brand-surface`}><item.icon size={15} />{item.label}</Button>)}</div>
    {feed.isPending ? <p className="flex items-center gap-2 py-6 text-sm text-brand-ink-soft"><Loader2 className="animate-spin" size={18} />Loading community…</p> : feed.isError ? <div role="alert" className="py-5 text-sm text-brand-ink-mid"><p>{feed.error.message}</p><Button variant="ghost" className="mt-2 text-brand-accent" onClick={() => void feed.refetch()}>Try again</Button></div> : !posts.length ? <div className="py-12 text-center"><Users className="mx-auto mb-4 text-brand-accent" size={32} /><h3 className="text-base font-semibold text-brand-ink">{filter === "strategy" ? "Fresh ideas from your team" : filter === "support" ? "Support starts here" : filter === "mine" ? "Your voice belongs here" : "A new space to grow together"}</h3><p className="mt-2 text-sm text-brand-ink-soft">{filter === "strategy" ? "Team recommendations will appear here." : filter === "support" ? "Community posts asking for support will appear here." : "Share a win, a question, or something worth talking about."}</p></div> : <div className="space-y-3">{posts.map((post) => <PostCard key={post.id} post={post} pending={mutation.isPending} onAction={act} onProfile={() => setAuthor({ postId: post.id, name: post.authorName })} />)}</div>}
    {feed.hasNextPage && <Button variant="outline" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()} className="w-full border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-wash">{feed.isFetchingNextPage ? "Loading…" : "Load more posts"}</Button>}
    </div></section>
    <CommunityProfileDialog accessCode={accessCode} author={author} onClose={() => setAuthor(null)} />
    </div></TooltipProvider>;
}

export function CommunityMode({ accessCode, clientName, initialTarget }: { accessCode: string; clientName: string; initialTarget?: { postId: string; filter: "all" | "support" | "strategy" } | null }) {
  const [tab, setTab] = useState("leaders");
  return <div className="flex h-full min-h-0 flex-col bg-social-feed"><div className="shrink-0 pb-2"><SectionHeader title="Community" /></div><div className="shrink-0 bg-social-feed px-5 pb-5 pt-2 sm:px-8"><SectionTabs ariaLabel="Community sections" items={[{ id: "leaders", label: "Creator Circle", icon: Users }, { id: "team", label: "Ask support", icon: MessageCircle }]} active={tab} onChange={setTab} /></div><div role="tabpanel" aria-label={tab === "team" ? "Ask your team" : "Creator Circle"} className={`min-h-0 flex-1 bg-social-feed ${tab === "team" ? "overflow-hidden" : "overflow-y-auto"}`}>{tab === "team" ? <TeamChat accessCode={accessCode} /> : <CommunityFeed accessCode={accessCode} clientName={clientName} initialTarget={initialTarget} />}</div></div>;
}
