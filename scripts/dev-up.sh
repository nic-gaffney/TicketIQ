#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

command -v docker >/dev/null 2>&1 || error "Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop"
command -v docker compose version >/dev/null 2>&1 || error "Docker Compose v2 not found."

if [ ! -f .env ]; then
  info "Creating .env ..."
  touch .env
  warn "Review .env and update secrets before going to production."
else
  info ".env already exists — skipping."
fi

# ─── Start ────────────────────────────────────────────────────────────────────
info "Building and starting development environment ..."
docker compose up --build -d

info "Waiting for DB to be healthy ..."
until docker compose exec db pg_isready -U appuser -d appdb >/dev/null 2>&1; do
  sleep 1
done

info "Running Alembic migrations ..."
docker compose exec backend alembic upgrade head

echo ""
info "  All services are up!"
echo ""
echo "  Frontend  -> http://localhost:3000"
echo "  Backend   -> http://localhost:8001"
echo "  API docs  -> http://localhost:8001/docs"
echo "  DB        -> localhost:5433"
echo ""
info "run 'docker compose logs -f' to tail logs."
info "run 'docker compose down' to shut down the system"
