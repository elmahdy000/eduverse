import { PrismaService } from '../common/prisma/prisma.service';
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    createAuditLog(entry: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        oldValue?: unknown;
        newValue?: unknown;
        ipAddress?: string | null;
        userAgent?: string | null;
    }): Promise<{
        id: string;
        action: string;
        timestamp: Date;
        entityType: string;
        entityId: string;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    }>;
    listAuditLogs(page?: number, limit?: number, filters?: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        action?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
            };
        } & {
            id: string;
            action: string;
            timestamp: Date;
            entityType: string;
            entityId: string;
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            userId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    getAuditLog(logId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        action: string;
        timestamp: Date;
        entityType: string;
        entityId: string;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    }>;
}
