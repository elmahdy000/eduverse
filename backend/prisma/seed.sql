-- Roles
INSERT INTO roles (id, name, description)
VALUES
  (gen_random_uuid(), 'Owner', 'Full system access'),
  (gen_random_uuid(), 'Operations Manager', 'Daily operations management'),
  (gen_random_uuid(), 'Receptionist', 'Customer lifecycle management'),
  (gen_random_uuid(), 'Barista', 'Bar order operations')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Permissions
INSERT INTO permissions (id, module, action, description)
VALUES
  (gen_random_uuid(), 'customers', 'read', 'View customers'),
  (gen_random_uuid(), 'customers', 'create', 'Create customer'),
  (gen_random_uuid(), 'customers', 'update', 'Update customer'),
  (gen_random_uuid(), 'customers', 'delete', 'Delete customer'),
  (gen_random_uuid(), 'sessions', 'read', 'View sessions'),
  (gen_random_uuid(), 'sessions', 'create', 'Open session'),
  (gen_random_uuid(), 'sessions', 'update', 'Update session'),
  (gen_random_uuid(), 'sessions', 'close', 'Close session'),
  (gen_random_uuid(), 'sessions', 'cancel', 'Cancel session'),
  (gen_random_uuid(), 'rooms', 'read', 'View rooms'),
  (gen_random_uuid(), 'rooms', 'create', 'Create room'),
  (gen_random_uuid(), 'rooms', 'update', 'Update room'),
  (gen_random_uuid(), 'rooms', 'delete', 'Delete room'),
  (gen_random_uuid(), 'bookings', 'read', 'View bookings'),
  (gen_random_uuid(), 'bookings', 'create', 'Create booking'),
  (gen_random_uuid(), 'bookings', 'update', 'Update booking'),
  (gen_random_uuid(), 'bookings', 'cancel', 'Cancel booking'),
  (gen_random_uuid(), 'bar_orders', 'read', 'View bar orders'),
  (gen_random_uuid(), 'bar_orders', 'create', 'Create order'),
  (gen_random_uuid(), 'bar_orders', 'update', 'Update order status'),
  (gen_random_uuid(), 'bar_orders', 'cancel', 'Cancel order'),
  (gen_random_uuid(), 'products', 'read', 'View products'),
  (gen_random_uuid(), 'products', 'create', 'Create product'),
  (gen_random_uuid(), 'products', 'update', 'Update product'),
  (gen_random_uuid(), 'invoices', 'read', 'View invoices'),
  (gen_random_uuid(), 'invoices', 'generate', 'Generate invoice'),
  (gen_random_uuid(), 'invoices', 'refund', 'Refund invoice'),
  (gen_random_uuid(), 'payments', 'read', 'View payments'),
  (gen_random_uuid(), 'payments', 'record', 'Record payment'),
  (gen_random_uuid(), 'audit_logs', 'read', 'View audit logs'),
  (gen_random_uuid(), 'dashboards', 'view_owner', 'View owner dashboard'),
  (gen_random_uuid(), 'dashboards', 'view_ops_manager', 'View ops manager dashboard'),
  (gen_random_uuid(), 'dashboards', 'view_reception', 'View reception dashboard'),
  (gen_random_uuid(), 'dashboards', 'view_barista', 'View barista dashboard'),
  (gen_random_uuid(), 'users', 'manage', 'Manage users'),
  (gen_random_uuid(), 'roles', 'manage', 'Manage roles')
ON CONFLICT (module, action) DO UPDATE SET description = EXCLUDED.description;

-- Owner: all permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Owner'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Operations Manager permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.module IN ('customers','sessions','rooms','bookings','bar_orders','audit_logs','dashboards')
WHERE r.name = 'Operations Manager'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Receptionist permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (
  p.module IN ('customers','sessions','bookings','bar_orders','invoices','payments')
  OR (p.module = 'dashboards' AND p.action = 'view_reception')
)
WHERE r.name = 'Receptionist'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Barista permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (
  (p.module = 'bar_orders' AND p.action <> 'cancel')
  OR (p.module = 'products' AND p.action = 'read')
  OR (p.module = 'dashboards' AND p.action = 'view_barista')
)
WHERE r.name = 'Barista'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Default owner user
INSERT INTO users (
  id,
  email,
  "passwordHash",
  "firstName",
  "lastName",
  "roleId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'owner@eduvers.com',
  '$2b$10$.VdIjhSpZz1Leiz6dqs7cesBPV8OexTjVSWuQrwnEYsJGmXDC58Qa',
  'Owner',
  'Admin',
  r.id,
  'active',
  NOW(),
  NOW()
FROM roles r
WHERE r.name = 'Owner'
ON CONFLICT (email) DO NOTHING;
