import Link from "next/link";
import { OrbitLogo } from "@/components/brand";
import { footerColumns } from "@/lib/content";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface/70">
      <div className="shell py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex rounded-lg" aria-label="Orbit, go to home">
              <OrbitLogo />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Metrics, alerts, and team workflows in a dashboard you can read at a glance. The complete
              foundation to launch your product.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              Demo environment
            </p>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              SaaS template — adapt it to your product.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Orbit. All rights reserved.</p>
          <p>
            Built with FastAPI, Next.js, and Paddle.{" "}
            <Link href="/admin" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
              Admin panel
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
