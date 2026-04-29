type UserKey = 'owner' | 'receptionist' | 'barista';

interface UserConfig {
  key: UserKey;
  email: string;
  password: string;
}

interface LoginResult {
  token: string;
  userId: string;
}

const API_BASE = (process.env.SIM_API_BASE_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const users: UserConfig[] = [
  {
    key: 'owner',
    email: process.env.SIM_OWNER_EMAIL || 'owner@eduvers.com',
    password: process.env.SIM_OWNER_PASSWORD || 'owner123',
  },
  {
    key: 'receptionist',
    email: process.env.SIM_RECEPTION_EMAIL || 'receptionist@eduvers.com',
    password: process.env.SIM_RECEPTION_PASSWORD || 'recept123',
  },
  {
    key: 'barista',
    email: process.env.SIM_BARISTA_EMAIL || 'barista@eduvers.com',
    password: process.env.SIM_BARISTA_PASSWORD || 'barista123',
  },
];

async function apiRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  token?: string,
  body?: unknown,
) {
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

function assertSuccess(status: number, payload: any, step: string) {
  if (status >= 200 && status < 300 && payload?.success !== false) {
    return;
  }
  const message = payload?.message
    ? Array.isArray(payload.message)
      ? payload.message.join('; ')
      : String(payload.message)
    : `HTTP ${status}`;
  throw new Error(`${step} failed: ${message}`);
}

async function login(user: UserConfig): Promise<LoginResult> {
  const { status, payload } = await apiRequest('/auth/login', 'POST', undefined, {
    email: user.email,
    password: user.password,
  });
  assertSuccess(status, payload, `Login (${user.key})`);

  const token = payload?.data?.accessToken as string | undefined;
  const userId = payload?.data?.user?.id as string | undefined;
  if (!token || !userId) {
    throw new Error(`Login (${user.key}) failed: missing token/user`);
  }

  return { token, userId };
}

function firstListItem(data: any): any | null {
  if (Array.isArray(data)) return data[0] ?? null;
  if (Array.isArray(data?.data)) return data.data[0] ?? null;
  if (Array.isArray(data?.items)) return data.items[0] ?? null;
  return null;
}

async function main() {
  console.log('Customer journey simulation started');
  console.log(`API Base: ${API_BASE}`);

  const ownerAuth = await login(users.find((u) => u.key === 'owner')!);
  const receptionAuth = await login(users.find((u) => u.key === 'receptionist')!);
  const baristaAuth = await login(users.find((u) => u.key === 'barista')!);

  const suffix = Date.now().toString().slice(-8);
  const phone = `0155${suffix}`;
  const customerName = `عميل محاكاة ${suffix}`;

  console.log('\n1) تسجيل عميل جديد');
  const createCustomerRes = await apiRequest('/customers', 'POST', receptionAuth.token, {
    fullName: customerName,
    phoneNumber: phone,
    customerType: 'visitor',
    notes: 'محاكاة رحلة عميل كاملة',
  });
  assertSuccess(createCustomerRes.status, createCustomerRes.payload, 'Create customer');
  const customer = createCustomerRes.payload.data;
  const customerId = customer.id as string;
  console.log(`   Customer ID: ${customerId}`);

  console.log('\n2) اختيار غرفة متاحة وعمل حجز لمدة ساعتين');
  const startTime = new Date(Date.now() + 30 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  const availabilityPath = `/rooms/availability?startTime=${encodeURIComponent(startTime.toISOString())}&endTime=${encodeURIComponent(endTime.toISOString())}`;
  const availabilityRes = await apiRequest(availabilityPath, 'GET', ownerAuth.token);
  assertSuccess(availabilityRes.status, availabilityRes.payload, 'Get room availability');
  let room = firstListItem(availabilityRes.payload?.data);
  if (!room?.id) {
    const tempRoomName = `قاعة محاكاة ${suffix}`;
    const createRoomRes = await apiRequest('/rooms', 'POST', ownerAuth.token, {
      name: tempRoomName,
      roomType: 'meeting',
      capacity: 4,
      hourlyRate: 120,
      notes: 'تم إنشاؤها تلقائيًا بواسطة customer journey simulation',
    });
    assertSuccess(createRoomRes.status, createRoomRes.payload, 'Create fallback room');
    room = createRoomRes.payload.data;
    console.log(`   No room available, created fallback room: ${room.id}`);
  }

  const bookingRes = await apiRequest('/bookings', 'POST', receptionAuth.token, {
    customerId,
    roomId: room.id,
    bookingType: 'meeting',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    participantCount: 2,
    totalAmount: 240,
    depositAmount: 50,
    notes: 'حجز محاكاة لمدة ساعتين',
  });
  assertSuccess(bookingRes.status, bookingRes.payload, 'Create booking');
  const bookingId = bookingRes.payload.data.id as string;
  console.log(`   Booking ID: ${bookingId}`);

  console.log('\n3) فتح جلسة للعميل');
  const openSessionRes = await apiRequest('/sessions', 'POST', receptionAuth.token, {
    customerId,
    sessionType: 'hourly',
    roomId: room.id,
    chargeAmount: 120,
    notes: 'فتح جلسة من محاكاة العميل',
  });
  assertSuccess(openSessionRes.status, openSessionRes.payload, 'Open session');
  const sessionId = openSessionRes.payload.data.id as string;
  console.log(`   Session ID: ${sessionId}`);

  console.log('\n4) طلب مشروب من البار');
  const productsRes = await apiRequest('/products?page=1&limit=20&active=true', 'GET', baristaAuth.token);
  assertSuccess(productsRes.status, productsRes.payload, 'List products');
  const product = firstListItem(productsRes.payload?.data);
  if (!product?.id) {
    throw new Error('No active product found for bar order');
  }

  const orderRes = await apiRequest('/bar-orders', 'POST', baristaAuth.token, {
    customerId,
    sessionId,
    items: [
      {
        productId: product.id,
        quantity: 1,
      },
    ],
    notes: 'طلب مشروب من محاكاة رحلة العميل',
  });
  assertSuccess(orderRes.status, orderRes.payload, 'Create bar order');
  const orderId = orderRes.payload.data.id as string;
  console.log(`   Bar Order ID: ${orderId}`);

  console.log('\n5) إغلاق الجلسة (العميل خلص وقام)');
  const closeSessionRes = await apiRequest(`/sessions/${sessionId}/close`, 'POST', receptionAuth.token, {
    notes: 'تم إنهاء الجلسة ضمن سيناريو المحاكاة',
  });
  assertSuccess(closeSessionRes.status, closeSessionRes.payload, 'Close session');

  console.log('\n6) إصدار فاتورة للجلسة');
  const invoiceRes = await apiRequest('/invoices', 'POST', receptionAuth.token, {
    sessionId,
    notes: 'فاتورة محاكاة رحلة العميل',
  });
  assertSuccess(invoiceRes.status, invoiceRes.payload, 'Generate invoice');
  const invoice = invoiceRes.payload.data;
  const invoiceId = invoice.id as string;
  const totalAmount = Number(invoice.totalAmount ?? 0);
  if (!invoiceId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('Invalid invoice data returned');
  }
  console.log(`   Invoice ID: ${invoiceId} | Total: ${totalAmount}`);

  console.log('\n7) تسجيل الدفع وخروج العميل');
  const paymentRes = await apiRequest('/payments', 'POST', receptionAuth.token, {
    invoiceId,
    paymentMethod: 'cash',
    amount: totalAmount,
    notes: 'دفع كامل عند الخروج',
  });
  assertSuccess(paymentRes.status, paymentRes.payload, 'Record payment');
  const paymentId = paymentRes.payload.data.id as string;
  console.log(`   Payment ID: ${paymentId}`);

  console.log('\nSimulation completed successfully');
  console.log(`- Customer: ${customerId}`);
  console.log(`- Booking: ${bookingId}`);
  console.log(`- Session: ${sessionId}`);
  console.log(`- Bar Order: ${orderId}`);
  console.log(`- Invoice: ${invoiceId}`);
  console.log(`- Payment: ${paymentId}`);
}

main().catch((error) => {
  console.error('Simulation failed:', error?.message || error);
  process.exit(1);
});
