import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Bar-Centric Production Seed...');

  // 1. Clean existing data
  console.log('🧹 Cleaning old data...');
  await prisma.barOrderItem.deleteMany();
  await prisma.barOrder.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
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

  // 6. Create Bar Products
  console.log('☕ Creating products...');
  const barProducts = [
    { name: 'اسبريسو', category: 'coffee', price: 45 },
    { name: 'كابتشينو', category: 'coffee', price: 65 },
    { name: 'لاتيه', category: 'coffee', price: 70 },
    { name: 'فلات وايت', category: 'coffee', price: 75 },
    { name: 'شاي فتلة', category: 'tea', price: 25 },
    { name: 'شاي أخضر', category: 'tea', price: 30 },
    { name: 'مياه معدنية', category: 'water', price: 15 },
    { name: 'بيبسي', category: 'cans', price: 25 },
    { name: 'ساندوتش تونة', category: 'food', price: 85 },
  ];

  for (const p of barProducts) {
    await prisma.product.create({
      data: {
        ...p,
        description: 'Bar Product',
        availability: true,
        active: true,
        costPrice: 0,
      },
    });
  }

  console.log('✅ SEEDING COMPLETE!');
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
