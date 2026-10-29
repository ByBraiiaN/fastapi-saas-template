import { Badge } from "@/components/ui/badge";
import {
  paymentStatusLabel,
  paymentTone,
  subscriptionStatusLabel,
  subscriptionTone,
  type StatusTone,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  kind?: "subscription" | "payment";
  context?: "app" | "admin";
  className?: string;
};

const appTones: Record<StatusTone, string> = {
  active: "border-primary/20 bg-primary/10 text-primary-strong",
  trialing: "border-accent/25 bg-accent/15 text-amber-800 dark:text-accent",
  past_due: "border-destructive/20 bg-destructive/10 text-destructive",
  canceled: "border-border bg-muted text-muted-foreground",
  pending: "border-slate-500/15 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const adminTones: Record<StatusTone, string> = {
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  trialing: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  past_due: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  canceled: "border-white/10 bg-white/5 text-slate-300",
  pending: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
};

export function StatusBadge({
  status,
  kind = "subscription",
  context = "app",
  className,
}: StatusBadgeProps) {
  const tone = kind === "payment" ? paymentTone(status) : subscriptionTone(status);
  const label = kind === "payment" ? paymentStatusLabel(status) : subscriptionStatusLabel(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 whitespace-nowrap",
        context === "admin" ? adminTones[tone] : appTones[tone],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </Badge>
  );
}
