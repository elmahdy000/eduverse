# Roles & Permissions Matrix - Eduverse Phase 1

## Role Definitions

### 1. Owner
Full system access and visibility. Controls all settings, users, and financial data.

**Permissions:**
- All read operations across all modules
- All create/update/delete operations
- User and role management
- View all dashboards
- View audit logs
- Financial reporting
- System settings

**Restrictions:**
- None

---

### 2. Operations Manager
Manages daily operations, monitors staff, ensures service quality.

**Permissions by Module:**

#### Customers
- READ: View all customers, search, filter
- UPDATE: Update customer information
- CREATE: Add new customers

#### Sessions
- READ: View all active and closed sessions
- CREATE: Open sessions (rarely, mainly for testing)
- UPDATE: Monitor session status
- DELETE: None

#### Rooms & Halls
- READ: View all rooms, availability status
- UPDATE: Change room status (available, occupied, under prep, out of service)
- CREATE: Add new rooms (if needed)
- DELETE: Archive only

#### Bookings
- READ: View all bookings, filter by room/date
- CREATE: Create bookings
- UPDATE: Modify booking status
- DELETE: Cancel (soft delete)

#### Bar Orders
- READ: View all bar orders, current queue
- UPDATE: Monitor order status
- CREATE: None (barista only)
- DELETE: None

#### Invoices & Payments
- READ: View invoices, payment status
- UPDATE: None
- CREATE: None
- DELETE: None

#### Audit Logs
- READ: View audit logs for operations
- UPDATE: None
- CREATE: None
- DELETE: None

#### Dashboards
- Operations Manager Dashboard: Full access
- Owner Dashboard: View only (no edit)

**Restrictions:**
- Cannot manage users/roles/permissions
- Cannot access financial settings
- Cannot override pricing

---

### 3. Receptionist
Handles customer lifecycle: registration, session management, checkout, payment.

**Permissions by Module:**

#### Customers
- READ: Search/view customers
- CREATE: Register new customers
- UPDATE: Update customer info during visit
- DELETE: None

#### Sessions
- READ: View active sessions for customers
- CREATE: Open sessions
- UPDATE: View session details
- DELETE: Close sessions (safe to undo)

#### Rooms & Halls
- READ: View room availability
- CREATE: None
- UPDATE: None (view only)
- DELETE: None

#### Bookings
- READ: View bookings linked to sessions
- CREATE: Create room bookings during visit
- UPDATE: Modify bookings (if not started)
- DELETE: Cancel bookings

#### Bar Orders
- READ: View bar orders linked to active sessions
- CREATE: None
- UPDATE: None
- DELETE: None

#### Invoices & Payments
- READ: View draft/active invoices
- CREATE: Generate invoices from sessions
- UPDATE: None
- DELETE: None

#### Payments
- READ: View payment records
- CREATE: Record customer payments
- UPDATE: None
- DELETE: None

#### Dashboards
- Reception Screen: Full access (custom layout)
- Owner Dashboard: None
- Operations Manager Dashboard: None

**Restrictions:**
- Can only view/manage sessions they opened
- Cannot view other receptionist's sensitive actions
- Cannot modify closed invoices or payments
- Cannot change pricing
- Cannot access user management

---

### 4. Barista
Creates and manages bar orders. Minimal system access.

**Permissions by Module:**

#### Customers
- READ: View customer name/phone (for order linking)
- CREATE: None
- UPDATE: None
- DELETE: None

#### Sessions
- READ: View active sessions (for order linking)
- CREATE: None
- UPDATE: None
- DELETE: None

#### Bar Orders
- READ: View all bar orders (current and recent)
- CREATE: Create new orders
- UPDATE: Update order status (new → in_preparation → ready → delivered)
- DELETE: Cancel orders (if not in preparation)

#### Products
- READ: View product catalog, prices
- CREATE: None
- UPDATE: None
- DELETE: None

#### Invoices, Payments, Audit Logs, Dashboards
- All: NONE

**Restrictions:**
- Cannot close sessions
- Cannot generate invoices
- Cannot record payments
- Cannot view financial summaries
- Cannot access admin functions
- Cannot view customer personal details (only name/phone for context)

---

## Permission Matrix

| Module | Action | Owner | Ops Manager | Receptionist | Barista |
|--------|--------|-------|-------------|--------------|---------|
| **Customers** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✓ (limited) |
| | Create | ✓ | ✓ | ✓ | ✗ |
| | Update | ✓ | ✓ | ✓ | ✗ |
| | Delete | ✓ | ✗ | ✗ | ✗ |
| **Sessions** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✓ (limited) |
| | Create | ✓ | ✗ | ✓ | ✗ |
| | Update | ✓ | ✓ | ✓ | ✗ |
| | Close | ✓ | ✗ | ✓ | ✗ |
| | Cancel | ✓ | ✗ | ✓ | ✗ |
| **Rooms** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✗ |
| | Create | ✓ | ✓ | ✗ | ✗ |
| | Update Status | ✓ | ✓ | ✗ | ✗ |
| | Delete | ✓ | ✗ | ✗ | ✗ |
| **Bookings** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✗ |
| | Create | ✓ | ✓ | ✓ | ✗ |
| | Update | ✓ | ✓ | ✓ | ✗ |
| | Cancel | ✓ | ✓ | ✓ | ✗ |
| **Bar Orders** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✓ |
| | Create | ✓ | ✗ | ✗ | ✓ |
| | Update Status | ✓ | ✗ | ✗ | ✓ |
| | Cancel | ✓ | ✗ | ✗ | ✓ |
| **Products** | | | | | |
| | Read | ✓ | ✓ | ✗ | ✓ |
| | Create/Update | ✓ | ✗ | ✗ | ✗ |
| **Invoices** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✗ |
| | Generate | ✓ | ✗ | ✓ | ✗ |
| | Refund | ✓ | ✗ | ✗ | ✗ |
| **Payments** | | | | | |
| | Read | ✓ | ✓ | ✓ | ✗ |
| | Record | ✓ | ✗ | ✓ | ✗ |
| **Users** | | | | | |
| | Manage | ✓ | ✗ | ✗ | ✗ |
| **Roles & Permissions** | | | | | |
| | Manage | ✓ | ✗ | ✗ | ✗ |
| **Audit Logs** | | | | | |
| | View | ✓ | ✓ | ✗ | ✗ |
| **Dashboards** | | | | | |
| | Owner | ✓ | View Only | ✗ | ✗ |
| | Ops Manager | ✓ | ✓ | ✗ | ✗ |
| | Reception | ✓ | ✗ | ✓ | ✗ |
| | Barista | ✓ | ✗ | ✗ | ✓ |

---

## Implementation Strategy

### Backend Permission Checks
Each API endpoint will include:
```typescript
@UseGuards(AuthGuard, RoleGuard)
@CheckPermission('module', 'action')
@Controller('customers')
async create(...) { }
```

### Frontend Permission Checks
Each UI component will check permissions before rendering:
```typescript
const { permissions } = useAuth();
if (permissions.has('invoices:create')) {
  return <GenerateInvoiceButton />;
}
```

### Permission Enforcement Points
1. **API Route Guards** - Reject requests without permission
2. **Service Layer** - Business logic respects permissions
3. **UI Layer** - Hide/disable actions user cannot perform
4. **Audit Logs** - Log all permission checks and failures

### Edge Cases
- Operations Manager cannot see owner dashboard
- Receptionist can only see sessions they opened (unless ops manager or owner)
- Barista cannot see financial data or customer personal details
- Multiple baristas can work simultaneously (orders queued)
