import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Format } from "@/lib/simplex/types";

const FORMATS: { value: Format; label: string }[] = [
  { value: "broll", label: "B-roll" },
  { value: "talkingVideo", label: "Talking video" },
  { value: "carousel", label: "Carousel" },
  { value: "graphic", label: "Graphic" },
];

export function SingleScriptForm({
  onSubmit,
  onFormat,
  selectedFormat,
}: {
  onSubmit: (input: { idea: string; format: Format }) => void;
  onFormat: (format: Format) => void;
  selectedFormat: Format | null;
}) {
  const [idea, setIdea] = useState("");
  const ready = idea.trim().length >= 3 && !!selectedFormat;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h2 className="text-[22px] font-semibold text-brand-ink">Single script</h2>
      <p className="mt-2 text-[14px] text-brand-ink-mid">Share your raw script or ideas and pick a format.</p>

      <p className="mt-8 text-[13px] font-semibold text-brand-ink">Choose a format</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FORMATS.map((f) => (
          <Button
            variant="outline"
            key={f.value}
            type="button"
            aria-pressed={selectedFormat === f.value}
            onClick={() => onFormat(f.value)}
            className={`rounded-xl border px-3 py-3 text-[13px] font-medium transition-colors ${
              selectedFormat === f.value
                ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                : "border-brand-purple/60 bg-brand-surface text-brand-purple hover:border-brand-purple hover:bg-brand-purple/5"
            }`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {selectedFormat && (
        <div className="mt-8">
          <label className="block text-[13px] font-semibold text-brand-ink">Raw script or ideas</label>
          <Textarea
            className="mt-2 min-h-[140px]"
            placeholder="e.g. Why most small businesses don't show up in ChatGPT answers, and the three fixes"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            autoFocus
          />
          <div className="mt-8 flex justify-end">
            <Button
              disabled={!ready}
              onClick={() => onSubmit({ idea, format: selectedFormat })}
              className="bg-brand-accent text-white hover:bg-brand-accent/90"
            >
              Write my script
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
