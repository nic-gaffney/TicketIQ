<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:E1007A,100:6A0DAD&height=200&section=header&text=TicketIQ&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI-Powered%20IT%20Helpdesk%20Ticketing%20System&descAlignY=60&descColor=ffffff"/>
</p>

<p align="center">
  <a href="https://github.com/nic-gaffney/TicketIQ/actions/workflows/ci.yml">
    <img src="https://github.com/nic-gaffney/TicketIQ/actions/workflows/ci.yml/badge.svg" alt="CI"/>
  </a>
  <img src="https://img.shields.io/badge/tests-38%20passed-brightgreen?style=flat-square" alt="Tests"/>
  <img src="https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square" alt="Coverage"/>
  <img src="https://img.shields.io/badge/python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/license-UTD%20CS3354-E1007A?style=flat-square" alt="License"/>
</p>

<p align="center">
  <b>TicketIQ</b> is an AI-powered IT helpdesk ticket management and prioritization system built for T-Mobile.<br/>
  Users submit support tickets which are automatically analyzed using NLP to determine severity and urgency,<br/>
  then placed in a priority queue for IT technicians.
</p>

---

## ⚡ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"/>
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white"/>
  <img src="https://img.shields.io/badge/pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white"/>
  <img src="https://img.shields.io/badge/Claude_AI-6B2FA0?style=for-the-badge&logo=anthropic&logoColor=white"/>
</p>

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Run Locally

```bash
git clone https://github.com/nic-gaffney/TicketIQ.git
cd TicketIQ
make up
```

| Service | URL |
|---|---|
| 🖥️ Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8000 |
| 📄 API Docs (Swagger) | http://localhost:8000/docs |

```bash
make down   # stop all services
```

---

## 🧪 Testing

```bash
make test
```

Runs both **pytest** (backend) and **Jest** (frontend) in one command.

| Suite | Tool | Result |
|---|---|---|
| Backend unit + functional | pytest | 98% coverage |
| Frontend unit | Jest | 38 tests passing |

<details>
<summary>▶ Run individually</summary>

```bash
# Backend only
docker compose exec backend pytest --cov=app --cov-report=term-missing

# Frontend only
docker compose exec frontend npm test -- --watchAll=false
```

</details>

---

## 🛠️ Make Commands

| Command | Description |
|---|---|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make build` | Rebuild Docker images |
| `make logs` | Stream logs from all containers |
| `make test` | Run all tests (backend + frontend) |
| `make lint` | Run ruff + eslint |
| `make migrate` | Apply database migrations |
| `make makemigration msg="..."` | Generate a new Alembic migration |
| `make shell-backend` | Shell into backend container |
| `make shell-db` | psql shell into database |

---

## 📁 Project Structure

<details>
<summary>▶ Expand structure</summary>

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
│       └── ci.yml
├── docker-compose.yml
├── Makefile
└── README.md
```

</details>

---

## 🔄 CI/CD

Every push to `main` triggers the GitHub Actions pipeline:

```
Push to main
    │
    ├── 🐘 Start PostgreSQL test DB
    ├── 🐍 Install backend deps → run pytest
    └── 📦 Install frontend deps → run jest
```

---

## 🔑 Environment Variables

<details>
<summary>▶ View required variables</summary>

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ANTHROPIC_API_KEY` | Claude API key for AI classification |
| `ENVIRONMENT` | `development` or `production` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry (default: 480 = 8 hours) |

</details>

---

## 👥 Team

| Name | Role |
|---|---|
| Dhruv Yadav | Frontend, Backend, AI Classification, Architecture |
| Nicolas Gaffney | Deployment, Backend, Escalation Service, CI/CD |
| Azzam Zahid | Backend Testing, Escalation Tests |
| Rinin Abraham | Frontend, Backend Testing, Deployment |

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:6A0DAD,100:E1007A&height=120&section=footer"/>
</p>

<p align="center">
  Built for CS 3354 @ UT Dallas &nbsp;·&nbsp; T-Mobile Internal Tools
</p>
