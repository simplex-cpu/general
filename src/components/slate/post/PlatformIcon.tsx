import { Link as LinkIcon } from "lucide-react";
import { siFacebook, siInstagram, siTiktok, siYoutube } from "simple-icons";

/** Authentic platform logo; falls back to a link icon for unknown platforms. */
export function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  const p = (platform || "").toLowerCase();
  const logo = p.includes("instagram") ? siInstagram : p.includes("tiktok") ? siTiktok : p.includes("youtube") ? siYoutube : p.includes("facebook") ? siFacebook : null;
  if (!logo) return <LinkIcon size={size} aria-hidden />;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={logo.path} /></svg>;
}
