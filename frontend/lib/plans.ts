import type { Plan } from "@/lib/api";

export type PricingPeriod = "monthly" | "yearly";

export const demoPlans: Plan[] = [
  {
    id: "demo-free-monthly",
    name: "Free",
    code: "free",
    price_cents: 0,
    currency: "USD",
    billing_period: "MONTHLY",
    tier: 0,
    is_active: true,
  },
  {
    id: "demo-pro-monthly",
    name: "Pro",
    code: "pro",
    price_cents: 2900,
    currency: "USD",
    billing_period: "MONTHLY",
    tier: 1,
    is_active: true,
  },
  {
    id: "demo-scale-monthly",
    name: "Scale",
    code: "scale",
    price_cents: 7900,
    currency: "USD",
    billing_period: "MONTHLY",
    tier: 2,
    is_active: true,
  },
  {
    id: "demo-pro-yearly",
    name: "Pro",
    code: "pro_yearly",
    price_cents: 29000,
    currency: "USD",
    billing_period: "YEARLY",
    tier: 1,
    is_active: true,
  },
  {
    id: "demo-scale-yearly",
    name: "Scale",
    code: "scale_yearly",
    price_cents: 79000,
    currency: "USD",
    billing_period: "YEARLY",
    tier: 2,
    is_active: true,
  },
];

export function planPeriod(plan: Plan): PricingPeriod {
  return String(plan.billing_period).toLowerCase() === "yearly" ? "yearly" : "monthly";
}

function annualFromMonthly(plan: Plan): Plan {
  return {
    ...plan,
    id: `${plan.id}-annual-preview`,
    code: `${plan.code}_annual`,
    billing_period: "YEARLY",
    price_cents: plan.price_cents * 10,
  };
}

function monthlyFromAnnual(plan: Plan): Plan {
  return {
    ...plan,
    id: `${plan.id}-monthly-preview`,
    code: `${plan.code}_monthly`,
    billing_period: "MONTHLY",
    price_cents: Math.round(plan.price_cents / 10),
  };
}

export function selectPlansForPeriod(
  plans: Plan[],
  period: PricingPeriod
): { plans: Plan[]; estimated: boolean } {
  const active = plans.filter((plan) => plan.is_active !== false);
  const exact = active.filter((plan) => planPeriod(plan) === period);

  if (exact.length > 0) {
    return {
      plans: [...exact].sort((a, b) => a.price_cents - b.price_cents),
      estimated: false,
    };
  }

  const fallback = active
    .filter((plan) => planPeriod(plan) !== period && plan.price_cents > 0)
    .map((plan) => (period === "yearly" ? annualFromMonthly(plan) : monthlyFromAnnual(plan)))
    .sort((a, b) => a.price_cents - b.price_cents);

  return { plans: fallback, estimated: fallback.length > 0 };
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function monthlyEquivalent(plan: Plan): number {
  return planPeriod(plan) === "yearly" ? Math.round(plan.price_cents / 12) : plan.price_cents;
}

export function planTier(plan: Plan): number {
  if (typeof plan.tier === "number") return plan.tier;
  if (/vip|scale/i.test(plan.code)) return 2;
  if (/pro/i.test(plan.code)) return 1;
  return 0;
}

export function isFeaturedPlan(plan: Plan): boolean {
  return planTier(plan) === 1 || /^pro/i.test(plan.code);
}

export function getPlanFeatures(plan: Plan): string[] {
  const tier = planTier(plan);

  if (tier >= 2) {
    return [
      "Everything in Pro",
      "Unlimited members",
      "Granular roles and SSO",
      "Unlimited automations",
      "Unlimited history",
      "Priority support",
    ];
  }

  if (tier === 1) {
    return [
      "Everything in Free",
      "Unlimited dashboards",
      "Up to 20 members",
      "100 automations per month",
      "Alerts and webhooks",
      "12-month history",
    ];
  }

  return [
    "One operations dashboard",
    "Up to 3 members",
    "7-day history",
    "Essential integrations",
    "Documentation access",
  ];
}

export function planAudience(plan: Plan): string {
  const tier = planTier(plan);
  if (tier >= 2) return "For teams already operating at scale";
  if (tier === 1) return "For growing teams";
  return "To try the full flow";
}
