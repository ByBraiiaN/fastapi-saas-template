"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { shortId } from "@/lib/format";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string | null | undefined;
  display?: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, display, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="text-slate-500">—</span>;
  }

  async function handleCopy() {
    if (!value) return;

    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: display ?? shortId(value),
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("We could not copy", {
        description: "Select the text and copy it manually.",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={`${label}: ${value}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-mono text-xs text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
        className
      )}
    >
      <span>{display ?? shortId(value)}</span>
      {copied ? (
        <Check className="size-3.5 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
