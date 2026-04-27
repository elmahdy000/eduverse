import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';

describe('Eduverse API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let ownerAccessToken: string;
  let restrictedAccessToken: string;

  const unique = Date.now().toString();
  let customerId: string;
  let roomId: string;
  let bookingId: string;
  let sessionId: string;
  let productId: string;
  let barOrderId: string;
  let invoiceId: string;
  let paymentId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const ownerLogin = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'owner@eduvers.com',
      password: 'owner123',
    });
    ownerAccessToken = ownerLogin.body.data.accessToken;

    const restrictedRole = await prisma.role.create({
      data: {
        name: `E2E Restricted ${unique}`,
        description: 'No permissions role used for e2e permission checks',
      },
      select: { id: true },
    });

    const restrictedEmail = `restricted.e2e.${unique}@eduvers.test`;
    await prisma.user.create({
      data: {
        email: restrictedEmail,
        passwordHash: await bcrypt.hash('restricted123', 10),
        firstName: 'Restricted',
        lastName: 'E2E',
        roleId: restrictedRole.id,
        status: 'active',
      },
    });

    const restrictedLogin = await request(app.getHttpServer()).post('/auth/login').send({
      email: restrictedEmail,
      password: 'restricted123',
    });
    restrictedAccessToken = restrictedLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('serves root and health endpoints', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');

    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ok');
      });
  });

  it('authenticates owner and returns profile', async () => {
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.email).toBe('owner@eduvers.com');
      });
  });

  it('enforces room booking conflict detection', async () => {
    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        fullName: `عميل اختبار ${unique}`,
        phoneNumber: `010${unique.slice(-7)}`,
        customerType: 'student',
      })
      .expect(201);
    customerId = customerRes.body.data.id;

    const roomRes = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        name: `قاعة اختبار ${unique}`,
        roomType: 'meeting',
        capacity: 8,
        features: ['wifi'],
        hourlyRate: 100,
      })
      .expect(201);
    roomId = roomRes.body.data.id;

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const overlapStart = new Date(start.getTime() + 30 * 60 * 1000);
    const overlapEnd = new Date(end.getTime() + 30 * 60 * 1000);

    const bookingRes = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        customerId,
        roomId,
        bookingType: 'meeting',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        participantCount: 4,
        totalAmount: 200,
      })
      .expect(201);
    bookingId = bookingRes.body.data.id;

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        customerId,
        roomId,
        bookingType: 'meeting',
        startTime: overlapStart.toISOString(),
        endTime: overlapEnd.toISOString(),
        participantCount: 4,
        totalAmount: 180,
      })
      .expect(400)
      .expect(({ body }) => {
        expect(String(body.message)).toContain('Room is not available');
      });
  });

  it('handles invoice, payment, and refund lifecycle correctly', async () => {
    const sessionRes = await request(app.getHttpServer())
      .post('/sessions')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        customerId,
        sessionType: 'hourly',
        chargeAmount: 150,
        notes: 'جلسة اختبار فواتير',
      })
      .expect(201);
    sessionId = sessionRes.body.data.id;

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        name: `قهوة اختبار ${unique}`,
        category: 'coffee',
        price: 50,
      })
      .expect(201);
    productId = productRes.body.data.id;

    const orderRes = await request(app.getHttpServer())
      .post('/bar-orders')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        sessionId,
        items: [{ productId, quantity: 2 }],
      })
      .expect(201);
    barOrderId = orderRes.body.data.id;

    await request(app.getHttpServer())
      .put(`/bar-orders/${barOrderId}/status`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ status: 'delivered' })
      .expect(200);

    const invoiceRes = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ sessionId })
      .expect(201);
    invoiceId = invoiceRes.body.data.id;

    expect(Number(invoiceRes.body.data.subtotal)).toBe(250);
    expect(Number(invoiceRes.body.data.totalAmount)).toBe(250);
    expect(Number(invoiceRes.body.data.remainingAmount)).toBe(250);

    const paymentRes = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        invoiceId,
        paymentMethod: 'cash',
        amount: 100,
      })
      .expect(201);
    paymentId = paymentRes.body.data.id;

    const invoiceAfterPayment = await request(app.getHttpServer())
      .get(`/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);
    expect(Number(invoiceAfterPayment.body.data.amountPaid)).toBe(100);
    expect(Number(invoiceAfterPayment.body.data.remainingAmount)).toBe(150);
    expect(invoiceAfterPayment.body.data.paymentStatus).toBe('partially_paid');

    await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        amount: 40,
        reason: 'اختبار استرجاع',
      })
      .expect(201);

    const invoiceAfterRefund = await request(app.getHttpServer())
      .get(`/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);
    expect(Number(invoiceAfterRefund.body.data.amountPaid)).toBe(60);
    expect(Number(invoiceAfterRefund.body.data.remainingAmount)).toBe(190);
    expect(invoiceAfterRefund.body.data.paymentStatus).toBe('partially_paid');

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        invoiceId,
        paymentMethod: 'cash',
        amount: 1000,
      })
      .expect(400)
      .expect(({ body }) => {
        expect(String(body.message)).toContain('exceeds remaining invoice amount');
      });
  });

  it('blocks unauthorized module access by role permissions', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${restrictedAccessToken}`)
      .send({
        fullName: `عميل غير مصرح ${unique}`,
        phoneNumber: `011${unique.slice(-7)}`,
        customerType: 'visitor',
      })
      .expect(403)
      .expect(({ body }) => {
        expect(String(body.message)).toContain('Insufficient permissions');
      });
  });

  it('creates audit log entries for mutating requests', async () => {
    let responseBody: any;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?page=1&limit=20')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .expect(200);

      responseBody = response.body;
      if ((responseBody?.data?.total || 0) > 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    expect(responseBody.success).toBe(true);
    expect(Array.isArray(responseBody.data.data)).toBe(true);
    expect(responseBody.data.total).toBeGreaterThan(0);
  });
});
