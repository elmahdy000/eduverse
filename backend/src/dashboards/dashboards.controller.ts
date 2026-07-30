import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OwnerGuard, OpsManagerGuard, RoleGuard } from '../auth/role.guard';
import { DashboardsService } from './dashboards.service';

@ApiTags('dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(private dashboardsService: DashboardsService) {}

  @Get('owner')
  @ApiOperation({ summary: 'Owner dashboard summary' })
  async getOwnerDashboard() {
    try {
      const data = await this.dashboardsService.getOwnerDashboard();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('operations-manager')
  @ApiOperation({ summary: 'Operations manager dashboard' })
  async getOperationsDashboard() {
    try {
      const data = await this.dashboardsService.getOperationsDashboard();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('reception')
  @ApiOperation({ summary: 'Reception dashboard context' })
  async getReceptionDashboard() {
    try {
      const data = await this.dashboardsService.getReceptionDashboard();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('barista')
  @ApiOperation({ summary: 'Barista dashboard queue' })
  async getBaristaDashboard() {
    try {
      const data = await this.dashboardsService.getBaristaDashboard();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('operations-by-role')
  @ApiOperation({ summary: 'Operations by role report for Owner' })
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getOperationsByRole() {
    try {
      const data = await this.dashboardsService.getOperationsByRole();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('analytics')
  @ApiOperation({
    summary:
      'Financial analytics report (daily/weekly/monthly) for Owner & Ops',
  })
  @UseGuards(JwtAuthGuard, OpsManagerGuard)
  async getAnalytics(
    @Query('period') period?: string,
    @Query('date') date?: string,
  ) {
    try {
      const data = await this.dashboardsService.getAnalytics(period, date);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
