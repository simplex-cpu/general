import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCtaChoice, type CtaChoice } from "@/lib/slate/variationFlow";

export const CTA_OPTIONS: { value: CtaChoice; label: string }[] = [
  { value: "follow", label: "Follow" },
  { value: "comment", label: "Comment" },
  { value: "share", label: "Share" },
  { value: "save", label: "Save" },
  { value: "lead-magnet", label: "Comment lead magnet keyword" },
  { value: "dm-keyword", label: "DM keyword" },
];

export const ctaNeedsKeyword = (c: string) => c === "lead-magnet" || c === "dm-keyword";

export function CtaDecisionCard({
  disabled,
  onConfirm,
}: {
  disabled?: boolean;
  onConfirm: (cta: string) => void;
}) {
  const [choice, setChoice] = useState<CtaChoice | "">("");
  const [keyword, setKeyword] = useState("");
  const [benefit, setBenefit] = useState("");
  const valid = !!choice && (!ctaNeedsKeyword(choice) || (!!keyword.trim() && !!benefit.trim()));

  return (
    <div className="mt-3 max-w-md space-y-3 rounded-lg border border-brand-line bg-brand-surface p-4">
      <Select
        value={choice}
        onValueChange={(value) => setChoice(value as CtaChoice)}
        disabled={disabled}
      >
        <SelectTrigger className="border-brand-line bg-brand-surface text-brand-ink">
          <SelectValue placeholder="Choose a CTA" />
        </SelectTrigger>
        <SelectContent className="border-brand-line bg-brand-surface text-brand-ink">
          {CTA_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {ctaNeedsKeyword(choice) && (
        <div className="space-y-3">
          <Input
            aria-label="Keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Enter the keyword"
            disabled={disabled}
            className="border-brand-line bg-brand-surface text-brand-ink"
          />
          <Input
            aria-label="What the viewer will receive"
            value={benefit}
            onChange={(event) => setBenefit(event.target.value)}
            placeholder="to get my ebook, guide…"
            disabled={disabled}
            className="border-brand-line bg-brand-surface text-brand-ink"
          />
        </div>
      )}
      <Button
        type="button"
        disabled={disabled || !valid}
        onClick={() => choice && onConfirm(formatCtaChoice(choice, keyword, benefit))}
        className="bg-brand-accent text-white hover:bg-brand-accent/90"
      >
        Continue
      </Button>
    </div>
  );
}
