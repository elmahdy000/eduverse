import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber() {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const base = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
      now.getUTCDate(),
    )}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;

    for (let i = 0; i < 10; i += 1) {
      const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
      const invoiceNumber = `INV-${base}-${suffix}`;
      const exists = await this.prisma.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (!exists) {
        return invoiceNumber;
      }
    }

    throw new Error('Unable to generate unique invoice number');
  }

  async generateInvoice(createInvoiceDto: CreateInvoiceDto, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      return await this.generateInvoiceWithTx(createInvoiceDto, userId, tx);
    });
  }

  async generateInvoiceWithTx(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
    tx: any, // Using any for Prisma transaction client
  ) {
    if (createInvoiceDto.discountAmount && createInvoiceDto.discountPercent) {
      throw new Error('Use either discountAmount or discountPercent, not both');
    }

    const session = await tx.session.findUnique({
      where: { id: createInvoiceDto.sessionId },
      include: {
        customer: true,
        barOrders: {
          where: {
            status: { not: 'cancelled' },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        invoice: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }
    if (session.invoice) {
      return tx.invoice.findUnique({
        where: { id: session.invoice.id },
        include: {
          customer: true,
          session: true,
          items: true,
          payments: {
            orderBy: { paidAt: 'desc' },
          },
        },
      });
    }

    const sessionAmount = Number(session.chargeAmount ?? 0);
    const barOrdersAmount = session.barOrders.reduce(
      (sum: number, order: any) => sum + Number(order.totalAmount ?? 0),
      0,
    );
    const subtotal = sessionAmount + barOrdersAmount;

    const discountAmount = createInvoiceDto.discountAmount
      ? createInvoiceDto.discountAmount
      : createInvoiceDto.discountPercent
        ? Number(((subtotal * createInvoiceDto.discountPercent) / 100).toFixed(2))
        : 0;

    const taxAmount = 0;
    const totalAmount = Math.max(0, Number((subtotal - discountAmount + taxAmount).toFixed(2)));

    const invoiceNumber = await this.generateInvoiceNumberWithTx(tx);

    const createdInvoice = await tx.invoice.create({
      data: {
        customerId: session.customerId,
        sessionId: session.id,
        invoiceNumber,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        remainingAmount: totalAmount,
        paymentStatus: totalAmount === 0 ? 'paid' : 'unpaid',
        notes: createInvoiceDto.notes,
        createdByUserId: userId,
      },
    });

    const itemsData: any[] = [];

    if (sessionAmount > 0) {
      itemsData.push({
        invoiceId: createdInvoice.id,
        itemType: 'session',
        itemId: null,
        description: `Session charge (${session.sessionType})`,
        quantity: 1,
        unitPrice: sessionAmount,
        total: sessionAmount,
      });
    }

    for (const order of session.barOrders) {
      const orderTotal = Number(order.totalAmount ?? 0);
      if (orderTotal <= 0) {
        continue;
      }

      const itemsDesc = order.items
        .map((item: any) => `${item.quantity}x ${item.product?.name ?? 'منتج'}`)
        .join('، ');
      const description = itemsDesc ? `طلب بار: ${itemsDesc}` : `طلب بار #${order.id.slice(0, 8)}`;

      itemsData.push({
        invoiceId: createdInvoice.id,
        itemType: 'bar_order',
        itemId: order.id,
        description,
        quantity: 1,
        unitPrice: orderTotal,
        total: orderTotal,
      });
    }

    if (discountAmount > 0) {
      itemsData.push({
        invoiceId: createdInvoice.id,
        itemType: 'discount',
        itemId: null,
        description: 'Discount',
        quantity: 1,
        unitPrice: -discountAmount,
        total: -discountAmount,
      });
    }

    if (itemsData.length > 0) {
      await tx.invoiceItem.createMany({
        data: itemsData,
      });
    }

    return tx.invoice.findUnique({
      where: { id: createdInvoice.id },
      include: {
        customer: true,
        session: true,
        items: true,
        payments: true,
      },
    });
  }

  private async generateInvoiceNumberWithTx(tx: any) {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const base = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
      now.getUTCDate(),
    )}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;

    for (let i = 0; i < 10; i += 1) {
      const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
      const invoiceNumber = `INV-${base}-${suffix}`;
      const exists = await tx.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (!exists) {
        return invoiceNumber;
      }
    }

    throw new Error('Unable to generate unique invoice number');
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        session: {
          include: {
            room: true,
            booking: true,
            barOrders: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        items: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  async listInvoices(
    page: number = 1,
    limit: number = 20,
    filters?: {
      customerId?: string;
      paymentStatus?: string;
      sessionId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters?.sessionId) {
      where.sessionId = filters.sessionId;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.issuedAt = {};
      if (filters.fromDate) {
        where.issuedAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.issuedAt.lte = new Date(filters.toDate);
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + invoices.length < total,
    };
  }

  async getInvoicePrintPayload(invoiceId: string) {
    const invoice = await this.getInvoice(invoiceId);

    return {
      type: 'invoice_print_payload',
      invoice,
      generatedAt: new Date().toISOString(),
      printable: true,
    };
  }

  async getInvoicePayments(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payments = await this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });

    return {
      data: payments,
      total: payments.length,
      totalRecorded: Number(
        payments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2),
      ),
      remainingAmount: Number(invoice.remainingAmount),
    };
  }
}
