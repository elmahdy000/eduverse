import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto, CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

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
      throw new BadRequestException(`خطة بنوع "${dto.packageType}" موجودة بالفعل`);
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        packageType: dto.packageType,
        durationDays: dto.durationDays,
        price: dto.price,
        description: dto.description,
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
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
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
        ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deletePlan(id: string) {
    await this.findPlan(id);
    // Check if there are active subscriptions using this plan
    const activeCount = await this.prisma.customerSubscription.count({
      where: { planId: id, status: 'active' },
    });
    if (activeCount > 0) {
      throw new BadRequestException(`لا يمكن حذف الباقة — يوجد ${activeCount} اشتراك نشط مرتبط بها`);
    }
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CUSTOMER SUBSCRIPTIONS (اشتراكات الطلاب)
  // ════════════════════════════════════════════════════════════════════════════

  async subscribe(dto: CreateSubscriptionDto) {
    const plan = await this.findPlan(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('هذه الباقة غير متاحة حالياً');
    }

    // Check customer exists
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('العميل غير موجود');

    // Check for overlapping active subscription of same type
    const existing = await this.prisma.customerSubscription.findFirst({
      where: {
        customerId: dto.customerId,
        packageType: plan.packageType,
        status: 'active',
        endDate: { gte: new Date() },
      },
    });
    if (existing) {
      throw new BadRequestException(`العميل لديه اشتراك ${plan.packageType} نشط بالفعل حتى ${existing.endDate.toISOString().slice(0, 10)}`);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.customerSubscription.create({
      data: {
        customerId: dto.customerId,
        planId: plan.id,
        packageType: plan.packageType,
        startDate,
        endDate,
        pricePaid: dto.pricePaid ?? Number(plan.price),
        notes: dto.notes,
      },
      include: { customer: true, plan: true },
    });
  }

  async findAllSubscriptions(filters: {
    customerId?: string;
    status?: string;
    packageType?: string;
    page?: number;
    limit?: number;
  }) {
    const { customerId, status, packageType, page = 1, limit = 20 } = filters;
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

  async cancelSubscription(id: string) {
    const sub = await this.findSubscription(id);
    if (sub.status !== 'active') {
      throw new BadRequestException('لا يمكن إلغاء اشتراك غير نشط');
    }
    return this.prisma.customerSubscription.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { customer: true, plan: true },
    });
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
