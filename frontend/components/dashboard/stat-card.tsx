import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "neutral" | "indigo";
  className?: string;
};

const toneClasses = {
  primary: "bg-primary/10 text-primary-strong",
  accent: "bg-accent/15 text-amber-700 dark:text-accent",
  neutral: "bg-muted text-muted-foreground",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", toneClasses[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="mt-4 truncate font-display text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
