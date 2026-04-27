# Eduverse Phase 1 Codex Prompt

## Objective
Build **Phase 1** of the Eduverse management system as a **web application** focused entirely on **daily venue operations**.

This first phase is **not** about courses, kids programs, corporate training, or the recording studio yet.
It is strictly about operating the venue in real life from the moment a customer enters until the moment they leave and pay.

The system must support:
- Customer registration and lookup
- Reception workflow
- In-venue sessions
- Room and hall management
- Bookings and schedule management
- Barista order workflow
- Linking bar orders to customer sessions
- Invoice generation and payment handling
- Multi-role access control
- Owner dashboard and operations dashboard
- Full audit logging

---

## Business Context
Eduverse is a venue that includes:
- seating / coworking / study space
- halls and rooms for meetings and sessions
- a bar with barista service
- reception workflow
- operational management

The system must behave like a real operations platform, not a simple reservation app.

---

## Main Operational Rule
The **Receptionist** is responsible for the customer's full visit lifecycle inside the venue:
1. Register a new customer or find an existing one
2. Open a session for the customer
3. Monitor the customer's active session
4. See bar orders linked to that session
5. Manage room / hall bookings when needed
6. Close the session when the customer leaves
7. Generate the final invoice automatically
8. Record payment
9. Complete the visit

The **Barista** has a separate account and interface.
The Barista creates and updates bar orders, and those orders must automatically appear in the system and be visible to Operations Manager and Owner.

---

## Required Roles
Implement **role-based + permission-based** access control.

### 1. Owner
The owner has full visibility and full control.

Owner must be able to:
- view all operations
- view all financial summaries
- view all statistics
- manage users
- manage roles and permissions
- view audit logs
- view all sessions, orders, bookings, invoices, and payments
- view performance indicators

### 2. Operations Manager
The Operations Manager is below the Owner and manages daily operations.

Operations Manager must be able to:
- monitor receptionist activity
- monitor barista activity
- manage active sessions
- manage room and hall operational status
- manage bookings
- view operational dashboards
- view bar order flow
- handle daily operational issues

Operations Manager must **not** be able to:
- manage global system settings
- manage high-level financial visibility if restricted
- manage roles and permissions unless explicitly granted

### 3. Receptionist
The Receptionist handles the customer lifecycle.

Receptionist must be able to:
- register a new customer
- search for existing customers
- update customer basic data
- open sessions
- monitor active sessions
- view orders linked to a session
- create and manage bookings
- close sessions
- generate invoices
- record payments

### 4. Barista
The Barista uses a dedicated interface.

Barista must be able to:
- create bar orders
- link each order to a session or customer whenever possible
- update order status
- view current and pending bar orders

Barista must **not** be able to:
- close invoices
- record payments
- view sensitive financial reports
- manage users or settings
- access bookings or room management beyond what is necessary

### 5. Optional Cashier Role
If needed, allow a separate cashier role later, but in Phase 1 assume that **Receptionist can also handle checkout and payment recording**.

---

## Required Customer Data
The customer profile must include:

### Required fields
- full name
- primary phone number

### Optional / conditional fields
- secondary phone number
- address
- customer type
- college
- study level / academic year
- specialization / department
- employer name
- job title
- notes
- first visit date
- last visit date
- customer status

### Customer type options
- student
- employee
- trainer
- parent
- visitor

### Conditional behavior
- If customer type = **student**, show and require:
  - college
  - study level
  - specialization
- If customer type = **employee**, show:
  - employer name
  - job title

### Customer filters in admin and reception screens
Allow filtering/searching by:
- full name
- phone number
- customer type
- college
- study level
- employer name

---

## Phase 1 Functional Scope

### A. Customer Management
Build customer management with:
- create customer
- edit customer
- search customer
- view customer profile
- visit history
- current active session indicator
- linked invoices and orders overview

### B. In-Venue Sessions
A session represents a customer's active presence inside the venue.

Each session must support:
- customer assignment
- session type
- start time
- end time
- status
- location assignment
- linked orders
- linked invoice
- notes

Possible session types:
- hourly
- daily
- package-based
- booking-linked

Possible session statuses:
- active
- suspended
- closed
- cancelled

### C. Room / Hall Management
Create a module for rooms and halls.

Each room/hall must have:
- name
- type
- capacity
- features / equipment
- operational status
- pricing settings if needed

Possible room statuses:
- available
- occupied
- booked soon
- under preparation
- out of service

### D. Booking Management
Support room and hall bookings with:
- customer / organizer info
- room assignment
- booking type
- date
- start time
- end time
- participant count
- notes
- total amount
- deposit amount
- booking status

Possible booking statuses:
- draft
- confirmed
- completed
- cancelled

Critical rule:
- prevent time conflicts for the same room/hall

### E. Bar / Barista Orders
Support a dedicated bar order workflow.

Each order must support:
- linked session or customer
- products
- quantities
- notes
- order status
- timestamps
- created by user

Possible order statuses:
- new
- in preparation
- ready
- delivered
- cancelled

Critical rule:
- Barista-created orders must automatically appear in the system and be visible to Operations Manager and Owner
- Orders should be included in the customer invoice automatically when relevant

### F. Products
Build a simple product catalog for bar items:
- name
- category
- price
- availability
- active/inactive status

### G. Invoices
Invoices must be generated at checkout.

Invoice may include:
- session charges
- booking charges
- bar orders
- extra services
- discount if allowed
- subtotal
- total
- amount paid
- remaining amount
- payment status

Possible payment statuses:
- unpaid
- partially paid
- paid
- refunded

### H. Payments
Support payment records with:
- invoice
- payment method
- amount
- paid at
- recorded by
- notes

Possible payment methods:
- cash
- bank transfer
- mixed

### I. Audit Logs
Every major action must be logged.

Audit logs must record:
- user
- action
- entity type
- entity id
- old value snapshot if relevant
- new value snapshot if relevant
- timestamp

Examples of logged actions:
- customer created
- customer edited
- session opened
- session closed
- bar order created
- order status changed
- booking created
- booking updated
- invoice generated
- payment recorded
- discount applied

---

## Required Dashboards

### Owner Dashboard
Must show high-level visibility such as:
- active customers now
- active sessions now
- occupied rooms now
- today’s bookings
- current bar orders
- today’s revenue summary
- invoices issued today
- payments collected today
- top selling products
- operational alerts

### Operations Manager Dashboard
Must focus on operations such as:
- current active sessions
- room occupancy and upcoming bookings
- delayed or pending bar orders
- recently opened sessions
- operational alerts
- active receptionist / barista actions if possible

### Reception Screen
Must be optimized for fast workflow:
- quick customer search
- quick add customer
- open session
- view active sessions
- close session
- generate invoice
- record payment
- manage bookings

### Barista Screen
Must be optimized for speed and clarity:
- active sessions list or searchable target
- create order
- update order status
- kitchen/bar workflow style layout
- current pending orders

---

## Permissions Model
Implement both:
1. **Role-based access control**
2. **Granular permissions per module/action**

Examples of permission actions:
- read
- create
- update
- delete
- approve
- close
- view financials
- view analytics
- manage users
- manage roles

Modules that must support permissions:
- users
- roles
- permissions
- customers
- sessions
- rooms
- bookings
- products
- bar_orders
- invoices
- payments
- dashboards
- audit_logs

---

## Technical Stack
Use the following stack:

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- NestJS
- PostgreSQL
- Prisma ORM
- Swagger for API documentation
- JWT + refresh token authentication
- Redis for cache / queues if needed

### Architecture
Build it as:
- production-oriented
- modular
- scalable
- cleanly separated frontend and backend
- well structured for future phases

---

## Required Backend Modules
Implement or scaffold these modules for Phase 1:
- users
- roles_permissions
- auth
- customers
- sessions
- rooms
- bookings
- products
- bar_orders
- invoices
- payments
- dashboards
- audit_logs

---

## Required Frontend Screens
Build initial screens for:
- login
- owner dashboard
- operations manager dashboard
- receptionist screen
- barista screen
- customer management
- room management
- booking management
- session management
- invoice / checkout screen
- products management
- audit log viewer for owner/admin if appropriate

---

## Database Design Expectations
Design the database from the start to support:
- future multi-branch support
- multiple customer types
- room booking conflict prevention
- invoices with multiple item sources
- auditability
- strong relationships
- future extensibility for later phases

Do not create a weak demo schema.
Create a proper production-ready schema plan.

---

## Development Rules
- Do not implement all future phases now
- Focus on Phase 1 only
- Do not generate random fake architecture
- Keep naming consistent and clean
- Use DTOs and validation
- Implement pagination and filtering where needed
- Implement proper error handling
- Keep code organized by domain
- Write assumptions into `assumptions.md` whenever a business rule is not explicit
- Create seed data for testing the workflow

---

## Required Output Sequence
Work in this exact order:

### 1. Read and understand
Read the project requirements and summarize your understanding.

### 2. Create planning documents
Generate these files first:
- `architecture.md`
- `modules.md`
- `roles_permissions.md`
- `database_schema_plan.md`
- `api_plan.md`
- `implementation_phases.md`
- `assumptions.md`

### 3. Start implementation of Phase 1
Begin the actual implementation for Phase 1 immediately after planning.

### 4. After every meaningful implementation step
Report:
- what was completed
- which files were created or updated
- what remains next

---

## Final Instruction
Start with the **Phase 1 web app for full venue operations** only.
Do not move to courses, kids programs, corporate training, or studio modules yet.

The first release must allow Eduverse to run daily operations through one web app with:
- customer registration
- active sessions
- bar order workflow
- room and hall bookings
- checkout and payments
- hierarchical access control
- owner-level visibility
- operations-level visibility
- receptionist workflow
- barista workflow
- audit logging

---

## Senior UX and Visual Design Direction
This product must be designed as a **serious, professional operations platform**.
The visual language should reflect a high-quality business system used in real daily operations.

### Visual style requirements
- Do not use emojis anywhere in the product
- Do not use cartoon icons, playful illustrations, mascots, or childish visuals
- Use only professional, clean, modern iconography
- Prefer consistent icon systems such as Lucide or another clean line-based professional icon set
- Avoid decorative clutter, novelty UI, exaggerated gradients, or trendy visual noise
- Avoid childish colors, exaggerated rounded shapes, and playful empty states
- The design must feel credible, operational, structured, and executive-ready

### Layout and design expectations
- Build a premium admin experience with strong visual hierarchy
- Use a clean dashboard layout with clear spacing, alignment, and readable grouping
- Prioritize information density without making the interface feel crowded
- Use professional card layouts, structured tables, clear filters, and high-clarity forms
- Make operational screens fast, focused, and task-oriented
- Keep navigation simple, predictable, and role-aware
- Optimize the Receptionist and Barista interfaces for speed, minimal clicks, and low cognitive load
- Use clear status indicators for sessions, bookings, room state, and bar orders
- Present dashboards with polished summaries, trends, and operational alerts
- Ensure the Owner dashboard feels executive and analytical
- Ensure the Operations Manager dashboard feels real-time and operational
- Ensure the Receptionist screen feels fast, practical, and optimized for frequent input
- Ensure the Barista screen feels lightweight, high-contrast, and queue-friendly

### UX quality requirements
- Design all screens from a senior UX perspective, not just as CRUD pages
- Every screen must have a clear primary task and minimal friction
- Forms must be structured logically and support fast data entry
- Search, filtering, and state visibility must be first-class UX features
- Use sensible defaults, inline validation, loading states, empty states, and error states
- Make all operational actions obvious, safe, and reversible where appropriate
- Use confirmation patterns only when necessary for destructive or financially sensitive actions
- Keep the checkout and invoice flow extremely clear and reliable
- The design should reduce mistakes during peak operational hours

### Responsive behavior
- Desktop-first for admin and operations use
- Tablet-friendly layouts for reception and operational movement inside the venue
- Do not treat mobile phone layout as the primary experience for Phase 1

### Accessibility and readability
- Use strong contrast and readable typography
- Avoid tiny text and weak visual contrast
- Ensure forms, tables, and statuses remain readable in long usage sessions
- Maintain professional spacing and component consistency across all screens

### Non-negotiable UI direction
The final product must look like a polished professional operations system.
It must not look playful, casual, gamified, student-like, or experimental.
It must feel like software built by a senior product and UX team for real business operations.
