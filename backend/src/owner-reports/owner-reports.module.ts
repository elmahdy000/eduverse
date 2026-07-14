import { Module } from '@nestjs/common';
import { OwnerReportsService } from './owner-reports.service';
import { OwnerReportsController } from './owner-reports.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerReportsController],
  providers: [OwnerReportsService],
})
export class OwnerReportsModule {}
