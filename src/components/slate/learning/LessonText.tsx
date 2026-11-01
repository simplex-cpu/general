import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Shared rich-text renderer for milestone overviews, mission notes and
 * course instructions. The stored content is Markdown; raw HTML stays off.
 */
export function LessonText({
  text,
  className = "",
  tone = "light",
}: {
  text: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  if (!text || !text.trim()) return null;
  const dark = tone === "dark";
  const heading = dark ? "text-white" : "text-[#1A1A1D]";
  return (
    <div
      className={`max-w-[68ch] text-[14px] leading-[1.75] ${dark ? "text-white/75" : "text-[#1A1A1D]/80"} ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h2 className={`mt-8 mb-3 text-[20px] font-semibold leading-snug ${heading}`} {...p} />,
          h2: (p) => <h3 className={`mt-7 mb-2.5 text-[17px] font-semibold leading-snug ${heading}`} {...p} />,
          h3: (p) => <h4 className={`mt-6 mb-2 text-[15px] font-semibold ${heading}`} {...p} />,
          h4: (p) => <h5 className={`mt-5 mb-1.5 text-[14px] font-semibold ${heading}`} {...p} />,
          p: (p) => <p className="my-3" {...p} />,
          strong: (p) => <strong className={`font-semibold ${heading}`} {...p} />,
          em: (p) => <em className="italic" {...p} />,
          ul: (p) => <ul className="my-3 space-y-2 pl-5 [&>li]:list-disc [&>li]:marker:text-[#4F6BFF]" {...p} />,
          ol: (p) => <ol className="my-3 space-y-2 pl-5 [&>li]:list-decimal [&>li]:marker:text-[#4F6BFF]" {...p} />,
          li: (p) => <li className="pl-1 [&>p]:my-1" {...p} />,
          blockquote: (p) => (
            <blockquote
              className="my-4 rounded-r-lg border-l-[3px] border-[#4F6BFF]/50 bg-[#4F6BFF]/[0.05] px-4 py-3 [&>p]:my-1"
              {...p}
            />
          ),
          a: (p) => (
            <a
              className="font-medium text-[#4F6BFF] underline decoration-[#4F6BFF]/30 underline-offset-2 hover:decoration-[#4F6BFF]"
              target="_blank"
              rel="noreferrer"
              {...p}
            />
          ),
          code: (p) => (
            <code
              className={`rounded px-1.5 py-0.5 font-mono text-[12.5px] ${dark ? "bg-white/10 text-white" : "bg-black/[0.05] text-[#1A1A1D]"}`}
              {...p}
            />
          ),
          pre: (p) => (
            <pre className="my-4 overflow-x-auto rounded-xl bg-[#14141A] p-4 text-[12.5px] text-white/90" {...p} />
          ),
          hr: () => <hr className="my-6 border-black/[0.07]" />,
          table: (p) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]" {...p} />
            </div>
          ),
          th: (p) => (
            <th className="border-b border-black/[0.1] bg-black/[0.03] px-3 py-2 text-left font-semibold text-[#1A1A1D]" {...p} />
          ),
          td: (p) => <td className="border-b border-black/[0.06] px-3 py-2 align-top" {...p} />,
          img: (p) => <img className="my-4 rounded-xl" loading="lazy" {...p} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
