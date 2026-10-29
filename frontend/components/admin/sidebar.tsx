"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OrbitLogo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const navItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/transactions", label: "Transactions", icon: ReceiptText },
];

export function AdminSidebar({ variant = "desktop", onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-[#0B1220]",
        isMobile
          ? "w-full"
          : "fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 lg:flex"
      )}
      aria-label="Admin sidebar"
    >
      <div className={cn("flex h-16 items-center gap-2 px-5", isMobile && "pr-12")}>
        <Link
          href="/admin"
          onClick={onNavigate}
          className="rounded-lg"
          aria-label="Orbit Admin, go to dashboard"
        >
          <OrbitLogo textClassName="text-white" />
        </Link>
        <Badge className="ml-auto border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
          Admin
        </Badge>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 pt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
          Console
        </p>
        <nav className="space-y-1" aria-label="Admin navigation">
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
                    ? "bg-indigo-500/15 font-medium text-white ring-1 ring-inset ring-indigo-400/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-indigo-400"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={cn("size-4 shrink-0", active ? "text-indigo-300" : "text-slate-500")}
                  aria-hidden
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to app
          </Link>
          <p className="mt-3 px-3 text-[10px] leading-relaxed text-slate-600">
            Restricted to administrators.
          </p>
        </div>
      </div>
    </aside>
  );
}
