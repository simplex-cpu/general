import { useEffect, useRef, type ReactNode } from "react";

export function ChatThread({
  children,
  activityKey = "",
}: {
  children: ReactNode;
  activityKey?: string;
}) {
  const thread = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  useEffect(() => {
    const container = thread.current?.closest<HTMLElement>("[data-script-scroll]");
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) following.current = false;
      else if (container.scrollHeight - container.scrollTop - container.clientHeight < 180)
        following.current = true;
    };
    const onTouch = () => {
      following.current = false;
    };
    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("touchmove", onTouch, { passive: true });
    const scroll = () => {
      if (!following.current) return;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "instant",
      });
    };
    const frame = requestAnimationFrame(() => requestAnimationFrame(scroll));
    const observer = new ResizeObserver(scroll);
    if (thread.current) observer.observe(thread.current);
    const onScroll = () => {
      if (container.scrollHeight - container.scrollTop - container.clientHeight < 40)
        following.current = true;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchmove", onTouch);
      container.removeEventListener("scroll", onScroll);
    };
  }, [activityKey]);
  return (
    <div ref={thread} className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-10">
      {children}
    </div>
  );
}
