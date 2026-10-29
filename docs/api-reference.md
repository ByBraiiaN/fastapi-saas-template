# API reference — `backend/src/main.py`

Base URL: `http://localhost:8010` · Interactive docs: `/docs` · OpenAPI: `/openapi.json`

Docs are disabled when `APP_ENV=production`.

## Ops

- `GET /healthz` → `{"status":"ok"}`
- `GET /readyz` → `200 {"status":"ready"}` or `503 {"status":"not-ready"}` (real DB ping)

## Auth (no prefix, historical compatibility)

- `POST /register` → `UserRead` + verification email
- `POST /login` → `{"token","refresh_token","user"}` and `Set-Cookie: refresh_token` (`HttpOnly`)
- `POST /logout` → revokes all refresh tokens and clears the cookie
- `GET /me` → current user
- `PATCH /me` `{username}` → updated user
- `POST /refresh-token?token=` → rotation by `jti`; accepts the query token or the `refresh_token` cookie
- `GET /verify?token=` / `POST /request/verify`
- `POST /forget-password` / `POST /new-password`
- `POST /change-password` `{old_password, new_password}` (auth)
- `POST /request/login-code` / `POST /login/code` (OTP 15 min, single-use)
- `GET /google/login`, `GET /github/login` → redirect + `oauth_state_*` cookie (`secure` only in prod)
- `GET /auth/social/callback/google|github`
- `POST /deactivate` (auth)

Sensitive routes have stricter per-IP limits: login/register/OTP `10/minute`, OTP request/password reset `5/minute`, refresh `30/minute`.

## Billing — Paddle (`/billing`)

Paddle Billing is the Merchant of Record. **Paddle-first**: the product/price is created in the Paddle dashboard and mapped through `Plan.paddle_product_id / paddle_price_id`. `PADDLE_ENV=sandbox|production`.

- `GET /billing/plans` → paginated `{data: PlanOut[], total, limit, offset, has_next, next_offset, prev_offset}`
  - `PlanOut`: `id, name, code, price_cents, currency, billing_period, tier, is_active, paddle_product_id, paddle_price_id`
- `POST /billing/plans` (admin) · `GET /billing/plans/{id}` · `PATCH` (admin) · `DELETE` (admin, 204)
- `GET /billing/subscriptions/me` (auth) → **`200` with `SubscriptionOut` or `null`** when there is no subscription (not an error)
- `POST /billing/subscriptions/subscribe` → `201` `{checkout_url, transaction_id, paddle_price_id, subscription_id?, activated_locally?, updated_in_place?}`
- `POST /billing/subscriptions/upgrade` → same shape; in-place proration can return `checkout_url=""` + `updated_in_place=true`
- `POST /billing/subscriptions/cancel` → `SubscriptionOut` with `cancel_at_period_end=true` (`effective_from=next_billing_period`)
- `GET /billing/payments/me` → paginated `{data: PaymentResponse[], ...}` with `amount_cents/currency`
- `POST /billing/paddle/webhook` (rate-limit exempt; header `Paddle-Signature: ts=..;h1=..`, HMAC-SHA256, `408` if expired, `503` if the secret is missing):
  - `subscription.created/updated` → local upsert + period/status
  - `subscription.canceled` → local cancellation + email
  - `transaction.completed/updated` → idempotent `record_transaction_payment` + emails
  - `transaction.payment_failed` → `PAST_DUE` + email
- `POST /billing/stripe/webhook` → `410 Gone` (retired; use Paddle)

### Free plan (no Paddle)

If `price_cents=0` and there is no `paddle_price_id`, a local `MANUAL`/`ACTIVE` subscription is created with a 30-day (monthly) or 365-day (yearly) period. No Paddle keys are required.

### Access

`get_subscription_with_access` considers `ACTIVE`, `TRIALING`, `PAST_DUE` and `CANCELED` while `current_period_end > now`. `PENDING` does not grant access.

## Admin (`/admin`, every route requires admin role)

- `GET /admin/dashboard/stats` → `{users, subscriptions, payments}`
- `GET /admin/users?limit&offset&is_active&is_verified&is_admin` → paginated `{data, total, limit, offset, has_next, next_offset, prev_offset}` without password hashes
- `GET /admin/users/{id}` → `{user, subscriptions_count, transactions_count}`
- `GET /admin/users/{id}/transactions` · `/subscriptions`
- `PATCH /admin/users/{id}/status` `{is_active}` · `/role` `{is_admin}` · `/verify` (audited)
- `GET /admin/audit-logs?limit&offset&admin_id&target_type&target_id&action` → paginated audit trail
- `GET /admin/billing/transactions[/{payment_id}]` · `GET /admin/billing/subscriptions[/{sub_id}]`
- `POST /admin/ai/chat?prompt=` (Groq, read-only SQL; prompt and response audited)

## Docker vs scripts startup

- `docker compose up` does **not** run seeds: only `api` runs `alembic upgrade head`. Seeds: `docker compose --profile seed up seed` or `./scripts/setup.sh`.
- Minimum to see the web app in sandbox: `db + api + web` (`redis` starts through `depends_on`; `celery/beat/mailpit` are optional for emails/expiry).
- Initial admin: `ADMIN_EMAIL/ADMIN_PASSWORD` through `backend/scripts/seed_admin.py` (idempotent; `RESET_ADMIN_PASSWORD=1` to rotate).
- Paddle is optional in sandbox: without keys, landing/plans/dashboard work; paid checkout and the webhook return a friendly `503`.

## Frontend routes

- Marketing: `/`, `/pricing`, `/docs`, `/changelog`, `/contact`, `/terms`, `/privacy`
- Auth: `/login`, `/login/code`, `/register`, `/verify`, `/forgot`, `/reset`
- User: `/dashboard`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/account`
- Admin: `/admin`, `/admin/users`, `/admin/subscriptions`, `/admin/transactions`
- Checkout: `/checkout/success?txn_id=...`, `/checkout/cancel`
