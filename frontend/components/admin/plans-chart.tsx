"use client";

import { useMemo } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminSubscription } from "@/lib/api";
import { subscriptionStatusLabel } from "@/lib/billing";
import { cn } from "@/lib/utils";

type PlansChartProps = {
  subscriptions: AdminSubscription[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

const statusColors: Record<string, string> = {
  active: "#34d399",
  trialing: "#fbbf24",
  pending: "#818cf8",
  past_due: "#fb7185",
  canceled: "#64748b",
};

const statusOrder = ["active", "trialing", "pending", "past_due", "canceled"];

export function PlansChart({
  subscriptions,
  isLoading = false,
  isError = false,
  className,
}: PlansChartProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();

    for (const subscription of subscriptions) {
      const status = subscription.status.toLowerCase();
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    const ordered = statusOrder.filter((status) => counts.has(status));
    const extra = Array.from(counts.keys()).filter((status) => !statusOrder.includes(status));

    return [...ordered, ...extra].map((status) => ({
      key: status,
      name: subscriptionStatusLabel(status),
      value: counts.get(status) ?? 0,
      color: statusColors[status] ?? "#64748b",
    }));
  }, [subscriptions]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-[#0f172a]", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-white/10 pb-4">
        <div>
          <CardTitle className="text-sm font-medium text-white">
            Subscriptions by status
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">Distribution of the current base</p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
          <PieChartIcon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-5 sm:p-5">
        {isLoading ? (
          <Skeleton className="h-60 w-full bg-white/10" />
        ) : isError ? (
          <EmptyState
            icon={PieChartIcon}
            title="We could not load the subscriptions"
            description="Refresh the page to try again."
            className="border-white/10 bg-white/[0.02] py-10 [&_h3]:text-slate-200 [&_p]:text-slate-500"
          />
        ) : total === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title="No subscriptions"
            description="When a subscription exists, you will see its status here."
            className="border-white/10 bg-white/[0.02] py-10 [&_h3]:text-slate-200 [&_p]:text-slate-500"
          />
        ) : (
          <div>
            <div className="h-[188px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.map((item) => (
                      <Cell key={item.key} fill={item.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0B1220",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                    formatter={(value) => [`${value}`, "Subscriptions"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-2 space-y-1.5">
              {data.map((item) => (
                <li key={item.key} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  <span className="text-slate-400">{item.name}</span>
                  <span className="ml-auto font-medium tabular-nums text-slate-200">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
