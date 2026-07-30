import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION PLANS (الباقات وأسعارها)
  // ════════════════════════════════════════════════════════════════════════════

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { packageType: dto.packageType },
    });
    if (existing) {
      throw new BadRequestException(
        `خطة بنوع "${dto.packageType}" موجودة بالفعل`,
      );
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        packageType: dto.packageType,
        durationDays: dto.durationDays,
        price: dto.price,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllPlans(includeInactive = false) {
    return this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { durationDays: 'asc' },
    });
  }

  async findPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('الباقة غير موجودة');
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.findPlan(id);
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.durationDays !== undefined && {
          durationDays: dto.durationDays,
        }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deletePlan(id: string) {
    await this.findPlan(id);
    const usageCount = await this.prisma.customerSubscription.count({
      where: { planId: id },
    });
    if (usageCount === 0) {
      await this.prisma.subscriptionPlan.delete({ where: { id } });
      return { deleted: true, archived: false };
    }

    await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });
    return { deleted: false, archived: true, usageCount };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CUSTOMER SUBSCRIPTIONS (اشتراكات الطلاب)
  // ════════════════════════════════════════════════════════════════════════════

  async subscribe(dto: CreateSubscriptionDto, userId: string) {
    const plan = await this.findPlan(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('هذه الباقة غير متاحة حالياً');
    }

    // Check customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('العميل غير موجود');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${dto.customerId}:${plan.packageType}`}))`;

        const existing = await tx.customerSubscription.findFirst({
          where: {
            customerId: dto.customerId,
            packageType: plan.packageType,
            status: 'active',
            endDate: { gte: startDate },
          },
        });
        if (existing) {
          throw new BadRequestException(
            `العميل لديه اشتراك ${plan.packageType} نشط بالفعل حتى ${existing.endDate.toISOString().slice(0, 10)}`,
          );
        }

        const price = Number(plan.price);
        const paymentMethod = dto.paymentMethod ?? '';
        if (price > 0) {
          if (!paymentMethod) {
            throw new BadRequestException(
              'طريقة الدفع مطلوبة للاشتراكات المدفوعة',
            );
          }
          const openShift = await tx.shift.findFirst({
            where: { userId, status: 'open' },
          });
          if (!openShift)
            throw new BadRequestException('يجب فتح شفت أولاً قبل بيع الاشتراك');
        }

        const subscription = await tx.customerSubscription.create({
          data: {
            customerId: dto.customerId,
            planId: plan.id,
            packageType: plan.packageType,
            startDate,
            endDate,
            pricePaid: price,
            notes: dto.notes,
            createdByUserId: userId,
          },
        });

        const invoice = await tx.invoice.create({
          data: {
            customerId: dto.customerId,
            invoiceNumber: `SUB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
            subtotal: price,
            totalAmount: price,
            amountPaid: price,
            remainingAmount: 0,
            paymentStatus: 'paid',
            notes: `اشتراك ${plan.name}`,
            createdByUserId: userId,
            items: {
              create: {
                itemType: 'service',
                description: `اشتراك ${plan.name} (${plan.durationDays} يوم)`,
                quantity: 1,
                unitPrice: price,
                total: price,
              },
            },
          },
        });

        if (price > 0) {
          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              paymentMethod,
              amount: price,
              notes: `تحصيل اشتراك ${plan.name}`,
              recordedByUserId: userId,
            },
          });
        }

        return tx.customerSubscription.update({
          where: { id: subscription.id },
          data: { invoiceId: invoice.id },
          include: {
            customer: true,
            plan: true,
            invoice: { include: { payments: true } },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findAllSubscriptions(filters: {
    customerId?: string;
    status?: string;
    packageType?: string;
    page?: number;
    limit?: number;
  }) {
    const { customerId, status, packageType } = filters;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (packageType) where.packageType = packageType;

    const [data, total] = await Promise.all([
      this.prisma.customerSubscription.findMany({
        where,
        include: { customer: true, plan: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customerSubscription.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findSubscription(id: string) {
    const sub = await this.prisma.customerSubscription.findUnique({
      where: { id },
      include: { customer: true, plan: true, sessions: true },
    });
    if (!sub) throw new NotFoundException('الاشتراك غير موجود');
    return sub;
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    await this.findSubscription(id);
    return this.prisma.customerSubscription.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { customer: true, plan: true },
    });
  }

  async cancelSubscription(id: string, userId: string) {
    const sub = await this.findSubscription(id);
    if (sub.status !== 'active') {
      throw new BadRequestException('لا يمكن إلغاء اشتراك غير نشط');
    }
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        const current = await tx.customerSubscription.findUnique({
          where: { id },
          include: {
            invoice: {
              include: {
                payments: {
                  where: { amount: { gt: 0 } },
                  orderBy: { paidAt: 'asc' },
                },
              },
            },
          },
        });
        if (!current || current.status !== 'active') {
          throw new BadRequestException('لا يمكن إلغاء اشتراك غير نشط');
        }

        if (current.invoice && Number(current.invoice.amountPaid) > 0) {
          const openShift = await tx.shift.findFirst({
            where: { userId, status: 'open' },
          });
          if (!openShift)
            throw new BadRequestException(
              'يجب فتح شفت أولاً قبل رد قيمة الاشتراك',
            );
          if (!current.invoice.payments.length)
            throw new BadRequestException(
              'تعذر العثور على دفعة الاشتراك الأصلية',
            );
          let remainingRefund = Number(current.invoice.amountPaid);
          for (const originalPayment of current.invoice.payments) {
            if (remainingRefund <= 0) break;
            const refundAmount = Math.min(
              Number(originalPayment.amount),
              remainingRefund,
            );
            await tx.payment.create({
              data: {
                invoiceId: current.invoice.id,
                paymentMethod: originalPayment.paymentMethod,
                amount: -refundAmount,
                notes: `رد قيمة اشتراك ملغي #${id.slice(0, 8)}`,
                recordedByUserId: userId,
                refundedPaymentId: originalPayment.id,
              },
            });
            remainingRefund -= refundAmount;
          }
          if (remainingRefund > 0.001) {
            throw new BadRequestException(
              'قيمة الدفعات الأصلية لا تكفي لإتمام رد الاشتراك',
            );
          }
          await tx.invoice.update({
            where: { id: current.invoice.id },
            data: {
              amountPaid: 0,
              remainingAmount: 0,
              paymentStatus: 'refunded',
            },
          });
        }

        return tx.customerSubscription.update({
          where: { id },
          data: { status: 'cancelled' },
          include: {
            customer: true,
            plan: true,
            invoice: { include: { payments: true } },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /** Auto-expire subscriptions that passed their endDate */
  async expireOverdue() {
    const result = await this.prisma.customerSubscription.updateMany({
      where: {
        status: 'active',
        endDate: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
    return { expired: result.count };
  }

  /** Check if a customer has an active subscription (used by sessions) */
  async getActiveSubscription(customerId: string) {
    return this.prisma.customerSubscription.findFirst({
      where: {
        customerId,
        status: 'active',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });
  }
}
