import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "indigo" | "emerald" | "amber";
  isLoading?: boolean;
  className?: string;
};

const toneClasses = {
  indigo: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
  isLoading = false,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("border-white/10 bg-[#0f172a] p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
            toneClasses[tone]
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-8 w-24 bg-white/10" />
      ) : (
        <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-white">
          {value.toLocaleString("en-US")}
        </p>
      )}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}
