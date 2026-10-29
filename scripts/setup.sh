#!/usr/bin/env bash
set -euo pipefail
# Bootstrap monorepo: backend (uv/venv + pip), frontend (npm), Docker infra, migrations and seeds
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing $1 — install it first ($2)"; exit 1; }; }

echo "== 1/6 checks =="
need python3 "python>=3.12"
need docker "docker engine"
need node "node>=20"

echo "== 2/6 env =="
[ -f .env ] || { cp .env.example .env; echo "→ created .env from .env.example (edit secrets!)"; }
cp .env backend/.env
# shellcheck disable=SC1091
set -a; . ./.env; set +a

echo "== 3/6 infra (postgres+redis+mailpit) =="
docker compose up -d db redis mailpit
echo "→ waiting for postgres..."
for i in $(seq 1 30); do
  docker exec fastapi-saas-template-db pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1 && break
  sleep 1
done

echo "== 4/6 backend deps =="
[ -d backend/.venv ] || python3 -m venv backend/.venv
if command -v uv >/dev/null 2>&1; then
  uv pip install --python backend/.venv/bin/python -q \
    -r backend/requirements/requirements.txt \
    -r backend/requirements/requirements-dev.txt
else
  backend/.venv/bin/pip install -q --upgrade pip
  backend/.venv/bin/pip install -q \
    -r backend/requirements/requirements.txt \
    -r backend/requirements/requirements-dev.txt
fi

echo "== 5/6 migrations + seeds =="
(cd backend && ../backend/.venv/bin/alembic upgrade head 2>/dev/null || .venv/bin/alembic upgrade head || alembic upgrade head)
BACKEND_VENV="$ROOT/backend/.venv/bin/python"
[ -x "$BACKEND_VENV" ] || BACKEND_VENV="python3"
$BACKEND_VENV backend/scripts/seed_plans.py
$BACKEND_VENV backend/scripts/seed_admin.py
echo "→ admin: ${ADMIN_EMAIL:-admin@example.com} (change ADMIN_PASSWORD in .env for production)"

echo "== 6/6 frontend deps =="
(cd frontend && npm install)

echo ""
echo "✅ setup done. Next:"
echo "   ./scripts/dev.sh        # api + worker + web"
echo "   docker compose up --build"
echo "   docker compose --profile seed up seed   # re-run seeds in Docker"
