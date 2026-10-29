import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Quickstart, authentication, Paddle billing, and deployment for the Orbit template.",
};

const toc = [
  { href: "#quickstart", label: "Quickstart" },
  { href: "#authentication", label: "Authentication" },
  { href: "#billing", label: "Plans and billing" },
  { href: "#api", label: "API" },
  { href: "#webhooks", label: "Webhooks" },
  { href: "#deployment", label: "Deployment" },
];

const endpoints = [
  { method: "GET", path: "/me", note: "Current profile" },
  { method: "PATCH", path: "/me", note: "Update username" },
  { method: "POST", path: "/logout", note: "Revoke refresh tokens" },
  { method: "GET", path: "/billing/plans", note: "Paginated public catalog of active plans" },
  { method: "GET", path: "/billing/subscriptions/me", note: "Current subscription or null" },
  { method: "POST", path: "/billing/subscriptions/subscribe", note: "Creates the Paddle checkout" },
  { method: "POST", path: "/billing/subscriptions/upgrade", note: "Changes plan or prorates" },
  { method: "POST", path: "/billing/subscriptions/cancel", note: "Cancels at the end of the period" },
  { method: "GET", path: "/billing/payments/me", note: "Paginated payments for the authenticated user" },
  { method: "POST", path: "/billing/paddle/webhook", note: "Syncs subscriptions and payments" },
];

export default function DocsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-45" aria-hidden />
        <div className="shell relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <Badge variant="outline">Documentation</Badge>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl">
              Build on a foundation that already works.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Orbit connects a Next.js frontend with a FastAPI backend, real authentication, and
              subscription billing. This guide covers the minimum to get it running and enough to
              adapt it.
            </p>
          </div>
        </div>
      </section>

      <div className="shell grid gap-12 py-14 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-medium text-muted-foreground">On this page</p>
            <nav className="mt-4 space-y-2" aria-label="Documentation index">
              {toc.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 border-t border-border/70 pt-6">
              <p className="text-xs font-medium text-muted-foreground">Resources</p>
              <div className="mt-3 space-y-2">
                <Link
                  href="/changelog"
                  className="block rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Changelog
                </Link>
                <Link
                  href="/contact"
                  className="block rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </Link>
                <Link
                  href="/terms"
                  className="block rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  License
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <article className="max-w-3xl space-y-14">
          <section id="quickstart" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">Quickstart</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You need Node 20+, Python 3.11+, PostgreSQL, and Redis. The repository includes a
              Docker Compose environment to bring up the database and API without configuring
              services by hand.
            </p>
            <ol className="mt-6 space-y-4">
              {[
                {
                  title: "Set up the environment",
                  body: "Copy .env.example to .env and adjust the database connection string, Paddle keys, and email sender.",
                },
                {
                  title: "Start the API",
                  body: "Boot db, api, and redis. Migrations run on startup; the plan and admin seeds run separately.",
                },
                {
                  title: "Start the frontend",
                  body: "Install dependencies and run the development server. The landing page consumes the real catalog from GET /billing/plans.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-card font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <pre className="code-block mt-6">
              <code>{`cp .env.example .env

# API + database
docker compose up db api redis

# Frontend
npm install --prefix frontend
npm run dev --prefix frontend`}</code>
            </pre>
            <Alert className="mt-6">
              <Info className="size-4" aria-hidden />
              <AlertTitle>Without Paddle configured</AlertTitle>
              <AlertDescription>
                The app still works in sandbox. The free plan activates locally and paid plans
                show a notice until you configure the keys.
              </AlertDescription>
            </Alert>
          </section>

          <section id="authentication" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">Authentication</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Login returns an access token and sets the refresh token as an HttpOnly cookie. The
              frontend stores only the access token in the Zustand persisted store and sends it as
              Bearer on protected routes. Hydration happens after mount to avoid SSR mismatches.
            </p>
            <pre className="code-block mt-6">
              <code>{`POST /login
Content-Type: application/json

{ "email": "ana@company.com", "password": "••••••••" }

200 OK
{ "token": "eyJ...", "refresh_token": "...", "user": { ... } }
Set-Cookie: refresh_token=...; HttpOnly; SameSite=Lax`}</code>
            </pre>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Email verification and password recovery arrive by link. The{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/verify</code> and{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/reset</code> pages read
              the token from the query automatically. Sign-in with a 6-digit OTP code is also available.
            </p>
          </section>

          <section id="billing" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">Plans and billing</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The catalog lives in the database and is exposed at{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">GET /billing/plans</code>.
              The landing page filters by <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">billing_period</code>{" "}
              for the monthly/yearly selector. If the backend has no yearly plans, the interface
              shows an estimate and says so.
            </p>
            <pre className="code-block mt-6">
              <code>{`// Checkout only redirects if Paddle returns a URL.
const result = await api.subscribe(token, "pro");

if (result.checkout_url) {
  window.location.assign(result.checkout_url);
}

// A prorated upgrade can resolve locally:
// { updated_in_place: true, subscription_id: "..." }`}</code>
            </pre>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Paddle is the Merchant of Record: it calculates taxes, charges, and issues the invoice.
              The local subscription updates when the signed webhook arrives, not when the user
              returns from checkout.
            </p>
          </section>

          <section id="api" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">API</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Billing endpoints require a valid token. Admin routes also check the user&apos;s role.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border">
              {endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="flex flex-col gap-1 border-b border-border/70 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="w-12 shrink-0 font-mono text-[11px] font-medium text-primary-strong">
                    {endpoint.method}
                  </span>
                  <code className="flex-1 font-mono text-xs text-foreground">{endpoint.path}</code>
                  <span className="text-xs text-muted-foreground">{endpoint.note}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="webhooks" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">Webhooks</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">POST /billing/paddle/webhook</code>{" "}
              endpoint validates the Paddle-Signature header with HMAC-SHA256, applies idempotency, and
              updates the local subscription and payments. Supported events: subscription creation,
              update, and cancellation, payment completed, and payment failed.
            </p>
            <Alert className="mt-5" variant="warning">
              <Info className="size-4" aria-hidden />
              <AlertTitle>Local environment</AlertTitle>
              <AlertDescription>
                To receive webhooks locally you need to expose the API through a tunnel and register
                the URL in the Paddle dashboard. Events are retried; keep the endpoint
                idempotent.
              </AlertDescription>
            </Alert>
          </section>

          <section id="deployment" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">Deployment</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The frontend needs at least{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">NEXT_PUBLIC_API_URL</code> and{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SITE_URL</code>.
              The backend requires database, Redis, SMTP, and Paddle credentials. Use
              different keys per environment and rotate the signing secret if any is exposed.
            </p>
            <div className="mt-6 rounded-xl border bg-card p-5">
              <p className="text-sm font-medium">Before publishing</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Replace the brand, legal texts, and contact emails.</li>
                <li>Configure prices and products in Paddle, and map their IDs in the plans.</li>
                <li>Enable email verification and use your own sender.</li>
                <li>Review the admin panel and roles before opening registration.</li>
              </ul>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Something not fitting?{" "}
              <Link
                href="/contact"
                className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Write to us
              </Link>{" "}
              or check the{" "}
              <Link
                href="/changelog"
                className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                changelog
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
              .
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
