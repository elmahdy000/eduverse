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
import { CreateInvoiceDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Generate invoice for session' })
  async generateInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: any) {
    try {
      const invoice = await this.invoicesService.generateInvoice(
        createInvoiceDto,
        req.user.userId,
      );
      return {
        success: true,
        data: invoice,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(@Param('id') invoiceId: string) {
    try {
      const invoice = await this.invoicesService.getInvoice(invoiceId);
      return {
        success: true,
        data: invoice,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/print')
  @ApiOperation({ summary: 'Get printable invoice payload' })
  async getPrintableInvoice(@Param('id') invoiceId: string) {
    try {
      const payload = await this.invoicesService.getInvoicePrintPayload(invoiceId);
      return {
        success: true,
        data: payload,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get all payments for an invoice' })
  async getInvoicePayments(@Param('id') invoiceId: string) {
    try {
      const payments = await this.invoicesService.getInvoicePayments(invoiceId);
      return {
        success: true,
        data: payments,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  async listInvoices(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('customerId') customerId?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('sessionId') sessionId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    try {
      const result = await this.invoicesService.listInvoices(Number(page), Number(limit), {
        customerId,
        paymentStatus,
        sessionId,
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
}
