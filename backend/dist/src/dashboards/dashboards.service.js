"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let DashboardsService = class DashboardsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getTodayRange() {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    getWeekRange() {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
    }
    getYesterdayRange() {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    async getOwnerDashboard() {
        const today = this.getTodayRange();
        const yesterday = this.getYesterdayRange();
        const week = this.getWeekRange();
        const [activeCustomersNow, activeSessionsNow, activeSessionsWithRoom, todayBookings, currentBarOrders, invoicesToday, paymentsToday, paymentsYesterday, paymentsWeek, recentOrderItems, closedSessionsToday, totalCustomers, newCustomersToday,] = await Promise.all([
            this.prisma.customer.count({ where: { status: 'active' } }),
            this.prisma.session.count({ where: { status: 'active' } }),
            this.prisma.session.findMany({
                where: { status: 'active', roomId: { not: null } },
                select: { roomId: true },
            }),
            this.prisma.booking.count({
                where: { startTime: { gte: today.start, lte: today.end } },
            }),
            this.prisma.barOrder.count({
                where: { status: { in: ['new', 'in_preparation', 'ready'] } },
            }),
            this.prisma.invoice.count({
                where: { issuedAt: { gte: today.start, lte: today.end } },
            }),
            this.prisma.payment.findMany({
                where: { paidAt: { gte: today.start, lte: today.end } },
                select: { amount: true },
            }),
            this.prisma.payment.findMany({
                where: { paidAt: { gte: yesterday.start, lte: yesterday.end } },
                select: { amount: true },
            }),
            this.prisma.payment.findMany({
                where: { paidAt: { gte: week.start, lte: week.end } },
                select: { amount: true, paidAt: true },
            }),
            this.prisma.barOrderItem.findMany({
                take: 500,
                orderBy: { order: { createdAt: 'desc' } },
                include: { product: true },
            }),
            this.prisma.session.findMany({
                where: { status: 'closed', endTime: { gte: today.start, lte: today.end } },
                select: { durationMinutes: true },
            }),
            this.prisma.customer.count(),
            this.prisma.customer.count({
                where: { createdAt: { gte: today.start, lte: today.end } },
            }),
        ]);
        const occupiedRoomsNow = new Set(activeSessionsWithRoom.map((s) => s.roomId).filter(Boolean)).size;
        const todayRevenue = Number(paymentsToday.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2));
        const yesterdayRevenue = Number(paymentsYesterday.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2));
        const weekRevenue = Number(paymentsWeek.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2));
        const revenueTrend = yesterdayRevenue > 0
            ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1))
            : null;
        const durations = closedSessionsToday
            .map((s) => s.durationMinutes)
            .filter((d) => d != null && d > 0);
        const avgSessionMinutes = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : null;
        const dailyRevenue = {};
        for (const p of paymentsWeek) {
            const day = new Date(p.paidAt).toLocaleDateString('ar-EG', { weekday: 'short' });
            dailyRevenue[day] = Number(((dailyRevenue[day] ?? 0) + Number(p.amount)).toFixed(2));
        }
        const productMap = new Map();
        for (const item of recentOrderItems) {
            const key = item.productId;
            const existing = productMap.get(key) ?? {
                productName: item.product?.name ?? 'غير معروف',
                quantity: 0,
                revenue: 0,
            };
            existing.quantity += Number(item.quantity);
            existing.revenue += Number(item.subtotal);
            productMap.set(key, existing);
        }
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        const operationalAlerts = [];
        if (currentBarOrders > 20)
            operationalAlerts.push('High pending bar orders volume');
        if (activeSessionsNow > 30)
            operationalAlerts.push('High active sessions load');
        if (todayRevenue === 0 && new Date().getHours() > 12)
            operationalAlerts.push('Zero revenue after noon — check invoices');
        return {
            activeCustomersNow,
            activeSessionsNow,
            occupiedRoomsNow,
            todayBookings,
            currentBarOrders,
            todayRevenue,
            invoicesToday,
            paymentsTodayAmount: todayRevenue,
            yesterdayRevenue,
            weekRevenue,
            revenueTrend,
            avgSessionMinutes,
            dailyRevenue,
            totalCustomers,
            newCustomersToday,
            topProducts,
            operationalAlerts,
        };
    }
    async getOperationsDashboard() {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const today = this.getTodayRange();
        const [activeSessions, rooms, upcomingBookings, pendingBarOrders, totalRooms] = await Promise.all([
            this.prisma.session.findMany({
                where: { status: 'active' },
                include: { customer: true, room: true },
                orderBy: { startTime: 'asc' },
                take: 100,
            }),
            this.prisma.room.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.booking.findMany({
                where: {
                    status: { in: ['draft', 'confirmed'] },
                    startTime: { gte: now, lte: next24h },
                },
                include: { customer: true, room: true },
                orderBy: { startTime: 'asc' },
                take: 50,
            }),
            this.prisma.barOrder.findMany({
                where: { status: { in: ['new', 'in_preparation'] } },
                include: { customer: true, items: { include: { product: true } } },
                orderBy: { createdAt: 'asc' },
                take: 50,
            }),
            this.prisma.room.count(),
        ]);
        const occupancyByRoomId = new Map();
        for (const session of activeSessions) {
            if (!session.roomId)
                continue;
            occupancyByRoomId.set(session.roomId, (occupancyByRoomId.get(session.roomId) ?? 0) + 1);
        }
        const roomOccupancy = rooms.map((room) => ({
            roomId: room.id,
            roomName: room.name,
            roomType: room.roomType,
            status: room.status,
            capacity: room.capacity,
            activeSessions: occupancyByRoomId.get(room.id) ?? 0,
            isOccupied: (occupancyByRoomId.get(room.id) ?? 0) > 0,
        }));
        const availableRooms = roomOccupancy.filter((r) => r.status === 'available' && !r.isOccupied).length;
        const occupiedRooms = roomOccupancy.filter((r) => r.isOccupied).length;
        const offlineRooms = roomOccupancy.filter((r) => r.status === 'out_of_service').length;
        const oldestPending = pendingBarOrders[0];
        const urgentOrderMinutes = oldestPending
            ? Math.round((now.getTime() - new Date(oldestPending.createdAt).getTime()) / 60000)
            : null;
        const alerts = [];
        if (pendingBarOrders.filter((o) => o.status === 'new').length > 10)
            alerts.push('Bar queue is building up');
        if (upcomingBookings.length > 15)
            alerts.push('High upcoming bookings in next 24h');
        if (urgentOrderMinutes && urgentOrderMinutes > 20)
            alerts.push(`Oldest bar order waiting ${urgentOrderMinutes} min`);
        return {
            activeSessions,
            roomOccupancy,
            roomStats: { total: totalRooms, available: availableRooms, occupied: occupiedRooms, offline: offlineRooms },
            upcomingBookings,
            pendingBarOrders,
            urgentOrderMinutes,
            alerts,
        };
    }
    async getReceptionDashboard() {
        const today = this.getTodayRange();
        const [activeSessionCount, recentCustomers, todayInvoicesCount, todayPayments, activeSessions, todayBarOrders] = await Promise.all([
            this.prisma.session.count({ where: { status: 'active' } }),
            this.prisma.customer.findMany({
                orderBy: { createdAt: 'desc' },
                take: 9,
            }),
            this.prisma.invoice.count({
                where: { issuedAt: { gte: today.start, lte: today.end } },
            }),
            this.prisma.payment.findMany({
                where: { paidAt: { gte: today.start, lte: today.end } },
                select: { amount: true },
            }),
            this.prisma.session.findMany({
                where: { status: 'active' },
                include: { customer: { select: { fullName: true, customerType: true } }, room: { select: { name: true } } },
                orderBy: { startTime: 'asc' },
                take: 20,
            }),
            this.prisma.barOrder.count({
                where: { createdAt: { gte: today.start, lte: today.end } },
            }),
        ]);
        const todayRevenuePartial = Number(todayPayments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2));
        return {
            activeSessionCount,
            recentCustomers,
            todayInvoicesCount,
            todayRevenuePartial,
            activeSessions,
            todayBarOrders,
        };
    }
    async getBaristaDashboard() {
        const now = new Date();
        const [newOrders, inPreparationOrders, readyOrders, deliveredToday] = await Promise.all([
            this.prisma.barOrder.findMany({
                where: { status: 'new' },
                include: { customer: true, items: { include: { product: true } } },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.barOrder.findMany({
                where: { status: 'in_preparation' },
                include: { customer: true, items: { include: { product: true } } },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.barOrder.findMany({
                where: { status: 'ready' },
                include: { customer: true, items: { include: { product: true } } },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.barOrder.count({
                where: {
                    status: 'delivered',
                    updatedAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    },
                },
            }),
        ]);
        const addWaitTime = (orders) => orders.map((o) => ({
            ...o,
            waitMinutes: Math.round((now.getTime() - new Date(o.createdAt).getTime()) / 60000),
        }));
        return {
            newOrders: addWaitTime(newOrders),
            inPreparationOrders: addWaitTime(inPreparationOrders),
            readyOrders: readyOrders,
            deliveredTodayCount: deliveredToday,
            counts: {
                new: newOrders.length,
                inPreparation: inPreparationOrders.length,
                ready: readyOrders.length,
            },
        };
    }
    async getOperationsByRole() {
        const today = this.getTodayRange();
        const users = await this.prisma.user.findMany({
            include: { role: true },
        });
        const targetRoles = ['Operations Manager', 'Receptionist', 'Barista'];
        const targetUsers = users.filter((u) => targetRoles.includes(u.role.name));
        const userIds = targetUsers.map((u) => u.id);
        const auditLogs = await this.prisma.auditLog.findMany({
            where: {
                userId: { in: userIds },
                timestamp: { gte: today.start, lte: today.end },
            },
            include: { user: { include: { role: true } } },
            orderBy: { timestamp: 'desc' },
            take: 100,
        });
        const operationsByRole = targetRoles.map((roleName) => {
            const roleUsers = targetUsers.filter((u) => u.role.name === roleName);
            const roleUserIds = roleUsers.map((u) => u.id);
            const roleLogs = auditLogs.filter((log) => roleUserIds.includes(log.userId));
            const actionCounts = roleLogs.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {});
            return {
                role: roleName,
                userCount: roleUsers.length,
                totalOperations: roleLogs.length,
                actionCounts,
                recentLogs: roleLogs.slice(0, 10).map((log) => ({
                    id: log.id,
                    action: log.action,
                    entityType: log.entityType,
                    entityId: log.entityId,
                    oldValue: log.oldValue,
                    newValue: log.newValue,
                    timestamp: log.timestamp,
                    user: {
                        id: log.user.id,
                        email: log.user.email,
                        firstName: log.user.firstName,
                        lastName: log.user.lastName,
                    },
                })),
            };
        });
        return {
            operationsByRole,
            totalOperationsToday: auditLogs.length,
        };
    }
};
exports.DashboardsService = DashboardsService;
exports.DashboardsService = DashboardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardsService);
//# sourceMappingURL=dashboards.service.js.map