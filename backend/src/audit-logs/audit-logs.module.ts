import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsInterceptor } from './audit-logs.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsInterceptor],
  exports: [AuditLogsService, AuditLogsInterceptor],
})
export class AuditLogsModule {}
