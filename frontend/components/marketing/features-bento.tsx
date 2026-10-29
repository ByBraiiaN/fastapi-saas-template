import type { LucideIcon } from "lucide-react";
import { Activity, BellRing, ShieldCheck, Webhook, Workflow } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
};

function FeatureCard({ icon: Icon, title, description, className, children }: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-colors duration-200 hover:border-primary/35",
        className
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl border border-border/70 bg-surface text-primary">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </article>
  );
}

type ActivityBar = {
  id: string;
  label: string;
  height: string;
  highlight?: boolean;
};

const bars: ActivityBar[] = [
  { id: "monday", label: "M", height: "42%" },
  { id: "tuesday", label: "T", height: "58%" },
  { id: "wednesday", label: "W", height: "50%" },
  { id: "thursday", label: "T", height: "72%" },
  { id: "friday", label: "F", height: "66%" },
  { id: "saturday", label: "S", height: "84%", highlight: true },
  { id: "sunday", label: "S", height: "78%" },
];

export function FeaturesBento() {
  return (
    <section id="product" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
            <span className="h-px w-6 bg-primary" aria-hidden />
            The product
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
            Fewer tabs.
            <br />
            More signal.
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Orbit turns scattered information into a shared view for the whole team. No
            CSV exports, no chasing updates, and no relying on a single person.
          </p>
        </div>

        <div className="mt-11 grid gap-4 md:grid-cols-12">
          <FeatureCard
            icon={Activity}
            title="The pulse of your operation"
            description="Revenue, usage, incidents, and team performance in a summary you can read in seconds."
            className="md:col-span-7"
          >
            <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Weekly activity</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Revenue and usage combined</p>
                </div>
                <Badge variant="default">+24.8%</Badge>
              </div>
              <div className="mt-5 flex h-28 items-end gap-2">
                {bars.map((bar) => (
                  <div key={bar.id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-24 w-full items-end rounded-md bg-secondary/70">
                      <div
                        className={cn(
                          "w-full rounded-md",
                          bar.highlight ? "bg-primary" : "bg-primary/35"
                        )}
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                <span>Peak: Saturday, 11:00</span>
                <span className="font-medium text-foreground">1,284 events</span>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={BellRing}
            title="Alerts that explain why"
            description="Every alert arrives with context, owners, and the next step. Less noise, more decisions."
            className="md:col-span-5"
          >
            <div className="space-y-2">
              {[
                {
                  title: "Latency above threshold",
                  meta: "Payments · 4 min ago",
                  tone: "bg-accent",
                  status: "In review",
                },
                {
                  title: "New activation spike",
                  meta: "Product · 18 min ago",
                  tone: "bg-primary",
                  status: "Resolved",
                },
                {
                  title: "Priority ticket unassigned",
                  meta: "Support · 26 min ago",
                  tone: "bg-admin",
                  status: "Open",
                },
              ].map((alert) => (
                <div
                  key={alert.title}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface/50 p-3"
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", alert.tone)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{alert.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{alert.meta}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{alert.status}</span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Workflow}
            title="Automations without a spreadsheet"
            description="Connect an event to an action and let repetitive work resolve itself."
            className="md:col-span-4"
          >
            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
              {[
                "A priority ticket comes in",
                "It is assigned to the on-call",
                "The team gets the alert",
              ].map((step, index) => (
                <li key={step} className="relative flex items-center gap-3">
                  <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background font-mono text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs">{step}</span>
                </li>
              ))}
            </ol>
          </FeatureCard>

          <FeatureCard
            icon={ShieldCheck}
            title="Permissions that grow with you"
            description="Per-team roles so each person sees what they need, no more and no less."
            className="md:col-span-4"
          >
            <div className="rounded-xl border border-border/70 bg-surface/50 p-4">
              <div className="flex -space-x-2">
                {[
                  { initials: "LF", color: "bg-primary text-white" },
                  { initials: "MS", color: "bg-ink text-white" },
                  { initials: "IR", color: "bg-accent text-ink" },
                ].map((person) => (
                  <Avatar key={person.initials} className="size-8 border-2 border-card">
                    <AvatarFallback className={person.color}>{person.initials}</AvatarFallback>
                  </Avatar>
                ))}
                <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                  +9
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary">Admin</Badge>
                <Badge variant="secondary">Editor</Badge>
                <Badge variant="outline">Read-only</Badge>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={Webhook}
            title="Open by design"
            description="REST API, webhooks, and per-environment keys. Your data leaves when and how you want."
            className="md:col-span-4"
          >
            <div className="code-block !p-3.5 !text-[11px] !leading-5">
              <p className="text-slate-500">POST /billing/webhook</p>
              <p className="mt-1 text-primary">200</p>
              <p className="text-slate-300">{"{ event: \"subscription.updated\" }"}</p>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
