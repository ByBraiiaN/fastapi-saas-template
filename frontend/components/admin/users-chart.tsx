"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser } from "@/lib/api";
import { cn } from "@/lib/utils";

type UsersChartProps = {
  users: AdminUser[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

type UserBucket = {
  key: string;
  label: string;
  total: number;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthBuckets(): UserBucket[] {
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

export function UsersChart({
  users,
  isLoading = false,
  isError = false,
  className,
}: UsersChartProps) {
  const data = useMemo(() => {
    const buckets = buildMonthBuckets();
    const positions = new Map(buckets.map((bucket, index) => [bucket.key, index]));

    for (const user of users) {
      const date = new Date(user.created_at);
      if (Number.isNaN(date.getTime())) continue;

      const position = positions.get(monthKey(date));
      if (position === undefined) continue;

      buckets[position].total += 1;
    }

    return buckets;
  }, [users]);

  const hasData = data.some((bucket) => bucket.total > 0);

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-[#0f172a]", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-white/10 pb-4">
        <div>
          <CardTitle className="text-sm font-medium text-white">User signups</CardTitle>
          <p className="mt-1 text-xs text-slate-500">Registrations per month in the last 6 months</p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
          <Users className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-5 sm:p-5">
        {isLoading ? (
          <Skeleton className="h-56 w-full bg-white/10" />
        ) : isError ? (
          <EmptyState
            icon={Users}
            title="We could not load the users"
            description="Refresh the page to try again."
            className="border-white/10 bg-white/[0.02] py-10 [&_h3]:text-slate-200 [&_p]:text-slate-500"
          />
        ) : !hasData ? (
          <EmptyState
            icon={Users}
            title="No recent signups"
            description="New registrations will appear here grouped by month."
            className="border-white/10 bg-white/[0.02] py-10 [&_h3]:text-slate-200 [&_p]:text-slate-500"
          />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  width={44}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => [`${value}`, "Users"]}
                />
                <Bar dataKey="total" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
