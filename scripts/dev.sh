#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Development: API (reload) + Celery worker + Celery beat + Next.js web in parallel
cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT

echo "→ starting infrastructure (db, redis, mailpit)"
docker compose up -d db redis mailpit

API_PY="$ROOT/backend/.venv/bin/uvicorn"
[ -x "$API_PY" ] || API_PY="uvicorn"

echo "→ api :8010 | worker | beat | web :3010"
(cd backend && ../backend/.venv/bin/uvicorn src.main:app --reload --port 8010 2>/dev/null || uvicorn src.main:app --reload --port 8010) &
(cd backend && (../backend/.venv/bin/celery -A src.celery_app.celery_app worker --loglevel=info 2>/dev/null || celery -A src.celery_app.celery_app worker --loglevel=info)) &
(cd backend && (../backend/.venv/bin/celery -A src.celery_app.celery_app beat --loglevel=info 2>/dev/null || celery -A src.celery_app.celery_app beat --loglevel=info)) &
(cd frontend && npm run dev) &

wait
