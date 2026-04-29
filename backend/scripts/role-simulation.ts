type RoleKey = 'owner' | 'ops' | 'receptionist' | 'barista';

interface RoleConfig {
  key: RoleKey;
  label: string;
  email: string;
  password: string;
}

interface Check {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  expected: 'allow' | 'deny';
  body?: unknown;
}

interface RoleResult {
  role: string;
  passed: number;
  failed: number;
}

const API_BASE = (process.env.SIM_API_BASE_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const roles: RoleConfig[] = [
  {
    key: 'owner',
    label: 'Owner',
    email: process.env.SIM_OWNER_EMAIL || 'owner@eduvers.com',
    password: process.env.SIM_OWNER_PASSWORD || 'owner123',
  },
  {
    key: 'ops',
    label: 'Operations Manager',
    email: process.env.SIM_OPS_EMAIL || 'opsmanager@eduvers.com',
    password: process.env.SIM_OPS_PASSWORD || 'ops123',
  },
  {
    key: 'receptionist',
    label: 'Receptionist',
    email: process.env.SIM_RECEPTION_EMAIL || 'receptionist@eduvers.com',
    password: process.env.SIM_RECEPTION_PASSWORD || 'recept123',
  },
  {
    key: 'barista',
    label: 'Barista',
    email: process.env.SIM_BARISTA_EMAIL || 'barista@eduvers.com',
    password: process.env.SIM_BARISTA_PASSWORD || 'barista123',
  },
];

const checksByRole: Record<RoleKey, Check[]> = {
  owner: [
    { name: 'Owner dashboard', method: 'GET', path: '/dashboards/owner', expected: 'allow' },
    { name: 'Users roles list', method: 'GET', path: '/users/roles', expected: 'allow' },
    { name: 'Barista dashboard', method: 'GET', path: '/dashboards/barista', expected: 'allow' },
  ],
  ops: [
    { name: 'Ops dashboard', method: 'GET', path: '/dashboards/operations-manager', expected: 'allow' },
    { name: 'Audit logs list', method: 'GET', path: '/audit-logs', expected: 'allow' },
    { name: 'Owner dashboard access', method: 'GET', path: '/dashboards/owner', expected: 'allow' },
    { name: 'Owner-only create user', method: 'POST', path: '/users', expected: 'deny', body: {} },
  ],
  receptionist: [
    { name: 'Reception dashboard', method: 'GET', path: '/dashboards/reception', expected: 'allow' },
    { name: 'Customers list', method: 'GET', path: '/customers', expected: 'allow' },
    { name: 'Barista dashboard access', method: 'GET', path: '/dashboards/barista', expected: 'deny' },
    { name: 'Owner-only create user', method: 'POST', path: '/users', expected: 'deny', body: {} },
  ],
  barista: [
    { name: 'Barista dashboard', method: 'GET', path: '/dashboards/barista', expected: 'allow' },
    { name: 'Products list', method: 'GET', path: '/products', expected: 'allow' },
    { name: 'Owner-only create user', method: 'POST', path: '/users', expected: 'deny', body: {} },
  ],
};

async function apiRequest(path: string, method: string, token?: string, body?: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, payload };
}

async function login(role: RoleConfig): Promise<string> {
  const { status, payload } = await apiRequest('/auth/login', 'POST', undefined, {
    email: role.email,
    password: role.password,
  });

  if (status !== 201 && status !== 200) {
    throw new Error(`Login failed (${status}) for ${role.label}`);
  }

  const token = payload?.data?.accessToken;
  if (!token) {
    throw new Error(`No access token returned for ${role.label}`);
  }

  return token;
}

function isAllowedStatus(status: number) {
  return status !== 401 && status !== 403;
}

async function runRoleSimulation(role: RoleConfig): Promise<RoleResult> {
  const checks = checksByRole[role.key];
  const token = await login(role);

  console.log(`\nRole: ${role.label}`);
  console.log(`User: ${role.email}`);

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const { status, payload } = await apiRequest(check.path, check.method, token, check.body);
    const allowed = isAllowedStatus(status);
    const ok = check.expected === 'allow' ? allowed : !allowed;

    if (ok) {
      passed += 1;
      console.log(`  PASS  [${status}] ${check.name}`);
      continue;
    }

    failed += 1;
    const message = payload?.message
      ? Array.isArray(payload.message)
        ? payload.message.join('; ')
        : String(payload.message)
      : 'No error message';
    console.log(`  FAIL  [${status}] ${check.name} -> ${message}`);
  }

  return { role: role.label, passed, failed };
}

async function main() {
  console.log('Role-based backend simulation started');
  console.log(`API Base: ${API_BASE}`);

  const publicCheck = await apiRequest('/dashboards/owner', 'GET');
  if (publicCheck.status === 200) {
    console.log(`WARN: Protected route unexpectedly allowed anonymous user (status ${publicCheck.status})`);
  } else {
    console.log(`PASS: Anonymous access rejected with status ${publicCheck.status}`);
  }

  const results: RoleResult[] = [];
  for (const role of roles) {
    const result = await runRoleSimulation(role);
    results.push(result);
  }

  const totalPassed = results.reduce((sum, item) => sum + item.passed, 0);
  const totalFailed = results.reduce((sum, item) => sum + item.failed, 0);

  console.log('\nSimulation summary');
  for (const result of results) {
    console.log(`- ${result.role}: ${result.passed} passed, ${result.failed} failed`);
  }
  console.log(`- TOTAL: ${totalPassed} passed, ${totalFailed} failed`);

  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Simulation failed:', error?.message || error);
  process.exit(1);
});
