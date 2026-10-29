import { API_URL, type Plan } from "@/lib/api";
import { demoPlans } from "@/lib/plans";

function isPlan(value: unknown): value is Plan {
  if (typeof value !== "object" || value === null) return false;
  const plan = value as Record<string, unknown>;
  return (
    typeof plan.id === "string" &&
    typeof plan.name === "string" &&
    typeof plan.code === "string" &&
    typeof plan.price_cents === "number" &&
    typeof plan.currency === "string" &&
    (plan.billing_period === "MONTHLY" || plan.billing_period === "YEARLY")
  );
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_URL}/billing/plans`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) return demoPlans;

    const data: unknown = await res.json();
    if (!Array.isArray(data)) return demoPlans;

    const plans = data.filter(isPlan);
    return plans.length > 0 ? plans : demoPlans;
  } catch {
    return demoPlans;
  }
}
