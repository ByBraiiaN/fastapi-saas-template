# Features

Feature matrix for the template. Each row shows where the feature lives and adaptation notes.

## Authentication

| Feature | Description | Location | Notes |
| --- | --- | --- | --- |
| Local registration | Email + username + password with Argon2 | `src/auth/router.py`, `service.py` | Sends a verification email |
| Login | Access + refresh JWT | `src/auth/router.py` | Returns `{token, refresh_token, user}` and sets an HttpOnly refresh cookie |
| Refresh rotation | DB hash + revocation by jti | `src/utils.py`, `src/repository.py` | Reuse is detected as revoked |
| Logout | Revokes every refresh token | `POST /logout` | Clears the refresh cookie |
| Profile | Read/update username | `GET/PATCH /me` | Email changes are intentionally out of scope |
| Email verification | Signed validation token | `src/auth/router.py`, `emails.py` | Resend with `POST /request/verify` |
| Password reset | Signed validation token | `POST /forget-password`, `/new-password` | Generic anti-enumeration message |
| Password change | Authenticated | `POST /change-password` | Requires `old_password` |
| OTP login | 15-minute single-use code | `src/auth/service.py` | Passwordless alternative |
| OAuth | Google and GitHub | `src/auth/utils.py` | `state` in an HttpOnly cookie |
| Deactivate account | Soft-disable | `POST /deactivate` | The user can no longer authenticate |

## Billing (Paddle)

| Feature | Description | Location | Notes |
| --- | --- | --- | --- |
| Plan catalog | Local CRUD + Paddle mapping | `src/billing/service.py`, `PlanRepository` | Paddle-first: the price lives in Paddle |
| Hosted checkout | Transaction + redirect | `PaddleGateway.create_subscription_checkout_session` | No Paddle.js; returns `checkout_url` |
| Local free plan | Activation without payment | `SubscriptionService.subscribe_user_to_plan` | 30 days monthly / 365 yearly, provider `MANUAL` |
| Upgrade | Proration or new checkout | `PaddleGateway.update_subscription_price` | Tier guard prevents silent downgrade |
| Cancellation | End of period | `POST /billing/subscriptions/cancel` | `effective_from=next_billing_period` |
| Access | Valid period and status | `get_subscription_with_access` | `ACTIVE/TRIALING/PAST_DUE/CANCELED` |
| Webhook | HMAC signature + idempotency | `src/billing/paddle_gateway.py` | `503` when not configured in sandbox |
| Payments | Transaction records | `PaymentRepository` | Unique `provider_invoice_id` |
| Emails | Subscription, renewal, cancellation, failure | `src/billing/tasks.py` | Celery with retries |
| Expiry | Hourly sweep | `expire_subscriptions_task` | Marks `CANCELED` + `canceled_at` |
| Stripe legacy | Retired endpoint | `POST /billing/stripe/webhook` | `410 Gone` |

## Admin

| Feature | Description | Location | Notes |
| --- | --- | --- | --- |
| Global guard | Every `/admin/*` requires the role | `src/admin/router.py` | `403` for non-admins |
| KPIs | User/subscription/payment totals | `AnalyticsService.get_stats` | Powers the dashboard and charts |
| Users | Paginated listing + filters | `GET /admin/users` | `AdminUserOut` without password |
| Detail | Subscription and payment counters | `GET /admin/users/{id}` | `404` when missing |
| Actions | Activate, role, verify | `PATCH /admin/users/{id}/*` | Audited in `admin_audit_logs` |
| Subscriptions | Paginated listing | `GET /admin/billing/subscriptions` | Includes status and provider |
| Transactions | Paginated listing | `GET /admin/billing/transactions` | Amount and currency |
| Audit log | Paginated, filterable trail | `GET /admin/audit-logs` | Includes plan and AI actions |
| AI assistant | Read-only SQL queries | `src/admin/ai_*` | Requires `GROQ_API_KEY`; audited |

## Frontend

| Feature | Description | Location | Notes |
| --- | --- | --- | --- |
| Landing | Hero, bento, logos, pricing, testimonials, FAQ, CTA | `app/(marketing)` | Template copy |
| Pricing | Monthly/yearly toggle | `components/marketing/pricing-section.tsx` | Filters real `billing_period` |
| Auth UI | Six validated forms | `app/(auth)`, `components/auth` | RHF + zod + toasts |
| User dashboard | Overview, plan, payments, checklist | `app/(dashboard)/dashboard` | Real empty states |
| User billing | Plans, upgrade, cancel, invoices | `dashboard/billing` | Confirmation dialog |
| Settings | Password change and theme | `dashboard/settings` | Password through the API |
| Account | Details, deactivate, logout | `dashboard/account` | Danger zone |
| Admin panel | KPIs + Recharts | `app/(admin)/admin` | Distinct dark sidebar |
| Admin tables | Users, subscriptions, transactions | `admin/users|subscriptions|transactions` | Server-side pagination |
| Admin guard | Role probe | `app/(admin)/layout.tsx` | `403` → redirect to dashboard |
| Errors | 404, loading, error boundary | `app/not-found|loading|error` | — |
| Checkout | Success/cancel | `app/checkout` | Revalidates the subscription |

## Infrastructure

| Feature | Description | Location | Notes |
| --- | --- | --- | --- |
| Docker Compose | api, web, db, redis, celery, beat, mailpit | `docker-compose.yml` | Host `8010/3010` |
| Seeds | Idempotent plans and admin | `backend/scripts` | `seed` profile outside `up` |
| Mailpit | Local SMTP + UI | compose | `:1025` / `:8025` |
| Healthchecks | API and dependencies | `main.py`, compose | `/readyz` 503 if the DB fails |
| CI | Tests, build, images | `.github/workflows/ci.yml` | Postgres 16 + Redis 7 |
| Docs | README, API, architecture, features, deployment | `docs/` | Keep in sync with contracts |

## Known limits (template)

- The refresh token is still returned in JSON for backwards compatibility; migrate clients to the HttpOnly cookie and remove the body field.
- There is no email-change endpoint (the dashboard shows email read-only).
- The AI assistant is optional and requires a Groq key.
- Alembic history was reset to two clean revisions; regenerate migrations only from now on.
