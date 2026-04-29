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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let SessionsService = class SessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateUniqueGuestCode() {
        let code = '';
        let exists = true;
        while (exists) {
            code = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await this.prisma.session.findUnique({
                where: { guestCode: code },
            });
            if (!existing)
                exists = false;
        }
        return code;
    }
    async openSession(createSessionDto, userId) {
        const existingSession = await this.prisma.session.findFirst({
            where: {
                customerId: createSessionDto.customerId,
                status: 'active',
            },
        });
        if (existingSession) {
            throw new Error('Customer already has an active session');
        }
        const customer = await this.prisma.customer.findUnique({
            where: { id: createSessionDto.customerId },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const guestCode = await this.generateUniqueGuestCode();
        const session = await this.prisma.session.create({
            data: {
                ...createSessionDto,
                startTime: new Date(),
                openedByUserId: userId,
                status: 'active',
                guestCode,
            },
            include: {
                customer: true,
                room: true,
            },
        });
        await this.prisma.customer.update({
            where: { id: createSessionDto.customerId },
            data: { lastVisitAt: new Date() },
        });
        return session;
    }
    async closeSession(sessionId, closeSessionDto, userId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { room: true },
        });
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.status !== 'active') {
            throw new Error('Only active sessions can be closed');
        }
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - session.startTime.getTime()) / 60000);
        let chargeAmount = Number(session.chargeAmount || 0);
        if (chargeAmount === 0) {
            if (session.sessionType === 'hourly') {
                const rate = Number(session.room?.hourlyRate || 10);
                const hours = Math.ceil(durationMinutes / 60);
                chargeAmount = hours * rate;
            }
            else if (session.sessionType === 'daily' && session.room?.dailyRate) {
                chargeAmount = Number(session.room.dailyRate);
            }
        }
        const closedSession = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                endTime,
                durationMinutes,
                status: 'closed',
                closedByUserId: userId,
                chargeAmount,
                notes: closeSessionDto.notes,
                guestCode: null,
            },
            include: {
                customer: true,
                barOrders: true,
            },
        });
        return closedSession;
    }
    async getSession(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                customer: true,
                room: true,
                barOrders: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!session) {
            throw new Error('Session not found');
        }
        return session;
    }
    async listActiveSessions(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [sessions, total] = await Promise.all([
            this.prisma.session.findMany({
                where: { status: 'active' },
                include: {
                    customer: true,
                    room: true,
                },
                skip,
                take: limit,
                orderBy: { startTime: 'desc' },
            }),
            this.prisma.session.count({ where: { status: 'active' } }),
        ]);
        const hasMore = skip + sessions.length < total;
        return {
            data: sessions,
            total,
            page,
            limit,
            hasMore,
        };
    }
    async cancelSession(sessionId, userId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.status !== 'active') {
            throw new Error('Only active sessions can be cancelled');
        }
        return await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'cancelled',
                closedByUserId: userId,
                endTime: new Date(),
            },
        });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map