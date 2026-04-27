import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
