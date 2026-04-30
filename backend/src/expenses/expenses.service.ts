import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, CreateCategoryDto, CreateVendorDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  // Expenses
  async createExpense(userId: string, dto: CreateExpenseDto) {
    if (!userId) throw new Error('User ID is required');
    
    return this.prisma.expense.create({
      data: {
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        paymentMethod: dto.paymentMethod,
        status: dto.status || 'paid',
        receiptUrl: dto.receiptUrl,
        isRecurring: dto.isRecurring || false,
        frequency: dto.frequency,
        category: { connect: { id: dto.categoryId } },
        vendor: dto.vendorId ? { connect: { id: dto.vendorId } } : undefined,
        recordedByUser: { connect: { id: userId } },
        linkedUser: dto.linkedUserId ? { connect: { id: dto.linkedUserId } } : undefined,
      },
      include: {
        category: true,
        vendor: true,
        recordedByUser: { select: { firstName: true, lastName: true, email: true } },
        linkedUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findAllExpenses(query: {
    categoryId?: string;
    vendorId?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { categoryId, vendorId, fromDate, toDate, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          category: true,
          vendor: true,
          recordedByUser: { select: { firstName: true, lastName: true, email: true } },
          linkedUser: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + data.length < total,
    };
  }

  async findOneExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: true,
        recordedByUser: { select: { firstName: true, lastName: true, email: true } },
        linkedUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!expense) throw new NotFoundException('المصروف غير موجود');
    return expense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: dto,
    });
  }

  async removeExpense(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  // Categories
  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.expenseCategory.create({ data: dto });
  }

  async findAllCategories() {
    const categories = await this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });

    // إذا كانت القائمة فارغة، قم بإنشاء تصنيفات افتراضية
    if (categories.length === 0) {
      const defaults = [
        { name: 'إيجار', description: 'إيجار المكان الشهري' },
        { name: 'مرتبات', description: 'رواتب الموظفين والعمال' },
        { name: 'مشتريات بار', description: 'بن، حليب، عصائر، خامات' },
        { name: 'فواتير (كهرباء/مياه)', description: 'فواتير المرافق العامة' },
        { name: 'صيانة', description: 'صيانة الأجهزة والأثاث' },
        { name: 'تسويق', description: 'إعلانات ومطبوعات' },
        { name: 'نثريات', description: 'مصاريف متنوعة بسيطة' },
      ];

      await this.prisma.expenseCategory.createMany({
        data: defaults,
      });

      return this.prisma.expenseCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { expenses: true } } },
      });
    }

    return categories;
  }

  // Vendors
  async createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  async findAllVendors() {
    const vendors = await this.prisma.vendor.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });

    if (vendors.length === 0) {
      await this.prisma.vendor.create({
        data: { name: 'مورد عام / نثريات', category: 'متنوع' },
      });
      return this.prisma.vendor.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { expenses: true } } },
      });
    }

    return vendors;
  }

  // Financial Summary
  async getFinancialSummary(query: { fromDate?: string; toDate?: string }) {
    const { fromDate, toDate } = query;
    const dateRange: any = {};
    
    if (fromDate) {
      const d = new Date(fromDate);
      if (!isNaN(d.getTime())) dateRange.gte = d;
    }
    if (toDate) {
      const d = new Date(toDate);
      if (!isNaN(d.getTime())) dateRange.lte = d;
    }

    const [expensesByCategory, totalExpenses, totalRevenue] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: Object.keys(dateRange).length > 0 ? { date: dateRange } : {},
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: Object.keys(dateRange).length > 0 ? { date: dateRange } : {},
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: Object.keys(dateRange).length > 0 ? { paidAt: dateRange } : {},
        _sum: { amount: true },
      }),
    ]);

    // Map category names
    const categories = await this.findAllCategories();
    const breakdown = expensesByCategory.map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: cat?.name || 'غير مصنف',
        total: Number(item._sum.amount || 0),
      };
    });

    const expensesTotal = Number(totalExpenses._sum.amount || 0);
    const revenueTotal = Number(totalRevenue._sum.amount || 0);

    return {
      revenueTotal,
      expensesTotal,
      netProfit: revenueTotal - expensesTotal,
      breakdown,
    };
  }
}
