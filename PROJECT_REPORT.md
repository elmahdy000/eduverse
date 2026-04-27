# Eduverse - Venue Operations Platform
## Complete Project Report & Documentation

---

## 1. Project Overview

**Eduverse** is a professional venue operations platform for managing daily customer visits, sessions, room bookings, bar orders, and payments at a coworking/study venue.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 10, PostgreSQL 16, Prisma 5 ORM |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, React Query |
| Auth | JWT (Passport.js) with access/refresh tokens |
| Containerization | Docker & Docker Compose |
| API Docs | Swagger/OpenAPI |

### Project Structure

```
D:\coders\eduvers/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # JWT authentication, role guards
│   │   ├── users/             # User CRUD
│   │   ├── customers/         # Customer management
│   │   ├── sessions/          # Session lifecycle
│   │   ├── rooms/             # Room management
│   │   ├── bookings/          # Booking with conflict detection
│   │   ├── products/          # Bar product catalog
│   │   ├── bar-orders/        # Order workflow
│   │   ├── invoices/          # Invoice generation
│   │   ├── payments/          # Payment recording
│   │   ├── audit-logs/        # Compliance logging
│   │   ├── dashboards/        # Role-specific dashboards
│   │   ├── common/            # Prisma service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma      # 18-table schema
│   └── Dockerfile
├── frontend/                   # Next.js App
│   ├── app/
│   │   ├── (protected)/       # Auth-protected routes
│   │   │   ├── dashboard/     # 4 role dashboards
│   │   │   ├── customers/
│   │   │   ├── sessions/
│   │   │   ├── bookings/
│   │   │   ├── bar-orders/
│   │   │   ├── products/
│   │   │   ├── rooms/
│   │   │   ├── billing/
│   │   │   ├── users/
│   │   │   └── audit-logs/
│   │   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # AppShell, AuthGate, providers
│   ├── lib/                   # API client, types, formatters
│   ├── store/                 # Zustand auth store
│   └── Dockerfile.dev
├── docker-compose.yml
└── README.md
```

---

## 2. Database Schema (18 Tables)

### Authentication & Access
| Table | Purpose |
|-------|---------|
| `roles` | 4 roles: Owner, Operations Manager, Receptionist, Barista |
| `permissions` | 36+ granular permissions |
| `role_permissions` | Role-permission mappings |
| `users` | User accounts with hashed passwords |

### Operations
| Table | Purpose |
|-------|---------|
| `customers` | Customer profiles with type-based fields |
| `sessions` | In-venue session tracking |
| `rooms` | Room/hall inventory |
| `bookings` | Room bookings with conflict prevention |

### Bar Operations
| Table | Purpose |
|-------|---------|
| `products` | Bar product catalog |
| `bar_orders` | Order headers |
| `bar_order_items` | Order line items |

### Billing
| Table | Purpose |
|-------|---------|
| `invoices` | Invoice records |
| `invoice_items` | Invoice line items |
| `payments` | Payment records |

### Compliance
| Table | Purpose |
|-------|---------|
| `audit_logs` | All mutation audit trail |

---

## 3. Roles & Permissions

### 4 System Roles

| Role | Access Level |
|------|-------------|
| **Owner** | Full system access, financial reports, user management, audit logs |
| **Operations Manager** | Daily operations monitoring, room management, booking oversight |
| **Receptionist** | Customer lifecycle, session management, checkout, payments |
| **Barista** | Order creation, status updates, product viewing |

### Default Credentials
```
Email: owner@eduvers.com
Password: owner123
```

---

## 4. API Endpoints (65+)

### Auth (4)
- `POST /auth/login` - User login
- `POST /auth/register` - Create user (admin)
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Users (8)
- `GET/POST /users` - List/create users
- `GET/PUT/DELETE /users/:id` - CRUD operations
- `PUT /users/:id/password` - Change password
- `GET /users/me` - Current user
- `GET /users/roles` - List roles

### Customers (9)
- `GET/POST /customers` - List/create
- `GET/PUT /customers/:id` - Get/update
- `GET /customers/:id/sessions` - Visit history
- `GET /customers/:id/active-session` - Active session
- `PUT /customers/:id/status` - Deactivate/blacklist

### Sessions (5)
- `POST /sessions` - Open session
- `GET /sessions` - List sessions
- `GET /sessions/:id` - Get session
- `PUT /sessions/:id/close` - Close session
- `PUT /sessions/:id/cancel` - Cancel session

### Rooms (7)
- `GET/POST /rooms` - List/create
- `GET/PUT /rooms/:id` - Get/update
- `PUT /rooms/:id/status` - Change status
- `GET /rooms/available` - Available rooms

### Bookings (7)
- `POST /bookings` - Create booking
- `GET /bookings` - List bookings
- `GET /bookings/:id` - Get booking
- `PUT /bookings/:id` - Update booking
- `PUT /bookings/:id/cancel` - Cancel
- `GET /bookings/room/:id/conflicts` - Conflict check

### Products (6)
- `GET/POST /products` - List/create
- `GET/PUT /products/:id` - Get/update
- `PUT /products/:id/deactivate` - Deactivate
- `PUT /products/:id/reactivate` - Reactivate

### Bar Orders (5)
- `POST /bar-orders` - Create order
- `GET /bar-orders` - List orders
- `GET /bar-orders/:id` - Get order
- `PUT /bar-orders/:id/status` - Update status
- `PUT /bar-orders/:id/cancel` - Cancel

### Invoices (5)
- `POST /invoices` - Generate invoice
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice
- `GET /invoices/:id/print` - Print payload
- `GET /invoices/:id/payments` - Invoice payments

### Payments (3)
- `POST /payments` - Record payment
- `GET /payments` - List payments
- `POST /payments/:id/refund` - Refund

### Audit Logs (2)
- `GET /audit-logs` - List logs
- `GET /audit-logs/:id` - Get log

### Dashboards (4)
- `GET /dashboards/owner` - Owner summary
- `GET /dashboards/operations-manager` - Ops view
- `GET /dashboards/reception` - Reception context
- `GET /dashboards/barista` - Barista queue

---

## 5. Frontend Pages

### Dashboard Routes (Role-Based)
| Route | Role |
|-------|------|
| `/dashboard/owner` | Owner - Financial KPIs, alerts |
| `/dashboard/operations-manager` | Ops Manager - Real-time monitoring |
| `/dashboard/reception` | Receptionist - Quick actions |
| `/dashboard/barista` | Barista - Order queue |

### Management Pages
| Route | Features |
|-------|----------|
| `/customers` | Search, create, edit, blacklist, history |
| `/sessions` | Open, close, cancel sessions |
| `/bookings` | Create, conflict check, complete, cancel |
| `/bar-orders` | Create orders, update status |
| `/products` | CRUD, activate/deactivate |
| `/rooms` | CRUD, availability check |
| `/billing` | Generate invoices, record payments, refunds |
| `/users` | CRUD, role assignment, password change |
| `/audit-logs` | Filter and view logs |

---

## 6. Quick Start

### With Docker
```bash
cd D:\coders\eduvers
docker-compose up -d
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### Local Development
```bash
# Backend
cd backend
npm install --legacy-peer-deps
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 7. Implementation Status

| Component | Status |
|-----------|--------|
| Backend Modules (12) | **COMPLETE** |
| Frontend Pages | **COMPLETE** |
| Database Schema | **COMPLETE** |
| API Endpoints | **65+ IMPLEMENTED** |
| Authentication | **COMPLETE** |
| Role-Based Access | **COMPLETE** |
| Audit Logging | **COMPLETE** |

---

## 8. Business Rules

- One active session per customer at a time
- Room bookings cannot conflict (auto-checked)
- Sessions auto-generate invoice on close
- Bar orders link to sessions/customers
- All mutations logged to audit trail
- Payments support partial and mixed methods