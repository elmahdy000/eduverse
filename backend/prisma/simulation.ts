import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🎬 Starting full simulation for all roles...');

  // Get existing roles
  const roles = await prisma.role.findMany();
  const ownerRole = roles.find(r => r.name === 'Owner');
  const opsManagerRole = roles.find(r => r.name === 'Operations Manager');
  const receptionistRole = roles.find(r => r.name === 'Receptionist');
  const baristaRole = roles.find(r => r.name === 'Barista');

  if (!ownerRole || !opsManagerRole || !receptionistRole || !baristaRole) {
    throw new Error('Roles not found. Please run seed first.');
  }

  // Create additional users for each role
  const opsManagerUser = await prisma.user.upsert({
    where: { email: 'ops2@eduvers.com' },
    update: {},
    create: {
      email: 'ops2@eduvers.com',
      passwordHash: await bcrypt.hash('ops123', 10),
      firstName: 'أحمد',
      lastName: 'محمد',
      phoneNumber: '01000000001',
      roleId: opsManagerRole.id,
      status: 'active',
    },
  });

  const receptionistUser1 = await prisma.user.upsert({
    where: { email: 'reception1@eduvers.com' },
    update: {},
    create: {
      email: 'reception1@eduvers.com',
      passwordHash: await bcrypt.hash('recept123', 10),
      firstName: 'سارة',
      lastName: 'أحمد',
      phoneNumber: '01000000002',
      roleId: receptionistRole.id,
      status: 'active',
    },
  });

  const receptionistUser2 = await prisma.user.upsert({
    where: { email: 'reception2@eduvers.com' },
    update: {},
    create: {
      email: 'reception2@eduvers.com',
      passwordHash: await bcrypt.hash('recept123', 10),
      firstName: 'محمد',
      lastName: 'علي',
      phoneNumber: '01000000003',
      roleId: receptionistRole.id,
      status: 'active',
    },
  });

  const baristaUser1 = await prisma.user.upsert({
    where: { email: 'barista1@eduvers.com' },
    update: {},
    create: {
      email: 'barista1@eduvers.com',
      passwordHash: await bcrypt.hash('barista123', 10),
      firstName: 'كريم',
      lastName: 'حسن',
      phoneNumber: '01000000004',
      roleId: baristaRole.id,
      status: 'active',
    },
  });

  const baristaUser2 = await prisma.user.upsert({
    where: { email: 'barista2@eduvers.com' },
    update: {},
    create: {
      email: 'barista2@eduvers.com',
      passwordHash: await bcrypt.hash('barista123', 10),
      firstName: 'نور',
      lastName: 'خالد',
      phoneNumber: '01000000005',
      roleId: baristaRole.id,
      status: 'active',
    },
  });

  console.log('✅ Created simulation users');

  // Get existing rooms
  const rooms = await prisma.room.findMany({ where: { status: 'available' } });
  if (rooms.length === 0) {
    throw new Error('No rooms available. Please create rooms first.');
  }

  // Get existing products
  const products = await prisma.product.findMany({ where: { active: true } });
  if (products.length === 0) {
    throw new Error('No products available. Please create products first.');
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Create customers
  const customers: any[] = [];
  for (let i = 0; i < 20; i++) {
    const customer = await prisma.customer.create({
      data: {
        fullName: `عميل تجريبي ${i + 1}`,
        phoneNumber: `0123456789${i.toString().padStart(2, '0')}`,
        customerType: ['student', 'visitor', 'employee'][i % 3],
        status: 'active',
        createdByUserId: receptionistUser1.id,
      },
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers`);

  // Create sessions (by Receptionist)
  const sessions: any[] = [];
  for (let i = 0; i < 10; i++) {
    const startTime = new Date(today);
    startTime.setHours(9 + i, 0, 0, 0);
    
    const session = await prisma.session.create({
      data: {
        customerId: customers[i].id,
        sessionType: 'hourly',
        roomId: rooms[i % rooms.length].id,
        startTime,
        status: i < 5 ? 'active' : 'closed',
        chargeAmount: 50,
        openedByUserId: receptionistUser1.id,
        closedByUserId: i < 5 ? null : receptionistUser1.id,
        endTime: i < 5 ? null : new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
        durationMinutes: i < 5 ? null : 120,
      },
    });
    sessions.push(session);
  }
  console.log(`✅ Created ${sessions.length} sessions`);

  // Create bookings (by Receptionist)
  const bookings: any[] = [];
  for (let i = 0; i < 5; i++) {
    const startTime = new Date(today);
    startTime.setHours(14 + i, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    const booking = await prisma.booking.create({
      data: {
        customerId: customers[10 + i].id,
        roomId: rooms[i % rooms.length].id,
        bookingType: 'meeting',
        startTime,
        endTime,
        participantCount: 5,
        totalAmount: 200,
        status: 'confirmed',
        createdByUserId: receptionistUser2.id,
      },
    });
    bookings.push(booking);
  }
  console.log(`✅ Created ${bookings.length} bookings`);

  // Create bar orders (by Barista)
  const barOrders: any[] = [];
  for (let i = 0; i < 15; i++) {
    const orderTime = new Date(today);
    orderTime.setHours(10 + i, 0, 0, 0);

    const barOrder = await prisma.barOrder.create({
      data: {
        customerId: customers[i].id,
        sessionId: sessions[i % sessions.length].id,
        createdByUserId: i % 2 === 0 ? baristaUser1.id : baristaUser2.id,
        status: ['new', 'in_preparation', 'ready', 'delivered'][i % 4],
        totalAmount: 30 + i * 5,
        notes: `طلب تجريبي ${i + 1}`,
        createdAt: orderTime,
      },
    });
    barOrders.push(barOrder);

    // Add items to bar order
    const numItems = 1 + (i % 3);
    for (let j = 0; j < numItems; j++) {
      const product = products[j % products.length];
      await prisma.barOrderItem.create({
        data: {
          orderId: barOrder.id,
          productId: product.id,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      });
    }
  }
  console.log(`✅ Created ${barOrders.length} bar orders`);

  // Create invoices (by Operations Manager)
  const invoices: any[] = [];
  for (let i = 0; i < 8; i++) {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}-${(i + 1).toString().padStart(2, '0')}`;
    const session = sessions[i];
    
    const invoice = await prisma.invoice.create({
      data: {
        customerId: session.customerId,
        sessionId: session.id,
        invoiceNumber,
        subtotal: 50,
        discountAmount: 0,
        taxAmount: 5,
        totalAmount: 55,
        amountPaid: i % 2 === 0 ? 55 : 0,
        remainingAmount: i % 2 === 0 ? 0 : 55,
        paymentStatus: i % 2 === 0 ? 'paid' : 'unpaid',
        issuedAt: new Date(today),
        createdByUserId: opsManagerUser.id,
      },
    });
    invoices.push(invoice);

    // Add invoice items
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        itemType: 'session',
        description: 'رسوم المدة',
        quantity: 1,
        unitPrice: 50,
        total: 50,
      },
    });
  }
  console.log(`✅ Created ${invoices.length} invoices`);

  // Create payments (by Receptionist)
  const payments: any[] = [];
  for (let i = 0; i < 6; i++) {
    const invoice = invoices[i];
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        paymentMethod: ['cash', 'card', 'bank_transfer'][i % 3],
        amount: invoice.totalAmount,
        recordedByUserId: receptionistUser1.id,
        paidAt: new Date(today),
      },
    });
    payments.push(payment);
  }
  console.log(`✅ Created ${payments.length} payments`);

  // Create audit logs for each role
  const auditLogs: any[] = [];

  // Operations Manager logs
  auditLogs.push(
    await prisma.auditLog.create({
      data: {
        userId: opsManagerUser.id,
        action: 'create',
        entityType: 'invoice',
        entityId: invoices[0].id,
        oldValue: Prisma.JsonNull,
        newValue: { invoiceNumber: invoices[0].invoiceNumber },
        timestamp: new Date(today),
      },
    }),
    await prisma.auditLog.create({
      data: {
        userId: opsManagerUser.id,
        action: 'read',
        entityType: 'sessions',
        entityId: sessions[0].id,
        oldValue: Prisma.JsonNull,
        newValue: Prisma.JsonNull,
        timestamp: new Date(today),
      },
    }),
  );

  // Receptionist logs
  auditLogs.push(
    await prisma.auditLog.create({
      data: {
        userId: receptionistUser1.id,
        action: 'create',
        entityType: 'customer',
        entityId: customers[0].id,
        oldValue: Prisma.JsonNull,
        newValue: { fullName: customers[0].fullName },
        timestamp: new Date(today),
      },
    }),
    await prisma.auditLog.create({
      data: {
        userId: receptionistUser1.id,
        action: 'create',
        entityType: 'session',
        entityId: sessions[0].id,
        oldValue: Prisma.JsonNull,
        newValue: { sessionType: 'hourly' },
        timestamp: new Date(today),
      },
    }),
    await prisma.auditLog.create({
      data: {
        userId: receptionistUser2.id,
        action: 'create',
        entityType: 'booking',
        entityId: bookings[0].id,
        oldValue: Prisma.JsonNull,
        newValue: { bookingType: 'meeting' },
        timestamp: new Date(today),
      },
    }),
    await prisma.auditLog.create({
      data: {
        userId: receptionistUser1.id,
        action: 'record',
        entityType: 'payment',
        entityId: payments[0].id,
        oldValue: Prisma.JsonNull,
        newValue: { amount: payments[0].amount },
        timestamp: new Date(today),
      },
    }),
  );

  // Barista logs
  auditLogs.push(
    await prisma.auditLog.create({
      data: {
        userId: baristaUser1.id,
        action: 'create',
        entityType: 'bar_order',
        entityId: barOrders[0].id,
        oldValue: Prisma.JsonNull,
        newValue: { status: 'new' },
        timestamp: new Date(today),
      },
    }),
    await prisma.auditLog.create({
      data: {
        userId: baristaUser1.id,
        action: 'update',
        entityType: 'bar_order',
        entityId: barOrders[1].id,
        oldValue: { status: 'new' },
        newValue: { status: 'in_preparation' },
        timestamp: new Date(today),
      },
    }),
    await prisma.auditLog.create({
      data: {
        userId: baristaUser2.id,
        action: 'update',
        entityType: 'bar_order',
        entityId: barOrders[2].id,
        oldValue: { status: 'in_preparation' },
        newValue: { status: 'ready' },
        timestamp: new Date(today),
      },
    }),
  );

  console.log(`✅ Created ${auditLogs.length} audit logs`);

  console.log('\n🎉 Simulation completed successfully!');
  console.log('\n📋 Simulation Summary:');
  console.log(`   - Users: 6 (1 Owner, 2 Ops Manager, 2 Receptionist, 2 Barista)`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Sessions: ${sessions.length}`);
  console.log(`   - Bookings: ${bookings.length}`);
  console.log(`   - Bar Orders: ${barOrders.length}`);
  console.log(`   - Invoices: ${invoices.length}`);
  console.log(`   - Payments: ${payments.length}`);
  console.log(`   - Audit Logs: ${auditLogs.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Simulation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
