"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, LogOut, Menu, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AdminSidebar } from "@/components/admin/sidebar";
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
import { getInitials } from "@/lib/format";
import { useAuth } from "@/lib/store";

const pageLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/subscriptions": "Subscriptions",
  "/admin/transactions": "Transactions",
};

export function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuth((state) => state.user);
  const token = useAuth((state) => state.token);
  const clear = useAuth((state) => state.clear);

  const label = pageLabels[pathname] ?? "Dashboard";
  const displayName = user?.username ?? user?.email ?? "Administrator";
  const initials = getInitials(displayName);

  function handleLogout() {
    if (token) {
      void api.logout(token).catch(() => undefined);
    }
    clear();
    queryClient.clear();
    toast.success("Signed out");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/10 bg-[#0B1220]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu className="size-[18px]" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] border-r border-white/10 bg-[#0B1220] p-0 text-slate-100 sm:max-w-xs [&>button]:text-slate-400 [&>button]:hover:bg-white/10 [&>button]:hover:text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Admin menu</SheetTitle>
            <SheetDescription>Dashboard, users, subscriptions, and transactions.</SheetDescription>
          </SheetHeader>
          <AdminSidebar variant="mobile" onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <nav aria-label="Breadcrumbs" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-slate-500 sm:inline">Admin</span>
        <ChevronRight className="hidden size-3.5 text-slate-600 sm:block" aria-hidden />
        <span className="truncate font-medium text-slate-100">{label}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <LinkToApp />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
              aria-label="Open administrator menu"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-indigo-500/20 text-[11px] font-semibold text-indigo-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 border-white/10 bg-[#0f172a] text-slate-100"
          >
            <DropdownMenuLabel className="space-y-0.5">
              <span className="block truncate text-sm font-medium text-slate-100">
                {displayName}
              </span>
              {user?.email ? (
                <span className="block truncate text-[11px] font-normal text-slate-500">
                  {user.email}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard/account")}
              className="focus:bg-white/10 focus:text-white"
            >
              <UserRound className="size-4 text-slate-400" aria-hidden />
              My account
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard")}
              className="focus:bg-white/10 focus:text-white"
            >
              <ArrowLeft className="size-4 text-slate-400" aria-hidden />
              Back to app
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
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

function LinkToApp() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="hidden text-slate-300 hover:bg-white/10 hover:text-white md:inline-flex"
    >
      <a href="/dashboard">
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to app
      </a>
    </Button>
  );
}
