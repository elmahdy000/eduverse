# Assumptions & Business Rules - Eduverse Phase 1

## Explicit Business Assumptions

### Customer Management
- Customers can be registered on-the-fly by receptionist
- Phone number is the unique identifier for customer lookup
- Customer type determines which conditional fields are required
- Customers can have multiple concurrent bookings but only one active session
- First/last visit dates are auto-updated on session open/close

### Session Management
- A session represents a customer's continuous presence in the venue
- Only one active session per customer at a time
- Session auto-calculates duration based on start and end times
- Sessions can be in one of: active, suspended, closed, cancelled
- Closing a session triggers invoice generation
- Session charges are calculated by session type and duration

### Booking & Room Availability
- Rooms cannot be double-booked (conflict detection required)
- A booking can exist without a linked session (pre-booking)
- A booking can be confirmed with or without deposit
- Room capacity is enforced (participant_count ≤ room capacity)
- Bookings and sessions are independent workflows (can happen together or separately)

### Bar Orders & Products
- Bar orders are created by barista role only
- Orders can be linked to a session OR customer (fallback if session not available)
- Products have a fixed price defined in product master
- Order status flows: new → in_preparation → ready → delivered or cancelled
- Barista can see all active orders and pending orders queue
- Operations manager and owner see real-time bar order status

### Invoices & Payments
- Invoices are generated at session close OR on-demand by receptionist
- Invoices include:
  - Session charges (hourly/daily/package rate)
  - Linked booking charges
  - Linked bar orders (all items from orders)
- Invoices support:
  - Discount (amount or percentage) - applied by manager/owner only
  - Tax (if applicable in jurisdiction)
- Payment methods: cash, bank transfer, mixed (cash + transfer)
- Partial payments are allowed (payment_status = partially_paid)
- Invoices can be refunded (full or partial)

### Audit & Compliance
- Every customer creation/update is logged
- Every session open/close is logged
- Every booking create/update/cancel is logged
- Every bar order action is logged
- Every invoice generation is logged
- Every payment recorded is logged
- Every permission check failure is logged
- Audit logs include: user, action, entity type, entity id, old/new snapshots, timestamp

### Authentication & Authorization
- User login requires email + password
- JWT tokens issued on successful login (access + refresh)
- Access token valid 15 minutes
- Refresh token valid 7 days
- All API requests must include valid JWT
- Role assignment is fixed per user (single role per user)
- Permissions are role-based, enforced at API level
- Frontend UI respects permissions (hide buttons, disable actions)

### Data Integrity & Constraints
- Email must be unique per user
- Phone number must be valid format
- Room capacity must be > 0
- Pricing fields (rates, amounts) must be ≥ 0
- Participant count cannot exceed room capacity
- Booking times must be: start < end
- Session times must be: start < end
- Invoice amounts calculated, not user-entered
- Payment amount ≤ remaining invoice amount

### User Workflow Rules
- Receptionist sees "Reception Screen" optimized for speed
- Barista sees "Barista Screen" optimized for order queue
- Operations Manager sees real-time operations dashboard
- Owner sees executive dashboard with summaries and trends
- No user can delete data (soft deletes only where applicable)
- No user can modify closed/paid invoices
- Owner only can refund payments

### Operational Assumptions
- Venue operates during business hours (times tracked per session)
- Venue has standard rates (hourly coworking, daily study, meeting rooms)
- Bar operates within venue and serves customers during sessions
- Multiple receptionists/baristas can work simultaneously
- No time zone complications (Phase 1 single location, assume local time)
- No currency conversion (single currency per instance)

---

## Explicit Non-Requirements for Phase 1

### Out of Scope
- Courses and training programs
- Kids programs and school schedules
- Recording studio / media production workflow
- Multi-branch / multi-location support
- Payment gateway integration (manual payment entry only)
- Automated email / SMS notifications
- Mobile app
- Real-time WebSocket updates (polling-based only)
- Advanced analytics and ML
- Inventory management for bar stock
- Supplier management
- Employee time tracking
- Shift scheduling

---

## Explicit Requirements for Phase 1

### Must Have

#### Functionality
- [x] Customer registration and profile management
- [x] Session lifecycle (open, close, cancel)
- [x] Room availability and booking
- [x] Bar order creation and status tracking
- [x] Invoice generation from sessions
- [x] Payment recording (cash, transfer)
- [x] Audit logging for compliance
- [x] Role-based access control
- [x] Four separate UI workflows (owner, ops manager, receptionist, barista)

#### Technical
- [x] PostgreSQL database with proper schema
- [x] NestJS backend with Prisma ORM
- [x] JWT authentication and authorization
- [x] API documentation (Swagger)
- [x] Proper error handling
- [x] Input validation and DTOs
- [x] Database indexing for performance
- [x] Docker & docker-compose for local dev

#### User Experience
- [x] Professional, not playful visual design
- [x] Receptionist interface optimized for speed
- [x] Barista interface optimized for queue workflow
- [x] Owner dashboard with executive summaries
- [x] Ops Manager dashboard with real-time status
- [x] No emojis or cartoon visuals
- [x] Consistent iconography (Lucide)
- [x] Clear visual hierarchy and spacing
- [x] Form validation and error messages
- [x] Empty states and loading states

---

## Known Decisions & Trade-offs

### Decision 1: Single Role Per User
- Users have exactly one role (Owner, Ops Manager, Receptionist, or Barista)
- Not multi-role (simpler to implement, sufficient for Phase 1)
- Can be revisited in Phase 2 if needed

### Decision 2: Manual Payment Entry
- No payment gateway integration in Phase 1
- Receptionist manually enters payment method and amount
- Supports cash, bank transfer, and mixed manually
- Stripe/PayPal can be added in Phase 2

### Decision 3: Polling-Based Dashboard Updates
- No real-time WebSocket
- Dashboards poll API every 10-15 seconds
- Sufficient for small venue operations
- WebSocket can be added in Phase 2 for higher concurrency

### Decision 4: Single Location
- No multi-branch support in Phase 1
- All data belongs to single venue instance
- Multi-tenant can be added in Phase 2

### Decision 5: Soft Deletes (Archive Pattern)
- Most entities use status/active flags instead of hard deletes
- Maintains audit trail and referential integrity
- Supports recovery if needed
- Reduces risk of accidental data loss

### Decision 6: Auto-Invoice on Session Close
- Invoice generated automatically when session closes
- Receptionist can modify (discounts, corrections) before payment
- Reduces manual steps and errors

---

## Questions for Stakeholder Clarification

### If Needed Later
1. Should customers be able to have multiple simultaneous sessions (e.g., one coworking + one meeting room)?
   - Current assumption: NO, one active session per customer

2. Should bookings be linked to invoices or sessions?
   - Current assumption: Bookings are line items in invoices

3. Should bar orders be linked to bookings (not just sessions)?
   - Current assumption: NO, orders link to sessions or customers

4. Should discount require approval (manager sign-off)?
   - Current assumption: NO, receptionist can apply discounts, audit logged

5. Should system enforce minimum payment (e.g., deposit before session)?
   - Current assumption: NO, payment after session completes

6. Should customer types be more granular?
   - Current assumption: Use provided five types (student, employee, trainer, parent, visitor)

---

## Success Criteria for Phase 1

### Functional Success
- [x] Receptionist can register customer → open session → close session → generate invoice → record payment in <5 minutes
- [x] Barista can create orders, update status, without leaving their interface
- [x] Operations Manager can see real-time status of all active sessions and bar orders
- [x] Owner can access full system with audit trails and financial summaries
- [x] No double-bookings of rooms
- [x] All actions logged in audit trail

### Technical Success
- [x] Backend API responds in <200ms per request (avg)
- [x] Database handles 1000 concurrent sessions without issues
- [x] All endpoints secured with JWT and role-based checks
- [x] Zero SQL injection vulnerabilities
- [x] Graceful error handling with meaningful messages
- [x] Code is clean, documented, and testable

### UX Success
- [x] Receptionist interface feels fast and intuitive
- [x] Barista screen is uncluttered and queue-focused
- [x] No confusion about roles or what user can access
- [x] Forms don't lose data on error
- [x] All status indicators are clear and accurate
- [x] Professional appearance (no emojis, playful elements)

---

## Version & Iteration Notes
- Phase 1 is MVP for operations
- Feedback from real users will shape Phase 2
- All architectural decisions can be revisited if assumptions prove wrong
- Code is structured for easy refactoring and extension
