"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useAuth } from "@/lib/store";

function AppToaster() {
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" | "system" =
    resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system";

  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  useEffect(() => {
    const finish = () => useAuth.getState().setHydrated(true);
    const unsubscribe = useAuth.persist.onFinishHydration(finish);
    void useAuth.persist.rehydrate();
    if (useAuth.persist.hasHydrated()) finish();
    return unsubscribe;
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <AppToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
