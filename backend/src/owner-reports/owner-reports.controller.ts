import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OwnerPortalGuard } from '../auth/role.guard';
import { OwnerReportsService } from './owner-reports.service';

/**
 * كل مسارات هذا الكونترولر محمية بـ JwtAuthGuard + OwnerPortalGuard.
 * فقط حسابات الـ OwnerPortal role يمكنها الوصول (منعزل عن Owner العادي).
 */
@ApiTags('owner-portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OwnerPortalGuard)
@Controller('owner-portal')
export class OwnerReportsController {
  constructor(private readonly service: OwnerReportsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'المؤشرات المالية والتشغيلية العامة' })
  async getKpis(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.service.getKpis(fromDate, toDate);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'تقرير الدخل التفصيلي' })
  async getRevenue(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.service.getRevenueReport(fromDate, toDate);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'تقرير المصروفات التفصيلي' })
  async getExpenses(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.service.getExpensesReport(fromDate, toDate);
  }

  @Get('profit')
  @ApiOperation({ summary: 'تقرير صافي الربح مع المقارنة' })
  async getProfit(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.service.getProfitReport(fromDate, toDate);
  }

  @Get('bar')
  @ApiOperation({ summary: 'تفاصيل مبيعات البار' })
  async getBar(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.service.getBarReport(fromDate, toDate);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'حالة المخزون + الهالك + الحركات الأخيرة' })
  async getInventory(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.service.getInventoryReport(fromDate, toDate);
  }
}
