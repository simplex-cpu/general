import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2 } from "lucide-react";
import { siInstagram } from "simple-icons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { communityProfile } from "@/lib/community.functions";

export function CommunityProfileDialog({ accessCode, author, onClose }: { accessCode: string; author: { postId: string; name: string } | null; onClose: () => void }) {
  const call = useServerFn(communityProfile);
  const profile = useQuery({ queryKey: ["community-profile", accessCode, author?.postId], enabled: !!author, queryFn: () => { if (!author) throw new Error("Select a profile"); return call({ data: { accessCode, postId: author.postId } }); }, staleTime: 60_000, retry: false });
  const data = profile.data;
  return <Dialog open={!!author} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent aria-describedby={undefined} className="w-[calc(100%-32px)] max-w-sm rounded-lg border-brand-line bg-brand-surface p-6 text-brand-ink">
    <div className="flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-accent/10 text-lg font-semibold text-brand-accent">{data?.photo ? <img src={data.photo} alt="" className="h-full w-full object-cover" /> : (data?.name || author?.name || "").slice(0, 2).toUpperCase()}</div><DialogTitle className="min-w-0 break-words pr-4 text-lg tracking-normal">{data?.name || author?.name}</DialogTitle></div>
    {profile.isPending && <Loader2 aria-label="Loading profile" size={20} className="animate-spin text-brand-accent" />}
    {profile.isError && <div role="alert" className="text-sm text-brand-ink-soft">{profile.error.message}<Button variant="ghost" onClick={() => void profile.refetch()} className="mt-2 text-brand-accent">Try again</Button></div>}
    {data?.bio && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-brand-ink-mid">{data.bio}</p>}
    {(data?.website || data?.instagram) && <div className="flex flex-wrap gap-3 border-t border-brand-line pt-4">{data.website && <Button asChild variant="outline" size="sm" className="border-brand-line text-brand-ink hover:bg-brand-wash"><a href={data.website} target="_blank" rel="noopener noreferrer"><Globe size={16} />Website</a></Button>}{data.instagram && <Button asChild variant="outline" size="sm" className="border-brand-line text-brand-ink hover:bg-brand-wash"><a href={data.instagram} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d={siInstagram.path} /></svg>Instagram</a></Button>}</div>}
  </DialogContent></Dialog>;
}