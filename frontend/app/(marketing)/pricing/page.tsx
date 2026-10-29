import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { PricingSection } from "@/components/marketing/pricing-section";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlans } from "@/lib/plans-server";
import { planPeriod, selectPlansForPeriod } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Clear plans for every stage. Start free and upgrade as your team grows. Billing managed by Paddle.",
};

const comparisonRows: { label: string; values: (string | boolean)[] }[] = [
  { label: "Operations dashboards", values: ["1", "Unlimited", "Unlimited"] },
  { label: "Team members", values: ["3", "20", "Unlimited"] },
  { label: "Data history", values: ["7 days", "12 months", "Unlimited"] },
  { label: "Automations", values: ["—", "100 per month", "Unlimited"] },
  { label: "Alerts and webhooks", values: ["—", true, true] },
  { label: "Roles and permissions", values: ["Basic", "Per team", "Granular + SSO"] },
  { label: "CSV export", values: ["—", true, true] },
  { label: "Support", values: ["Documentation", "Priority", "Dedicated"] },
  { label: "SLA", values: ["—", "—", "99.9%"] },
];

export default async function PricingPage() {
  const plans = await getPlans();
  const monthly = selectPlansForPeriod(plans, "monthly").plans.filter(
    (plan) => planPeriod(plan) === "monthly"
  );
  const columns = monthly.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-50" aria-hidden />
        <div className="shell relative py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              No commitment
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Pricing that does not require a meeting.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Choose by stage, not by call volume. Change plans when you need to and
              keep access until the end of the period.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Need a custom agreement?{" "}
              <Link
                href="/contact"
                className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Let&apos;s talk
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <PricingSection plans={plans} />

      <section id="comparison" className="scroll-mt-24 py-20 sm:py-28">
        <div className="shell">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
              <span className="h-px w-6 bg-primary" aria-hidden />
              Comparison
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-4xl">
              The differences, without the maze.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              All the core functionality is in all three plans. What changes is scale,
              history, and the level of control.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableCaption className="px-4 pb-4">
                A guide comparison across the active monthly plans in your catalog.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Feature</TableHead>
                  {columns.map((plan) => (
                    <TableHead key={plan.id} className="min-w-[140px] text-center">
                      {plan.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {columns.map((plan, index) => {
                      const value = row.values[index];
                      return (
                        <TableCell key={`${row.label}-${plan.id}`} className="text-center">
                          {value === true ? (
                            <span className="inline-flex items-center justify-center">
                              <Check className="size-4 text-primary" aria-hidden />
                              <span className="sr-only">Included</span>
                            </span>
                          ) : value === false ? (
                            <span className="inline-flex items-center justify-center">
                              <Minus className="size-4 text-muted-foreground" aria-hidden />
                              <span className="sr-only">Not included</span>
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">{value}</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <Faq />
    </>
  );
}
