# Implementation Roadmap - Eduverse Phase 1

## Phase 1 Structure

### Stage 1: Foundation (Backend Core)
1. **Project Setup**
   - Initialize NestJS backend
   - Set up PostgreSQL with Docker Compose
   - Configure Prisma ORM
   - Set up environment variables and configuration

2. **Database Layer**
   - Create Prisma schema from `database_schema_plan.md`
   - Create migrations
   - Seed initial roles and permissions
   - Verify indexes and constraints

3. **Authentication & Authorization**
   - JWT strategy (Passport + Guards)
   - Role-based access control middleware
   - Permission checks at controller/service level
   - User registration (admin-initiated)
   - Login endpoint with token generation

4. **Core Business Modules** (in order)
   - **Users & Roles**: CRUD operations, permissions assignment
   - **Customers**: Registration, search, profile management
   - **Products**: Simple CRUD for bar items
   - **Rooms**: CRUD and availability logic
   - **Sessions**: Open, close, status transitions
   - **Bookings**: Create, manage, conflict detection
   - **Bar Orders**: Create, status updates
   - **Invoices**: Auto-generation from sessions, calculations
   - **Payments**: Record payments, validate amounts
   - **Audit Logs**: Interceptor-based logging for all mutations

5. **Dashboards (Data Aggregation)**
   - Owner dashboard aggregations
   - Operations Manager dashboard queries
   - Reception lightweight context

6. **API Documentation**
   - Swagger/OpenAPI setup
   - All endpoints documented with examples

---

### Stage 2: Frontend Application
1. **Project Setup**
   - Initialize Next.js frontend
   - Configure TypeScript, Tailwind, shadcn/ui
   - Set up environment variables

2. **Authentication UI**
   - Login page with email/password form
   - Logout functionality
   - Protected routes (middleware)

3. **Shared Components**
   - Layout wrapper with sidebar/header
   - Role-based navigation
   - Loading states
   - Error boundaries
   - Modal/form components

4. **Dashboard Screens** (in order)
   - **Owner Dashboard**: Summaries, stats, trends
   - **Operations Manager Dashboard**: Real-time view, room status, orders
   - **Reception Screen**: Optimized customer flow
   - **Barista Screen**: Order queue interface

5. **Administrative Panels**
   - User management (owner only)
   - Room management
   - Product management (barista product list)
   - Audit log viewer

6. **Customer Management**
   - Customer search/lookup
   - Customer profile
   - Create customer form
   - Customer history

7. **Session & Booking Workflows**
   - Session creation
   - Session lifecycle management
   - Booking creation and management
   - Conflict detection feedback

8. **Bar Order Workflow**
   - Order creation form (barista)
   - Order queue view
   - Status update interface
   - Recent orders list

9. **Invoice & Payment**
   - Invoice generation form
   - Invoice preview/print
   - Payment recording form
   - Invoice history

---

### Stage 3: Integration & Testing
1. **End-to-End Testing**
   - Receptionist workflow (register → open → close → pay)
   - Barista workflow (create order → update → complete)
   - Booking workflow (create → manage → conflict detection)
   - Payment workflow

2. **Performance Testing**
   - API response times
   - Dashboard data aggregation performance
   - Database query optimization

3. **Security Audit**
   - JWT token handling
   - Permission enforcement
   - Input validation
   - SQL injection prevention

4. **User Acceptance Testing**
   - Receptionist interface usability
   - Barista interface speed
   - Operations Manager real-time visibility
   - Owner reporting accuracy

---

## Detailed Implementation Order

### Backend Implementation Sequence

#### Week 1: Foundation
```
Day 1: NestJS setup + PostgreSQL + Prisma
  - Initialize NestJS project
  - Configure PostgreSQL Docker container
  - Install and configure Prisma
  - Set up migrations system
  
Day 2: Database Schema
  - Create Prisma schema (all tables from database_schema_plan.md)
  - Create and run migrations
  - Add indexes
  - Seed initial roles and permissions
  
Day 3: Auth & Users
  - Implement JWT strategy
  - User registration (admin endpoint)
  - User login with token generation
  - Role assignment
  
Day 4: Permissions
  - Permission model in database
  - Role-permission mapping
  - Permission checks in middleware/guards
  - Audit logging setup
  
Day 5: API Documentation
  - Swagger/OpenAPI setup
  - Document auth endpoints
```

#### Week 2: Core Modules
```
Day 6: Customers Module
  - Customer CRUD
  - Search and filter
  - Visit history aggregation
  - Active session lookup
  
Day 7: Rooms Module
  - Room CRUD
  - Availability calculation
  - Conflict detection logic
  
Day 8: Sessions Module
  - Open session
  - Close session (with invoice trigger)
  - Query active/closed sessions
  - Link orders to session
  
Day 9: Bookings Module
  - Create booking
  - Check conflicts before save
  - Update booking status
  - Cancel booking
  
Day 10: Products Module
  - Product CRUD
  - Category filtering
```

#### Week 3: Orders & Invoicing
```
Day 11: Bar Orders Module
  - Create order
  - Update order status
  - Link to session/customer
  - Calculate order total
  
Day 12: Invoices Module
  - Auto-generate invoice on session close
  - Aggregate line items (session + orders)
  - Apply discounts
  - Generate invoice number
  
Day 13: Payments Module
  - Record payment
  - Update invoice payment status
  - Support partial payments
  - Refund logic
  
Day 14: Dashboards (Backend)
  - Owner dashboard aggregations
  - Operations Manager dashboard queries
  - Reception lightweight data
```

#### Week 4: Polish & Integration
```
Day 15: Error Handling & Validation
  - Consistent error responses
  - Input validation DTOs
  - Business rule validation
  
Day 16: Testing & Seed Data
  - Create seed script
  - Test all workflows
  - Performance checks
  
Day 17: Docker & Deployment
  - Dockerfile for backend
  - docker-compose configuration
  - Environment setup
  
Day 18: Documentation
  - API documentation complete
  - Setup instructions
  - Database schema documentation
```

### Frontend Implementation Sequence

#### Week 5: Setup & Auth
```
Day 19: Next.js Setup
  - Initialize Next.js project
  - Configure Tailwind + shadcn/ui
  - Set up TypeScript
  - Environment variables
  
Day 20: Authentication
  - Login page design
  - JWT token storage
  - Protected routes middleware
  - Logout
  
Day 21: Layout & Navigation
  - Main layout wrapper
  - Role-based sidebar navigation
  - Header with user menu
```

#### Week 6: Dashboards
```
Day 22: Owner Dashboard
  - Summary cards (active customers, revenue, etc.)
  - Charts and trends
  - Operational alerts
  
Day 23: Operations Manager Dashboard
  - Active sessions table
  - Room occupancy view
  - Pending orders list
  - Booking calendar preview
  
Day 24: Reception Screen
  - Customer search
  - Quick add customer button
  - Active sessions for customer
  - Open session form
```

#### Week 7: Core Workflows
```
Day 25: Customer Management
  - Search/lookup page
  - Customer profile page
  - Create customer form
  - Edit customer
  
Day 26: Session Workflow
  - Open session form
  - Close session confirmation
  - View active session details
  
Day 27: Booking Workflow
  - Create booking form
  - Room availability calendar
  - Conflict warnings
  - Edit/cancel booking
  
Day 28: Bar Order Workflow
  - Order creation form (barista)
  - Order queue (barista view)
  - Status update buttons
```

#### Week 8: Invoices & Admin
```
Day 29: Invoice & Payment
  - Invoice preview
  - Generate invoice form
  - Record payment form
  - Invoice history
  
Day 30: Barista Screen
  - Dedicated barista interface
  - Current orders queue
  - Product catalog
  - Status update buttons
  
Day 31: Admin Panels
  - Room management (CRUD)
  - Product management
  - User management (owner only)
  - Audit log viewer
```

#### Week 9: Integration & Polish
```
Day 32: Testing & Bug Fixes
  - End-to-end workflows
  - UI/UX refinement
  - Cross-browser testing
  
Day 33: Performance
  - API call optimization
  - Caching strategies
  - Image optimization
  
Day 34: Docker & Deployment
  - Dockerfile for frontend
  - docker-compose integration
  - Production build
  
Day 35: Final QA & Handoff
  - Full system testing
  - Documentation
  - User training prep
```

---

## Acceptance Criteria

### Backend Complete When:
- [x] All 13 modules implemented and tested
- [x] API endpoints match `api_plan.md`
- [x] Permissions enforced at all endpoints
- [x] Audit logs capture all mutations
- [x] Database schema matches plan
- [x] Swagger documentation complete
- [x] Error handling consistent
- [x] Input validation on all endpoints
- [x] Docker Compose runs locally without errors
- [x] Seed data loads successfully

### Frontend Complete When:
- [x] All 4 role-based interfaces implemented
- [x] Login/logout working
- [x] Protected routes enforced
- [x] All dashboards display data
- [x] Receptionist workflow fully functional
- [x] Barista workflow fully functional
- [x] Forms validate input
- [x] Error messages clear and helpful
- [x] Loading states visible
- [x] Mobile responsive (tablet-first)
- [x] Professional visual design (no emojis, clean icons)
- [x] Runs on `npm run dev` without errors

### Integration Complete When:
- [x] End-to-end receptionist workflow works
- [x] End-to-end barista workflow works
- [x] End-to-end booking workflow works
- [x] No double-bookings occur
- [x] Invoices generate correctly
- [x] Payments record accurately
- [x] Dashboards update in real-time (polling)
- [x] Permission checks work across all roles
- [x] Audit logs complete and accurate
- [x] System handles concurrent users

---

## Known Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Booking conflict logic too complex | Build conflict detection early, test thoroughly |
| Invoice calculations incorrect | Implement unit tests for calculation logic |
| Permissions not properly enforced | Test each permission matrix item manually |
| Performance issues with dashboard | Index database early, profile queries |
| Frontend/Backend API mismatch | Use Swagger, keep sync'd |
| Database migrations break in production | Test migrations locally first |
| Authentication token issues | Use industry-standard JWT library (passport) |
| UI too cluttered for barista | Iterate with actual barista feedback |

---

## Definition of Done

- Code follows project structure
- All endpoints tested
- Database migrations pass
- No console errors or warnings
- Documentation updated
- Git commits meaningful and clean
- Code review completed
- No technical debt introduced
