import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { RecordPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record payment for invoice' })
  async recordPayment(@Body() recordPaymentDto: RecordPaymentDto, @Request() req: any) {
    try {
      const payment = await this.paymentsService.recordPayment(
        recordPaymentDto,
        req.user.userId,
      );
      return {
        success: true,
        data: payment,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  async listPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('invoiceId') invoiceId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    try {
      const result = await this.paymentsService.listPayments(Number(page), Number(limit), {
        invoiceId,
        paymentMethod,
        fromDate,
        toDate,
      });
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() refundDto: RefundPaymentDto,
    @Request() req: any,
  ) {
    try {
      const refundPayment = await this.paymentsService.refundPayment(
        paymentId,
        refundDto,
        req.user.userId,
      );
      return {
        success: true,
        data: refundPayment,
        message: 'Payment refunded',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
