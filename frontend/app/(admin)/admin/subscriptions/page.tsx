"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard, ShieldOff } from "lucide-react";
import { CopyButton } from "@/components/admin/copy-button";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { TablePagination } from "@/components/admin/table-pagination";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, getErrorMessage } from "@/lib/api";
import { providerLabel } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/store";

export default function AdminSubscriptionsPage() {
  const token = useAuth((state) => state.token);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  const subscriptionsQuery = useQuery({
    queryKey: ["admin", "subscriptions", token, { limit, offset }],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminSubs(token, { limit, offset });
    },
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const subscriptions = subscriptionsQuery.data?.data ?? [];
  const total = subscriptionsQuery.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300">
            Subscriptions
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
            Platform subscriptions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Status, provider, and period for each subscription. Copy the user ID to locate
            the account in the users table.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-white/10 bg-white/5 px-3 py-1 text-slate-300"
        >
          {total.toLocaleString("en-US")} subscriptions
        </Badge>
      </div>

      <Card className="overflow-hidden border-white/10 bg-[#0f172a]">
        <DataTableToolbar
          meta={`${total} total`}
          onRefresh={() => void subscriptionsQuery.refetch()}
          isRefreshing={subscriptionsQuery.isFetching}
        />

        {subscriptionsQuery.isError ? (
          <div className="p-4">
            <Alert className="border-rose-400/25 bg-rose-500/10 text-rose-200">
              <ShieldOff aria-hidden />
              <AlertTitle>We could not load the subscriptions</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3 text-rose-200/80 sm:flex-row sm:items-center sm:justify-between">
                <span>{getErrorMessage(subscriptionsQuery.error)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void subscriptionsQuery.refetch()}
                  className="border-rose-400/30 bg-transparent text-rose-200 hover:bg-rose-500/10"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : subscriptionsQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28 bg-white/10" />
                <Skeleton className="h-4 flex-1 bg-white/10" />
                <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-4 w-24 bg-white/10" />
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CreditCard}
              title="No subscriptions"
              description="When users subscribe to a plan, their subscriptions will appear here."
              className="border-white/10 bg-white/[0.02] py-12 [&_h3]:text-slate-200 [&_p]:text-slate-500"
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="pl-4 text-slate-500">Subscription</TableHead>
                <TableHead className="text-slate-500">User</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500">Provider</TableHead>
                <TableHead className="text-slate-500">Current period</TableHead>
                <TableHead className="pr-4 text-right text-slate-500">Start</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell className="pl-4">
                    <CopyButton value={subscription.id} label="Subscription ID" />
                    <p className="mt-1 max-w-[12rem] truncate font-mono text-[10px] text-slate-600">
                      {subscription.provider_subscription_id}
                    </p>
                  </TableCell>
                  <TableCell>
                    <CopyButton
                      value={subscription.user_id}
                      label="User ID"
                      display={subscription.user_id ? `${subscription.user_id.slice(0, 8)}…` : "—"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={subscription.status} context="admin" />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/5 text-slate-300"
                    >
                      {providerLabel(subscription.provider)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-slate-300">
                      {formatDate(subscription.current_period_end)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {subscription.cancel_at_period_end
                        ? "Cancels at the end of the period"
                        : "Automatic renewal"}
                    </p>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <p className="text-xs text-slate-300">{formatDate(subscription.started_at)}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TablePagination
          total={total}
          limit={limit}
          offset={offset}
          hasNext={subscriptionsQuery.data?.has_next ?? false}
          isFetching={subscriptionsQuery.isFetching}
          onPrevious={() => setOffset((current) => Math.max(0, current - limit))}
          onNext={() => setOffset((current) => current + limit)}
        />
      </Card>
    </div>
  );
}
