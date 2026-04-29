"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database with initial data...');
    const ownerRole = await prisma.role.upsert({
        where: { name: 'Owner' },
        update: {},
        create: {
            name: 'Owner',
            description: 'Full system access',
        },
    });
    const opsManagerRole = await prisma.role.upsert({
        where: { name: 'Operations Manager' },
        update: {},
        create: {
            name: 'Operations Manager',
            description: 'Daily operations management',
        },
    });
    const receptionistRole = await prisma.role.upsert({
        where: { name: 'Receptionist' },
        update: {},
        create: {
            name: 'Receptionist',
            description: 'Customer lifecycle management',
        },
    });
    const baristaRole = await prisma.role.upsert({
        where: { name: 'Barista' },
        update: {},
        create: {
            name: 'Barista',
            description: 'Bar order operations',
        },
    });
    console.log('✅ Roles created');
    const permissions = [
        { module: 'customers', action: 'read', description: 'View customers' },
        { module: 'customers', action: 'create', description: 'Create customer' },
        { module: 'customers', action: 'update', description: 'Update customer' },
        { module: 'customers', action: 'delete', description: 'Delete customer' },
        { module: 'sessions', action: 'read', description: 'View sessions' },
        { module: 'sessions', action: 'create', description: 'Open session' },
        { module: 'sessions', action: 'update', description: 'Update session' },
        { module: 'sessions', action: 'close', description: 'Close session' },
        { module: 'sessions', action: 'cancel', description: 'Cancel session' },
        { module: 'rooms', action: 'read', description: 'View rooms' },
        { module: 'rooms', action: 'create', description: 'Create room' },
        { module: 'rooms', action: 'update', description: 'Update room' },
        { module: 'rooms', action: 'delete', description: 'Delete room' },
        { module: 'bookings', action: 'read', description: 'View bookings' },
        { module: 'bookings', action: 'create', description: 'Create booking' },
        { module: 'bookings', action: 'update', description: 'Update booking' },
        { module: 'bookings', action: 'cancel', description: 'Cancel booking' },
        { module: 'bar_orders', action: 'read', description: 'View bar orders' },
        { module: 'bar_orders', action: 'create', description: 'Create order' },
        { module: 'bar_orders', action: 'update', description: 'Update order status' },
        { module: 'bar_orders', action: 'cancel', description: 'Cancel order' },
        { module: 'products', action: 'read', description: 'View products' },
        { module: 'products', action: 'create', description: 'Create product' },
        { module: 'products', action: 'update', description: 'Update product' },
        { module: 'invoices', action: 'read', description: 'View invoices' },
        { module: 'invoices', action: 'generate', description: 'Generate invoice' },
        { module: 'invoices', action: 'refund', description: 'Refund invoice' },
        { module: 'payments', action: 'read', description: 'View payments' },
        { module: 'payments', action: 'record', description: 'Record payment' },
        { module: 'audit_logs', action: 'read', description: 'View audit logs' },
        {
            module: 'dashboards',
            action: 'view_owner',
            description: 'View owner dashboard',
        },
        {
            module: 'dashboards',
            action: 'view_ops_manager',
            description: 'View ops manager dashboard',
        },
        {
            module: 'dashboards',
            action: 'view_reception',
            description: 'View reception dashboard',
        },
        {
            module: 'dashboards',
            action: 'view_barista',
            description: 'View barista dashboard',
        },
        {
            module: 'dashboards',
            action: 'view_operations_by_role',
            description: 'View operations by role report',
        },
        { module: 'users', action: 'manage', description: 'Manage users' },
        { module: 'roles', action: 'manage', description: 'Manage roles' },
    ];
    const createdPermissions = await Promise.all(permissions.map((perm) => prisma.permission.upsert({
        where: { module_action: { module: perm.module, action: perm.action } },
        update: {},
        create: perm,
    })));
    console.log(`✅ Created ${createdPermissions.length} permissions`);
    const ownerPermissions = createdPermissions.map((perm) => ({
        roleId: ownerRole.id,
        permissionId: perm.id,
    }));
    for (const rp of ownerPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: rp.roleId,
                    permissionId: rp.permissionId,
                },
            },
            update: {},
            create: rp,
        });
    }
    console.log('✅ Owner role assigned all permissions');
    const opsPermissions = createdPermissions
        .filter((p) => [
        'customers',
        'sessions',
        'rooms',
        'bookings',
        'bar_orders',
        'audit_logs',
        'dashboards',
    ].includes(p.module))
        .map((perm) => ({
        roleId: opsManagerRole.id,
        permissionId: perm.id,
    }));
    for (const rp of opsPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: rp.roleId,
                    permissionId: rp.permissionId,
                },
            },
            update: {},
            create: rp,
        });
    }
    console.log('✅ Operations Manager role permissions assigned');
    const receptionistPermissions = createdPermissions
        .filter((p) => [
        'customers',
        'sessions',
        'rooms',
        'bookings',
        'bar_orders',
        'invoices',
        'payments',
    ].includes(p.module) ||
        (p.module === 'dashboards' && p.action === 'view_reception'))
        .map((perm) => ({
        roleId: receptionistRole.id,
        permissionId: perm.id,
    }));
    for (const rp of receptionistPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: rp.roleId,
                    permissionId: rp.permissionId,
                },
            },
            update: {},
            create: rp,
        });
    }
    console.log('✅ Receptionist role permissions assigned');
    const baristaPermissions = createdPermissions
        .filter((p) => (p.module === 'bar_orders') ||
        (p.module === 'products' && p.action === 'read') ||
        (p.module === 'customers' && p.action === 'read') ||
        (p.module === 'sessions' && p.action === 'read') ||
        (p.module === 'dashboards' && p.action === 'view_barista'))
        .map((perm) => ({
        roleId: baristaRole.id,
        permissionId: perm.id,
    }));
    for (const rp of baristaPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: rp.roleId,
                    permissionId: rp.permissionId,
                },
            },
            update: {},
            create: rp,
        });
    }
    console.log('✅ Barista role permissions assigned');
    const passwordHash = await bcrypt.hash('owner123', 10);
    const ownerUser = await prisma.user.upsert({
        where: { email: 'owner@eduvers.com' },
        update: {},
        create: {
            email: 'owner@eduvers.com',
            passwordHash,
            firstName: 'المالك',
            lastName: 'اداري',
            roleId: ownerRole.id,
            status: 'active',
        },
    });
    console.log('✅ Default owner user created');
    const opsPasswordHash = await bcrypt.hash('ops123', 10);
    const opsUser = await prisma.user.upsert({
        where: { email: 'opsmanager@eduvers.com' },
        update: {},
        create: {
            email: 'opsmanager@eduvers.com',
            passwordHash: opsPasswordHash,
            firstName: 'مدير',
            lastName: 'العمليات',
            roleId: opsManagerRole.id,
            status: 'active',
        },
    });
    console.log('✅ Operations Manager user created');
    const receptionPasswordHash = await bcrypt.hash('recept123', 10);
    const receptionUser = await prisma.user.upsert({
        where: { email: 'receptionist@eduvers.com' },
        update: {},
        create: {
            email: 'receptionist@eduvers.com',
            passwordHash: receptionPasswordHash,
            firstName: 'موظف',
            lastName: 'الاستقبال',
            roleId: receptionistRole.id,
            status: 'active',
        },
    });
    console.log('✅ Receptionist user created');
    const baristaPasswordHash = await bcrypt.hash('barista123', 10);
    const baristaUser = await prisma.user.upsert({
        where: { email: 'barista@eduvers.com' },
        update: {},
        create: {
            email: 'barista@eduvers.com',
            passwordHash: baristaPasswordHash,
            firstName: 'باريستا',
            lastName: 'بار',
            roleId: baristaRole.id,
            status: 'active',
        },
    });
    console.log('✅ Barista user created');
    const sampleProducts = [
        { name: 'Espresso', category: 'coffee', price: 25 },
        { name: 'Americano', category: 'coffee', price: 30 },
        { name: 'Cappuccino', category: 'coffee', price: 35 },
        { name: 'Latte', category: 'coffee', price: 40 },
        { name: 'Mocha', category: 'coffee', price: 45 },
        { name: 'Turkish Coffee', category: 'coffee', price: 20 },
        { name: 'Tea', category: 'tea', price: 15 },
        { name: 'Green Tea', category: 'tea', price: 20 },
        { name: 'Mint Tea', category: 'tea', price: 25 },
        { name: 'Fresh Juice', category: 'juice', price: 30 },
        { name: 'Mango Smoothie', category: 'juice', price: 40 },
        { name: 'Sandwich', category: 'sandwich', price: 50 },
        { name: 'Croissant', category: 'snack', price: 25 },
        { name: 'Cake', category: 'dessert', price: 35 },
        { name: 'Cookie', category: 'snack', price: 15 },
    ];
    for (const prod of sampleProducts) {
        const existing = await prisma.product.findFirst({
            where: { name: prod.name },
        });
        if (!existing) {
            await prisma.product.create({
                data: {
                    name: prod.name,
                    category: prod.category,
                    price: prod.price,
                    description: `${prod.name} - Quality product`,
                    availability: true,
                    active: true,
                },
            });
        }
    }
    console.log(`✅ Created ${sampleProducts.length} sample products`);
    const egyptianCustomers = [
        { fullName: 'أحمد محمد علي', phoneNumber: '01012345678', customerType: 'student', college: 'جامعة القاهرة', studyLevel: 'السنة الرابعة' },
        { fullName: 'محمد أحمد حسن', phoneNumber: '01123456789', customerType: 'student', college: 'جامعة عين شمس', studyLevel: 'السنة الثالثة' },
        { fullName: 'سارة أحمد محمود', phoneNumber: '01234567890', customerType: 'student', college: 'جامعة الإسكندرية', studyLevel: 'السنة الثانية' },
        { fullName: 'كريم عبد الله', phoneNumber: '01098765432', customerType: 'employee', employerName: 'شركة IBM', jobTitle: 'مهندس برمجيات' },
        { fullName: 'نور الدين محمد', phoneNumber: '01187654321', customerType: 'student', college: 'جامعة الأزهر', studyLevel: 'السنة الخامسة' },
        { fullName: 'يوسف إبراهيم', phoneNumber: '01276543210', customerType: 'employee', employerName: 'بنك مصر', jobTitle: 'محاسب' },
        { fullName: 'فاطمة الزهراء', phoneNumber: '01054321098', customerType: 'student', college: 'جامعة حلوان', studyLevel: 'السنة الأولى' },
        { fullName: 'عمر فاروق', phoneNumber: '01143210987', customerType: 'trainer', college: 'جامعة القاهرة', studyLevel: 'خريج' },
        { fullName: 'ليلى محمود', phoneNumber: '01232109876', customerType: 'student', college: 'جامعة المنصورة', studyLevel: 'السنة الرابعة' },
        { fullName: 'محمود حسن', phoneNumber: '01021098765', customerType: 'employee', employerName: 'فودافون مصر', jobTitle: 'مدير مبيعات' },
        { fullName: 'رنا سعيد', phoneNumber: '01110987654', customerType: 'student', college: 'جامعة بني سويف', studyLevel: 'السنة الثالثة' },
        { fullName: 'خالد عادل', phoneNumber: '01209876543', customerType: 'employee', employerName: 'أوراسكوم', jobTitle: 'مهندس مدني' },
        { fullName: 'منى أحمد', phoneNumber: '01098765432', customerType: 'parent', college: null, studyLevel: null },
        { fullName: 'عبد الرحمن محمود', phoneNumber: '01187654321', customerType: 'student', college: 'جامعة دمنهور', studyLevel: 'السنة الثانية' },
        { fullName: 'سامي عبد الكريم', phoneNumber: '01276543210', customerType: 'employee', employerName: 'شركة Vodafone', jobTitle: 'مطور ويب' },
        { fullName: 'هند محمد', phoneNumber: '01065432109', customerType: 'student', college: 'جامعة سوهاج', studyLevel: 'السنة الرابعة' },
        { fullName: 'ياسر علي', phoneNumber: '01154321098', customerType: 'trainer', college: 'جامعة القاهرة', studyLevel: 'خريج' },
        { fullName: 'نادية حسن', phoneNumber: '01243210987', customerType: 'employee', employerName: 'بنك القاهرة', jobTitle: 'موظف خدمة عملاء' },
        { fullName: 'مصطفى أحمد', phoneNumber: '01032109876', customerType: 'student', college: 'جامعة الفيوم', studyLevel: 'السنة الثالثة' },
        { fullName: 'دعاء محمود', phoneNumber: '01121098765', customerType: 'student', college: 'جامعة كفر الشيخ', studyLevel: 'السنة الأولى' },
        { fullName: 'علي حسين', phoneNumber: '01210987654', customerType: 'employee', employerName: 'شركة اتصالات', jobTitle: 'فني شبكات' },
    ];
    for (const customer of egyptianCustomers) {
        const existing = await prisma.customer.findFirst({
            where: { phoneNumber: customer.phoneNumber },
        });
        if (!existing) {
            await prisma.customer.create({
                data: {
                    fullName: customer.fullName,
                    phoneNumber: customer.phoneNumber,
                    customerType: customer.customerType,
                    college: customer.college,
                    studyLevel: customer.studyLevel,
                    employerName: customer.employerName,
                    jobTitle: customer.jobTitle,
                    status: 'active',
                    createdByUserId: ownerUser.id,
                },
            });
        }
    }
    console.log(`✅ Created ${egyptianCustomers.length} Egyptian customers`);
    console.log('\n📋 ALL ROLE CREDENTIALS:');
    console.log('┌─────────────────────┬────────────────────────┬────────────┐');
    console.log('│ Role                │ Email                  │ Password   │');
    console.log('├─────────────────────┼────────────────────────┼────────────┤');
    console.log('│ Owner               │ owner@eduvers.com      │ owner123   │');
    console.log('│ Operations Manager  │ opsmanager@eduvers.com │ ops123     │');
    console.log('│ Receptionist        │ receptionist@eduvers.com│ recept123  │');
    console.log('│ Barista             │ barista@eduvers.com    │ barista123 │');
    console.log('└─────────────────────┴────────────────────────┴────────────┘');
    console.log('\n✅ Database seeded successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map