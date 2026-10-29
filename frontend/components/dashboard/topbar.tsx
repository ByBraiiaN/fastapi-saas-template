"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getInitials } from "@/lib/format";
import { useAuth } from "@/lib/store";

const pageLabels: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
  "/dashboard/account": "Account",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuth((state) => state.user);
  const token = useAuth((state) => state.token);
  const clear = useAuth((state) => state.clear);

  const label = pageLabels[pathname] ?? "Overview";
  const displayName = user?.username ?? user?.email ?? "My account";
  const initials = getInitials(displayName);

  function handleLogout() {
    if (token) {
      void api.logout(token).catch(() => undefined);
    }
    clear();
    queryClient.clear();
    toast.success("Signed out", {
      description: "Come back anytime; your work is still here.",
    });
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="size-[18px]" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] border-r-0 bg-background p-0 sm:max-w-xs"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Dashboard menu</SheetTitle>
            <SheetDescription>Access overview, billing, settings, and account.</SheetDescription>
          </SheetHeader>
          <DashboardSidebar variant="mobile" onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <nav aria-label="Breadcrumbs" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Dashboard</span>
        <ChevronRight className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
        <span className="truncate font-medium">{label}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open account menu"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary-strong">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="space-y-0.5">
              <span className="block truncate text-sm font-medium text-foreground">
                {displayName}
              </span>
              {user?.email ? (
                <span className="block truncate text-[11px] font-normal text-muted-foreground">
                  {user.email}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/dashboard/account")}>
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
              <Settings className="size-4 text-muted-foreground" aria-hidden />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/dashboard/billing")}>
              <CreditCard className="size-4 text-muted-foreground" aria-hidden />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
