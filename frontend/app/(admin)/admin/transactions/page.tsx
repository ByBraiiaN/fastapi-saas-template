"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ReceiptText, ShieldOff } from "lucide-react";
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
import { formatCurrency, formatDate, formatRelative, shortId } from "@/lib/format";
import { useAuth } from "@/lib/store";

export default function AdminTransactionsPage() {
  const token = useAuth((state) => state.token);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  const transactionsQuery = useQuery({
    queryKey: ["admin", "transactions", token, { limit, offset }],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminPayments(token, { limit, offset });
    },
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const transactions = transactionsQuery.data?.data ?? [];
  const total = transactionsQuery.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300">
            Transactions
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
            Charge activity
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Amounts, statuses, and invoice identifiers for every payment recorded on the
            platform.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-white/10 bg-white/5 px-3 py-1 text-slate-300"
        >
          {total.toLocaleString("en-US")} transactions
        </Badge>
      </div>

      <Card className="overflow-hidden border-white/10 bg-[#0f172a]">
        <DataTableToolbar
          meta={`${total} total`}
          onRefresh={() => void transactionsQuery.refetch()}
          isRefreshing={transactionsQuery.isFetching}
        />

        {transactionsQuery.isError ? (
          <div className="p-4">
            <Alert className="border-rose-400/25 bg-rose-500/10 text-rose-200">
              <ShieldOff aria-hidden />
              <AlertTitle>We could not load the transactions</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3 text-rose-200/80 sm:flex-row sm:items-center sm:justify-between">
                <span>{getErrorMessage(transactionsQuery.error)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void transactionsQuery.refetch()}
                  className="border-rose-400/30 bg-transparent text-rose-200 hover:bg-rose-500/10"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : transactionsQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-20 bg-white/10" />
                <Skeleton className="h-5 w-24 rounded-full bg-white/10" />
                <Skeleton className="h-4 flex-1 bg-white/10" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ReceiptText}
              title="No transactions"
              description="Payments will appear here as soon as the first charge is recorded."
              className="border-white/10 bg-white/[0.02] py-12 [&_h3]:text-slate-200 [&_p]:text-slate-500"
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="pl-4 text-slate-500">Date</TableHead>
                <TableHead className="text-right text-slate-500">Amount</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500">Provider</TableHead>
                <TableHead className="text-slate-500">Invoice</TableHead>
                <TableHead className="pr-4 text-right text-slate-500">Subscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="border-white/5 hover:bg-white/[0.03]"
                >
                  <TableCell className="pl-4">
                    <p className="text-xs text-slate-200">{formatDate(transaction.created_at)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {formatRelative(transaction.created_at)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-slate-100">
                    {formatCurrency(transaction.amount_cents, transaction.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={transaction.status}
                      kind="payment"
                      context="admin"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/5 text-slate-300"
                    >
                      {providerLabel(transaction.provider)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CopyButton
                      value={transaction.provider_invoice_id}
                      label="Invoice ID"
                      display={shortId(transaction.provider_invoice_id, 18)}
                    />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <CopyButton
                      value={transaction.subscription_id}
                      label="Subscription ID"
                      display={
                        transaction.subscription_id
                          ? shortId(transaction.subscription_id, 10)
                          : "—"
                      }
                    />
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
          hasNext={transactionsQuery.data?.has_next ?? false}
          isFetching={transactionsQuery.isFetching}
          onPrevious={() => setOffset((current) => Math.max(0, current - limit))}
          onNext={() => setOffset((current) => current + limit)}
        />
      </Card>
    </div>
  );
}
