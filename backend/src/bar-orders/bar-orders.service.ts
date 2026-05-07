import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateBarOrderDto,
  UpdateBarOrderStatusDto,
} from './dto/bar-order.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class BarOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async createOrder(createBarOrderDto: CreateBarOrderDto, userId?: string) {
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
      if (customerId && customerId !== session.customerId) {
        throw new Error('Selected customer does not match the selected session');
      }
      if (!customerId) customerId = session.customerId;
    }

    if (!customerId) {
      throw new Error('Unable to resolve customer for this order');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new Error('Customer not found');

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

      let unitPrice = Number(product.price);

      // Special pricing for Staff and Owners
      // Categories 'water' or 'mineral_water' get costPrice
      const isWater =
        product.category?.toLowerCase().includes('water') ||
        product.name?.toLowerCase().includes('مياه') ||
        product.name?.toLowerCase().includes('مياة');

      if (customer.customerType === 'owner_discount') {
        if (isWater) {
          unitPrice = Number(product.costPrice);
        } else {
          unitPrice = Number(product.price) * 0.3; // 70% discount
        }
      } else if (customer.customerType === 'staff') {
        if (isWater) {
          unitPrice = Number(product.costPrice);
        } else {
          unitPrice = Number(product.price) * 0.5; // 50% discount
        }
      }

      const subtotal = unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const totalAmount = itemsToCreate.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await this.prisma.barOrder.create({
      data: {
        sessionId: createBarOrderDto.sessionId,
        customerId,
        createdByUserId: userId,
        guestCode: createBarOrderDto.guestCode,
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

  async createOrderByGuestCode(guestCode: string, items: { productId: string; quantity: number }[]) {
    const session = await this.prisma.session.findFirst({
      where: { guestCode, status: 'active' },
    });

    if (!session) {
      throw new Error('Guest code is invalid or session has ended');
    }

    return this.createOrder({
      sessionId: session.id,
      customerId: session.customerId,
      items,
      guestCode,
      notes: `طلب عبر الجوال (Guest Code: ${guestCode})`,
    });
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
    filters?: { status?: string; sessionId?: string; customerId?: string; guestCode?: string },

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
    if (filters?.guestCode) where.guestCode = filters.guestCode;


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

      if (!activeSession) {
        // Create a standalone invoice for the bar order if there is no active session
        await this.prisma.$transaction(async (tx) => {
          const invoiceNumber = `BAR-${Date.now().toString(36).toUpperCase()}`;
          const invoice = await tx.invoice.create({
            data: {
              customerId: order.customerId,
              invoiceNumber,
              createdByUserId: order.createdByUserId || order.customer.createdByUserId,
              totalAmount: Number(order.totalAmount),
              amountPaid: 0,
              remainingAmount: Number(order.totalAmount),
              paymentStatus: 'unpaid',
              notes: `طلب بار #${orderId.slice(0, 8)}`,
              items: {
                create: order.items.map((item: any) => ({
                  itemType: 'bar_order',
                  itemId: orderId,
                  description: item.product?.name ?? 'منتج بار',
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice),
                  total: Number(item.quantity) * Number(item.unitPrice),
                })),
              },
            },
          });

          await tx.barOrder.update({
            where: { id: orderId },
            data: { 
              invoiceId: invoice.id,
              status: updateStatusDto.status,
            },
          });
        });
        
        // Return updated order
        return this.getOrder(orderId);
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

    // Deduct inventory when delivered (if not already deducted)
    if (updateStatusDto.status === 'delivered') {
      try {
        await this.inventoryService.deductStockForOrder(orderId, updated.createdByUserId || updated.customer.createdByUserId);
      } catch (err) {
        console.error('Failed to deduct inventory:', err.message);
        // We don't throw here to avoid failing the order update, but it should be logged
      }
    }

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
