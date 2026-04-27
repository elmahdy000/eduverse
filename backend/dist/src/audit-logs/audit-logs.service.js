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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let AuditLogsService = class AuditLogsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAuditLog(entry) {
        return this.prisma.auditLog.create({
            data: {
                userId: entry.userId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                oldValue: entry.oldValue,
                newValue: entry.newValue,
                ipAddress: entry.ipAddress ?? undefined,
                userAgent: entry.userAgent ?? undefined,
            },
        });
    }
    async listAuditLogs(page = 1, limit = 20, filters) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safePage = Math.max(page, 1);
        const skip = (safePage - 1) * safeLimit;
        const where = {};
        if (filters?.entityType) {
            where.entityType = filters.entityType;
        }
        if (filters?.entityId) {
            where.entityId = filters.entityId;
        }
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.action) {
            where.action = filters.action;
        }
        if (filters?.fromDate || filters?.toDate) {
            where.timestamp = {};
            if (filters.fromDate) {
                where.timestamp.gte = new Date(filters.fromDate);
            }
            if (filters.toDate) {
                where.timestamp.lte = new Date(filters.toDate);
            }
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { timestamp: 'desc' },
                skip,
                take: safeLimit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            data: logs,
            total,
            page: safePage,
            limit: safeLimit,
            hasMore: skip + logs.length < total,
        };
    }
    async getAuditLog(logId) {
        const log = await this.prisma.auditLog.findUnique({
            where: { id: logId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!log) {
            throw new Error('Audit log not found');
        }
        return log;
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map