export type StatusTone = "active" | "trialing" | "past_due" | "canceled" | "pending";

const subscriptionLabels: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Payment past due",
  canceled: "Canceled",
  pending: "Pending",
};

const paymentLabels: Record<string, string> = {
  succeeded: "Paid",
  pending: "Pending",
  failed: "Failed",
};

export function subscriptionStatusLabel(status: string): string {
  return subscriptionLabels[status.toLowerCase()] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return paymentLabels[status.toLowerCase()] ?? status;
}

export function subscriptionTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "trialing") return "trialing";
  if (normalized === "past_due") return "past_due";
  if (normalized === "canceled" || normalized === "cancelled") return "canceled";
  return "pending";
}

export function paymentTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (normalized === "succeeded" || normalized === "paid") return "active";
  if (normalized === "failed" || normalized === "refunded") return "past_due";
  return "pending";
}

export function isYearly(period: string): boolean {
  return String(period).toLowerCase() === "yearly";
}

export function billingPeriodLabel(period: string): string {
  return isYearly(period) ? "Yearly" : "Monthly";
}

export function billingPeriodSuffix(period: string): string {
  return isYearly(period) ? "/year" : "/month";
}

export function providerLabel(provider: string): string {
  const normalized = provider.toLowerCase();
  if (normalized === "paddle") return "Paddle";
  if (normalized === "stripe") return "Stripe";
  if (normalized === "paymob") return "Paymob";
  if (normalized === "manual") return "Manual";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
