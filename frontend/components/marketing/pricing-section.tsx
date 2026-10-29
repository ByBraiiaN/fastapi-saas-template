"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Plan } from "@/lib/api";
import {
  formatMoney,
  getPlanFeatures,
  isFeaturedPlan,
  monthlyEquivalent,
  planAudience,
  selectPlansForPeriod,
  type PricingPeriod,
} from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingSectionProps = {
  plans: Plan[];
};

const periods: { value: PricingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function PricingSection({ plans }: PricingSectionProps) {
  const [period, setPeriod] = useState<PricingPeriod>("monthly");
  const selection = selectPlansForPeriod(plans, period);
  const visiblePlans = selection.plans;
  const currency = visiblePlans[0]?.currency ?? "USD";

  return (
    <section id="pricing" className="relative scroll-mt-20 border-t border-border/70 bg-surface/60 py-20 sm:py-28">
      <div className="shell">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
              <span className="h-px w-6 bg-primary" aria-hidden />
              Pricing
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              A plan for every stage.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Start free and upgrade when your team needs it. No commitment, no fine
              print, and checkout managed by Paddle.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div
              className="inline-flex w-fit items-center rounded-full border border-border bg-card p-1 shadow-sm"
              role="group"
              aria-label="Billing period"
            >
              {periods.map((option) => {
                const active = period === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "bg-ink text-white shadow-sm dark:bg-primary dark:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {period === "yearly"
                ? "You save the equivalent of 2 months."
                : "Switch to yearly whenever you like."}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 grid gap-5",
            visiblePlans.length === 2
              ? "mx-auto max-w-4xl md:grid-cols-2"
              : "md:grid-cols-2 xl:grid-cols-3"
          )}
        >
          {visiblePlans.map((plan) => {
            const featured = isFeaturedPlan(plan);
            const price = monthlyEquivalent(plan);
            const isFree = plan.price_cents === 0;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex h-full flex-col border-border/80 p-6 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none",
                  featured &&
                    "border-ink bg-ink text-white shadow-lift dark:border-primary/35 dark:bg-secondary"
                )}
              >
                {featured ? (
                  <Badge className="absolute right-5 top-5 border-transparent bg-accent text-ink">
                    Most popular
                  </Badge>
                ) : null}

                <div>
                  <h3
                    className={cn(
                      "font-display text-xl font-semibold tracking-tight",
                      featured && "text-white"
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      "mt-1.5 text-sm",
                      featured ? "text-white/60" : "text-muted-foreground"
                    )}
                  >
                    {planAudience(plan)}
                  </p>
                </div>

                <div className="mt-7">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[2.6rem] font-semibold leading-none tracking-[-0.05em]">
                      {formatMoney(price, plan.currency)}
                    </span>
                    <span className={cn("text-sm", featured ? "text-white/60" : "text-muted-foreground")}>
                      /month
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-xs",
                      featured ? "text-white/55" : "text-muted-foreground"
                    )}
                  >
                    {isFree
                      ? "Free forever. No card required."
                      : period === "yearly"
                        ? `Billed ${formatMoney(plan.price_cents, plan.currency)} per year`
                        : "Billed monthly. Cancel anytime."}
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-3 text-sm">
                  {getPlanFeatures(plan).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          featured ? "text-accent" : "text-primary"
                        )}
                        aria-hidden
                      />
                      <span className={featured ? "text-white/80" : "text-muted-foreground"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={featured ? "accent" : isFree ? "default" : "outline"}
                  className="mt-8 w-full"
                  size="lg"
                >
                  <Link href={isFree ? "/register" : `/register?plan=${encodeURIComponent(plan.code)}`}>
                    {isFree ? "Start for free" : `Choose ${plan.name}`}
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>

        {selection.estimated ? (
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Reference yearly price calculated from the monthly catalog. Set your yearly
            prices in the admin panel.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>Prices in {currency}. Paddle calculates taxes and acts as Merchant of Record.</p>
          <Link
            href="/pricing#comparison"
            className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            View full comparison
          </Link>
        </div>
      </div>
    </section>
  );
}
