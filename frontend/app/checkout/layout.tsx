import Link from "next/link";
import { OrbitLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface/60">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between">
          <Link href="/" className="rounded-lg" aria-label="Orbit, go to home">
            <OrbitLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              View plans
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-14 sm:px-8 sm:py-20">
        {children}
      </main>

      <footer className="px-5 pb-6 text-center text-xs text-muted-foreground">
        SaaS template — adapt it to your product.
      </footer>
    </div>
  );
}
