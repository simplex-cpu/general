import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const emojis = ["😀", "😊", "🥰", "😎", "🤩", "😂", "🙌", "👏", "💪", "🤝", "❤️", "💚", "🔥", "✨", "🎉", "🚀", "💡", "🎯", "📈", "🏆", "🙏", "👀", "✅", "💬"];

export function CommunityEmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return <Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Add emoji" title="Add emoji" className="h-10 w-10 text-social-celebrate hover:bg-social-celebrate/10"><Smile size={20} /></Button></PopoverTrigger><PopoverContent align="start" className="w-64 border-brand-line bg-brand-surface p-3 text-brand-ink"><p className="mb-2 text-xs font-semibold text-brand-ink-soft">Emojis</p><div className="grid grid-cols-6 gap-1">{emojis.map((emoji) => <Button key={emoji} type="button" variant="ghost" size="icon" aria-label={`Add ${emoji}`} className="h-9 w-9 text-xl hover:bg-brand-wash" onClick={() => onSelect(emoji)}>{emoji}</Button>)}</div></PopoverContent></Popover>;
}