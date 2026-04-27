import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    getAuditLog(logId: string): Promise<{
        success: boolean;
        data: {
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
        };
        timestamp: string;
    }>;
    listAuditLogs(page?: string, limit?: string, entityType?: string, entityId?: string, userId?: string, action?: string, fromDate?: string, toDate?: string): Promise<{
        success: boolean;
        data: {
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
        };
        timestamp: string;
    }>;
}
