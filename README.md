# TicketIQ
[![CI](https://github.com/nic-gaffney/TicketIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/nic-gaffney/TicketIQ/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-38%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Next.js](https://img.shields.io/badge/next.js-14-black)

An AI-powered IT helpdesk ticket management and prioritization system built for T-Mobile. TicketIQ allows users to submit IT support tickets, which are automatically analyzed using NLP to determine severity and urgency, then placed in a priority queue for IT technicians.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy (async) |
| Database | PostgreSQL (via asyncpg) |
| AI Classification | Claude LLM (Anthropic API) |
| Auth | JWT (python-jose + bcrypt) |
| Migrations | Alembic |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Testing | pytest, Jest |

---

## Team

| Name | Role |
|---|---|
| Dhruv Yadav | Frontend, Backend, AI Classification, Architecture |
| Nicolas Gaffney | Deployment, Backend, Escalation Service, CI/CD |
| Azzam Zahid | Backend Testing, Escalation Tests |
| Rinin Abraham | Frontend, Backend Testing, Deployment |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Run Locally

```bash
git clone https://github.com/nic-gaffney/TicketIQ.git
cd TicketIQ
make up
```

This starts all services (frontend, backend, database) via Docker Compose.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Stop the system

```bash
make down
```

---

## Available Make Commands

| Command | Description |
|---|---|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make build` | Rebuild Docker images |
| `make logs` | Stream logs from all containers |
| `make test` | Run backend (pytest) and frontend (Jest) tests |
| `make lint` | Run ruff (backend) and eslint (frontend) |
| `make migrate` | Apply database migrations |
| `make makemigration msg="..."` | Generate a new Alembic migration |
| `make shell-backend` | Open a shell inside the backend container |
| `make shell-db` | Open a psql shell inside the database container |

---

## Running Tests

```bash
make test
```

This runs:
- **Backend:** `pytest` with coverage report (`--cov=app --cov-report=term-missing`)
- **Frontend:** `jest` (non-interactive mode)

To run individually:

```bash
# Backend only
docker compose exec backend pytest --cov=app --cov-report=term-missing

# Frontend only
docker compose exec frontend npm test -- --watchAll=false
```

---

## Project Structure

```
TicketIQ/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Config, security, JWT
│   │   ├── db/           # Database session and base
│   │   ├── models/       # SQLAlchemy models
│   │   └── services/     # AI classification, escalation
│   ├── tests/            # pytest test files
│   ├── alembic/          # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages and routes
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # Auth, ticket, toast contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Types, helpers, API client
│   │   └── __tests__/    # Jest test files
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI pipeline
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## CI/CD

Every push to `main` automatically triggers the GitHub Actions pipeline which:

1. Starts a PostgreSQL test database
2. Installs backend dependencies
3. Runs the full `pytest` suite
4. Installs frontend dependencies
5. Runs the full `jest` suite

Pipeline status is visible under the **Actions** tab on GitHub.

---

## Environment Variables

The backend reads configuration from environment variables. For local development these are set via Docker Compose. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ANTHROPIC_API_KEY` | Claude API key for AI classification |
| `ENVIRONMENT` | `development` or `production` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry (default: 480 = 8 hours) |

---

## License

This project was developed as part of CS 3354 at UT Dallas.
