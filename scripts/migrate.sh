#!/usr/bin/env bash
# Usage:
#   ./scripts/migrate.sh               — apply all pending migrations
#   ./scripts/migrate.sh "add users"   — auto-generate a new migration
set -euo pipefail

if [ -n "${1:-}" ]; then
  echo "Generating migration: $1"
  docker compose exec backend alembic revision --autogenerate -m "$1"
else
  echo "Applying migrations ..."
  docker compose exec backend alembic upgrade head
fi
