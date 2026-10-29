"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { OrbitLogo } from "@/components/brand";
import { userFromToken } from "@/lib/session";
import { useAuth } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);
  const hydrated = useAuth((state) => state.hydrated);
  const setSession = useAuth((state) => state.setSession);

  const redirected = useRef(false);

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

  if (!hydrated || !token) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface/40 px-5">
        <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
          <OrbitLogo />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Checking your session…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface/40">
      <a
        href="#content"
        className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,hsl(var(--primary)/0.08),transparent_38%)]"
        aria-hidden
      />

      <DashboardSidebar />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <DashboardTopbar />
        <main
          id="content"
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
