export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010";

export type BillingPeriod = "MONTHLY" | "YEARLY";

export type Plan = {
  id: string;
  name: string;
  code: string;
  price_cents: number;
  currency: string;
  billing_period: BillingPeriod;
  tier?: number;
  is_active?: boolean;
  paddle_product_id?: string | null;
  paddle_price_id?: string | null;
};

export type Subscription = {
  id: string;
  status: string;
  started_at: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  provider: string;
  provider_subscription_id: string;
  plan: Plan;
};

export type Payment = {
  id: string;
  subscription_id?: string | null;
  provider: string;
  provider_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  provider: string;
};

export type AuthResponse = {
  token: string;
  refresh_token: string;
  type?: string;
  user: AuthUser;
};

export type CheckoutResult = {
  checkout_url?: string | null;
  transaction_id?: string | null;
  paddle_price_id?: string | null;
  subscription_id?: string | null;
  activated_locally?: boolean;
  updated_in_place?: boolean;
};

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  is_verified: boolean;
  provider: string;
  created_at: string;
  updated_at: string;
  paddle_customer_id: string | null;
};

export type AdminStats = {
  users: number;
  subscriptions: number;
  payments: number;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  next_offset: number | null;
  prev_offset: number | null;
};

export type AdminUserDetail = {
  user: AdminUser;
  subscriptions_count: number;
  transactions_count: number;
};

export type AdminSubscription = Omit<Subscription, "plan"> & {
  user_id?: string;
  plan_id?: string;
};

export type AdminPayment = Payment & {
  user_id?: string;
};

export type PageParams = {
  limit?: number;
  offset?: number;
};

export type AdminUserFilters = PageParams & {
  is_active?: boolean;
  is_verified?: boolean;
  is_admin?: boolean;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!isRecord(item)) return null;
        if (typeof item.msg !== "string") return null;
        const location = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";
        return location ? `${location}: ${item.msg}` : item.msg;
      })
      .filter((item): item is string => Boolean(item));
    if (messages.length) return messages.join(". ");
  }
  return null;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (isRecord(body)) {
    const detail = messageFromDetail(body.detail) ?? messageFromDetail(body.message);
    if (detail) return detail;
  }
  return fallback;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) {
    const message = error.message.trim();
    if (/failed to fetch|load failed|networkerror|network request failed/i.test(message)) {
      return "We could not reach the server. Check your connection and try again.";
    }
    if (message) return message;
  }
  return "Something did not go as expected. Try again.";
}

export function isNoSubscription(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  if (res.status === 204) return null as T;

  const text = await res.text();
  const body = parseBody(text);

  if (!res.ok) {
    throw new ApiError(res.status, body, messageFromBody(body, res.statusText || "Network error"));
  }

  return body as T;
}

export const api = {
  listPlans: async () => {
    const page = await request<Paginated<Plan>>("/billing/plans?limit=100");
    return page.data;
  },

  me: async (token: string): Promise<Subscription | null> => {
    try {
      const subscription = await request<Subscription | null>("/billing/subscriptions/me", {}, token);
      return subscription ?? null;
    } catch (error) {
      if (isNoSubscription(error)) return null;
      throw error;
    }
  },

  payments: async (token: string) => {
    const page = await request<Paginated<Payment>>("/billing/payments/me?limit=100", {}, token);
    return page.data;
  },

  currentUser: (token: string) => request<AuthUser>("/me", {}, token),

  updateProfile: (token: string, username: string) =>
    request<AuthUser>("/me", { method: "PATCH", body: JSON.stringify({ username }) }, token),

  logout: (token: string) =>
    request<{ message?: string }>("/logout", { method: "POST", body: "{}" }, token),

  subscribe: (token: string, plan_code: string) =>
    request<CheckoutResult>(
      "/billing/subscriptions/subscribe",
      { method: "POST", body: JSON.stringify({ plan_code }) },
      token
    ),

  upgrade: (token: string, plan_code: string) =>
    request<CheckoutResult>(
      "/billing/subscriptions/upgrade",
      { method: "POST", body: JSON.stringify({ plan_code }) },
      token
    ),

  cancel: (token: string) =>
    request<Subscription>("/billing/subscriptions/cancel", { method: "POST", body: "{}" }, token),

  login: (email: string, password: string) =>
    request<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, username: string, password: string) =>
    request<AuthUser>("/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    }),

  verify: (token: string) => request<{ message?: string }>(`/verify?token=${encodeURIComponent(token)}`),

  requestVerify: (jwt: string) =>
    request<{ message?: string }>("/request/verify", { method: "POST", body: "{}" }, jwt),

  forgot: (email: string) =>
    request<{ message?: string }>("/forget-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  newPassword: (token: string, password: string) =>
    request<{ message?: string }>("/new-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  requestCode: (email: string) =>
    request<{ message?: string }>("/request/login-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  loginCode: (email: string, code: string) =>
    request<AuthResponse>("/login/code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  changePassword: (token: string, old_password: string, new_password: string) =>
    request<{ message?: string }>(
      "/change-password",
      { method: "POST", body: JSON.stringify({ old_password, new_password }) },
      token
    ),

  deactivate: (token: string) =>
    request<{ message?: string }>("/deactivate", { method: "POST", body: "{}" }, token),

  adminStats: (token: string) =>
    request<AdminStats>("/admin/dashboard/stats", {}, token),

  adminUsers: (token: string, params: AdminUserFilters = {}) =>
    request<Paginated<AdminUser>>(`/admin/users${toQuery(params)}`, {}, token),

  adminUser: (token: string, id: string) =>
    request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`, {}, token),

  adminSubs: (token: string, params: PageParams = {}) =>
    request<Paginated<AdminSubscription>>(
      `/admin/billing/subscriptions${toQuery(params)}`,
      {},
      token
    ),

  adminPayments: (token: string, params: PageParams = {}) =>
    request<Paginated<AdminPayment>>(
      `/admin/billing/transactions${toQuery(params)}`,
      {},
      token
    ),

  updateUserStatus: (token: string, id: string, is_active: boolean) =>
    request<AdminUser>(
      `/admin/users/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ is_active }) },
      token
    ),

  updateUserRole: (token: string, id: string, is_admin: boolean) =>
    request<AdminUser>(
      `/admin/users/${encodeURIComponent(id)}/role`,
      { method: "PATCH", body: JSON.stringify({ is_admin }) },
      token
    ),

  verifyUser: (token: string, id: string) =>
    request<AdminUser>(
      `/admin/users/${encodeURIComponent(id)}/verify`,
      { method: "PATCH", body: "{}" },
      token
    ),
};

export async function startPaddleCheckout(
  token: string,
  plan_code: string,
  upgrade = false
): Promise<CheckoutResult> {
  const result = upgrade ? await api.upgrade(token, plan_code) : await api.subscribe(token, plan_code);

  if (result.checkout_url) {
    window.location.assign(result.checkout_url);
  }

  return result;
}
