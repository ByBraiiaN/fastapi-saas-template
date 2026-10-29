# fastapi-saas-template

Production-minded SaaS starter: async FastAPI backend + Paddle Billing (Merchant of Record) + admin panel + Next.js App Router frontend with marketing pages, authentication, a user dashboard and administration.

Built to be cloned, renamed and extended: separate domains (`auth`, `billing`, `admin`), typed contracts, idempotent seeds and a Docker Compose setup ready for development.

## Stack

| Layer | Technology |
| --- | --- |
| API | FastAPI, Pydantic v2, SQLAlchemy 2 async, PostgreSQL, Alembic |
| Auth | JWT access/refresh with rotation, Argon2, email OTP, Google/GitHub OAuth |
| Billing | Paddle Billing (Hosted Checkout + signed webhooks), plans and subscriptions |
| Async | Celery + Redis (emails and subscription expiry) |
| Frontend | Next.js 15 App Router, React 19, TypeScript, Tailwind 4, Radix/shadcn, TanStack Query, RHF + zod, Recharts, next-themes |
| Infra | Docker Compose, Mailpit, GitHub Actions |

## Project layout

```text
.
├── backend/
│   ├── src/
│   │   ├── main.py              # app, lifespan, CORS, /healthz, /readyz
│   │   ├── auth/                # register, login, refresh, OTP, OAuth, password
│   │   ├── billing/             # plans, subscriptions, payments, Paddle gateway, webhook
│   │   ├── admin/               # metrics, users, subscriptions, payments, audit, AI
│   │   ├── settings/            # per-domain settings
│   │   ├── database.py          # async/sync engines + sessions
│   │   └── celery_app.py        # worker + beat (celery/default/billing queues)
│   ├── scripts/                 # seed_plans.py, seed_admin.py (idempotent)
│   ├── alembic/                 # migrations (2 clean revisions)
│   └── tests/                   # auth + billing (API and unit)
├── frontend/
│   ├── app/(marketing)/         # landing, pricing, docs, changelog, contact, legal
│   ├── app/(auth)/              # login, register, verify, forgot, reset, login/code
│   ├── app/(dashboard)/         # overview, billing, settings, account
│   ├── app/(admin)/             # panel, users, subscriptions, transactions
│   ├── app/checkout/            # success / cancel
│   ├── components/              # ui (Radix), marketing, auth, dashboard, admin
│   └── lib/                     # typed API client, zod schemas, store, session, formatting
├── packages/shared/             # shared types (extension point)
├── docs/                        # getting started, architecture, API, features, deployment, customization
├── scripts/                     # setup.sh, dev.sh
├── docker-compose.yml
├── Makefile
└── .env.example
```

## Quick start

Requirements: Docker, Python 3.12+, Node 20+ (Node 22 LTS recommended) and npm (only for local development without Docker).

```bash
cp .env.example .env      # edit ADMIN_* and, for a real checkout, PADDLE_*
```

### Full Docker stack

> Coming from an older version of the template? Run `docker compose down` first: container names changed. Volumes are preserved.

```bash
docker compose up --build -d             # -d = detached, frees the terminal
docker compose --profile seed up seed    # once per empty database

docker compose logs -f api web           # follow logs
docker compose ps                        # service status
```

Services: `api` (:8010), `web` (:3010), `db` (:5432), `redis` (:6379), `celery`, `celery_beat`, `mailpit` (:8025 UI, :1025 SMTP).

### Docker API + frontend only

```bash
# Builds and starts api + web. db and redis start as dependencies
# (official images, no build) and celery/beat/mailpit are not started.
docker compose up --build -d api web

# If db and redis are already running and you do not want to touch dependencies:
docker compose up --build -d --no-deps api web

docker compose logs -f api web
docker compose stop api web

# Make equivalents
make compose-core        # with dependencies
make compose-core-fast   # without dependencies
```

> `--build` only builds the images for the listed services. `api web` does not build `celery` or `celery_beat` (they share the API Dockerfile but are only built when requested).
>
> Seeds are not executed by `up`. To create plans/admin: `docker compose --profile seed up seed`.
>
> `-d` (detached) leaves containers in the background and returns the prompt. Without `-d`, Compose keeps the terminal and shows the interactive bar (`w` watch, `d` detach).

### Local development (hot reload)

```bash
./scripts/setup.sh   # venv + dependencies, Docker infra, migrations, seeds, npm install
./scripts/dev.sh     # api :8010 + worker + beat + web :3010
```

See [docs/getting-started.md](docs/getting-started.md) for the environment-file strategy and Make targets.

## Initial admin

```env
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
```

`seed_admin.py` creates the user or promotes it to admin if it already exists. It is idempotent.

```bash
# rotate password
RESET_ADMIN_PASSWORD=1 python3 backend/scripts/seed_admin.py
# or in Docker
docker compose run --rm -e RESET_ADMIN_PASSWORD=1 api python scripts/seed_admin.py
```

Open `http://localhost:3010/login` and then `http://localhost:3010/admin`.

## Frontend routes

| Area | Routes |
| --- | --- |
| Marketing | `/`, `/pricing`, `/docs`, `/changelog`, `/contact`, `/terms`, `/privacy` |
| Auth | `/login`, `/login/code`, `/register`, `/verify`, `/forgot`, `/reset` |
| User | `/dashboard`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/account` |
| Admin | `/admin`, `/admin/users`, `/admin/subscriptions`, `/admin/transactions` |
| Checkout | `/checkout/success?txn_id=...`, `/checkout/cancel` |

## Main API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/healthz` | Liveness |
| GET | `/readyz` | Real readiness (503 if the DB fails) |
| POST | `/register`, `/login` | Local auth |
| POST | `/logout` | Revokes all refresh tokens for the user |
| GET/PATCH | `/me` | Current profile / username update |
| POST | `/refresh-token` | Refresh rotation (query token or HttpOnly cookie) |
| POST | `/request/login-code`, `/login/code` | OTP |
| GET | `/billing/plans` | Public catalog (paginated) |
| POST | `/billing/plans` | Admin |
| GET | `/billing/subscriptions/me` | **`200` with a subscription or `null`** |
| POST | `/billing/subscriptions/subscribe` | Returns `checkout_url` or local free-plan activation |
| POST | `/billing/subscriptions/upgrade` | Proration or checkout |
| POST | `/billing/subscriptions/cancel` | Cancels at the end of the period |
| GET | `/billing/payments/me` | User invoices (paginated) |
| POST | `/billing/paddle/webhook` | HMAC signature + idempotency |
| GET | `/admin/*` | Requires `is_admin` on every route |

Full reference: [docs/api-reference.md](docs/api-reference.md) · Swagger at `http://localhost:8010/docs`.

### Subscription contract

`GET /billing/subscriptions/me` returns `200 null` when the user has no subscription: that is a valid state, not an error. The dashboard renders an empty state with a plan CTA. `404` is reserved for real errors.

### Free plan

If a plan has `price_cents=0` and no `paddle_price_id`, a local `MANUAL` subscription is activated for 30 days (monthly) or 365 days (yearly), without Paddle.

## Paddle (optional in sandbox)

Paddle acts as the Merchant of Record (taxes and compliance included). The catalog lives in Paddle and the backend only maps IDs.

1. Create a product and price in the Paddle dashboard (sandbox).
2. Create a local `Plan` through the admin API with `paddle_product_id` and `paddle_price_id`.
3. Configure:

```env
PADDLE_API_KEY=pdl_...apikey_...sdbx_...
PADDLE_WEBHOOK_SECRET=...     # Developer tools > Notifications > destination
PADDLE_ENV=sandbox            # production for live
PADDLE_CLIENT_TOKEN=test_...  # reserved for the Paddle.js overlay (not used in v1)
FRONTEND_URL=http://localhost:3010
```

- API key and client token: **Developer tools > Authentication**.
- Webhook secret: **Developer tools > Notifications > your destination**.
- Without keys in sandbox: landing, auth, plans and dashboard work; paid checkout and webhook return a friendly `503`.
- Local webhook: expose `POST /billing/paddle/webhook` through a tunnel and register the URL in Paddle.

## Environment variables

The main ones (all in `.env.example`):

```env
APP_NAME=fastapi-saas-template
APP_ENV=development
APP_URL=http://localhost:8010

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_db
SYNC_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/app_db
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_test_db

REDIS_URL=redis://localhost:6379/0
CELERY_WORKER_URL=redis://localhost:6379/0
CELERY_BEAT_URL=redis://localhost:6379/1

ACCESS_SECRET_KEY=...
REFRESH_SECRET_KEY=...
VALIDATION_SECRET_KEY=...

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@example.com

PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENV=sandbox
FRONTEND_URL=http://localhost:3010

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!

NEXT_PUBLIC_API_URL=http://localhost:8010
```

Notes:

- The root `.env` is the source of truth; Docker injects it with `env_file` and overrides DB/Redis hosts for the Compose network.
- `backend/.env` is a generated copy for commands executed from `backend/`; `setup.sh` keeps it in sync. Do not edit it directly.
- Inside Docker, the API uses `db` and `redis` hostnames; your `.env` keeps `localhost` for local development.
- Never commit `.env`.

## Tests and CI

```bash
pytest -q                                   # backend/tests (dedicated DB)
pytest -q --cov=backend/src --cov-report=html
cd frontend && npm run typecheck && npm run build
```

- `TEST_DATABASE_URL` must point to a database **separate** from development.
- Email, Paddle and Celery are mocked; the rate limiter is disabled in tests.
- CI (`.github/workflows/ci.yml`): Postgres 16 + Redis 7, Alembic, pytest with coverage, frontend typecheck/build and Docker image builds on push.

## Customization

1. **Branding**: name in `.env` (`APP_NAME`), `frontend/app/layout.tsx`, `components/brand.tsx` and `(marketing)` copy.
2. **Palette and typography**: tokens in `frontend/app/globals.css` (`@theme`); fonts in `layout.tsx`.
3. **Catalog**: edit `backend/scripts/seed_plans.py` or create plans via admin with Paddle IDs.
4. **Domains**: each module is independent; add features as `src/<domain>/{router,service,repository,schemas,models}`.
5. **Contracts**: export types from OpenAPI and place them in `packages/shared`.
6. **Emails**: templates in `backend/templates/email`.
7. **Admin AI**: optional; requires `GROQ_API_KEY`.

See [docs/customization.md](docs/customization.md) for the full checklist.

## Security and production

- Change every secret (`ACCESS/REFRESH/VALIDATION_SECRET_KEY`, `ADMIN_PASSWORD`, Paddle/SMTP keys).
- Set `APP_ENV=production`, `PADDLE_ENV=production`, `APP_DEBUG=False`, HTTPS and CORS with your real domain (`FRONTEND_URL`).
- Configure the Paddle webhook and verify the signature; never expose the secret.
- Restrict Postgres/Redis to the internal network in production.
- Refresh tokens are set as `HttpOnly` cookies; the JSON response also keeps `refresh_token` for backwards-compatible clients. Migrate clients to the cookie and drop the body field when possible.
- Read [SECURITY.md](SECURITY.md) before reporting a vulnerability.

Full production checklist: [docs/deployment.md](docs/deployment.md).

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `address already in use` | Another process is using the port. Change the mapping in `docker-compose.yml` (`8010:8000`, `3010:3010`) or free the port. |
| `permission denied` with Docker | `sudo usermod -aG docker $USER` and log in again. |
| API cannot reach the DB in Docker | It must use `@db:5432`; Compose already injects it. Do not use `localhost` inside containers. |
| `localhost:3010` does not respond | Check `docker compose ps`; if `web` is not running: `docker compose up --build -d api web`. |
| Terminal shows `w enable watch` / `d detach` | You are in attached mode. Press `d` to detach (keeps running) or `Ctrl+C` to stop. Next time use `-d`. |
| No plans or admin | Run `docker compose --profile seed up seed` (or `make seed`). |
| Empty subscription in dashboard | Normal state without a plan (`200 null`); choose a plan in `/dashboard/billing`. |
| Checkout returns 503 | Paddle is not configured in sandbox; add `PADDLE_API_KEY`/`PADDLE_WEBHOOK_SECRET`. |

## Documentation

- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api-reference.md)
- [Features](docs/features.md)
- [Deployment](docs/deployment.md)
- [Customization](docs/customization.md)
- [Dependency upgrade plan](docs/dependency-upgrade-plan.md)
- [Security policy](SECURITY.md)

## License

MIT. Add the `LICENSE` file when you publish your own copy.
