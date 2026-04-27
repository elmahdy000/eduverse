# Eduverse Phase 1 - System Architecture

## Overview
Eduverse is a professional venue operations platform for managing daily customer visits, sessions, room bookings, bar orders, and payments.

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js + TS)         │
│  - Owner Dashboard                      │
│  - Operations Manager Dashboard         │
│  - Receptionist Interface               │
│  - Barista Interface                    │
│  - Admin Panels                         │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
                 │ JWT Auth
┌────────────────▼────────────────────────┐
│       Backend (NestJS + PostgreSQL)     │
│  ┌──────────────────────────────────┐  │
│  │ Modules:                         │  │
│  │ - Auth & Users                   │  │
│  │ - Roles & Permissions            │  │
│  │ - Customers                      │  │
│  │ - Sessions                       │  │
│  │ - Rooms & Halls                  │  │
│  │ - Bookings                       │  │
│  │ - Bar Orders & Products          │  │
│  │ - Invoices & Payments            │  │
│  │ - Audit Logs                     │  │
│  │ - Dashboards (data aggregation)  │  │
│  └──────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      PostgreSQL Database                │
│  - Customers, Sessions, Rooms           │
│  - Bookings, Orders, Invoices           │
│  - Payments, Audit Logs                 │
│  - Users, Roles, Permissions            │
└─────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 16+** (App Router)
- **TypeScript**
- **Tailwind CSS** (professional styling)
- **shadcn/ui** (component library)
- **React Query** (data fetching & caching)
- **axios** (API client)
- **Zustand** (state management - minimal)
- **date-fns** (date utilities)
- **Lucide React** (professional icons)

### Backend
- **NestJS** (framework)
- **TypeScript**
- **PostgreSQL** (database)
- **Prisma** (ORM)
- **JWT** (authentication)
- **@nestjs/passport** (auth strategy)
- **class-validator** (DTOs & validation)
- **Swagger** (API documentation)
- **Winston** (logging)

### Deployment & DevOps
- **Docker** (containerization)
- **docker-compose** (local development)
- **PostgreSQL Docker image**

## Project Structure

```
eduvers/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (operations)/
│   │   └── layout.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── customers/
│   │   ├── sessions/
│   │   ├── rooms/
│   │   ├── bookings/
│   │   ├── bar-orders/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── audit-logs/
│   │   ├── dashboards/
│   │   ├── common/
│   │   ├── config/
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── test/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Authentication & Authorization

### Auth Flow
1. User logs in with email + password
2. Backend validates credentials
3. Backend returns JWT access token + refresh token
4. Frontend stores tokens (httpOnly cookies if possible)
5. All API requests include Authorization header with JWT
6. Backend validates JWT and checks user permissions per action

### Role-Based Access Control (RBAC)
- Each user has a **role** (Owner, Operations Manager, Receptionist, Barista)
- Each role has **permissions** (read, create, update, delete per module)
- Permissions are checked at API level and enforced in frontend UI

## Data Flow - Receptionist Customer Lifecycle

```
1. Customer enters venue
   ↓
2. Receptionist searches/registers customer
   ↓
3. Receptionist opens a session for customer
   ↓
4. Session is active (customer present in venue)
   ↓
5. Barista may create bar orders linked to session
   ↓
6. Receptionist can add room bookings to session if needed
   ↓
7. When customer leaves, Receptionist closes session
   ↓
8. Invoice is auto-generated (session charges + orders + bookings)
   ↓
9. Receptionist records payment
   ↓
10. Visit complete, audit logged
```

## Real-Time Features (Phase 1 Basic)
- Dashboard updates poll backend every 10-15 seconds
- Active sessions list refreshes on demand
- Bar orders visible to ops manager when created by barista

## Performance & Scalability Considerations
- Database indexed on frequently queried fields (customer_id, session_id, room_id, created_at)
- API pagination for lists (default 20 items)
- Audit logs stored separately for fast queries
- Room availability calculated on-demand or cached short-term
- Invoice generation is atomic (no partial states)

## Security
- All passwords hashed with bcrypt
- JWT tokens short-lived (15 min access, 7 day refresh)
- Role-based permission checks at API route level
- Audit logging for all mutations
- Input validation via class-validator DTOs
- SQL injection prevention via Prisma parameterized queries

## Error Handling
- Consistent API error response format
- HTTP status codes used correctly (401, 403, 404, 409, 422, 500)
- User-friendly error messages for frontend
- Server error logging with context
- Graceful degradation on backend failures

## Future Phases (Not in Phase 1)
- Courses and training modules
- Kids programs
- Recording studio booking
- Multi-branch support
- Advanced analytics and reporting
- Payment gateway integration (Stripe, PayPal)
- Mobile app
- Real-time WebSocket updates
