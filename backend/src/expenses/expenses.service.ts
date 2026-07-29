import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, CreateCategoryDto, UpdateCategoryDto, CreateVendorDto, UpdateVendorDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  // ── helpers ──
  private readonly expenseIncludes = {
    category: true,
    vendor: true,
    recordedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
    linkedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
  };

  private parseDateRange(fromDate?: string, toDate?: string) {
    const range: any = {};
    if (fromDate) {
      const d = new Date(fromDate);
      if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); range.gte = d; }
    }
    if (toDate) {
      const d = new Date(toDate);
      if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); range.lte = d; }
    }
    return Object.keys(range).length > 0 ? range : undefined;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // EXPENSES (المصروفات)
  // ════════════════════════════════════════════════════════════════════════════

  async createExpense(userId: string, dto: CreateExpenseDto) {
    if (!userId) throw new BadRequestException('User ID is required');

    // التأكد من وجود شفت مفتوح
    const openShift = await this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
    });
    if (!openShift) {
      throw new BadRequestException('يجب فتح شفت أولاً قبل تسجيل أي مصروفات');
    }

    // التأكد من وجود التصنيف
    const category = await this.prisma.expenseCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('التصنيف غير موجود');

    // التأكد من وجود المورد (لو تم إرساله)
    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('المورد غير موجود');
    }

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
      include: this.expenseIncludes,
    });
  }

  async findAllExpenses(query: {
    categoryId?: string;
    vendorId?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    paymentMethod?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { categoryId, vendorId, fromDate, toDate, status, paymentMethod, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const dateRange = this.parseDateRange(fromDate, toDate);
    if (dateRange) where.date = dateRange;

    // بحث في الوصف
    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: this.expenseIncludes,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + data.length < total,
    };
  }

  async findOneExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: this.expenseIncludes,
    });
    if (!expense) throw new NotFoundException('المصروف غير موجود');
    return expense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    const existing = await this.findOneExpense(id);
    if (existing.status === 'cancelled') {
      throw new BadRequestException('لا يمكن تعديل مصروف ملغي');
    }

    // التحقق من التصنيف الجديد
    if (dto.categoryId) {
      const cat = await this.prisma.expenseCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException('التصنيف غير موجود');
    }

    // التحقق من المورد الجديد
    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('المورد غير موجود');
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.vendorId !== undefined && { vendorId: dto.vendorId }),
        ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
        ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
        ...(dto.linkedUserId !== undefined && { linkedUserId: dto.linkedUserId }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: this.expenseIncludes,
    });
  }

  async removeExpense(id: string) {
    const existing = await this.findOneExpense(id);
    if (existing.status === 'cancelled') {
      throw new BadRequestException('المصروف ملغي بالفعل');
    }
    return this.prisma.expense.update({
      where: { id },
      data: { status: 'cancelled' },
      include: this.expenseIncludes,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CATEGORIES (التصنيفات)
  // ════════════════════════════════════════════════════════════════════════════

  async createCategory(dto: CreateCategoryDto) {
    const exists = await this.prisma.expenseCategory.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException(`تصنيف "${dto.name}" موجود بالفعل`);
    return this.prisma.expenseCategory.create({ data: dto });
  }

  async findAllCategories() {
    const categories = await this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });

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
      await this.prisma.expenseCategory.createMany({ data: defaults });
      return this.prisma.expenseCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { expenses: true } } },
      });
    }

    return categories;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('التصنيف غير موجود');

    if (dto.name && dto.name !== cat.name) {
      const dup = await this.prisma.expenseCategory.findUnique({ where: { name: dto.name } });
      if (dup) throw new BadRequestException(`تصنيف "${dto.name}" موجود بالفعل`);
    }

    return this.prisma.expenseCategory.update({ where: { id }, data: dto });
  }

  async removeCategory(id: string) {
    const cat = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('التصنيف غير موجود');

    const count = await this.prisma.expense.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new BadRequestException(`لا يمكن حذف التصنيف — مرتبط بـ ${count} مصروف`);
    }

    return this.prisma.expenseCategory.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VENDORS (الموردين)
  // ════════════════════════════════════════════════════════════════════════════

  async createVendor(dto: CreateVendorDto) {
    const exists = await this.prisma.vendor.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException(`مورد "${dto.name}" موجود بالفعل`);
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

  async updateVendor(id: string, dto: UpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('المورد غير موجود');

    if (dto.name && dto.name !== vendor.name) {
      const dup = await this.prisma.vendor.findUnique({ where: { name: dto.name } });
      if (dup) throw new BadRequestException(`مورد "${dto.name}" موجود بالفعل`);
    }

    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  async removeVendor(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('المورد غير موجود');

    const count = await this.prisma.expense.count({ where: { vendorId: id } });
    if (count > 0) {
      throw new BadRequestException(`لا يمكن حذف المورد — مرتبط بـ ${count} مصروف`);
    }

    return this.prisma.vendor.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FINANCIAL SUMMARY & ANALYTICS (الملخص المالي والتحليلات)
  // ════════════════════════════════════════════════════════════════════════════

  async getFinancialSummary(query: { fromDate?: string; toDate?: string }) {
    const dateRange = this.parseDateRange(query.fromDate, query.toDate);
    const expenseWhere: any = { status: 'paid' };
    const paymentWhere: any = {};
    if (dateRange) {
      expenseWhere.date = dateRange;
      paymentWhere.paidAt = dateRange;
    }

    const [expensesByCategory, totalExpenses, totalRevenue, expensesByPaymentMethod, recentExpenses] =
      await Promise.all([
        // تقسيم المصروفات بالتصنيف
        this.prisma.expense.groupBy({
          by: ['categoryId'],
          where: expenseWhere,
          _sum: { amount: true },
          _count: true,
        }),
        // إجمالي المصروفات
        this.prisma.expense.aggregate({
          where: expenseWhere,
          _sum: { amount: true },
          _count: true,
        }),
        // إجمالي الإيرادات
        this.prisma.payment.aggregate({
          where: paymentWhere,
          _sum: { amount: true },
        }),
        // تقسيم بطريقة الدفع
        this.prisma.expense.groupBy({
          by: ['paymentMethod'],
          where: expenseWhere,
          _sum: { amount: true },
          _count: true,
        }),
        // آخر 5 مصروفات
        this.prisma.expense.findMany({
          where: expenseWhere,
          orderBy: { date: 'desc' },
          take: 5,
          include: { category: true, vendor: true },
        }),
      ]);

    // جلب أسماء التصنيفات
    const categories = await this.prisma.expenseCategory.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const breakdown = expensesByCategory
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: categoryMap.get(item.categoryId) || 'غير مصنف',
        total: Number(item._sum.amount || 0),
        count: item._count,
      }))
      .sort((a, b) => b.total - a.total);

    const byPaymentMethod = expensesByPaymentMethod.map((item) => ({
      method: item.paymentMethod,
      total: Number(item._sum.amount || 0),
      count: item._count,
    }));

    const expensesTotal = Number(totalExpenses._sum.amount || 0);
    const revenueTotal = Number(totalRevenue._sum.amount || 0);

    return {
      revenueTotal,
      expensesTotal,
      netProfit: revenueTotal - expensesTotal,
      expenseCount: totalExpenses._count,
      breakdown,
      byPaymentMethod,
      recentExpenses,
    };
  }

  /** مقارنة شهرية — آخر N شهر */
  async getMonthlyTrend(months = 6) {
    const now = new Date();
    const results: Array<{ month: string; total: number; count: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const agg = await this.prisma.expense.aggregate({
        where: { status: 'paid', date: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      });

      results.push({
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        total: Number(agg._sum.amount || 0),
        count: agg._count,
      });
    }

    return results;
  }

  /** أعلى الموردين من حيث المصروفات */
  async getTopVendors(limit = 10) {
    const topVendors = await this.prisma.expense.groupBy({
      by: ['vendorId'],
      where: { status: 'paid', vendorId: { not: null } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const vendorIds = topVendors.map((v) => v.vendorId).filter(Boolean) as string[];
    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
    });
    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

    return topVendors.map((item) => ({
      vendorId: item.vendorId,
      vendorName: vendorMap.get(item.vendorId!) || 'غير معروف',
      total: Number(item._sum.amount || 0),
      count: item._count,
    }));
  }
}
