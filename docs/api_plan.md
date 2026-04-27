# API Plan - Eduverse Phase 1

## API Base Structure
- **Base URL**: `http://localhost:3001/api`
- **Authentication**: JWT Bearer Token in Authorization header
- **Content-Type**: application/json
- **Response Format**: Consistent JSON structure with metadata

## Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error Response:
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer with ID xyz not found",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user (admin only)
- **Body**: { email, password, firstName, lastName, roleId }
- **Response**: { userId, email, role }

### POST /auth/login
User login
- **Body**: { email, password }
- **Response**: { accessToken, refreshToken, user: { id, email, role, permissions } }

### POST /auth/refresh
Refresh access token
- **Body**: { refreshToken }
- **Response**: { accessToken }

### POST /auth/logout
Logout user
- **Response**: { message: "Logged out successfully" }

---

## Customers Endpoints

### GET /customers
List all customers with pagination & filters
- **Query**: `page=1&limit=20&search=john&type=student&college=xyz`
- **Response**: { data: [...], total, page, limit, hasMore }

### GET /customers/:id
Get customer details
- **Response**: { id, fullName, phone, email, type, college, ... }

### POST /customers
Create new customer
- **Body**: { fullName, phone, email, type, college?, employer?, ... }
- **Response**: { id, ... }

### PUT /customers/:id
Update customer
- **Body**: { fullName?, phone?, email?, notes?, ... }
- **Response**: { id, ... }

### GET /customers/:id/sessions
Get customer's session history
- **Query**: `limit=50&status=closed`
- **Response**: { data: [...], total }

### GET /customers/:id/active-session
Get customer's active session (if any)
- **Response**: { id, status, startTime, ... } or null

---

## Sessions Endpoints

### POST /sessions
Open a new session for customer
- **Body**: { customerId, sessionType, roomId?, chargeAmount? }
- **Response**: { id, customerId, status, startTime, ... }

### GET /sessions
List sessions with filters
- **Query**: `status=active&customerId=xyz&limit=50`
- **Response**: { data: [...], total }

### GET /sessions/:id
Get session details
- **Response**: { id, customerId, status, startTime, endTime, linkedOrders: [...], ... }

### PUT /sessions/:id/close
Close an active session
- **Body**: { notes? }
- **Response**: { id, status: "closed", endTime, ... }

### PUT /sessions/:id/cancel
Cancel a session
- **Response**: { id, status: "cancelled" }

### PUT /sessions/:id/suspend
Suspend a session temporarily
- **Response**: { id, status: "suspended" }

### GET /sessions/:id/linked-orders
Get bar orders linked to session
- **Response**: { data: [...], total }

---

## Rooms Endpoints

### GET /rooms
List all rooms
- **Query**: `type=meeting&status=available&limit=50`
- **Response**: { data: [...], total }

### POST /rooms
Create new room (admin/ops manager)
- **Body**: { name, type, capacity, features, hourlyRate?, dailyRate? }
- **Response**: { id, ... }

### PUT /rooms/:id
Update room details
- **Body**: { name?, capacity?, features?, hourlyRate?, dailyRate?, status? }
- **Response**: { id, ... }

### GET /rooms/:id/availability
Check room availability for date/time range
- **Query**: `startTime=2024-01-15T10:00:00Z&endTime=2024-01-15T12:00:00Z`
- **Response**: { isAvailable: true, conflicts: [] }

---

## Bookings Endpoints

### POST /bookings
Create a new booking
- **Body**: { customerId, roomId, bookingType, startTime, endTime, participantCount, totalAmount, depositAmount?, notes? }
- **Response**: { id, status: "confirmed", ... }

### GET /bookings
List bookings with filters
- **Query**: `roomId=xyz&status=confirmed&startDate=2024-01-15&limit=50`
- **Response**: { data: [...], total }

### GET /bookings/:id
Get booking details
- **Response**: { id, customerId, roomId, status, times, totalAmount, ... }

### PUT /bookings/:id
Update booking
- **Body**: { startTime?, endTime?, participantCount?, notes? }
- **Response**: { id, ... }

### PUT /bookings/:id/cancel
Cancel a booking
- **Response**: { id, status: "cancelled" }

### GET /bookings/room/:roomId/conflicts
Check conflicts for room on date
- **Query**: `startTime=...&endTime=...`
- **Response**: { conflicts: [] }

---

## Bar Orders Endpoints

### POST /bar-orders
Create new bar order (barista)
- **Body**: { sessionId?, customerId?, items: [{ productId, quantity }], notes? }
- **Response**: { id, status: "new", totalAmount, ... }

### GET /bar-orders
List bar orders (queue view)
- **Query**: `status=new,in_preparation&limit=100&sortBy=createdAt`
- **Response**: { data: [...], total }

### GET /bar-orders/:id
Get order details
- **Response**: { id, customerId, items: [...], status, totalAmount, ... }

### PUT /bar-orders/:id/status
Update order status (barista)
- **Body**: { status: "in_preparation" | "ready" | "delivered" | "cancelled" }
- **Response**: { id, status, ... }

### PUT /bar-orders/:id/cancel
Cancel order (barista)
- **Response**: { id, status: "cancelled" }

---

## Products Endpoints

### GET /products
List products
- **Query**: `category=coffee&active=true&limit=100`
- **Response**: { data: [...], total }

### POST /products
Create product (admin/ops manager)
- **Body**: { name, category, price, description?, active: true }
- **Response**: { id, ... }

### PUT /products/:id
Update product
- **Body**: { name?, price?, category?, active? }
- **Response**: { id, ... }

---

## Invoices Endpoints

### POST /invoices
Generate invoice for session
- **Body**: { sessionId, discountAmount?, discountPercent?, notes? }
- **Response**: { id, invoiceNumber, customerId, totalAmount, paymentStatus, ... }

### GET /invoices
List invoices with filters
- **Query**: `customerId=xyz&paymentStatus=unpaid&limit=50&sortBy=issuedAt`
- **Response**: { data: [...], total }

### GET /invoices/:id
Get invoice details with line items
- **Response**: { id, invoiceNumber, customer, items: [...], amounts, paymentStatus, ... }

### GET /invoices/:id/print
Get printable invoice (PDF stream)
- **Response**: PDF file

---

## Payments Endpoints

### POST /payments
Record payment for invoice
- **Body**: { invoiceId, paymentMethod: "cash" | "bank_transfer" | "mixed", amount, notes? }
- **Response**: { id, invoiceId, amount, paymentMethod, recordedAt, ... }

### GET /payments
List payments with filters
- **Query**: `invoiceId=xyz&limit=50&sortBy=paidAt`
- **Response**: { data: [...], total }

### GET /invoices/:id/payments
Get all payments for invoice
- **Response**: { data: [...], totalRecorded, remainingAmount }

### POST /payments/:id/refund
Refund a payment (owner/ops manager)
- **Body**: { amount?, reason? }
- **Response**: { id, status: "refunded", ... }

---

## Dashboards Endpoints

### GET /dashboards/owner
Executive dashboard summary
- **Response**:
  ```json
  {
    "activeCustomersNow": 12,
    "activeSessionsNow": 15,
    "occupiedRoomsNow": 5,
    "todayBookings": 8,
    "currentBarOrders": 23,
    "todayRevenue": 5420.50,
    "invoicesToday": 18,
    "paymentsTodayAmount": 4850.00,
    "topProducts": [...],
    "operationalAlerts": [...]
  }
  ```

### GET /dashboards/operations-manager
Operations real-time view
- **Response**:
  ```json
  {
    "activeSessions": [...],
    "roomOccupancy": [...],
    "upcomingBookings": [...],
    "pendingBarOrders": [...],
    "recentActions": [...],
    "alerts": [...]
  }
  ```

### GET /dashboards/reception
Reception context (lightweight)
- **Response**:
  ```json
  {
    "activeSessionCount": 12,
    "recentCustomers": [...],
    "todayInvoicesCount": 5,
    "todayRevenuePartial": 1250.00
  }
  ```

---

## Audit Logs Endpoints

### GET /audit-logs
List audit logs (owner/admin only)
- **Query**: `entityType=customer&entityId=xyz&limit=100&sortBy=timestamp:desc`
- **Response**: { data: [...], total }

### GET /audit-logs/:id
Get audit log entry
- **Response**: { id, user, action, entity, oldValue, newValue, timestamp, ... }

---

## Users Endpoints (Owner Only)

### GET /users
List users
- **Query**: `role=receptionist&status=active&limit=50`
- **Response**: { data: [...], total }

### POST /users
Create user
- **Body**: { email, password, firstName, lastName, roleId }
- **Response**: { id, email, role, ... }

### PUT /users/:id
Update user
- **Body**: { firstName?, lastName?, roleId?, status? }
- **Response**: { id, ... }

### PUT /users/:id/password
Change user password
- **Body**: { newPassword }
- **Response**: { message: "Password updated" }

### DELETE /users/:id
Deactivate user
- **Response**: { id, status: "inactive" }

---

## Error Codes & HTTP Status

| Error | HTTP | Code |
|-------|------|------|
| Invalid credentials | 401 | INVALID_CREDENTIALS |
| Unauthorized | 403 | FORBIDDEN |
| Resource not found | 404 | NOT_FOUND |
| Email already exists | 409 | DUPLICATE_EMAIL |
| Room double-booked | 409 | BOOKING_CONFLICT |
| Invalid data | 422 | VALIDATION_ERROR |
| Internal server error | 500 | INTERNAL_ERROR |

---

## Rate Limiting
- 1000 requests per minute per user
- 100 requests per minute per IP (anonymous)

---

## Pagination
- Default limit: 20
- Max limit: 100
- Offset-based pagination

---

## Filtering & Search
- Full-text search on text fields
- Exact match on IDs and status fields
- Date range filtering with startDate/endDate
- Multiple filters combined with AND logic
