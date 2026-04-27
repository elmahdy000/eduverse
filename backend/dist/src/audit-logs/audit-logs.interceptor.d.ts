import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsInterceptor implements NestInterceptor {
    private auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    private isMutation;
    private isUuid;
    private resolveEntityType;
    private resolveEntityTypeFromUrl;
    private resolveEntityId;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
