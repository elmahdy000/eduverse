# Database Schema Plan - Eduverse Phase 1

## Core Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  role_id UUID NOT NULL REFERENCES roles(id),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed roles:
-- Owner
-- Operations Manager
-- Receptionist
-- Barista
```

### permissions
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(module, action)
);

-- Examples:
-- (customers, read)
-- (customers, create)
-- (customers, update)
-- (sessions, read), (sessions, create), (sessions, close)
-- (invoices, generate), (payments, record)
-- (dashboards, view_owner), (dashboards, view_ops)
```

### role_permissions (Junction Table)
```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  phone_number_secondary VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  customer_type ENUM('student', 'employee', 'trainer', 'parent', 'visitor') NOT NULL,
  -- Conditional fields (student)
  college VARCHAR(255),
  study_level VARCHAR(100),
  specialization VARCHAR(255),
  -- Conditional fields (employee)
  employer_name VARCHAR(255),
  job_title VARCHAR(255),
  -- General fields
  notes TEXT,
  status ENUM('active', 'inactive', 'blacklisted') DEFAULT 'active',
  first_visit_at TIMESTAMP,
  last_visit_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_name ON customers(full_name);
CREATE INDEX idx_customers_type ON customers(customer_type);
```

### rooms
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  room_type ENUM('coworking', 'study', 'meeting', 'hall') NOT NULL,
  capacity INT NOT NULL,
  features TEXT[], -- e.g., ['projector', 'whiteboard', 'wifi', 'ac']
  hourly_rate DECIMAL(10, 2),
  daily_rate DECIMAL(10, 2),
  status ENUM('available', 'occupied', 'booked_soon', 'under_prep', 'out_of_service') DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_status ON rooms(status);
```

### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  session_type ENUM('hourly', 'daily', 'package', 'booking_linked') NOT NULL,
  room_id UUID REFERENCES rooms(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INT,
  status ENUM('active', 'suspended', 'closed', 'cancelled') DEFAULT 'active',
  charge_amount DECIMAL(10, 2),
  notes TEXT,
  opened_by_user_id UUID NOT NULL REFERENCES users(id),
  closed_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_customer_id ON sessions(customer_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_active ON sessions(customer_id, status);
```

### bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  booking_type ENUM('meeting', 'training', 'event', 'private') NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  participant_count INT,
  total_amount DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2),
  notes TEXT,
  status ENUM('draft', 'confirmed', 'completed', 'cancelled') DEFAULT 'confirmed',
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE UNIQUE INDEX idx_bookings_no_conflict ON rooms(id) 
  WHERE status != 'cancelled' 
  AND (start_time, end_time) OVERLAPS 
  (NEW.start_time, NEW.end_time);
```

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  availability BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
```

### bar_orders
```sql
CREATE TABLE bar_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  customer_id UUID REFERENCES customers(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  status ENUM('new', 'in_preparation', 'ready', 'delivered', 'cancelled') DEFAULT 'new',
  total_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bar_orders_session_id ON bar_orders(session_id);
CREATE INDEX idx_bar_orders_customer_id ON bar_orders(customer_id);
CREATE INDEX idx_bar_orders_status ON bar_orders(status);
CREATE INDEX idx_bar_orders_created_at ON bar_orders(created_at);
```

### bar_order_items (Line Items)
```sql
CREATE TABLE bar_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES bar_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);
```

### invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  session_id UUID REFERENCES sessions(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('unpaid', 'partially_paid', 'paid', 'refunded') DEFAULT 'unpaid',
  notes TEXT,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  due_at TIMESTAMP,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);
```

### invoice_items (Line Items)
```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type ENUM('session', 'booking', 'bar_order', 'service', 'discount') NOT NULL,
  item_id UUID,
  description VARCHAR(255),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL
);
```

### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  payment_method ENUM('cash', 'bank_transfer', 'card', 'mixed') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  recorded_by_user_id UUID NOT NULL REFERENCES users(id),
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

## Constraints & Business Rules

1. **Booking Conflict Prevention**: Check before creating/updating booking that room is free during time slot
2. **Session Uniqueness**: Customer can have only one active session at a time
3. **Invoice Atomicity**: Invoice generation must be atomic (all or nothing)
4. **Payment Amount Validation**: Payment amount cannot exceed invoice remaining amount
5. **Audit Trail Completeness**: Every customer, session, booking, order, invoice, payment must be logged
6. **Customer Type Validation**: If type = student, college/study_level/specialization are required
7. **Room Capacity**: Booking participant_count cannot exceed room capacity
8. **Barista Orders**: Orders created by barista role automatically visible to ops manager and owner

## Indexes for Performance
- Customers: phone, name, type (for search)
- Sessions: customer_id, status, start_time (for active sessions query)
- Bookings: room_id, start_time, status (for room availability)
- Bar Orders: session_id, status, created_at (for workflow)
- Invoices: customer_id, payment_status, issued_at (for reporting)
- Audit Logs: entity_type, timestamp (for audit queries)
