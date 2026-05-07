import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Bar-Centric Production Seed with Inventory...');

  // 1. Clean existing data (Ordering matters due to foreign keys)
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
    { m: 'customers', actions: ['read', 'create', 'update'] },
    { m: 'sessions', actions: ['read'] },
    { m: 'dashboards', actions: ['view_owner', 'view_barista'] },
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

  // 4. Assign Permissions to Roles
  console.log('🔗 Assigning permissions to roles...');
  for (const perm of allCreatedPermissions) {
    // Owner & Operations Manager get everything
    await prisma.rolePermission.create({ data: { roleId: roles['Owner'].id, permissionId: perm.id } });
    await prisma.rolePermission.create({ data: { roleId: roles['Operations Manager'].id, permissionId: perm.id } });

    // Barista & Receptionist get core operational permissions
    const isOperational = ['read', 'create'].includes(perm.action) ||
      perm.module === 'dashboards' ||
      perm.module === 'sessions' ||
      (perm.module === 'bar_orders' && perm.action === 'update');

    if (isOperational) {
      await prisma.rolePermission.create({ data: { roleId: roles['Barista'].id, permissionId: perm.id } });
      await prisma.rolePermission.create({ data: { roleId: roles['Receptionist'].id, permissionId: perm.id } });
    }
  }

  // 5. Create Default Users (Password: 123456)
  console.log('👤 Creating default users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  const defaultUsers = [
    { email: 'owner@eduvers.com', role: 'Owner', name: 'Owner' },
    { email: 'ops@eduvers.com', role: 'Operations Manager', name: 'Ops Manager' },
    { email: 'barista1@eduvers.com', role: 'Barista', name: 'Barista One' },
    { email: 'barista2@eduvers.com', role: 'Barista', name: 'Barista Two' },
    { email: 'recept1@eduvers.com', role: 'Receptionist', name: 'Receptionist One' },
    { email: 'recept2@eduvers.com', role: 'Receptionist', name: 'Receptionist Two' },
  ];

  for (const u of defaultUsers) {
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        firstName: u.name,
        lastName: 'User',
        roleId: roles[u.role].id,
        status: 'active',
      },
    });
  }

  // 6. Create Inventory Items
  console.log('📦 Creating inventory items...');
  const inventoryItems = [
    { name: 'بن برازيلي (حبوب)', category: 'coffee', unit: 'جرام', currentStock: 5000, minStockLevel: 1000 },
    { name: 'حليب كامل الدسم', category: 'dairy', unit: 'مل', currentStock: 12000, minStockLevel: 2000 },
    { name: 'سكر أبيض', category: 'raw', unit: 'جرام', currentStock: 3000, minStockLevel: 500 },
    { name: 'أكواب ورقية 9oz', category: 'packaging', unit: 'قطعة', currentStock: 500, minStockLevel: 50 },
    { name: 'مياه معدنية 500ml', category: 'drinks', unit: 'قطعة', currentStock: 100, minStockLevel: 12 },
  ];

  const invMap: Record<string, any> = {};
  for (const item of inventoryItems) {
    invMap[item.name] = await prisma.inventoryItem.create({ data: item });
  }

  // 7. Create Bar Products & Recipes
  console.log('☕ Creating products and recipes...');
  const products = [
    { 
      name: 'اسبريسو', category: 'coffee', price: 45, 
      recipe: [{ name: 'بن برازيلي (حبوب)', qty: 18 }] 
    },
    { 
      name: 'لاتيه', category: 'coffee', price: 70, 
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 200 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ] 
    },
    { 
      name: 'مياه معدنية', category: 'water', price: 15, 
      recipe: [{ name: 'مياه معدنية 500ml', qty: 1 }] 
    },
  ];

  for (const pInfo of products) {
    const product = await prisma.product.create({
      data: {
        name: pInfo.name,
        category: pInfo.category,
        price: pInfo.price,
        description: 'Bar Product',
        availability: true,
        active: true,
        costPrice: 0,
      },
    });

    // Create Recipe
    for (const r of pInfo.recipe) {
      await prisma.recipeItem.create({
        data: {
          productId: product.id,
          inventoryItemId: invMap[r.name].id,
          quantity: r.qty,
        },
      });
    }
  }

  console.log('✅ SEEDING COMPLETE WITH INVENTORY!');
  console.log('-----------------------------------');
  console.log('Default Login Credentials:');
  console.log('Email: owner@eduvers.com');
  console.log('Email: barista1@eduvers.com');
  console.log('Password: 123456');
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
