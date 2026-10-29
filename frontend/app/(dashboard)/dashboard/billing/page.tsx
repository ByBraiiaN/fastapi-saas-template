"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  CircleAlert,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ApiError,
  api,
  getErrorMessage,
  startPaddleCheckout,
  type Plan,
  type Subscription,
} from "@/lib/api";
import {
  billingPeriodLabel,
  billingPeriodSuffix,
  providerLabel,
} from "@/lib/billing";
import { formatCurrency, formatDate, shortId } from "@/lib/format";
import {
  getPlanFeatures,
  isFeaturedPlan,
  planPeriod,
  planTier,
  type PricingPeriod,
} from "@/lib/plans";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

function planCta(plan: Plan, subscription: Subscription | null): string {
  if (subscription?.plan.code === plan.code) return "Current plan";
  if (!subscription) return plan.price_cents === 0 ? "Start for free" : "Choose plan";
  return planTier(plan) > planTier(subscription.plan) ? "Upgrade plan" : "Switch to this plan";
}

export default function BillingPage() {
  const token = useAuth((state) => state.token);
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PricingPeriod>("monthly");
  const [cancelOpen, setCancelOpen] = useState(false);

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: api.listPlans,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["sub", token],
    queryFn: () => {
      if (!token) return Promise.resolve(null);
      return api.me(token);
    },
    enabled: Boolean(token),
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", token],
    queryFn: () => {
      if (!token) return Promise.resolve([]);
      return api.payments(token);
    },
    enabled: Boolean(token),
  });

  const subscription = subscriptionQuery.data ?? null;
  const payments = paymentsQuery.data ?? [];
  const plans = (plansQuery.data ?? [])
    .filter((plan) => plan.is_active !== false)
    .sort((a, b) => a.price_cents - b.price_cents);
  const visiblePlans = plans
    .filter((plan) => planPeriod(plan) === period)
    .sort((a, b) => a.price_cents - b.price_cents);

  const checkoutMutation = useMutation({
    mutationFn: (plan: Plan) => {
      if (!token) throw new Error("Session unavailable");
      return startPaddleCheckout(token, plan.code, Boolean(subscription));
    },
    onSuccess: (result, plan) => {
      if (result.activated_locally) {
        toast.success("Plan activated", {
          description: `${plan.name} is now available on your account. No need to leave for Paddle.`,
        });
      } else if (result.updated_in_place) {
        toast.success("Plan updated", {
          description: `Your subscription has changed to ${plan.name}.`,
        });
      } else if (!result.checkout_url) {
        toast.success("Request sent", {
          description: "We will update your subscription as soon as Paddle confirms the change.",
        });
      }

      void queryClient.invalidateQueries({ queryKey: ["sub"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 503) {
        toast.error("Payments unavailable in this environment", {
          description:
            "Paddle is not configured yet. You can try the free plan or try again later.",
        });
        return;
      }

      toast.error("We could not change your plan", {
        description: getErrorMessage(error),
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.cancel(token);
    },
    onSuccess: () => {
      setCancelOpen(false);
      toast.success("Subscription canceled", {
        description: "You will keep access until the end of the current period.",
      });
      void queryClient.invalidateQueries({ queryKey: ["sub"] });
    },
    onError: (error) => {
      toast.error("We could not cancel the subscription", {
        description: getErrorMessage(error),
      });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-strong">
          Billing
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your plan and payments
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Check your subscription status, change plans, or review your invoice history.
          Charges are managed by Paddle as Merchant of Record.
        </p>
      </div>

      <section aria-labelledby="current-subscription">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="current-subscription" className="font-display text-xl font-semibold tracking-tight">
            Current subscription
          </h2>
          {subscription ? <StatusBadge status={subscription.status} /> : null}
        </div>

        {subscriptionQuery.isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-3 h-4 w-72" />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </Card>
        ) : subscriptionQuery.isError ? (
          <EmptyState
            icon={CircleAlert}
            title="We could not load your subscription"
            description={getErrorMessage(subscriptionQuery.error)}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => void subscriptionQuery.refetch()}
              >
                Retry
              </Button>
            }
            className="bg-card"
          />
        ) : subscription ? (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-4 space-y-0 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">{subscription.plan.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(subscription.plan.price_cents, subscription.plan.currency)}
                  {billingPeriodSuffix(subscription.plan.billing_period)} ·{" "}
                  {billingPeriodLabel(subscription.plan.billing_period)}
                </p>
              </div>
              {subscription.cancel_at_period_end ? (
                <Badge variant="accent">Cancels at the end of the period</Badge>
              ) : (
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                    >
                      Cancel subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel your subscription</DialogTitle>
                      <DialogDescription>
                        You will stop renewing the {subscription.plan.name} plan. You will keep access
                        until {formatDate(subscription.current_period_end)}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                      <p className="font-medium">What happens next</p>
                      <ul className="mt-2 space-y-1.5 text-muted-foreground">
                        <li>The next charge will not be made.</li>
                        <li>Your account will return to the free plan when the period ends.</li>
                        <li>You can reactivate a plan whenever you like.</li>
                      </ul>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Keep plan
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => cancelMutation.mutate()}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : null}
                        {cancelMutation.isPending ? "Canceling…" : "Yes, cancel"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>

            <CardContent className="p-6">
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-1.5">
                    <StatusBadge status={subscription.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {subscription.cancel_at_period_end ? "Access until" : "Next charge"}
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                    {formatDate(subscription.current_period_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Provider
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
                    {providerLabel(subscription.provider)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Start
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium">{formatDate(subscription.started_at)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Cycle
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium">
                    {billingPeriodLabel(subscription.plan.billing_period)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Subscription ID
                  </dt>
                  <dd className="mt-1.5 font-mono text-xs text-muted-foreground">
                    {shortId(subscription.id, 14)}
                  </dd>
                </div>
              </dl>

              {subscription.cancel_at_period_end ? (
                <Alert variant="warning" className="mt-6">
                  <CircleAlert aria-hidden />
                  <AlertTitle>Cancellation scheduled</AlertTitle>
                  <AlertDescription>
                    Your plan will not renew. You will have access to {subscription.plan.name} until{" "}
                    {formatDate(subscription.current_period_end)}.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={CreditCard}
            title="You do not have an active subscription"
            description="Choose one of the available plans to get started. You can change or cancel whenever you like."
            action={
              <Button asChild>
                <a href="#plans">View plans</a>
              </Button>
            }
            className="bg-card"
          />
        )}
      </section>

      <section id="plans" aria-labelledby="plans-heading" className="scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="plans-heading" className="font-display text-xl font-semibold tracking-tight">
              Available plans
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the billing period that fits your team best.
            </p>
          </div>
          <Tabs
            value={period}
            onValueChange={(value) => setPeriod(value === "yearly" ? "yearly" : "monthly")}
          >
            <TabsList aria-label="Billing period">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {plansQuery.isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-6">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-4 h-9 w-32" />
                <Skeleton className="mt-6 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-4/5" />
                <Skeleton className="mt-2 h-3 w-3/5" />
                <Skeleton className="mt-8 h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : plansQuery.isError ? (
          <Alert variant="destructive" className="mt-6">
            <CircleAlert aria-hidden />
            <AlertTitle>We could not load the plans</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{getErrorMessage(plansQuery.error)}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void plansQuery.refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : visiblePlans.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={`No ${period === "yearly" ? "yearly" : "monthly"} plans available`}
            description="Try the other billing period or come back later."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeriod(period === "yearly" ? "monthly" : "yearly")}
              >
                View {period === "yearly" ? "monthly" : "yearly"} plans
              </Button>
            }
            className="mt-6 bg-card"
          />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePlans.map((plan) => {
              const featured = isFeaturedPlan(plan);
              const isCurrent = subscription?.plan.code === plan.code;
              const pending = checkoutMutation.isPending && checkoutMutation.variables?.code === plan.code;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex h-full flex-col p-6",
                    featured && "border-primary/40 shadow-soft"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {billingPeriodLabel(plan.billing_period)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {featured ? (
                        <Badge className="border-transparent bg-primary/10 text-primary-strong">
                          Recommended
                        </Badge>
                      ) : null}
                      {isCurrent ? <Badge variant="secondary">Current plan</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-semibold tracking-tight">
                      {formatCurrency(plan.price_cents, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {billingPeriodSuffix(plan.billing_period)}
                    </span>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {getPlanFeatures(plan)
                      .slice(0, 5)
                      .map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                  </ul>

                  <Button
                    type="button"
                    variant={isCurrent ? "secondary" : featured ? "default" : "outline"}
                    className="mt-6 w-full"
                    onClick={() => checkoutMutation.mutate(plan)}
                    disabled={checkoutMutation.isPending || isCurrent}
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    {pending ? "Processing…" : planCta(plan, subscription)}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Wallet className="size-3.5" aria-hidden />
          Paddle calculates and manages taxes based on your country. You can cancel anytime.
        </p>
      </section>

      <PaymentsTable
        payments={payments}
        isLoading={paymentsQuery.isLoading}
        isError={paymentsQuery.isError}
        errorMessage={
          paymentsQuery.isError ? getErrorMessage(paymentsQuery.error) : undefined
        }
        onRetry={() => void paymentsQuery.refetch()}
        title="Invoices and payments"
        description="Charge history associated with your account."
        emptyDescription="No invoices yet. As soon as you subscribe to a plan, they will appear here with their status."
      />
    </div>
  );
}
