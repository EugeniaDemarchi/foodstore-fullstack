# Food Store — Full-Stack App

[![CI](https://github.com/EugeniaDemarchi/foodstore-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/EugeniaDemarchi/foodstore-fullstack/actions/workflows/ci.yml)

Food ordering management system: product catalog (categories, products, ingredients), orders, and user management with role-based access.

- **Backend:** Python · FastAPI · SQLModel · PostgreSQL · JWT (HttpOnly cookie) · pytest
- **Frontend:** React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query / Form / Table · Zustand · Axios
- **Infra:** Docker · Docker Compose · GitHub Actions

## Highlights

- **Layered architecture**, organized by domain module: `router → service → repository`, with a generic `BaseRepository[T]` and the **Unit of Work** pattern for transactions.
- **Transactional orders:** the order total is always computed on the server, and if any line item fails, the whole order is rolled back (covered by a test).
- **Security:** JWT stored in an **HttpOnly cookie** (never exposed to JavaScript), bcrypt password hashing, CORS with explicit origin and credentials, and **RBAC** (`user` / `admin`) enforced through FastAPI dependencies. Secrets are read from the environment and the app fails fast if they are missing.
- **Soft delete, auditing (`created_at` / `updated_at` / `deleted_at`), pagination and filters** across the catalog.
- **Frontend:** protected routes by session and role, a single Axios instance with a 401 interceptor, server state with TanStack Query, and UI that adapts to the user's role.
- **Integration tests against a real PostgreSQL database** (25 tests: auth, permissions, validation, CRUD, transactional rollback).

## Run it with Docker (recommended)

Requirements: Docker Desktop.

```bash
cp .env.example .env        # Windows: copy .env.example .env
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

Test users (created by the seed): `admin` / `Admin1234!` (admin) and `juan` / `Juan1234!` (user).

## Run it locally (without Docker)

Backend (needs a local PostgreSQL with a `food_store` database):

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt      # Windows: .venv\Scripts\pip
cp .env.example .env                           # then set DATABASE_URL and SECRET_KEY
.venv/bin/uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
# Uses a PostgreSQL database named food_store_test by default.
# Override with TEST_DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
pytest -v
```

On every push, GitHub Actions runs three jobs: **backend tests** against a PostgreSQL service container, **frontend lint + type-check + build**, and a **Docker Compose smoke test** that builds the images, starts the stack and checks the API health endpoint (`/health/db`).

## Project structure

```
backend/
  app/
    core/        config, database, security (JWT + bcrypt), deps (auth/RBAC),
                 generic repository, unit of work, pagination, auditing
    modules/     one folder per domain: categoria, producto, ingrediente,
                 unidad_medida, pedido, usuarios, health
                 (each with model, schema, service, router)
  tests/         pytest integration tests (PostgreSQL)
frontend/
  src/
    api/         Axios instance + interceptors
    store/       auth store (Zustand)
    services/    one API client per entity
    pages/ components/ hooks/ types/
docker-compose.yml
.github/workflows/ci.yml
```

## Design notes

Detailed design decisions, permission matrix, business rules and endpoint tables are documented (in Spanish) in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md). The `.http` files in `backend/` walk through every endpoint with the VS Code REST Client extension.

## About this project

Individual project built for **Programación IV** (Universidad Tecnológica Nacional, *Tecnicatura Universitaria en Programación*), developed incrementally over three course units: catalog CRUD → orders with Repository/Unit of Work → authentication and authorization. I designed and implemented both the backend and the frontend. For this portfolio version I added Docker Compose, the PostgreSQL integration test suite and the CI pipeline.

**Author:** Eugenia Demarchi · [LinkedIn](https://www.linkedin.com/in/eugenia-demarchi/) · [GitHub](https://github.com/EugeniaDemarchi)
