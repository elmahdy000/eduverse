import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import {
  CreateBarOrderDto,
  UpdateBarOrderStatusDto,
} from './dto/bar-order.dto';
import { BarOrdersService } from './bar-orders.service';
import { BarOrdersGateway } from './bar-orders.gateway';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('bar-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('bar-orders')
export class BarOrdersController {
  constructor(
    private barOrdersService: BarOrdersService,
    private barOrdersGateway: BarOrdersGateway,
    private prisma: PrismaService,
  ) {}

  private async assertCanMutateOrder(user: any) {
    if (!user?.roleId) {
      throw new ForbiddenException('User role not found');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });

    if (role?.name === 'Operations Manager') {
      throw new ForbiddenException(
        'Operations Manager can view bar orders but cannot change order status',
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bar order' })
  async createOrder(@Body() createBarOrderDto: CreateBarOrderDto, @Request() req: any) {
    try {
      const order = await this.barOrdersService.createOrder(
        createBarOrderDto,
        req.user.userId,
      );
      // Emit real-time event
      this.barOrdersGateway.emitNewOrder(order);
      this.barOrdersGateway.emitDashboardRefresh();
      return {
        success: true,
        data: order,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bar order details' })
  async getOrder(@Param('id') orderId: string) {
    try {
      const order = await this.barOrdersService.getOrder(orderId);
      return {
        success: true,
        data: order,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List bar orders' })
  async listOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('sessionId') sessionId?: string,
    @Query('customerId') customerId?: string,
  ) {
    try {
      const result = await this.barOrdersService.listOrders(
        Number(page),
        Number(limit),
        {
          status,
          sessionId,
          customerId,
        },
      );
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update bar order status' })
  async updateStatus(
    @Param('id') orderId: string,
    @Body() updateStatusDto: UpdateBarOrderStatusDto,
    @Request() req: any,
  ) {
    try {
      await this.assertCanMutateOrder(req.user);
      const order = await this.barOrdersService.updateOrderStatus(
        orderId,
        updateStatusDto,
      );
      // Emit real-time event
      this.barOrdersGateway.emitOrderStatusUpdate(order);
      this.barOrdersGateway.emitDashboardRefresh();
      return {
        success: true,
        data: order,
        message: 'Order status updated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel bar order' })
  async cancelOrder(
    @Param('id') orderId: string,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ) {
    try {
      await this.assertCanMutateOrder(req?.user);
      const order = await this.barOrdersService.cancelOrder(orderId, reason);
      // Emit real-time event
      this.barOrdersGateway.emitOrderStatusUpdate(order);
      this.barOrdersGateway.emitDashboardRefresh();
      return {
        success: true,
        data: order,
        message: 'Order cancelled',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
