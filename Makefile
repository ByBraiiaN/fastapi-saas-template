setup:
	./scripts/setup.sh
dev:
	./scripts/dev.sh
test-backend:
	pytest -q
test-cov:
	pytest -q --cov=backend/src --cov-report=term --cov-report=html
migrate:
	cd backend && alembic upgrade head
seed:
	python3 backend/scripts/seed_plans.py
	python3 backend/scripts/seed_admin.py
seed-reset-admin:
	RESET_ADMIN_PASSWORD=1 python3 backend/scripts/seed_admin.py
lint:
	ruff check backend/src backend/tests || true
types:
	mypy backend/src || true
frontend-install:
	cd frontend && npm install
frontend-dev:
	cd frontend && npm run dev
frontend-build:
	cd frontend && npm run build
compose-up:
	docker compose up --build -d

# API + web only (db and redis start through depends_on; celery/beat/mailpit are not built)
compose-core:
	docker compose up --build -d api web

# API + web reusing already-running db/redis
compose-core-fast:
	docker compose up --build -d --no-deps api web

compose-seed:
	docker compose --profile seed up seed

compose-logs:
	docker compose logs -f api web

compose-ps:
	docker compose ps

compose-stop:
	docker compose stop

compose-down:
	docker compose down -v
