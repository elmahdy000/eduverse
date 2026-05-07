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
    console.log('🌱 Starting Bar-Centric Production Seed...');
    console.log('🧹 Cleaning old data...');
    await prisma.barOrderItem.deleteMany();
    await prisma.barOrder.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    console.log('👥 Creating roles...');
    const roleNames = ['Owner', 'Operations Manager', 'Barista', 'Receptionist'];
    const roles = {};
    for (const name of roleNames) {
        roles[name] = await prisma.role.create({
            data: { name, description: `${name} role for bar operations` },
        });
    }
    console.log('🔐 Creating permissions...');
    const permissionModules = [
        { m: 'products', actions: ['read', 'create', 'update', 'delete'] },
        { m: 'bar_orders', actions: ['read', 'create', 'update', 'delete'] },
        { m: 'customers', actions: ['read', 'create', 'update'] },
        { m: 'sessions', actions: ['read'] },
        { m: 'dashboards', actions: ['view_owner', 'view_barista'] },
        { m: 'audit_logs', actions: ['read'] },
    ];
    const allCreatedPermissions = [];
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
    console.log('🔗 Assigning permissions to roles...');
    for (const perm of allCreatedPermissions) {
        await prisma.rolePermission.create({ data: { roleId: roles['Owner'].id, permissionId: perm.id } });
        await prisma.rolePermission.create({ data: { roleId: roles['Operations Manager'].id, permissionId: perm.id } });
        const isOperational = ['read', 'create'].includes(perm.action) ||
            perm.module === 'dashboards' ||
            perm.module === 'sessions' ||
            (perm.module === 'bar_orders' && perm.action === 'update');
        if (isOperational) {
            await prisma.rolePermission.create({ data: { roleId: roles['Barista'].id, permissionId: perm.id } });
            await prisma.rolePermission.create({ data: { roleId: roles['Receptionist'].id, permissionId: perm.id } });
        }
    }
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
//# sourceMappingURL=seed.js.map