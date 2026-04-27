import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BarOrdersService } from './bar-orders.service';
import { BarOrdersController } from './bar-orders.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BarOrdersController],
  providers: [BarOrdersService],
})
export class BarOrdersModule {}
