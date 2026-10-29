"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { OrbitLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ApiError, api, getErrorMessage } from "@/lib/api";
import { userFromToken } from "@/lib/session";
import { useAuth } from "@/lib/store";

const adminThemeVars = [
  "[--background:220_49%_8%]",
  "[--foreground:210_40%_98%]",
  "[--card:220_40%_11%]",
  "[--card-foreground:210_40%_98%]",
  "[--popover:220_40%_11%]",
  "[--popover-foreground:210_40%_98%]",
  "[--primary:243_75%_65%]",
  "[--primary-strong:243_80%_72%]",
  "[--primary-foreground:0_0%_100%]",
  "[--secondary:220_30%_16%]",
  "[--secondary-foreground:210_40%_96%]",
  "[--muted:220_30%_16%]",
  "[--muted-foreground:215_20%_68%]",
  "[--border:220_26%_20%]",
  "[--input:220_26%_24%]",
  "[--ring:243_75%_65%]",
  "[--destructive:0_72%_56%]",
  "[--destructive-foreground:0_0%_100%]",
].join(" ");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);
  const hydrated = useAuth((state) => state.hydrated);
  const setSession = useAuth((state) => state.setSession);
  const clear = useAuth((state) => state.clear);

  const redirected = useRef(false);
  const handledError = useRef(false);

  const accessQuery = useQuery({
    queryKey: ["admin", "stats", token],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminStats(token);
    },
    enabled: hydrated && Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      if (!redirected.current) {
        redirected.current = true;
        router.replace("/login");
      }
      return;
    }

    if (!user) {
      const decoded = userFromToken(token);
      if (decoded) setSession({ token, user: decoded });
    }
  }, [hydrated, router, setSession, token, user]);

  useEffect(() => {
    if (!accessQuery.isError || handledError.current) return;
    if (!(accessQuery.error instanceof ApiError)) return;

    handledError.current = true;

    if (accessQuery.error.status === 403) {
      toast.error("Access restricted", {
        description: "The admin console requires an administrator role.",
      });
      router.replace("/dashboard");
      return;
    }

    if (accessQuery.error.status === 401) {
      clear();
      toast.error("Your session has expired", {
        description: "Sign in again to continue.",
      });
      router.replace("/login");
    }
  }, [accessQuery.error, accessQuery.isError, clear, router]);

  if (!hydrated || !token || accessQuery.isPending) {
    return (
      <div className={`grid min-h-screen place-items-center bg-[#0B1220] px-5 ${adminThemeVars}`}>
        <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
          <OrbitLogo textClassName="text-white" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Checking permissions…
          </div>
        </div>
      </div>
    );
  }

  if (accessQuery.isError) {
    const isForbidden = accessQuery.error instanceof ApiError && accessQuery.error.status === 403;
    const isUnauthorized =
      accessQuery.error instanceof ApiError && accessQuery.error.status === 401;

    if (isForbidden || isUnauthorized) {
      return (
        <div className={`grid min-h-screen place-items-center bg-[#0B1220] px-5 ${adminThemeVars}`}>
          <div className="flex max-w-sm flex-col items-center gap-3 text-center" role="status">
            <span className="grid size-12 place-items-center rounded-full bg-rose-500/10 text-rose-300">
              <ShieldAlert className="size-6" aria-hidden />
            </span>
            <p className="font-display text-lg font-semibold text-white">
              {isForbidden ? "Access restricted" : "Session expired"}
            </p>
            <p className="text-sm text-slate-400">
              {isForbidden
                ? "Taking you back to your dashboard."
                : "Redirecting to sign in…"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`grid min-h-screen place-items-center bg-[#0B1220] px-5 ${adminThemeVars}`}>
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-rose-500/10 text-rose-300">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-white">
              We could not open the console
            </p>
            <p className="mt-1 text-sm text-slate-400">{getErrorMessage(accessQuery.error)}</p>
          </div>
          <Button
            type="button"
            onClick={() => void accessQuery.refetch()}
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            <RefreshCw className="size-4" aria-hidden />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0B1220] text-slate-100 ${adminThemeVars}`}>
      <a
        href="#admin-content"
        className="sr-only z-50 rounded-md bg-indigo-500 px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.13),transparent_55%)]"
        aria-hidden
      />

      <AdminSidebar />

      <div className="relative flex min-h-screen flex-col lg:pl-64">
        <AdminTopbar />
        <main
          id="admin-content"
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
