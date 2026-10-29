import Link from "next/link";
import { ArrowUpRight, CircleAlert, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subscription } from "@/lib/api";
import { billingPeriodSuffix, isYearly, providerLabel } from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/format";

type PlanCardProps = {
  subscription: Subscription | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
};

export function PlanCard({
  subscription,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: PlanCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-40" />
        <Skeleton className="mt-3 h-5 w-28" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="mt-6 h-10 w-40" />
      </Card>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="We could not load your plan"
        description={errorMessage ?? "Check your connection and try again."}
        action={
          onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
        className="h-full bg-card"
      />
    );
  }

  if (!subscription) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No active plan"
        description="Choose a plan to unlock your full operation. You can start with the free plan and change whenever you like."
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/billing">View plans</Link>
          </Button>
        }
        className="h-full bg-card"
      />
    );
  }

  const { plan } = subscription;
  const yearly = isYearly(plan.billing_period);

  return (
    <Card className="relative h-full overflow-hidden border-white/10 bg-ink p-6 text-white shadow-lift">
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full border border-white/10"
        aria-hidden
      >
        <div className="absolute inset-10 rounded-full border border-primary/20" />
        <div className="absolute inset-20 rounded-full border border-dashed border-accent/20" />
      </div>
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 size-52 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
            Current plan
          </p>
          <StatusBadge status={subscription.status} context="admin" />
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
          <h2 className="font-display text-3xl font-semibold tracking-tight">{plan.name}</h2>
          <p className="pb-1 text-sm text-white/60">
            {formatCurrency(plan.price_cents, plan.currency)}
            {billingPeriodSuffix(plan.billing_period)}
          </p>
        </div>
        <p className="mt-2 text-xs text-white/50">
          Billing {yearly ? "yearly" : "monthly"} · {providerLabel(subscription.provider)}
        </p>

        <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              {subscription.cancel_at_period_end ? "Access until" : "Next charge"}
            </dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {formatDate(subscription.current_period_end)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Renewal</dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {subscription.cancel_at_period_end ? "Cancels at the end of the period" : "Automatic"}
            </dd>
          </div>
        </dl>

        <Button
          asChild
          variant="accent"
          className="mt-6 w-full justify-between sm:w-auto"
        >
          <Link href="/dashboard/billing">
            Manage plan
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
