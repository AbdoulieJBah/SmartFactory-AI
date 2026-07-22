# SmartFactory AI

**AI-powered MES & ERP for food manufacturing** - production tracking, inventory, quality, and planning in one system, built for small and mid-size manufacturers that still run on paper and spreadsheets.

**Live demo:** https://smart-factory-ai-seven.vercel.app
**Try it:** `admin@smartfactory.ai` / `admin123`
**API:** https://smartfactory-ai-backend.onrender.com

> Free-tier hosting: the backend sleeps when idle - the first request may take ~60 seconds to wake. Give it a minute, then refresh.

Designed, built, and maintained solo by [Abdoulie J Bah](https://www.linkedin.com/in/abdoulie-j-bah-b71263244).

## What it does

**Production** - production orders and logs, work centers, scheduling, OEE tracking, downtime and waste records, maintenance.

**Inventory & supply chain** - products, lot-level inventory with batch traceability, suppliers, customers, purchase orders, sales orders.

**Quality & compliance** - quality checks, end-to-end traceability, audit logs.

**Intelligence** - AI copilot (LLM-assisted, Gemini API), demand forecasting, KPI dashboards, alerts and notifications, PDF reports and Excel exports.

**Platform** - multi-company support, authentication and user roles, subscriptions.

## Architecture

```text
Next.js / TypeScript  ->  FastAPI / Python  ->  PostgreSQL
      (Vercel)                 (Render)             (Neon)
```

REST API with JWT-based authentication. Docker Compose for local development.

## Tech stack

**Frontend:** Next.js, React, TypeScript
**Backend:** FastAPI, Python, SQLAlchemy, Alembic
**Database:** PostgreSQL
**AI / ML:** rule-based demand forecasting, Gemini API (copilot)
**Infrastructure:** Docker, Vercel, Render, Neon

## Run locally

```bash
git clone https://github.com/AbdoulieJBah/SmartFactory-AI
cd SmartFactory-AI
cp backend/.env.example backend/.env   # set DATABASE_URL and secrets
docker compose up
```

Frontend at http://localhost:3000 - API at http://localhost:8000

## Database migrations

Schema changes are managed with Alembic (`backend/migrations/`).

- **Fresh/empty database:** `cd backend && alembic upgrade head`
- **Existing database created before Alembic was introduced** (e.g. a dev
  DB or the Neon prod DB, which already has all tables from the old
  `Base.metadata.create_all()` boot step): run `cd backend && alembic stamp head`
  instead - this records the baseline revision as already applied without
  re-running the `CREATE TABLE` statements.
- **New schema change going forward:** update `backend/app/models.py`, then
  `alembic revision --autogenerate -m "..."` and `alembic upgrade head`.

## Tests & CI

```bash
cd backend
pip install -r requirements-dev.txt
pytest -v
```

GitHub Actions runs the backend test suite and a frontend lint/build check
on every push and pull request (`.github/workflows/`).

## Roadmap

- Offline-first mode with sync-on-reconnect for low-connectivity environments
- Mobile-money payment integration for the West African market
- Pilot deployments with food manufacturers

## Why this exists

SmartFactory AI grew out of a year working as a data analyst inside an Italian food manufacturing plant, watching production knowledge live in paper forms and spreadsheets. It's built to give small manufacturers - starting with The Gambia and West Africa - the systems larger factories take for granted.
