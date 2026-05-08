import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Bar-Centric Production Seed with Inventory...');

  // 1. Clean existing data
  console.log('🧹 Cleaning old data...');
  await prisma.inventoryTransaction.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.barOrderItem.deleteMany();
  await prisma.barOrder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.session.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.room.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  // 2. Create Essential Roles
  console.log('👥 Creating roles...');
  const roleNames = ['Owner', 'Operations Manager', 'Barista', 'Receptionist'];
  const roles: Record<string, any> = {};

  for (const name of roleNames) {
    roles[name] = await prisma.role.create({
      data: { name, description: `${name} role for bar operations` },
    });
  }

  // 3. Create Essential Permissions
  console.log('🔐 Creating permissions...');
  const permissionModules = [
    { m: 'products', actions: ['read', 'create', 'update', 'delete'] },
    { m: 'bar_orders', actions: ['read', 'create', 'update', 'delete'] },
    { m: 'customers', actions: ['read', 'create', 'update', 'delete'] },
    { m: 'sessions', actions: ['read', 'create', 'update', 'delete'] },
    { m: 'dashboards', actions: ['view_owner', 'view_barista', 'view_reception'] },
    { m: 'audit_logs', actions: ['read'] },
    { m: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
    { m: 'expenses', actions: ['read', 'create', 'update', 'delete'] },
  ];

  const allCreatedPermissions: any[] = [];
  for (const mod of permissionModules) {
    for (const action of mod.actions) {
      const p = await prisma.permission.create({
        data: {
          module: mod.m,
          action: action,
          description: `${action} permission for ${mod.m}`,
        },
      });
      allCreatedPermissions.push(p);
    }
  }

  // 4. Assign Permissions
  console.log('🔗 Assigning permissions...');
  for (const perm of allCreatedPermissions) {
    await prisma.rolePermission.create({ data: { roleId: roles['Owner'].id, permissionId: perm.id } });
    await prisma.rolePermission.create({ data: { roleId: roles['Operations Manager'].id, permissionId: perm.id } });

    const isOperational = ['read', 'create', 'update'].includes(perm.action) ||
      perm.module === 'dashboards' ||
      perm.module === 'sessions' ||
      perm.module === 'customers' ||
      perm.module === 'bar_orders';

    if (isOperational) {
      await prisma.rolePermission.create({ data: { roleId: roles['Barista'].id, permissionId: perm.id } });
      await prisma.rolePermission.create({ data: { roleId: roles['Receptionist'].id, permissionId: perm.id } });
    }
  }

  // 5. Create Default Users
  console.log('👤 Creating default users...');
  const passwordHash = await bcrypt.hash('123456', 10);
  const owner = await prisma.user.create({
    data: {
      email: 'owner@eduvers.com',
      passwordHash,
      firstName: 'Owner',
      lastName: 'User',
      roleId: roles['Owner'].id,
      status: 'active',
    },
  });

  await prisma.user.create({
    data: {
      email: 'barista@eduvers.com',
      passwordHash,
      firstName: 'Barista',
      lastName: 'One',
      roleId: roles['Barista'].id,
      status: 'active',
    },
  });

  // 6. Create Customers (Including Staff/Owners for discounts)
  console.log('👥 Creating customers...');
  const customers = [
    { fullName: 'أحمد علي (موظف)', phoneNumber: '01011111111', customerType: 'staff' },
    { fullName: 'محمد محمود (مالك)', phoneNumber: '01022222222', customerType: 'owner_discount' },
    { fullName: 'سارة حسن (طالب)', phoneNumber: '01033333333', customerType: 'student' },
    { fullName: 'ياسين كمال (زائر)', phoneNumber: '01044444444', customerType: 'visitor' },
  ];

  for (const c of customers) {
    await prisma.customer.create({
      data: { ...c, createdByUserId: owner.id },
    });
  }

  // 7. Create Inventory Items with Costs
  console.log('📦 Creating inventory items with costs...');
  const inventoryData = [
    { name: 'بن برازيلي (حبوب)', category: 'coffee', unit: 'جرام', currentStock: 10000, costPerUnit: 0.8 }, // 800 LE / kg
    { name: 'حليب كامل الدسم', category: 'dairy', unit: 'مل', currentStock: 20000, costPerUnit: 0.04 }, // 40 LE / Litre
    { name: 'سكر أبيض', category: 'raw', unit: 'جرام', currentStock: 5000, costPerUnit: 0.035 }, // 35 LE / kg
    { name: 'أكواب ورقية 9oz', category: 'packaging', unit: 'قطعة', currentStock: 1000, costPerUnit: 1.5 },
    { name: 'مياه معدنية 500ml', category: 'drinks', unit: 'قطعة', currentStock: 200, costPerUnit: 6.0 },
    { name: 'شاي فتلة', category: 'tea', unit: 'فتلة', currentStock: 500, costPerUnit: 2.0 },
    { name: 'بودرة فرابيه', category: 'raw', unit: 'جرام', currentStock: 2000, costPerUnit: 0.5 },
  ];

  const invMap: Record<string, any> = {};
  for (const item of inventoryData) {
    invMap[item.name] = await prisma.inventoryItem.create({ data: item });
  }

  // 8. Create Bar Products & Recipes with Automatic Cost Calculation
  console.log('☕ Creating products and recipes...');
  const productTemplates = [
    { 
      name: 'اسبريسو', category: 'coffee', price: 45, 
      recipe: [{ name: 'بن برازيلي (حبوب)', qty: 18 }] 
    },
    { 
      name: 'لاتيه', category: 'coffee', price: 75, 
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 250 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ] 
    },
    { 
      name: 'كابتشينو', category: 'coffee', price: 70, 
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 200 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ] 
    },
    { 
      name: 'مياه معدنية صغير', category: 'water', price: 15, 
      recipe: [{ name: 'مياه معدنية 500ml', qty: 1 }] 
    },
    { 
      name: 'شاي أحمر', category: 'tea', price: 25, 
      recipe: [
        { name: 'شاي فتلة', qty: 1 },
        { name: 'سكر أبيض', qty: 10 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ] 
    },
    { 
      name: 'فرابيه كراميل', category: 'frappe', price: 95, 
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 150 },
        { name: 'بودرة فرابيه', qty: 30 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ] 
    },
  ];

  for (const template of productTemplates) {
    // 1. Calculate cost from recipe
    let costPrice = 0;
    for (const r of template.recipe) {
      const invItem = invMap[r.name];
      costPrice += Number(invItem.costPerUnit) * r.qty;
    }

    // 2. Create product
    const product = await prisma.product.create({
      data: {
        name: template.name,
        category: template.category,
        price: template.price,
        costPrice: costPrice,
        description: `${template.name} - تحضير طازج`,
        availability: true,
        active: true,
      },
    });

    // 3. Create recipe items
    for (const r of template.recipe) {
      await prisma.recipeItem.create({
        data: {
          productId: product.id,
          inventoryItemId: invMap[r.name].id,
          quantity: r.qty,
        },
      });
    }
  }

  // 9. Create some Rooms for coworking
  console.log('🛋️ Creating rooms...');
  const rooms = [
    { name: 'قاعة الاجتماعات الكبرى', roomType: 'meeting', capacity: 12, hourlyRate: 300 },
    { name: 'منطقة العمل المشترك (A)', roomType: 'coworking', capacity: 20, hourlyRate: 40 },
    { name: 'غرفة مذاكرة هادئة', roomType: 'study', capacity: 4, hourlyRate: 60 },
  ];

  for (const r of rooms) {
    await prisma.room.create({ data: r });
  }

  console.log('✅ SEEDING COMPLETE!');
  console.log('-----------------------------------');
  console.log('Barista: barista@eduvers.com / 123456');
  console.log('Owner: owner@eduvers.com / 123456');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
