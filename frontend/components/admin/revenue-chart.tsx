"use client";

import { useMemo } from "react";
import { Activity, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Payment } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type RevenueChartProps = {
  transactions: Payment[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

type MonthBucket = {
  key: string;
  label: string;
  total: number;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthBuckets(): MonthBucket[] {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = new Intl.DateTimeFormat("en-US", { month: "short" })
      .format(date)
      .replace(".", "");

    return {
      key: monthKey(date),
      label: `${month} ${String(date.getFullYear()).slice(-2)}`,
      total: 0,
    };
  });
}

function compactCurrency(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(cents / 100);
  } catch {
    return String(Math.round(cents / 100));
  }
}

export function RevenueChart({
  transactions,
  isLoading = false,
  isError = false,
  className,
}: RevenueChartProps) {
  const currency = transactions.find((item) => item.currency)?.currency ?? "USD";

  const data = useMemo(() => {
    const buckets = buildMonthBuckets();
    const positions = new Map(buckets.map((bucket, index) => [bucket.key, index]));

    for (const payment of transactions) {
      if (payment.status.toLowerCase() !== "succeeded") continue;

      const date = new Date(payment.created_at);
      if (Number.isNaN(date.getTime())) continue;

      const position = positions.get(monthKey(date));
      if (position === undefined) continue;

      buckets[position].total += payment.amount_cents;
    }

    return buckets;
  }, [transactions]);

  const hasData = data.some((bucket) => bucket.total > 0);

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-[#0f172a]", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-white/10 pb-4">
        <div>
          <CardTitle className="text-sm font-medium text-white">Revenue by month</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Completed payments in the last 6 months
          </p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
          <TrendingUp className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-5 sm:p-5">
        {isLoading ? (
          <Skeleton className="h-64 w-full bg-white/10" />
        ) : isError ? (
          <EmptyState
            icon={Activity}
            title="We could not load revenue"
            description="Refresh the page to try again."
            className="border-white/10 bg-white/[0.02] py-12 [&_h3]:text-slate-200 [&_p]:text-slate-500"
          />
        ) : !hasData ? (
          <EmptyState
            icon={Activity}
            title="No revenue yet"
            description="When the first payment completes, you will see the monthly trend here."
            className="border-white/10 bg-white/[0.02] py-12 [&_h3]:text-slate-200 [&_p]:text-slate-500"
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  width={72}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(value) => compactCurrency(Number(value), currency)}
                />
                <RechartsTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.16)", strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 4, fill: "#c7d2fe", stroke: "#4f46e5", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
