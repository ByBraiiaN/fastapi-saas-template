"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { OrbitLogo } from "@/components/brand";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/account", label: "Account", icon: UserRound },
];

export function DashboardSidebar({ variant = "desktop", onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const token = useAuth((state) => state.token);

  const subscriptionQuery = useQuery({
    queryKey: ["sub", token],
    queryFn: () => {
      if (!token) return Promise.resolve(null);
      return api.me(token);
    },
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const adminProbe = useQuery({
    queryKey: ["admin", "access", token],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminStats(token);
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const subscription = subscriptionQuery.data ?? null;
  const isMobile = variant === "mobile";

  return (
    <aside
      className={cn(
        isMobile
          ? "flex h-full w-full flex-col bg-background"
          : "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-card/85 backdrop-blur-xl lg:flex"
      )}
      aria-label="Sidebar"
    >
      <div className={cn("flex h-16 items-center px-5", isMobile && "pr-12")}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="rounded-lg"
          aria-label="Orbit, go to overview"
        >
          <OrbitLogo />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 pt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Operations
        </p>
        <nav className="space-y-1" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary-strong"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {adminProbe.isSuccess ? (
          <div className="mt-4 border-t border-border/60 pt-4">
            <Link
              href="/admin"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Admin console
              <Badge variant="outline" className="ml-auto px-1.5 py-0 text-[9px] uppercase">
                Admin
              </Badge>
            </Link>
          </div>
        ) : null}

        <div className="mt-auto pt-6">
          {subscriptionQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : subscription ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Current plan
                </p>
                <StatusBadge status={subscription.status} />
              </div>
              <p className="mt-1.5 font-display text-sm font-semibold">{subscription.plan.name}</p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-2 h-8 w-full justify-between px-2 text-xs"
              >
                <Link href="/dashboard/billing" onClick={onNavigate}>
                  Manage
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background/60 p-3">
              <p className="text-xs font-medium">No active plan</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Choose a plan to unlock the full dashboard.
              </p>
              <Button asChild size="sm" className="mt-3 h-8 w-full">
                <Link href="/dashboard/billing" onClick={onNavigate}>
                  View plans
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
