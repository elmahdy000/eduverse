import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RecordPaymentDto, RefundPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private getPaymentStatus(totalAmount: number, amountPaid: number) {
    if (amountPaid <= 0) {
      return 'unpaid';
    }
    if (amountPaid >= totalAmount) {
      return 'paid';
    }
    return 'partially_paid';
  }

  async recordPayment(recordPaymentDto: RecordPaymentDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: recordPaymentDto.invoiceId },
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const remainingAmount = Number(invoice.remainingAmount);
    if (recordPaymentDto.amount > remainingAmount) {
      throw new Error('Payment amount exceeds remaining invoice amount');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: recordPaymentDto.invoiceId,
          paymentMethod: recordPaymentDto.paymentMethod,
          amount: recordPaymentDto.amount,
          notes: recordPaymentDto.notes,
          recordedByUserId: userId,
        },
      });

      const totalAmount = Number(invoice.totalAmount);
      const updatedAmountPaid = Number((Number(invoice.amountPaid) + recordPaymentDto.amount).toFixed(2));
      const updatedRemaining = Number((totalAmount - updatedAmountPaid).toFixed(2));
      const paymentStatus = this.getPaymentStatus(totalAmount, updatedAmountPaid);

      await tx.invoice.update({
        where: { id: recordPaymentDto.invoiceId },
        data: {
          amountPaid: updatedAmountPaid,
          remainingAmount: Math.max(0, updatedRemaining),
          paymentStatus,
        },
      });

      return payment;
    });
  }

  async listPayments(
    page: number = 1,
    limit: number = 20,
    filters?: {
      invoiceId?: string;
      paymentMethod?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
    if (filters?.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.paidAt = {};
      if (filters.fromDate) {
        where.paidAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.paidAt.lte = new Date(filters.toDate);
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: true,
          recordedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + payments.length < total,
    };
  }

  async refundPayment(paymentId: string, refundDto: RefundPaymentDto, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });
    if (!payment) {
      throw new Error('Payment not found');
    }

    const originalAmount = Number(payment.amount);
    if (originalAmount <= 0) {
      throw new Error('Cannot refund a refund payment');
    }

    const refundAmount = refundDto.amount ?? originalAmount;
    if (refundAmount > originalAmount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }

    return this.prisma.$transaction(async (tx) => {
      const refundPayment = await tx.payment.create({
        data: {
          invoiceId: payment.invoiceId,
          paymentMethod: payment.paymentMethod,
          amount: -Math.abs(refundAmount),
          notes: refundDto.reason
            ? `Refund for payment ${paymentId}: ${refundDto.reason}`
            : `Refund for payment ${paymentId}`,
          recordedByUserId: userId,
        },
      });

      const invoice = payment.invoice;
      const totalAmount = Number(invoice.totalAmount);
      const adjustedPaid = Math.max(
        0,
        Number((Number(invoice.amountPaid) - refundAmount).toFixed(2)),
      );
      const adjustedRemaining = Number((totalAmount - adjustedPaid).toFixed(2));
      const paymentStatus = this.getPaymentStatus(totalAmount, adjustedPaid);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: adjustedPaid,
          remainingAmount: Math.max(0, adjustedRemaining),
          paymentStatus,
        },
      });

      return refundPayment;
    });
  }
}
