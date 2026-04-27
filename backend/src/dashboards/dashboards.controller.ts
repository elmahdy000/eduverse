import { BadRequestException, Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
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
      throw new BadRequestException(error.message);
    }
  }
}
