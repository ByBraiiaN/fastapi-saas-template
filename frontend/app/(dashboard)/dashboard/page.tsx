"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  CreditCard,
  KeyRound,
  ReceiptText,
  Settings,
  UserRound,
  Wallet,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { PlanCard } from "@/components/dashboard/plan-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, getErrorMessage } from "@/lib/api";
import { subscriptionStatusLabel } from "@/lib/billing";
import { formatDate, getInitials } from "@/lib/format";
import { useAuth } from "@/lib/store";

export default function DashboardOverviewPage() {
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);

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
  const isLoading = subscriptionQuery.isLoading || paymentsQuery.isLoading;
  const subscriptionError = subscriptionQuery.isError;
  const paymentsError = paymentsQuery.isError;
  const subscriptionErrorMessage = subscriptionError
    ? getErrorMessage(subscriptionQuery.error)
    : undefined;
  const paymentsErrorMessage = paymentsError ? getErrorMessage(paymentsQuery.error) : undefined;
  const displayName = user?.username ?? user?.email ?? "your account";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-strong">
            Overview
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Hello, {displayName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Here is what is happening in your account. Review your plan, billing status, and
            latest activity in one place.
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/dashboard/billing">
            <CreditCard className="size-4" aria-hidden />
            Manage billing
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current plan"
          value={
            subscriptionQuery.isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : subscriptionError ? (
              "—"
            ) : (
              subscription?.plan.name ?? "No plan"
            )
          }
          hint={
            subscriptionError
              ? "Could not load your plan"
              : subscription
                ? "Billing active"
                : "Choose a plan to get started"
          }
          icon={Wallet}
        />
        <StatCard
          label="Status"
          value={
            subscriptionQuery.isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : subscriptionError ? (
              "—"
            ) : subscription ? (
              subscriptionStatusLabel(subscription.status)
            ) : (
              "—"
            )
          }
          hint={
            subscriptionError
              ? "Could not load your status"
              : subscription?.cancel_at_period_end
                ? "Cancels at the end of the period"
                : subscription
                  ? "Subscription up to date"
                  : "No subscription"
          }
          icon={CreditCard}
          tone="accent"
        />
        <StatCard
          label="Next charge"
          value={
            subscriptionQuery.isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : subscriptionError ? (
              "—"
            ) : (
              formatDate(subscription?.current_period_end)
            )
          }
          hint={
            subscriptionError
              ? "Could not load your renewal date"
              : subscription?.cancel_at_period_end
                ? "Access until that date"
                : "Automatic renewal"
          }
          icon={CalendarClock}
          tone="neutral"
        />
        <StatCard
          label="Total payments"
          value={
            paymentsQuery.isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : paymentsError ? (
              "—"
            ) : (
              payments.length.toLocaleString("en-US")
            )
          }
          hint={paymentsError ? "Could not load your payments" : "Full history for your account"}
          icon={ReceiptText}
          tone="indigo"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <PlanCard
          subscription={subscription}
          isLoading={subscriptionQuery.isLoading}
          isError={subscriptionError}
          errorMessage={subscriptionErrorMessage}
          onRetry={() => void subscriptionQuery.refetch()}
        />

        {subscriptionError ? (
          <EmptyState
            icon={CircleAlert}
            title="We could not load your account"
            description={subscriptionErrorMessage}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void subscriptionQuery.refetch()}
              >
                Retry
              </Button>
            }
            className="h-full bg-card"
          />
        ) : subscription ? (
          <Card className="flex h-full flex-col p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your account
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary-strong">
                  {getInitials(user?.username ?? user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.username ?? "My account"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
              </div>
            </div>

            <Separator className="my-5" />

            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/account"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                >
                  <UserRound className="size-4" aria-hidden />
                  Account details
                  <ArrowRight className="ml-auto size-3.5" aria-hidden />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                >
                  <KeyRound className="size-4" aria-hidden />
                  Password and security
                  <ArrowRight className="ml-auto size-3.5" aria-hidden />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                >
                  <Settings className="size-4" aria-hidden />
                  Appearance preferences
                  <ArrowRight className="ml-auto size-3.5" aria-hidden />
                </Link>
              </li>
            </ul>
          </Card>
        ) : (
          <OnboardingChecklist hasSubscription={Boolean(subscription)} />
        )}
      </div>

      <PaymentsTable
        payments={payments}
        isLoading={paymentsQuery.isLoading}
        isError={paymentsError}
        errorMessage={paymentsErrorMessage}
        onRetry={() => void paymentsQuery.refetch()}
        limit={5}
        title="Recent payments"
        description="The five most recent transactions in your account."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/billing">
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        }
        emptyDescription="No charges yet. Choose a plan and your first invoice will appear here."
      />

      {isLoading ? (
        <p className="sr-only" role="status">
          Loading your account data…
        </p>
      ) : null}
    </div>
  );
}
