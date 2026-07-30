import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Bar-Centric Production Seed with Inventory...');

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('SEED_DEFAULT_PASSWORD must be set to at least 12 characters before seeding');
  }

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
  await prisma.expenseCategory.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.wasteEntry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.shift.deleteMany();
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
    { m: 'bar_orders', actions: ['read', 'create', 'update', 'delete', 'cancel', 'items'] },
    { m: 'customers', actions: ['read', 'create', 'update', 'delete', 'deactivate', 'blacklist', 'reactivate'] },
    { m: 'sessions', actions: ['read', 'create', 'close', 'cancel', 'update', 'delete'] },
    { m: 'bookings', actions: ['read', 'create', 'update', 'cancel', 'delete', 'complete', 'no_show'] },
    { m: 'rooms', actions: ['read', 'create', 'update', 'delete'] },
    { m: 'invoices', actions: ['read', 'generate', 'create', 'update', 'delete', 'refund'] },
    { m: 'payments', actions: ['read', 'record', 'create', 'update', 'delete', 'refund'] },
    { m: 'dashboards', actions: ['view_owner', 'view_ops_manager', 'view_barista', 'view_reception'] },
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

  // Owner and Operations Manager get ALL permissions
  for (const perm of allCreatedPermissions) {
    await prisma.rolePermission.create({ data: { roleId: roles['Owner'].id, permissionId: perm.id } });
    await prisma.rolePermission.create({ data: { roleId: roles['Operations Manager'].id, permissionId: perm.id } });
  }

  // Barista: bar orders (r/c/u), products (r), inventory (r/c/u), sessions (r), customers (r), barista dashboard
  const baristaAllowed: Array<{ module: string; action: string }> = [
    { module: 'bar_orders', action: 'read' },
    { module: 'bar_orders', action: 'create' },
    { module: 'bar_orders', action: 'update' },
    { module: 'bar_orders', action: 'cancel' },
    { module: 'products', action: 'read' },
    { module: 'inventory', action: 'read' },
    { module: 'inventory', action: 'create' },
    { module: 'inventory', action: 'update' },
    { module: 'sessions', action: 'read' },
    { module: 'customers', action: 'read' },
    { module: 'dashboards', action: 'view_barista' },
  ];

  // Receptionist: customers (r/c/u), sessions (r/c/close/cancel), bookings (r/c/u/cancel),
  //               rooms (r), bar_orders (r), invoices (r/generate), payments (r/record), reception dashboard
  const receptionistAllowed: Array<{ module: string; action: string }> = [
    { module: 'customers', action: 'read' },
    { module: 'customers', action: 'create' },
    { module: 'customers', action: 'update' },
    { module: 'sessions', action: 'read' },
    { module: 'sessions', action: 'create' },
    { module: 'sessions', action: 'close' },
    { module: 'sessions', action: 'cancel' },
    { module: 'bookings', action: 'read' },
    { module: 'bookings', action: 'create' },
    { module: 'bookings', action: 'update' },
    { module: 'bookings', action: 'cancel' },
    { module: 'rooms', action: 'read' },
    { module: 'bar_orders', action: 'read' },
    { module: 'invoices', action: 'read' },
    { module: 'invoices', action: 'generate' },
    { module: 'payments', action: 'read' },
    { module: 'payments', action: 'record' },
    { module: 'expenses', action: 'read' },
    { module: 'expenses', action: 'create' },
    { module: 'expenses', action: 'update' },
    { module: 'expenses', action: 'delete' },
    { module: 'inventory', action: 'read' },
    { module: 'users', action: 'read' },
    { module: 'dashboards', action: 'view_reception' },
  ];

  for (const perm of allCreatedPermissions) {
    if (baristaAllowed.some(a => a.module === perm.module && a.action === perm.action)) {
      await prisma.rolePermission.create({ data: { roleId: roles['Barista'].id, permissionId: perm.id } });
    }
    if (receptionistAllowed.some(a => a.module === perm.module && a.action === perm.action)) {
      await prisma.rolePermission.create({ data: { roleId: roles['Receptionist'].id, permissionId: perm.id } });
    }
  }

  // 5. Create Default Users
  console.log('👤 Creating default users...');
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || '123456';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
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
      email: 'elmahdy@eduvers.com',
      passwordHash,
      firstName: 'Elmahdy',
      lastName: 'Owner',
      roleId: roles['Owner'].id,
      status: 'active',
    },
  });

  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.create({
    data: {
      email: 'admin@edu-vers.com',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Owner',
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
    { fullName: 'Mahmoud Elmahdy', phoneNumber: '01000000001', customerType: 'owner_discount' },
    { fullName: 'Khaled Salah', phoneNumber: '01000000002', customerType: 'owner_discount' },
    { fullName: 'Mahmoud Ezz', phoneNumber: '01000000003', customerType: 'owner_discount' },
    { fullName: 'Mahmoud Abd Rabou', phoneNumber: '01000000004', customerType: 'owner_discount' },
    { fullName: 'Mohamed Abdelazim', phoneNumber: '01000000005', customerType: 'owner_discount' },
    { fullName: 'Nada Elbaz', phoneNumber: '01000000006', customerType: 'owner_discount' },
    { fullName: 'Eng. Mohamed', phoneNumber: '01000000007', customerType: 'owner_discount' },
    { fullName: 'أحمد علي (موظف)', phoneNumber: '01011111111', customerType: 'staff' },
    { fullName: 'سارة حسن (طالب)', phoneNumber: '01033333333', customerType: 'student' },
    { fullName: 'ياسين كمال (زائر)', phoneNumber: '01044444444', customerType: 'visitor' },
  ];

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { phoneNumber: c.phoneNumber },
          { fullName: c.fullName }
        ]
      }
    });

    if (!existing) {
      await prisma.customer.create({
        data: { ...c, createdByUserId: owner.id },
      });
    } else {
      await prisma.customer.update({
        where: { id: existing.id },
        data: { customerType: c.customerType, fullName: c.fullName }
      });
    }
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
  console.log('☕ Creating products and recipes from CSV...');

  const categoryImages: Record<string, string> = {
    'Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
    'Tea': 'https://images.unsplash.com/photo-1544787210-2213d84ad960?auto=format&fit=crop&q=80&w=400',
    'Cold Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400',
    'Hot Drinks': 'https://images.unsplash.com/photo-1544787210-2213d84ad960?auto=format&fit=crop&q=80&w=400',
    'Frappe': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400',
    'Frappuccino': 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400',
    'Milk Shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bcc?auto=format&fit=crop&q=80&w=400',
    'Yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400',
    'Cans': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
    'Mocktails': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
    'Boba Additions': 'https://images.unsplash.com/photo-1558857563-b371f31ca735?auto=format&fit=crop&q=80&w=400',
    'Smoothies': 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&q=80&w=400',
    'Fresh Juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400',
    'Indomy': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400',
    'Indomy Add-ons': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400',
    'Additions': 'https://images.unsplash.com/photo-1551024601-bec78acc704b?auto=format&fit=crop&q=80&w=400',
    'Extra\'s': 'https://images.unsplash.com/photo-1551024601-bec78acc704b?auto=format&fit=crop&q=80&w=400'
  };

  const recipeMap: Record<string, { recipe: Array<{ name: string; qty: number }>; description?: string }> = {
    "Espresso (M)": {
      recipe: [{ name: 'بن برازيلي (حبوب)', qty: 18 }],
      description: "إسبريسو (وسط) - تحضير طازج"
    },
    "Latte (M)": {
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 250 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ],
      description: "لاتيه (وسط) - تحضير طازج"
    },
    "Cappuccino (M)": {
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 200 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ],
      description: "كابتشينو (وسط) - تحضير طازج"
    },
    "Water": {
      recipe: [{ name: 'مياه معدنية 500ml', qty: 1 }],
      description: "مياه معدنية صغير"
    },
    "Tea": {
      recipe: [
        { name: 'شاي فتلة', qty: 1 },
        { name: 'سكر أبيض', qty: 10 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ],
      description: "شاي فتلة أحمر - تحضير طازج"
    },
    "Frappe Special": {
      recipe: [
        { name: 'بن برازيلي (حبوب)', qty: 18 },
        { name: 'حليب كامل الدسم', qty: 150 },
        { name: 'بودرة فرابيه', qty: 30 },
        { name: 'أكواب ورقية 9oz', qty: 1 }
      ],
      description: "فرابيه سبيشيال - تحضير طازج"
    }
  };

  const csvPath = path.resolve(__dirname, '../../eduverse_menu_prices.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split('\n');

  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [category, item, size, priceStr, notes] = line.split(',');
    if (!item || !priceStr) continue;

    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;

    const productName = size && size !== 'One Size' ? `${item} (${size})` : item;
    const categoryName = category.trim();
    const imageUrl = categoryImages[categoryName] || 'https://images.unsplash.com/photo-1551024601-bec78acc704b?auto=format&fit=crop&q=80&w=400';

    // Check if we have a specific recipe
    const hasRecipe = recipeMap[productName];
    let costPrice = price * 0.4;
    let recipeItems: Array<{ name: string; qty: number }> = [];
    let customDescription = notes ? `${notes} - Imported from menu` : `Fresh ${productName}`;

    if (hasRecipe) {
      recipeItems = hasRecipe.recipe;
      if (hasRecipe.description) {
        customDescription = hasRecipe.description;
      }
      // Calculate exact cost from recipe
      costPrice = 0;
      for (const r of recipeItems) {
        const invItem = invMap[r.name];
        if (invItem) {
          costPrice += Number(invItem.costPerUnit) * r.qty;
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        name: productName,
        category: categoryName,
        price: price,
        costPrice: costPrice,
        description: customDescription,
        imageUrl: imageUrl,
        availability: true,
        active: true,
      },
    });

    // Create recipe items if any
    for (const r of recipeItems) {
      const invItem = invMap[r.name];
      if (invItem) {
        await prisma.recipeItem.create({
          data: {
            productId: product.id,
            inventoryItemId: invItem.id,
            quantity: r.qty,
          },
        });
      }
    }

    importedCount++;
  }

  console.log(`✅ Seeding complete! Total products imported from CSV: ${importedCount}`);

  // 9. Create some Rooms for coworking
  console.log('🛋️ Creating rooms...');
  const rooms = [
    { name: 'قاعة الاجتماعات الكبرى', roomType: 'meeting', capacity: 12, hourlyRate: 150, individualHourlyRate: 30 },
    { name: 'منطقة العمل المشترك (Outdoor)', roomType: 'coworking', capacity: 25, hourlyRate: 10, individualHourlyRate: 10 },
    { name: 'منطقة العمل المشترك (Space)', roomType: 'coworking', capacity: 20, hourlyRate: 20, individualHourlyRate: 20 },
    { name: 'غرفة مذاكرة هادئة', roomType: 'study', capacity: 4, hourlyRate: 10, individualHourlyRate: 10 },
  ];

  for (const r of rooms) {
    await prisma.room.create({ data: r });
  }
  console.log('✅ Seeding complete! Database is ready.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
