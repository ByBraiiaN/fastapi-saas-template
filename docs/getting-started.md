# Getting started

## Requirements

- Docker Engine + Docker Compose
- Python 3.12+ (local development)
- Node 20+ (Node 22 LTS recommended) and npm (local development)

## Environment files

The monorepo uses a **single root `.env` as the source of truth**.

- `docker-compose.yml` injects it into `api`, `celery`, `celery_beat` and `seed` with `env_file: .env`.
- Compose overrides `DATABASE_URL`, `SYNC_DATABASE_URL`, `REDIS_URL` and `CELERY_*_URL` so containers use the service hostnames `db` and `redis`.
- `frontend` receives `NEXT_PUBLIC_API_URL` through `environment`.
- `scripts/setup.sh` copies the root `.env` to `backend/.env` because `src/config.py` loads `env_file=".env"` relative to the backend working directory.
- `backend/.env` is generated and ignored by git. Edit the root `.env`, not the copy.

```bash
cp .env.example .env
```

Set at least:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
```

Paddle keys are optional in sandbox; see [Paddle](#paddle-in-sandbox).

## Full Docker stack

```bash
docker compose up --build -d
docker compose --profile seed up seed
```

Services and ports:

| Service | Port | Purpose |
| --- | --- | --- |
| `api` | 8010 | FastAPI + Alembic upgrade on start |
| `web` | 3010 | Next.js |
| `db` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Celery broker |
| `celery` | — | Worker for `celery,default,billing` |
| `celery_beat` | — | Scheduled subscription expiry |
| `mailpit` | 8025 (UI), 1025 (SMTP) | Local email inbox |

The seed profile is not executed by `up`. It is idempotent and can be re-run.

## API + frontend only

```bash
# db and redis start as dependencies; celery/beat/mailpit do not
docker compose up --build -d api web

# reuse running db/redis without touching dependencies
docker compose up --build -d --no-deps api web

# Make equivalents
make compose-core
make compose-core-fast
```

## Local development

```bash
./scripts/setup.sh   # checks, venv, deps, Docker infra, migrations, seeds, npm install
./scripts/dev.sh     # FastAPI :8010, Celery worker, Celery beat, Next.js :3010
```

`setup.sh` performs:

1. Checks `python3`, `docker` and `node`.
2. Creates `.env` from `.env.example` if needed and copies it to `backend/.env`.
3. Starts `db`, `redis` and `mailpit`.
4. Installs backend dependencies with `uv` when available, otherwise with a venv + pip.
5. Runs `alembic upgrade head` and both seeds.
6. Installs frontend dependencies with npm.

## Seeds

```bash
python3 backend/scripts/seed_plans.py
python3 backend/scripts/seed_admin.py

# rotate the admin password
RESET_ADMIN_PASSWORD=1 python3 backend/scripts/seed_admin.py

# in Docker
docker compose run --rm -e RESET_ADMIN_PASSWORD=1 api python scripts/seed_admin.py
```

## Useful Make targets

```bash
make setup             # local bootstrap
make dev               # local development
make migrate           # alembic upgrade head
make seed              # plans + admin
make seed-reset-admin  # rotate admin password
make compose-core      # Docker api + web (-d)
make compose-core-fast # Docker api + web without dependencies (-d)
make compose-seed      # Docker seeds
make compose-up        # full stack (-d)
make compose-logs      # api + web logs
make compose-ps        # service status
make compose-stop      # stop without removing
make compose-down      # remove containers and volumes
make test-backend
make frontend-build
```

## Paddle in sandbox

Without Paddle keys the app is fully usable: landing, auth, plans and dashboard work. Checkout and the webhook return a clear `503`.

1. Create a product and price in the Paddle **sandbox** dashboard.
2. Create a local plan through `POST /billing/plans` (admin) with `paddle_product_id` and `paddle_price_id`.
3. Fill `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_ENV=sandbox` and `FRONTEND_URL`.
4. For local webhooks, expose `POST /billing/paddle/webhook` with a tunnel and register the URL under **Developer tools > Notifications**.

## First login

Open `http://localhost:3010/login` with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, then go to `http://localhost:3010/admin`.

If plans or the admin are missing, run the seed profile or `make seed`.
