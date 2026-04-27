import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log entry by ID' })
  async getAuditLog(@Param('id') logId: string) {
    try {
      const log = await this.auditLogsService.getAuditLog(logId);
      return {
        success: true,
        data: log,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List audit logs with filters' })
  async listAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    try {
      const result = await this.auditLogsService.listAuditLogs(Number(page), Number(limit), {
        entityType,
        entityId,
        userId,
        action,
        fromDate,
        toDate,
      });
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
