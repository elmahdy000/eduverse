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
  HttpException,
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

    if (!role) {
      throw new ForbiddenException('User role not found');
    }

    const allowedRoles = [
      'barista',
      'receptionist',
      'owner',
      'operations manager',
    ];
    const roleName = (role.name || '').toLowerCase().trim();
    if (!allowedRoles.some((r) => roleName.includes(r) || roleName === r)) {
      throw new ForbiddenException(
        'Only Barista, Receptionist, Owner, or Operations Manager can modify bar orders',
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bar order' })
  async createOrder(
    @Body() createBarOrderDto: CreateBarOrderDto,
    @Request() req: any,
  ) {
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
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get barista dashboard' })
  async getDashboard() {
    return this.barOrdersService.getBaristaDashboard();
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
      if (error instanceof HttpException) throw error;
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
      if (error instanceof HttpException) throw error;
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
        req.user.userId,
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
      if (error instanceof HttpException) throw error;
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
      const order = await this.barOrdersService.cancelOrder(
        orderId,
        req.user.userId,
        reason,
      );
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
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Update bar order items (Edit order)' })
  async updateItems(
    @Param('id') orderId: string,
    @Body('items') items: { productId: string; quantity: number }[],
    @Request() req: any,
  ) {
    try {
      await this.assertCanMutateOrder(req.user);
      const order = await this.barOrdersService.updateOrderItems(
        orderId,
        items,
      );

      // Emit real-time event
      this.barOrdersGateway.emitOrderStatusUpdate(order);
      this.barOrdersGateway.emitDashboardRefresh();

      return {
        success: true,
        data: order,
        message: 'Order items updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
