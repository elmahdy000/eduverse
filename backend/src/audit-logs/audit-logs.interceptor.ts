import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
  constructor(private auditLogsService: AuditLogsService) {}

  private isMutation(method: string) {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  private isUuid(value: string | undefined) {
    if (!value) {
      return false;
    }
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private resolveEntityType(baseUrl: string | undefined) {
    const clean = String(baseUrl || '').replace(/^\/+/, '');
    return clean ? clean.split('/')[0].replace(/-/g, '_') : null;
  }

  private resolveEntityTypeFromUrl(url: string | undefined) {
    const clean = String(url || '')
      .replace(/\?.*$/, '')
      .replace(/^\/+/, '');
    return clean ? clean.split('/')[0].replace(/-/g, '_') : null;
  }

  private resolveEntityId(request: any, responseBody: any) {
    const pathId = request?.params?.id;
    if (this.isUuid(pathId)) {
      return pathId;
    }

    const bodyId = responseBody?.data?.id;
    if (this.isUuid(bodyId)) {
      return bodyId;
    }

    return null;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = String(request?.method || 'GET');

    if (!this.isMutation(method)) {
      return next.handle();
    }

    const userId = request?.user?.userId;
    if (!this.isUuid(userId)) {
      return next.handle();
    }

    const entityType =
      this.resolveEntityType(request?.baseUrl) ||
      this.resolveEntityTypeFromUrl(request?.originalUrl);
    if (!entityType || entityType === 'audit_logs') {
      return next.handle();
    }

    const action = `${method.toUpperCase()} ${String(request?.originalUrl || '')}`;

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId = this.resolveEntityId(request, responseBody);
        if (!entityId) {
          return;
        }

        void this.auditLogsService.createAuditLog({
          userId,
          action,
          entityType,
          entityId,
          newValue: responseBody?.data ?? null,
          ipAddress: request?.ip || null,
          userAgent: request?.headers?.['user-agent'] || null,
        });
      }),
    );
  }
}
