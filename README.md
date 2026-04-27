# Eduverse - Venue Operations Platform

A professional web application for managing daily venue operations including customer management, session tracking, room bookings, bar orders, and payments.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 16+ (if running locally)

### Start with Docker Compose
```bash
docker-compose up -d
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs
- **Database**: localhost:5432 (eduvers / eduvers_dev_password)

### Local Development

**Backend:**
```bash
cd backend
npm install --legacy-peer-deps
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
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

### Default Login
```
Email: owner@eduvers.com
Password: owner123
```

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
| Backend | NestJS 10, PostgreSQL 16, Prisma 5 |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Auth | JWT with access/refresh tokens |
| Data Fetching | React Query |
| State | Zustand |

## Documentation

- [PROJECT_REPORT.md](PROJECT_REPORT.md) - Complete project documentation
- [steps.md](steps.md) - Original requirements specification

## API Documentation

Swagger UI available at: http://localhost:3001/api/docs