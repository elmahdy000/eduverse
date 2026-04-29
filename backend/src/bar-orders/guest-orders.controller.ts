import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BarOrdersService } from './bar-orders.service';
import { BarOrdersGateway } from './bar-orders.gateway';
import { ProductsService } from '../products/products.service';

@ApiTags('guest-orders')
@Controller('public/orders')
export class GuestOrdersController {
  constructor(
    private barOrdersService: BarOrdersService,
    private barOrdersGateway: BarOrdersGateway,
    private productsService: ProductsService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'List available products for guests' })
  async listProducts() {
    try {
      const result = await this.productsService.listProducts(1, 100);
      return {
        success: true,
        data: result.data.filter(p => p.availability && p.active),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Place order using guest code' })
  async placeOrder(@Body() body: { guestCode: string; items: any[] }) {
    try {
      if (!body.guestCode) throw new Error('Guest code is required');
      if (!body.items || body.items.length === 0) throw new Error('No items selected');

      const order = await this.barOrdersService.createOrderByGuestCode(
        body.guestCode,
        body.items,
      );

      // Emit real-time event — barista sees it instantly
      this.barOrdersGateway.emitNewOrder(order);
      this.barOrdersGateway.emitDashboardRefresh();

      return {
        success: true,
        data: order,
        message: 'Order placed successfully! The barista will prepare it soon.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('status/:guestCode')
  @ApiOperation({ summary: 'Get status of orders for a guest code' })
  async getStatus(@Param('guestCode') guestCode: string) {
    try {
      const result = await this.barOrdersService.listOrders(1, 10, {
        status: 'new,in_preparation,ready,delivered',
        guestCode,
      });

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
