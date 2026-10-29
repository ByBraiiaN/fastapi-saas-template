# Architecture

## Overview

A SaaS template monorepo:

- **Backend**: async FastAPI with SQLAlchemy 2 + PostgreSQL, Redis and Celery.
- **Billing**: Paddle Billing (Merchant of Record) with Hosted Checkout URLs and signed webhooks.
- **Frontend**: Next.js 15 App Router with React 19, Tailwind 4, Radix/shadcn, TanStack Query, RHF + zod and Recharts.
- **Admin**: role-gated (`is_admin`) panel with KPIs, paginated tables and charts.

Development ports: API `8010`, web `3010`, Postgres `5432`, Redis `6379`, Mailpit `8025`.

## Backend layout

```text
backend/
  src/
    main.py            # app, lifespan, CORS, /healthz, /readyz, routers
    config.py          # composed Settings (app, db, mail, redis, celery, auth, paddle, ai)
    database.py        # async engine (API) + sync engine (Celery) + Base + get_db/get_sync_session
    celery_app.py      # single app + beat schedule; celery/default/billing queues
    auth/              # register, login, refresh, OTP, OAuth, verification, password, profile
    billing/           # plans, subscriptions, payments, PaddleGateway, webhook, tasks
    admin/             # metrics, users, subscriptions, payments, audit, AI
    settings/          # per-domain settings objects
  scripts/             # seed_plans.py, seed_admin.py (idempotent)
  alembic/             # two clean revisions: 0001_initial + 0002_paddle
  tests/               # auth + billing (API and unit)
```

## Frontend layout

```text
frontend/
  app/(marketing)      # landing, pricing, docs, changelog, contact, legal
  app/(auth)           # login, register, verify, forgot, reset, login/code
  app/(dashboard)      # user dashboard: overview, billing, settings, account
  app/(admin)          # admin panel: dashboard, users, subscriptions, transactions
  app/checkout         # success / cancel
  components/ui        # Radix + cva primitives
  components/marketing dashboard admin
  lib                  # typed API client, zod schemas, store, session, formatting
```

Route groups do not change URLs; each surface has its own layout.

## Data model

- `users`: id, email, username, password (nullable for OAuth), `is_admin`, `is_active`, `is_verified`, `provider`, `paddle_customer_id`, timestamps.
- `refresh_tokens`: jti, hash, expiry, revoked flag, replacement jti (rotation).
- `login_codes`: hashed OTP with expiry.
- `plans`: name, unique code, `price_cents`, currency, `billing_period`, `tier`, `is_active`, `paddle_product_id`, `paddle_price_id`, timestamps.
- `subscriptions`: user, plan, status, provider, provider IDs, period, `cancel_at_period_end`, `canceled_at`.
- `payments`: user, subscription, provider, `provider_invoice_id` (unique per provider), amount, currency, status.
- `admin_audit_logs`: admin, action, entity, before/after JSONB.

`stripe_*` columns and the `STRIPE` enum value are kept as read-only legacy. New writes use Paddle or `MANUAL`.

## Auth

- Local registration with Argon2 and a verification email.
- Login with access/refresh JWTs; refresh rotation by jti and hash stored in the database.
- Refresh tokens are also set as `HttpOnly` cookies (`Secure` in production, `SameSite=Lax`).
- Email verification and password reset through signed validation tokens.
- Email OTP (15 minutes, single-use).
- Google/GitHub OAuth with `state` validation in an `HttpOnly` cookie.
- Dependencies: `active_user_dep` requires active + verified; `admin_required` requires `is_admin`.
- `GET /me`, `PATCH /me` (username) and `POST /logout` (revokes all refresh tokens) are available.

## Billing (Paddle)

Paddle-first flow:

1. The product/price is created in the Paddle dashboard (sandbox/live).
2. The admin creates a local `Plan` with `paddle_product_id` and `paddle_price_id`.
3. `subscribe/upgrade` creates a Paddle transaction and returns `checkout.url` for redirect.
4. Paddle sends webhooks to `/billing/paddle/webhook`; `Paddle-Signature` is validated with HMAC-SHA256 and a 30-second window.
5. Events update the subscription, period, payments and enqueue emails through Celery.

Rules:

- No subscription: `GET /billing/subscriptions/me` returns `200 null`.
- Free plan: local `MANUAL` activation for 30/365 days without Paddle.
- Cancellation: `effective_from=next_billing_period`; access remains until `current_period_end`.
- Upgrade: in-place proration when Paddle accepts it; otherwise a new checkout.
- Failed payment: `PAST_DUE`. Webhooks are idempotent by `provider_invoice_id`.
- Stripe: endpoint retired (`410`), columns kept as legacy.

## Admin

- Router under `/admin` with a global admin dependency.
- Metrics: total users, subscriptions and payments.
- Users: paginated listing with filters and detail with counters; mutations audited.
- `AdminUserOut` projection never exposes the password hash.
- Subscriptions and transactions are paginated.
- `GET /admin/audit-logs` exposes the audit trail with filters.
- AI assistant (Groq) with read-only SQL and export; prompts/responses are audited.

## Frontend

- Route groups keep URLs stable; layouts differ per surface.
- Design system with CSS tokens, Radix and `class-variance-authority`; dark mode via `next-themes`.
- Data fetching with TanStack Query (`staleTime`, invalidation after mutations).
- Forms with react-hook-form + zod and toasts with `sonner`.
- Marketing: full landing (hero, bento, pricing toggle, testimonials, FAQ, CTA, footer) and legal/docs pages.
- User dashboard: overview, subscription/plans/invoices, settings (password), account (deactivate/logout).
- Admin: KPIs, Recharts charts, paginated tables and user actions.
- `lib/api.ts` is typed with `ApiError` and `isNoSubscription`; `me()` tolerates `200 null` and the legacy 404.

## Operations

- `docker compose up --build`: api, web, db, redis, celery, beat, mailpit.
- Seeds are outside the normal startup: `docker compose --profile seed up seed`.
- `./scripts/setup.sh` for local (venv, migrations, seeds, npm) and `./scripts/dev.sh` for hot reload.
- Healthchecks: `/healthz`, `/readyz` (503 if the DB fails) and the API container `HEALTHCHECK`.
- Worker consumes `celery,default,billing`.
- Structured logs: pretty console in development, JSON in production, per-domain files (`app`, `errors`, `auth`, `billing`) and `X-Request-ID` propagation.

## Tests

- `pytest -q` with a dedicated `TEST_DATABASE_URL`.
- Isolation per test (rollback + subscription/payment cleanup).
- Global mocks for email, Paddle and Celery; limiter disabled.
- CI: Postgres 16 + Redis 7, ruff/mypy, Alembic upgrade + check, pytest with coverage, frontend typecheck/lint/build and image builds on push.

## Security

- Secrets only in `.env` (git-ignored); `.env.example` documents every variable.
- Configurable JWT and webhook secrets; cookies `secure` only in production.
- Production requires 32+ character JWT secrets at startup.
- CORS restricted to `FRONTEND_URL` and development localhost origins.
- Rate limit per IP (`100/min`) plus stricter limits on login, registration, OTP and password reset; webhook exempt.
- Admin panel protected globally and password hashes never exposed.
- Pending recommendation: remove `refresh_token` from the JSON body once all clients use the HttpOnly cookie.
