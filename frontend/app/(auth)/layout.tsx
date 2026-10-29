import Link from "next/link";
import { Check } from "lucide-react";
import { OrbitLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const benefits = [
  "Auth with verification and OTP",
  "Plans and checkout with Paddle",
  "Dashboard and admin panel",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "54px 54px",
            maskImage: "radial-gradient(ellipse at 30% 20%, black 20%, transparent 75%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 top-24 size-[460px] rounded-full border border-white/10"
          aria-hidden
        >
          <div className="absolute inset-16 rounded-full border border-primary/25" />
          <div className="absolute inset-32 rounded-full border border-dashed border-white/15" />
          <div className="absolute left-12 top-20 size-3 rounded-full bg-accent" />
        </div>
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />

        <Link href="/" className="relative z-10 w-fit rounded-lg" aria-label="Orbit, go to home">
          <OrbitLogo textClassName="text-white" />
        </Link>

        <div className="relative z-10 my-auto max-w-md py-16">
          <p className="text-sm font-medium text-primary-strong">The foundation for your next SaaS</p>
          <p className="mt-4 text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] xl:text-5xl">
            Less infrastructure. More product.
          </p>
          <p className="mt-5 text-pretty text-base leading-relaxed text-white/60">
            Start with a polished identity, real authentication, and a billing flow that already
            works. The rest is your idea.
          </p>

          <ul className="mt-8 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-white/75">
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5">
                  <Check className="size-3 text-accent" aria-hidden />
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <figure className="mt-12 border-t border-white/10 pt-6">
            <blockquote className="text-pretty text-sm leading-relaxed text-white/65">
              “The template saved us the first two weeks. We started talking about product
              from day one.”
            </blockquote>
            <figcaption className="mt-3 text-xs text-white/60">
              Lucía Ferrer · COO at Norte
            </figcaption>
          </figure>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/60">
          <p>SaaS template — adapt it to your product.</p>
          <Link href="/terms" className="rounded-sm transition-colors hover:text-white/70">
            Terms
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:justify-end">
          <Link href="/" className="rounded-lg lg:hidden" aria-label="Orbit, go to home">
            <OrbitLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Back to home
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>

        <footer className="px-5 pb-6 text-center text-xs text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} Orbit ·{" "}
          <Link href="/privacy" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
            Terms
          </Link>
        </footer>
      </div>
    </div>
  );
}
