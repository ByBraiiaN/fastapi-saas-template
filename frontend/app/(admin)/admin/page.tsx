"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, ReceiptText, ShieldAlert, Users } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { PlansChart } from "@/components/admin/plans-chart";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { UsersChart } from "@/components/admin/users-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/store";

const chartParams = { limit: 100, offset: 0 };

export default function AdminDashboardPage() {
  const token = useAuth((state) => state.token);

  const statsQuery = useQuery({
    queryKey: ["admin", "stats", token],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminStats(token);
    },
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", token, chartParams],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminUsers(token, chartParams);
    },
    enabled: Boolean(token),
  });

  const subscriptionsQuery = useQuery({
    queryKey: ["admin", "subscriptions", token, chartParams],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminSubs(token, chartParams);
    },
    enabled: Boolean(token),
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin", "transactions", token, chartParams],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminPayments(token, chartParams);
    },
    enabled: Boolean(token),
  });

  const stats = statsQuery.data;
  const users = usersQuery.data?.data ?? [];
  const subscriptions = subscriptionsQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300">
            Control panel
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your operation at a glance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Users, subscriptions, and revenue across the whole platform. Use the tables to drill in
            and manage accounts.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit gap-2 border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-indigo-200"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-indigo-300" aria-hidden />
          Console active
        </Badge>
      </div>

      {statsQuery.isError ? (
        <Alert className="border-rose-400/25 bg-rose-500/10 text-rose-200">
          <ShieldAlert aria-hidden />
          <AlertTitle>We could not load the metrics</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 text-rose-200/80 sm:flex-row sm:items-center sm:justify-between">
            <span>{getErrorMessage(statsQuery.error)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void statsQuery.refetch()}
              className="border-rose-400/30 bg-transparent text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Users"
          value={stats?.users ?? 0}
          hint="Accounts registered on the platform"
          icon={Users}
          tone="indigo"
          isLoading={statsQuery.isLoading}
        />
        <KpiCard
          label="Subscriptions"
          value={stats?.subscriptions ?? 0}
          hint="Subscriptions created, active, or historical"
          icon={CreditCard}
          tone="emerald"
          isLoading={statsQuery.isLoading}
        />
        <KpiCard
          label="Transactions"
          value={stats?.payments ?? 0}
          hint="Payments recorded across all providers"
          icon={ReceiptText}
          tone="amber"
          isLoading={statsQuery.isLoading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <RevenueChart
          transactions={payments}
          isLoading={paymentsQuery.isLoading}
          isError={paymentsQuery.isError}
          className="xl:col-span-2"
        />
        <PlansChart
          subscriptions={subscriptions}
          isLoading={subscriptionsQuery.isLoading}
          isError={subscriptionsQuery.isError}
        />
        <UsersChart
          users={users}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          className="xl:col-span-3"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        The charts are calculated from the latest 100 records of each collection. The KPI
        figures reflect the real platform total.
      </p>
    </div>
  );
}
