.PHONY: up down build logs shell-backend shell-db migrate makemigration lint test

# ─── Dev lifecycle ────────────────────────────────────────────────────────────
up:
	@bash scripts/dev-up.sh

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

# ─── Shells ───────────────────────────────────────────────────────────────────
shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec db psql -U appuser -d appdb

# ─── Database ────────────────────────────────────────────────────────────────
migrate:
	docker compose exec backend alembic upgrade head

# Usage: make makemigration msg="add users table"
makemigration:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

# ─── Quality ─────────────────────────────────────────────────────────────────
lint:
	docker compose exec backend ruff check app tests
	docker compose exec frontend npm run lint

test:
	docker compose exec backend pytest --cov=app --cov-report=term-missing

# ─── Production ──────────────────────────────────────────────────────────────
prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
