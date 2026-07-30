# Eduverse - Venue Operations Platform

A professional web application for managing daily venue operations including customer management, session tracking, room bookings, bar orders, and payments.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20.9+ (for local development and production)
- PostgreSQL 16+ (if running locally)

### Start with Docker Compose
```bash
cp compose.env.example .env
# Replace both placeholder values before continuing.
docker-compose up -d
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs
- **Database**: localhost:5432 (user: `eduvers`; password: the value in `.env`)

### Local Development

**Backend:**
```bash
cd backend
npm ci
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm ci
npm run dev
```

## Features

### Core Operations
- Customer registration and management
- Session lifecycle (open, close, cancel)
- Room and hall management
- Room booking with conflict prevention
- Bar order workflow
- Invoice generation
- Payment recording (cash, bank transfer, mixed)

### Role-Based Access
| Role | Access |
|------|--------|
| Owner | Full system access |
| Operations Manager | Daily operations monitoring |
| Receptionist | Customer lifecycle, checkout |
| Barista | Order management |

### Initial Login

Set `SEED_DEFAULT_PASSWORD` to a strong value (12+ characters) before running the seed. No default password is stored in the repository.

## Production deployment

The server checkout is expected at `/srv/eduverse` and should be owned by a limited `deploy` user. Add the server's SSH host key to `known_hosts`, then create these untracked files before the first deployment:

- `backend/.env` with `DATABASE_URL`, a strong `JWT_SECRET`, and production settings.
- `frontend/.env.production` with an HTTPS `NEXT_PUBLIC_API_URL`.
- `owner-portal/.env.production` with an HTTPS `NEXT_PUBLIC_API_URL`.

Install the local deployment helper with `python -m pip install -r requirements-deploy.txt`, configure `DEPLOY_HOST`, `DEPLOY_USER`, and optionally `DEPLOY_SSH_KEY`, then run:

```bash
python scripts/deploy_runner.py --message "fix: describe the release"
```

The server deploy uses `npm ci`, applies committed Prisma migrations, builds all three applications, reloads PM2, and fails if any health check does not pass.

## Project Structure

```
eduvers/
├── backend/           # NestJS API
│   ├── src/          # 12 modules (auth, users, customers, sessions, etc.)
│   └── prisma/       # Database schema (18 tables)
├── frontend/         # Next.js App
│   ├── app/          # Pages (login, dashboards, CRUD screens)
│   ├── components/   # AppShell, AuthGate
│   └── lib/          # API client, types
├── docker-compose.yml
└── PROJECT_REPORT.md # Full documentation
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11, PostgreSQL 16, Prisma 5 |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Auth | JWT with access/refresh tokens |
| Data Fetching | React Query |
| State | Zustand |

## Documentation

- [PROJECT_REPORT.md](PROJECT_REPORT.md) - Complete project documentation
- [steps.md](steps.md) - Original requirements specification

## API Documentation

Swagger UI available at: http://localhost:3001/api/docs
