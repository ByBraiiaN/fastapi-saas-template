"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Clock3, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, getErrorMessage, type Subscription } from "@/lib/api";
import { useAuth } from "@/lib/store";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    trialing: "Trialing",
    past_due: "Payment past due",
    canceled: "Canceled",
    pending: "Pending",
  };
  return labels[status.toLowerCase()] ?? status;
}

function SubscriptionSummary({ subscription }: { subscription: Subscription }) {
  return (
    <div className="mt-6 rounded-xl border border-border/70 bg-surface/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="mt-0.5 font-display text-lg font-semibold">{subscription.plan.name}</p>
        </div>
        <Badge variant="default">{statusLabel(subscription.status)}</Badge>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-border/70 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Renewal</dt>
          <dd className="mt-0.5">{formatDate(subscription.current_period_end)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Provider</dt>
          <dd className="mt-0.5 capitalize">{subscription.provider}</dd>
        </div>
      </dl>
    </div>
  );
}

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("txn_id");
  const token = useAuth((state) => state.token);
  const hydrated = useAuth((state) => state.hydrated);

  const [gaveUp, setGaveUp] = useState(false);

  const subscriptionQuery = useQuery({
    queryKey: ["subscription", "me", token],
    queryFn: () => (token ? api.me(token) : Promise.resolve(null)),
    enabled: Boolean(token),
    retry: 0,
    refetchInterval: (query) => {
      if (query.state.data || query.state.dataUpdateCount >= 6) return false;
      return 4000;
    },
  });

  const subscription = subscriptionQuery.data ?? null;

  useEffect(() => {
    if (!token || subscription) {
      setGaveUp(false);
      return;
    }
    const timer = window.setTimeout(() => setGaveUp(true), 28000);
    return () => window.clearTimeout(timer);
  }, [token, subscription]);

  if (!hydrated) {
    return (
      <Card className="w-full max-w-md p-7">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-6 h-24 w-full" />
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Payment received
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in to see your subscription status and finish setting up your workspace.
        </p>
        <div className="mt-6 grid gap-2">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing">Back to plans</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (subscription) {
    return (
      <Card className="w-full max-w-md p-7">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Your plan is active
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Paddle confirmed the payment and the subscription is now synced with your account.
        </p>

        <SubscriptionSummary subscription={subscription} />

        {transactionId ? (
          <p className="mt-4 truncate font-mono text-[11px] text-muted-foreground">
            Transaction: {transactionId}
          </p>
        ) : null}

        <div className="mt-6 grid gap-2">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing">Manage plan</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const fetchFailed = subscriptionQuery.isError;

  return (
    <Card className="w-full max-w-md p-7">
      <span className="grid size-12 place-items-center rounded-full bg-accent/15 text-amber-700 dark:text-accent">
        {fetchFailed ? <CircleAlert className="size-6" aria-hidden /> : <Clock3 className="size-6" aria-hidden />}
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        We are confirming your payment
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Paddle processes the charge and notifies us by webhook. This usually takes a few seconds; you can
        refresh the status without reloading the page.
      </p>

      <Alert
        className="mt-5"
        variant={fetchFailed ? "destructive" : gaveUp ? "warning" : "default"}
      >
        {subscriptionQuery.isFetching ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : fetchFailed ? (
          <CircleAlert aria-hidden />
        ) : (
          <Clock3 aria-hidden />
        )}
        <AlertTitle>
          {fetchFailed
            ? "We could not check your subscription"
            : gaveUp
              ? "Still pending"
              : "Syncing subscription"}
        </AlertTitle>
        <AlertDescription>
          {fetchFailed
            ? getErrorMessage(subscriptionQuery.error)
            : gaveUp
              ? "If the charge completed, check again in a minute or contact support with the transaction ID."
              : "Do not close this tab if you just paid. Confirmation will arrive automatically."}
        </AlertDescription>
      </Alert>

      {transactionId ? (
        <p className="mt-4 truncate font-mono text-[11px] text-muted-foreground">
          Transaction: {transactionId}
        </p>
      ) : null}

      <div className="mt-6 grid gap-2">
        <Button
          type="button"
          size="lg"
          onClick={() => void subscriptionQuery.refetch()}
          disabled={subscriptionQuery.isFetching}
        >
          {subscriptionQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {subscriptionQuery.isFetching ? "Updating…" : "Update status"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </Card>
  );
}
