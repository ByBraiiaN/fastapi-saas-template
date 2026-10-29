import { CircleAlert, ReceiptText } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Payment } from "@/lib/api";
import { providerLabel } from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaymentsTableProps = {
  payments: Payment[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  limit?: number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  emptyDescription?: string;
  className?: string;
};

export function PaymentsTable({
  payments,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  limit,
  title = "Recent payments",
  description,
  action,
  emptyDescription = "When you subscribe to a plan, your invoices and charges will appear here.",
  className,
}: PaymentsTableProps) {
  const rows = typeof limit === "number" ? payments.slice(0, limit) : payments;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardHeader>

      {isLoading ? (
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      ) : isError ? (
        <div className="p-5">
          <EmptyState
            icon={CircleAlert}
            title="We could not load your payments"
            description={errorMessage ?? "Check your connection and try again."}
            action={
              onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              ) : undefined
            }
            className="border-0 bg-transparent py-10"
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={ReceiptText}
            title="No payments yet"
            description={emptyDescription}
            className="border-0 bg-transparent py-10"
          />
        </div>
      ) : (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="pr-6 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((payment) => (
                <TableRow key={payment.id} className="border-border/60">
                  <TableCell className="pl-6">
                    <time dateTime={payment.created_at} className="text-[13px] font-medium">
                      {formatDate(payment.created_at)}
                    </time>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p
                      className="max-w-[14rem] truncate font-mono text-[11px] text-muted-foreground"
                      title={payment.provider_invoice_id}
                    >
                      {payment.provider_invoice_id}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {providerLabel(payment.provider)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-[13px] font-medium tabular-nums">
                    {formatCurrency(payment.amount_cents, payment.currency)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <StatusBadge status={payment.status} kind="payment" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
