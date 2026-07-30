import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditLogsInterceptor } from './audit-logs.interceptor';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsInterceptor', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const entityId = '22222222-2222-4222-8222-222222222222';

  function createContext(responseBody: unknown) {
    const request = {
      method: 'POST',
      user: { userId },
      params: {},
      baseUrl: '/api/expenses',
      originalUrl: '/api/expenses',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of(responseBody) } as CallHandler;
    return { context, next };
  }

  it.each([
    ['direct response', { id: entityId, amount: 100 }],
    ['wrapped response', { data: { id: entityId, amount: 100 } }],
  ])('records mutations returned as a %s', (_label, responseBody) => {
    const createAuditLog = jest.fn().mockResolvedValue(undefined);
    const auditLogsService = {
      createAuditLog,
    } as unknown as AuditLogsService;
    const interceptor = new AuditLogsInterceptor(auditLogsService);
    const { context, next } = createContext(responseBody);

    interceptor.intercept(context, next).subscribe();

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        entityId,
        entityType: 'expenses',
        newValue:
          'data' in responseBody && responseBody.data
            ? responseBody.data
            : responseBody,
      }),
    );
  });
});
