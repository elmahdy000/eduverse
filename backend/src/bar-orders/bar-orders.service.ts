import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateBarOrderDto,
  UpdateBarOrderStatusDto,
} from './dto/bar-order.dto';

@Injectable()
export class BarOrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(createBarOrderDto: CreateBarOrderDto, userId: string) {
    if (!createBarOrderDto.customerId && !createBarOrderDto.sessionId) {
      throw new Error('Either customerId or sessionId is required');
    }
    if (!createBarOrderDto.items || createBarOrderDto.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    let customerId = createBarOrderDto.customerId;

    if (createBarOrderDto.sessionId) {
      const session = await this.prisma.session.findUnique({
        where: { id: createBarOrderDto.sessionId },
      });
      if (!session) throw new Error('Session not found');
      if (!customerId) customerId = session.customerId;
    }

    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) throw new Error('Customer not found');
    }

    const productIds = createBarOrderDto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new Error('One or more products were not found');
    }

    const productsMap = new Map<string, any>(products.map((p: any) => [p.id, p]));
    const itemsToCreate = createBarOrderDto.items.map((item) => {
      const product = productsMap.get(item.productId);
      if (!product) throw new Error('Product not found');
      if (!product.active || !product.availability) {
        throw new Error(`Product "${product.name}" is not available`);
      }
      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      return { productId: item.productId, quantity: item.quantity, unitPrice, subtotal };
    });

    const totalAmount = itemsToCreate.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await this.prisma.barOrder.create({
      data: {
        sessionId: createBarOrderDto.sessionId,
        customerId,
        createdByUserId: userId,
        status: 'new',
        totalAmount,
        notes: createBarOrderDto.notes,
        items: { create: itemsToCreate },
      },
      include: {
        customer: true,
        session: true,
        items: { include: { product: true } },
      },
    });

    return order;
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.barOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        session: true,
        createdByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: { include: { product: true } },
      },
    });
    if (!order) throw new Error('Order not found');
    return order;
  }

  async listOrders(
    page = 1,
    limit = 20,
    filters?: { status?: string; sessionId?: string; customerId?: string },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
    if (filters?.status) {
      const statuses = filters.status.split(',').map((v) => v.trim());
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (filters?.sessionId) where.sessionId = filters.sessionId;
    if (filters?.customerId) where.customerId = filters.customerId;

    const [orders, total] = await Promise.all([
      this.prisma.barOrder.findMany({
        where,
        include: {
          customer: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.barOrder.count({ where }),
    ]);

    // Add waitMinutes for each order
    const now = Date.now();
    const ordersWithWait = orders.map((o: any) => ({
      ...o,
      waitMinutes:
        o.status !== 'delivered' && o.status !== 'cancelled'
          ? Math.floor((now - new Date(o.createdAt).getTime()) / 60_000)
          : 0,
    }));

    return {
      data: ordersWithWait,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + orders.length < total,
    };
  }

  async updateOrderStatus(orderId: string, updateStatusDto: UpdateBarOrderStatusDto) {
    const order = await this.getOrder(orderId);

    if (updateStatusDto.status === 'delivered' && order.status !== 'delivered') {
      if (!order.customerId) throw new Error('Cannot deliver order without customer');

      const activeSession = order.sessionId
        ? await this.prisma.session.findFirst({
            where: { id: order.sessionId, status: 'active' },
          })
        : null;

      if (activeSession) {
        const currentCharge = Number(activeSession.chargeAmount || 0);
        const orderTotal = Number(order.totalAmount || 0);
        await this.prisma.session.update({
          where: { id: activeSession.id },
          data: { chargeAmount: currentCharge + orderTotal },
        });
      } else {
        // Create a standalone invoice for the bar order
        const invoiceNumber = `BAR-${Date.now().toString(36).toUpperCase()}`;
        const invoice = await this.prisma.invoice.create({
          data: {
            customerId: order.customerId,
            invoiceNumber,
            createdByUserId: order.createdByUserId,
            totalAmount: Number(order.totalAmount),
            amountPaid: 0,
            remainingAmount: Number(order.totalAmount),
            paymentStatus: 'unpaid',
            notes: `طلب بار #${orderId.slice(0, 8)}`,
            items: {
              create: order.items.map((item: any) => ({
                itemType: 'bar_order',
                description: item.product?.name ?? 'منتج بار',
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.quantity) * Number(item.unitPrice),
              })),
            },
          },
        });
        // Link invoice to order if field exists
        try {
          await this.prisma.barOrder.update({
            where: { id: orderId },
            data: { invoiceId: invoice.id } as any,
          });
        } catch {
          // Field may not exist in schema yet
        }
      }
    }

    const updated = await this.prisma.barOrder.update({
      where: { id: orderId },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return updated;
  }

  async cancelOrder(orderId: string, _reason?: string) {
    const order = await this.getOrder(orderId);
    if (order.status === 'delivered') {
      throw new Error('Cannot cancel a delivered order');
    }
    return this.prisma.barOrder.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  }

  async getBaristaDashboard() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [newOrders, inPreparationOrders, readyOrders, deliveredToday] = await Promise.all([
      this.prisma.barOrder.findMany({
        where: { status: 'new' },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.barOrder.findMany({
        where: { status: 'in_preparation' },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.barOrder.findMany({
        where: { status: 'ready' },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.barOrder.count({
        where: { status: 'delivered', updatedAt: { gte: startOfDay } },
      }),
    ]);

    const nowMs = Date.now();
    const addWait = (orders: any[]) =>
      orders.map((o) => ({
        ...o,
        waitMinutes: Math.floor((nowMs - new Date(o.createdAt).getTime()) / 60_000),
      }));

    return {
      newOrders: addWait(newOrders),
      inPreparationOrders: addWait(inPreparationOrders),
      readyOrders: addWait(readyOrders),
      deliveredTodayCount: deliveredToday,
      counts: {
        new: newOrders.length,
        inPreparation: inPreparationOrders.length,
        ready: readyOrders.length,
        deliveredToday,
      },
    };
  }
}
