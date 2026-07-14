import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BarOrdersService } from './bar-orders.service';
import { BarOrdersController } from './bar-orders.controller';
import { GuestOrdersController } from './guest-orders.controller';
import { ProductsModule } from '../products/products.module';
import { BarOrdersGateway } from './bar-orders.gateway';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ProductsModule, InventoryModule, AuthModule],
  controllers: [BarOrdersController, GuestOrdersController],
  providers: [BarOrdersService, BarOrdersGateway],
  exports: [BarOrdersService, BarOrdersGateway],
})
export class BarOrdersModule {}
