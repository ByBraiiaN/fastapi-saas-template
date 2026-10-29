export type PlanOut = {
  id: string;
  name: string;
  code: string;
  price_cents: number;
  currency: string;
  billing_period: "monthly" | "yearly";
  tier: number;
  is_active: boolean;
  paddle_product_id?: string | null;
  paddle_price_id?: string | null;
};

export type SubscriptionOut = {
  id: string;
  status: string;
  started_at: string;
  cancel_at_period_end: boolean;
  current_period_end?: string | null;
  provider: string;
  provider_subscription_id: string;
  plan: PlanOut;
};
