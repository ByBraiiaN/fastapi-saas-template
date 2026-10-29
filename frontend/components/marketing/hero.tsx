import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CircleCheck,
  Clock3,
  Inbox,
  LayoutGrid,
  LockKeyhole,
  Search,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";
import { OrbitMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

const sidebarIcons = [LayoutGrid, BarChart3, Inbox, Zap];

const stats = [
  { label: "MRR", value: "$128.4k", change: "+12.8%", positive: true },
  { label: "Activations", value: "1,284", change: "+3.1%", positive: true },
  { label: "Response", value: "1m 42s", change: "-18s", positive: true },
];

const alerts = [
  { label: "Latency spike", detail: "Payments API", tone: "bg-accent" },
  { label: "New plan active", detail: "Norte · Pro", tone: "bg-primary" },
  { label: "Unassigned ticket", detail: "Support · 8 min", tone: "bg-admin" },
];

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div
        className="absolute inset-0 translate-y-3 rotate-[-1.4deg] rounded-[2rem] border border-primary/15 bg-primary/[0.04]"
        aria-hidden
      />
      <div
        className="absolute inset-x-10 -bottom-8 h-20 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-lift transition-transform duration-500 hover:rotate-0 hover:scale-[1.005] motion-reduce:transition-none"
        role="img"
        aria-label="Illustrative view of the Orbit dashboard with metrics, revenue chart, and team alerts"
      >
        <div className="flex h-10 items-center justify-between border-b border-border/70 bg-surface/80 px-4">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-destructive/60" />
            <span className="size-2 rounded-full bg-accent/70" />
            <span className="size-2 rounded-full bg-primary/70" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <LockKeyhole className="size-2.5" aria-hidden />
            app.orbit.demo
          </div>
          <div className="flex items-center gap-2 text-muted-foreground" aria-hidden>
            <Search className="size-3" />
            <Bell className="size-3" />
          </div>
        </div>

        <div className="grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[58px_minmax(0,1fr)]">
          <aside className="flex flex-col items-center gap-2 border-r border-white/5 bg-ink px-2 py-3 text-white/45">
            <OrbitMark className="mb-2 size-7 rounded-lg ring-white/15" />
            {sidebarIcons.map((Icon, index) => (
              <span
                key={index}
                className={
                  index === 0
                    ? "grid size-8 place-items-center rounded-lg bg-white/10 text-white"
                    : "grid size-8 place-items-center rounded-lg transition-colors hover:bg-white/10 hover:text-white"
                }
                aria-hidden
              >
                <Icon className="size-3.5" />
              </span>
            ))}
            <span className="mt-auto grid size-8 place-items-center rounded-lg text-white/45" aria-hidden>
              <Settings className="size-3.5" />
            </span>
          </aside>

          <div className="min-w-0 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Wednesday, October 22</p>
                <p className="mt-0.5 font-display text-base font-semibold tracking-tight sm:text-lg">
                  Good morning, Valeria
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-medium text-primary-strong">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  Live
                </span>
                <span className="hidden size-7 place-items-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground sm:grid">
                  VG
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/70 bg-surface/60 p-2.5">
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-display text-sm font-semibold tracking-tight sm:text-[15px]">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium text-primary-strong">{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="mt-2.5 rounded-xl border border-border/70 bg-surface/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium">Revenue and usage</p>
                  <p className="text-[9px] text-muted-foreground">Last 30 days</p>
                </div>
                <div className="flex gap-0.5 rounded-md bg-secondary p-0.5 text-[8px] text-muted-foreground">
                  <span className="rounded px-1.5 py-0.5">7d</span>
                  <span className="rounded bg-background px-1.5 py-0.5 font-medium text-foreground shadow-sm">
                    30d
                  </span>
                  <span className="rounded px-1.5 py-0.5">90d</span>
                </div>
              </div>

              <svg
                viewBox="0 0 420 132"
                className="mt-2 h-[108px] w-full text-primary"
                fill="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="orbit-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[24, 56, 88, 120].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="420"
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />
                ))}
                <path
                  d="M0 106 C 26 99, 44 92, 68 94 C 94 96, 106 77, 132 74 C 158 71, 170 84, 194 72 C 220 59, 236 48, 260 53 C 286 58, 300 39, 324 35 C 350 31, 366 45, 390 28 C 402 20, 412 17, 420 14 L 420 132 L 0 132 Z"
                  fill="url(#orbit-chart-fill)"
                />
                <path
                  d="M0 106 C 26 99, 44 92, 68 94 C 94 96, 106 77, 132 74 C 158 71, 170 84, 194 72 C 220 59, 236 48, 260 53 C 286 58, 300 39, 324 35 C 350 31, 366 45, 390 28 C 402 20, 412 17, 420 14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="390" cy="28" r="4" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border/70 bg-surface/40 p-2.5">
                <p className="flex items-center justify-between text-[9px] font-medium">
                  Alerts <span className="text-muted-foreground">3</span>
                </p>
                <div className="mt-2 space-y-1.5">
                  {alerts.map((alert) => (
                    <div key={alert.label} className="flex items-center gap-1.5">
                      <span className={`size-1.5 shrink-0 rounded-full ${alert.tone}`} aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-[8px] font-medium leading-tight">{alert.label}</p>
                        <p className="truncate text-[7px] leading-tight text-muted-foreground">
                          {alert.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/40 p-2.5">
                <p className="text-[9px] font-medium">Today</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-1.5">
                    <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-2" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[8px] font-medium leading-tight">Weekly close</p>
                      <p className="text-[7px] leading-tight text-muted-foreground">Completed · 09:30</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                      <Clock3 className="size-2" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[8px] font-medium leading-tight">Churn review</p>
                      <p className="text-[7px] leading-tight text-muted-foreground">Today · 16:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-14 -left-6 hidden w-48 rounded-xl border border-border bg-card p-3 shadow-soft sm:block">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
            <CircleCheck className="size-3.5" aria-hidden />
          </span>
          <p className="text-[11px] font-medium">Active automation</p>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          Priority ticket · notify support
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-4/5 rounded-full bg-primary" />
        </div>
      </div>

      <div className="absolute -right-4 -top-5 hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-soft md:flex lg:-right-5">
        <TrendingUp className="size-4 text-primary" aria-hidden />
        <div>
          <p className="text-[9px] text-muted-foreground">This week</p>
          <p className="text-sm font-semibold leading-none">+24.8%</p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-20 -top-28 -z-10 hidden size-[420px] rounded-full border border-primary/10 lg:block"
        aria-hidden
      >
        <div className="absolute inset-12 rounded-full border border-dashed border-primary/10" />
        <div className="absolute inset-24 rounded-full border border-accent/15" />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-orbital-glow" aria-hidden />

      <div className="shell relative grid items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:pb-28 lg:pt-24">
        <div className="max-w-2xl">
          <div className="animate-enter">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              SaaS template · FastAPI + Next.js + Paddle
            </span>
          </div>

          <h1 className="mt-6 animate-enter text-balance font-display text-[2.9rem] font-semibold leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[4.35rem] [animation-delay:80ms]">
            Your operation,
            <span className="relative mt-1 block">
              finally in orbit.
              <svg
                className="absolute -bottom-2 left-0 h-2.5 w-[64%] text-primary/75"
                viewBox="0 0 320 12"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 8.5C66 3 158 2.5 318 6.2"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl animate-enter text-pretty text-lg leading-relaxed text-muted-foreground [animation-delay:150ms] sm:text-[19px]">
            Orbit brings metrics, alerts, and team work into one dashboard you can read at a
            glance. Start with a real foundation: authentication, roles, plans, and billing already
            handled.
          </p>

          <div className="mt-8 flex animate-enter flex-col gap-3 sm:flex-row sm:items-center [animation-delay:220ms]">
            <Button asChild size="lg" className="group">
              <Link href="/register">
                Create free account
                <ArrowUpRight
                  className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View plans and pricing</Link>
            </Button>
          </div>

          <p className="mt-4 animate-enter text-xs text-muted-foreground [animation-delay:280ms]">
            No card required · Free plan forever · Cancel anytime
          </p>

          <div className="mt-9 flex animate-enter flex-wrap items-center gap-x-4 gap-y-3 [animation-delay:340ms]">
            <div className="flex -space-x-2" aria-hidden>
              {[
                { initials: "LF", className: "bg-primary text-white" },
                { initials: "MS", className: "bg-ink text-white" },
                { initials: "IR", className: "bg-accent text-ink" },
                { initials: "JC", className: "bg-admin text-white" },
              ].map((person) => (
                <span
                  key={person.initials}
                  className={`grid size-8 place-items-center rounded-full border-2 border-background text-[10px] font-semibold ${person.className}`}
                >
                  {person.initials}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Product, support, and finance teams are already working in orbit.
            </p>
          </div>
        </div>

        <div className="relative animate-enter [animation-delay:180ms]">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
