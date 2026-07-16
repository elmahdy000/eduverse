import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateBarOrderDto,
  UpdateBarOrderStatusDto,
} from './dto/bar-order.dto';
import { InventoryService } from '../inventory/inventory.service';

// التصنيفات المستثناة من الخصم (ساقعة/تلاجة/معلبات) — بتتباع بسعرها الكامل
const NON_DISCOUNTED_CATEGORIES = ['cans', 'can', 'water', 'juice'];

function isNonDiscountedProduct(product: any): boolean {
  // 1) المصدر الأساسي المضمون: العلامة الصريحة على المنتج
  if (product.isFridge || product.isBakery) {
    return true;
  }

  const nameLower = product.name?.toLowerCase() || '';
  const categoryLower = product.category?.toLowerCase() || '';

  // 2) التصنيف الصريح (أدق من تخمين الاسم)
  if (NON_DISCOUNTED_CATEGORIES.some((c) => categoryLower === c)) {
    return true;
  }

  // 1. Water
  if (
    categoryLower.includes('water') ||
    nameLower.includes('مياه') ||
    nameLower.includes('مياة') ||
    nameLower.includes('ماء') ||
    nameLower.includes('water')
  ) {
    return true;
  }

  // 2. Canned / Packed / Cold Cans
  if (
    categoryLower.includes('cans') ||
    categoryLower.includes('can') ||
    nameLower.includes('بيبسي') ||
    nameLower.includes('pepsi') ||
    nameLower.includes('كولا') ||
    nameLower.includes('cola') ||
    nameLower.includes('سفن') ||
    nameLower.includes('seven') ||
    nameLower.includes('سبرايت') ||
    nameLower.includes('sprite') ||
    nameLower.includes('ريد بول') ||
    nameLower.includes('red bull') ||
    nameLower.includes('redbull') ||
    nameLower.includes('بيريل') ||
    nameLower.includes('birell') ||
    nameLower.includes('فيروز') ||
    nameLower.includes('fayrouz') ||
    nameLower.includes('شوويبس') ||
    nameLower.includes('schweppes') ||
    nameLower.includes('معلب') ||
    nameLower.includes('ساقع')
  ) {
    return true;
  }

  return false;
}

// حساب سعر الوحدة بعد تطبيق خصم نوع العميل (owner_discount 70% / staff 50%)
// مع استثناء منتجات التلاجة/المعلبات/المياه (تتباع بسعرها الكامل).
function computeUnitPrice(product: any, customerType?: string): number {
  const basePrice = Number(product.price);
  if (isNonDiscountedProduct(product)) {
    return basePrice;
  }
  if (customerType === 'owner_discount') {
    return basePrice * 0.3; // خصم 70%
  }
  if (customerType === 'staff') {
    return basePrice * 0.5; // خصم 50%
  }
  return basePrice;
}

@Injectable()
export class BarOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async createOrder(createBarOrderDto: CreateBarOrderDto, userId?: string) {
    if (!createBarOrderDto.customerId && !createBarOrderDto.sessionId) {
      throw new BadRequestException('Either customerId or sessionId is required');
    }
    if (!createBarOrderDto.items || createBarOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let customerId = createBarOrderDto.customerId;

    if (createBarOrderDto.sessionId) {
      const session = await this.prisma.session.findUnique({
        where: { id: createBarOrderDto.sessionId },
      });
      if (!session) throw new NotFoundException('Session not found');
      // لا يُسمح بإضافة طلبات لجلسة غير نشطة (مقفولة/ملغاة)
      if (session.status !== 'active') {
        throw new BadRequestException('لا يمكن إضافة طلب على جلسة غير نشطة');
      }
      if (customerId && customerId !== session.customerId) {
        throw new BadRequestException('Selected customer does not match the selected session');
      }
      if (!customerId) customerId = session.customerId;
    }

    if (!customerId) {
      throw new BadRequestException('Unable to resolve customer for this order');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.status === 'blacklisted') {
      throw new BadRequestException('هذا العميل في القائمة السوداء، لا يمكن استلام طلبات منه');
    }

    const productIds = createBarOrderDto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    const productsMap = new Map<string, any>(products.map((p: any) => [p.id, p]));
    const itemsToCreate = createBarOrderDto.items.map((item) => {
      const product = productsMap.get(item.productId);
      if (!product) throw new NotFoundException('Product not found');
      if (!product.active || !product.availability) {
        throw new BadRequestException(`Product "${product.name}" is not available`);
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(`Invalid quantity for product "${product.name}"`);
      }

      const unitPrice = computeUnitPrice(product, customer.customerType);
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

  async validateGuestCode(guestCode: string) {
    const OWNER_CODES: Record<string, { name: string; phone: string }> = {
      '1': { name: 'Mahmoud Elmahdy', phone: '01000000001' },
      '2': { name: 'Khaled Salah', phone: '01000000002' },
      '3': { name: 'Mahmoud Ezz', phone: '01000000003' },
      '4': { name: 'Mahmoud Abd-elrabo', phone: '01000000004' },
      '5': { name: 'Mohamed Abdelazim', phone: '01000000005' },
      '6': { name: 'Nada Elbaz', phone: '01000000006' },
    };

    if (OWNER_CODES[guestCode]) {
      const ownerInfo = OWNER_CODES[guestCode];
      // Find or create customer
      let customer = await this.prisma.customer.findFirst({
        where: {
          fullName: { equals: ownerInfo.name, mode: 'insensitive' },
        },
      });

      if (!customer) {
        // Find first active user to be creator
        const firstUser = await this.prisma.user.findFirst({
          where: { status: 'active' },
        });
        if (!firstUser) throw new Error('No active user found to create customer');

        customer = await this.prisma.customer.create({
          data: {
            fullName: ownerInfo.name,
            phoneNumber: ownerInfo.phone,
            customerType: 'owner_discount',
            createdByUserId: firstUser.id,
            status: 'active',
          },
        });
      }

      // Check if session is already active
      let session = await this.prisma.session.findFirst({
        where: { guestCode, status: 'active' },
      });

      if (!session) {
        // Create an active session for the owner
        const creatorUser = await this.prisma.user.findFirst({
          where: { status: 'active' },
        });
        if (!creatorUser) throw new Error('No active user found to open session');

        await this.prisma.session.create({
          data: {
            customerId: customer.id,
            sessionType: 'daily',
            startTime: new Date(),
            status: 'active',
            guestCode,
            openedByUserId: creatorUser.id,
          },
        });
      }
      return true;
    }

    const session = await this.prisma.session.findFirst({
      where: { guestCode, status: 'active' },
    });
    return !!session;
  }

  async createOrderByGuestCode(guestCode: string, items: { productId: string; quantity: number }[], notes?: string) {
    // Initialize session if it is a special owner code
    await this.validateGuestCode(guestCode);

    const session = await this.prisma.session.findFirst({
      where: { guestCode, status: 'active' },
    });

    if (!session) {
      throw new BadRequestException('Guest code is invalid or session has ended');
    }

    return this.createOrder({
      sessionId: session.id,
      customerId: session.customerId,
      items,
      guestCode,
      notes: notes ? `${notes} (Guest Code: ${guestCode})` : `طلب عبر الجوال (Guest Code: ${guestCode})`,
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
    if (!order) throw new NotFoundException('Order not found');
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

  async updateOrderStatus(orderId: string, updateStatusDto: UpdateBarOrderStatusDto, userId: string) {
    const order = await this.getOrder(orderId);

    const allowedTransitions: Record<string, string[]> = {
      new: ['in_preparation', 'cancelled'],
      in_preparation: ['ready', 'cancelled'],
      ready: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    if (updateStatusDto.status !== order.status && !allowedTransitions[order.status]?.includes(updateStatusDto.status)) {
      throw new BadRequestException(`Invalid order transition from ${order.status} to ${updateStatusDto.status}`);
    }

    // Prevent changing the status of an already delivered order to avoid stock and invoice conflicts
    if (order.status === 'delivered' && updateStatusDto.status !== 'delivered') {
      throw new BadRequestException('Cannot change the status of an already delivered order');
    }

    if (updateStatusDto.status === 'delivered' && order.status !== 'delivered') {
      if (!order.customerId) throw new BadRequestException('Cannot deliver order without customer');

      // لو الأوردر متحاسب بالفعل ضمن جلسة نشطة، الفاتورة هتتولّد عند إغلاق الجلسة
      const activeSession = order.sessionId
        ? await this.prisma.session.findFirst({
            where: { id: order.sessionId, status: 'active' },
          })
        : null;

      // نعمل فاتورة standalone فقط لو:
      // (أ) مفيش جلسة نشطة مرتبطة، و
      // (ب) الأوردر لسه مش مربوط بأي فاتورة (منع الاحتساب المزدوج).
      // خصم المخزون داخل نفس الـ transaction لضمان اتساق البيانات
      // (deductStockForOrder له حماية داخلية ضد التكرار عبر referenceId)
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
        const lockedOrder = await tx.barOrder.findUnique({
          where: { id: orderId },
          include: { customer: true, items: { include: { product: true } } },
        });
        if (!lockedOrder) throw new NotFoundException('Order not found');
        if (lockedOrder.status === 'delivered') return;
        if (lockedOrder.status !== 'ready') throw new BadRequestException('Only ready orders can be delivered');
        const lockedActiveSession = lockedOrder.sessionId
          ? await tx.session.findFirst({ where: { id: lockedOrder.sessionId, status: 'active' } })
          : null;
        const needsStandaloneInvoice = !lockedActiveSession && !lockedOrder.invoiceId;
        if (needsStandaloneInvoice) {
          const invoiceNumber = `BAR-${Date.now().toString(36).toUpperCase()}`;
          const invoice = await tx.invoice.create({
            data: {
              customerId: lockedOrder.customerId,
              invoiceNumber,
              createdByUserId: lockedOrder.createdByUserId || lockedOrder.customer.createdByUserId,
              totalAmount: Number(lockedOrder.totalAmount),
              amountPaid: 0,
              remainingAmount: Number(lockedOrder.totalAmount),
              paymentStatus: Number(lockedOrder.totalAmount) === 0 ? 'paid' : 'unpaid',
              notes: `طلب بار #${orderId.slice(0, 8)}`,
              items: {
                create: lockedOrder.items.map((item: any) => ({
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
        } else {
          await tx.barOrder.update({
            where: { id: orderId },
            data: { status: updateStatusDto.status },
          });
        }

        // خصم المخزون ضمن نفس المعاملة — لو فشل، ترجع المعاملة بالكامل
        await this.inventoryService.deductStockForOrderTx(tx, orderId, userId);
      });

      return this.getOrder(orderId);
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

  async cancelOrder(orderId: string, userId: string, _reason?: string) {
    const order = await this.getOrder(orderId);
    if (order.status === 'delivered') {
      throw new BadRequestException('Cannot cancel a delivered order');
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

  async cancelGuestOrder(orderId: string, guestCode: string) {
    const order = await this.getOrder(orderId);
    if (order.guestCode !== guestCode) {
      throw new ForbiddenException('Unauthorized access to this order');
    }

    const now = Date.now();
    const createdAt = new Date(order.createdAt).getTime();
    const diffSeconds = (now - createdAt) / 1000;

    if (diffSeconds > 10) {
      throw new BadRequestException('Cancellation window (10s) has expired');
    }

    if (order.status !== 'new') {
      throw new BadRequestException('Order is already being prepared and cannot be cancelled');
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

  async updateOrderItems(orderId: string, items: { productId: string; quantity: number }[]) {
    const order = await this.getOrder(orderId);
    if (order.status === 'delivered') {
      throw new BadRequestException('Cannot edit a delivered order');
    }
    // لو الأوردر اتحاسب بالفعل (متربط بفاتورة) مش مسموح بتعديله لتفادي اختلاف الفاتورة عن الطلب
    if (order.invoiceId) {
      throw new BadRequestException('لا يمكن تعديل طلب تم إصدار فاتورة له بالفعل');
    }
    // لو الأوردر مربوط بجلسة، لازم تكون الجلسة لسه نشطة (مش مقفولة/ملغاة)
    if (order.sessionId && order.session && order.session.status !== 'active') {
      throw new BadRequestException('لا يمكن تعديل طلب على جلسة غير نشطة');
    }
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const customer = order.customer;
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productsMap = new Map<string, any>(products.map((p: any) => [p.id, p]));
    const itemsToCreate = items.map((item) => {
      const product = productsMap.get(item.productId);
      if (!product) throw new NotFoundException('Product not found');
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(`Invalid quantity for product "${product.name}"`);
      }

      const unitPrice = computeUnitPrice(product, customer.customerType);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const totalAmount = itemsToCreate.reduce((sum, item) => sum + item.subtotal, 0);

    return this.prisma.$transaction(async (tx) => {
      await tx.barOrderItem.deleteMany({ where: { orderId } });
      return tx.barOrder.update({
        where: { id: orderId },
        data: {
          totalAmount,
          items: { create: itemsToCreate },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });
    });
  }

  async getBaristaDashboard() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [newOrders, inPreparationOrders, readyOrders, deliveredToday, deliveredOrders] = await Promise.all([
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
      this.prisma.barOrder.findMany({
        where: { status: 'delivered', updatedAt: { gte: startOfDay } },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { updatedAt: 'desc' },
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
      deliveredTodayOrders: deliveredOrders,
      counts: {
        new: newOrders.length,
        inPreparation: inPreparationOrders.length,
        ready: readyOrders.length,
        deliveredToday,
      },
    };
  }
}
