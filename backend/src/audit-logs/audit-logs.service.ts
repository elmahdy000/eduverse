import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async createAuditLog(entry: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValue: entry.oldValue as any,
        newValue: entry.newValue as any,
        ipAddress: entry.ipAddress ?? undefined,
        userAgent: entry.userAgent ?? undefined,
      },
    });
  }

  async listAuditLogs(
    page: number = 1,
    limit: number = 20,
    filters?: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
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

  async getAuditLog(logId: string) {
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
}
