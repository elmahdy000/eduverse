import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  private canAccessAnyShift(actor?: { roleName?: string }) {
    return actor?.roleName === 'Owner' || actor?.roleName === 'Operations Manager';
  }

  private assertCanAccessShift(
    shiftUserId: string,
    actor?: { userId?: string; roleName?: string },
  ) {
    if (this.canAccessAnyShift(actor)) return;
    if (shiftUserId !== actor?.userId) {
      throw new ForbiddenException('You can only access your own shift');
    }
  }

  async startShift(userId: string, startCash: number, notes?: string) {
    // Check if user already has an open shift
    const openShift = await this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
    });

    if (openShift) {
      throw new BadRequestException('You already have an open shift. Close it first.');
    }

    return this.prisma.shift.create({
      data: {
        userId,
        startCash,
        notes,
        status: 'open',
      },
    });
  }

  async getCurrentShift(userId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
    });
    
    if (!shift) return null;

    // Calculate real-time stats for the open shift
    const stats = await this.getShiftStats(shift.startTime, new Date(), shift.userId);
    
    return {
      ...shift,
      stats,
    };
  }

  async closeShift(
    shiftId: string,
    actualCash: number,
    actor: { userId: string; roleName?: string },
    notes?: string,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('الشفت غير موجود');
    }

    if (shift.status === 'closed') {
      throw new BadRequestException('الشفت مغلق بالفعل');
    }

    this.assertCanAccessShift(shift.userId, actor);

    const endTime = new Date();
    const stats = await this.getShiftStatsDetailed(
      shift.startTime,
      endTime,
      shift.userId,
    );
    // Important: Expected cash is based ONLY on cash transactions
    const expectedCash = Number(shift.startCash) + stats.totalCashSales - stats.totalCashExpenses;
    const variance = Number((actualCash - expectedCash).toFixed(2));

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime,
        endCash: expectedCash,
        actualCash,
        totalSales: stats.totalSales,
        totalExpenses: stats.totalExpenses,
        status: 'closed',
        notes: notes ? `${shift.notes || ''} | Close Notes: ${notes}` : shift.notes,
      },
    });

    return {
      shift: updatedShift,
      report: {
        shiftId: updatedShift.id,
        openedAt: updatedShift.startTime,
        closedAt: updatedShift.endTime,
        startCash: Number(updatedShift.startCash),
        expectedCash,
        actualCash: Number(updatedShift.actualCash || 0),
        variance,
        totalSales: stats.totalSales,
        totalExpenses: stats.totalExpenses,
        netSales: Number((stats.totalSales - stats.totalExpenses).toFixed(2)),
        paymentsByMethod: stats.paymentsByMethod,
        expensesByCategory: stats.expensesByCategory,
        recentPayments: stats.recentPayments,
        recentExpenses: stats.recentExpenses,
      },
    };
  }

  private async getShiftStats(startTime: Date, endTime: Date, userId: string) {
    const [sales, expenses, cashSales, cashExpenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          recordedByUserId: userId,
          paidAt: { gte: startTime, lte: endTime },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          recordedByUserId: userId,
          date: { gte: startTime, lte: endTime },
          status: 'paid',
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          recordedByUserId: userId,
          paymentMethod: 'cash',
          paidAt: { gte: startTime, lte: endTime },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          recordedByUserId: userId,
          paymentMethod: 'cash',
          date: { gte: startTime, lte: endTime },
          status: 'paid',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalSales: Number(sales._sum.amount || 0),
      totalExpenses: Number(expenses._sum.amount || 0),
      totalCashSales: Number(cashSales._sum.amount || 0),
      totalCashExpenses: Number(cashExpenses._sum.amount || 0),
    };
  }

  private async getShiftStatsDetailed(
    startTime: Date,
    endTime: Date,
    userId: string,
  ) {
    const [sales, expenses, cashSales, cashExpenses, paymentsByMethodRaw, expensesByCategoryRaw, recentPayments, recentExpenses] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            recordedByUserId: userId,
            paidAt: { gte: startTime, lte: endTime },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            recordedByUserId: userId,
            date: { gte: startTime, lte: endTime },
            status: 'paid',
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            recordedByUserId: userId,
            paymentMethod: 'cash',
            paidAt: { gte: startTime, lte: endTime },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            recordedByUserId: userId,
            paymentMethod: 'cash',
            date: { gte: startTime, lte: endTime },
            status: 'paid',
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.groupBy({
          by: ['paymentMethod'],
          where: {
            recordedByUserId: userId,
            paidAt: { gte: startTime, lte: endTime },
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            recordedByUserId: userId,
            date: { gte: startTime, lte: endTime },
            status: 'paid',
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.payment.findMany({
          where: {
            recordedByUserId: userId,
            paidAt: { gte: startTime, lte: endTime },
          },
          orderBy: { paidAt: 'desc' },
          take: 10,
          include: {
            recordedByUser: {
              select: { firstName: true, lastName: true, email: true },
            },
            invoice: {
              select: { invoiceNumber: true },
            },
          },
        }),
        this.prisma.expense.findMany({
          where: {
            recordedByUserId: userId,
            date: { gte: startTime, lte: endTime },
            status: 'paid',
          },
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            category: { select: { id: true, name: true } },
            recordedByUser: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
      ]);

    const categoryIds = expensesByCategoryRaw.map((x) => x.categoryId);
    const categories = categoryIds.length
      ? await this.prisma.expenseCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoriesMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      totalSales: Number(sales._sum.amount || 0),
      totalExpenses: Number(expenses._sum.amount || 0),
      totalCashSales: Number(cashSales._sum.amount || 0),
      totalCashExpenses: Number(cashExpenses._sum.amount || 0),
      paymentsByMethod: paymentsByMethodRaw.map((x) => ({
        paymentMethod: x.paymentMethod,
        count: x._count._all,
        totalAmount: Number(x._sum.amount || 0),
      })),
      expensesByCategory: expensesByCategoryRaw.map((x) => ({
        categoryId: x.categoryId,
        categoryName: categoriesMap.get(x.categoryId) || 'غير مصنف',
        count: x._count._all,
        totalAmount: Number(x._sum.amount || 0),
      })),
      recentPayments,
      recentExpenses,
    };
  }

  async getShiftReport(
    shiftId: string,
    actor: { userId: string; roleName?: string },
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('الشفت غير موجود');
    }

    this.assertCanAccessShift(shift.userId, actor);

    const endTime = shift.endTime || new Date();
    const stats = await this.getShiftStatsDetailed(
      shift.startTime,
      endTime,
      shift.userId,
    );
    const expectedCash =
      shift.status === 'closed'
        ? Number(shift.endCash || 0)
        : Number(shift.startCash) + stats.totalCashSales - stats.totalCashExpenses;
    const actualCash =
      shift.actualCash == null ? null : Number(shift.actualCash);
    const variance =
      actualCash == null
        ? null
        : Number((actualCash - expectedCash).toFixed(2));

    return {
      shift: {
        ...shift,
        startCash: Number(shift.startCash),
        endCash: shift.endCash == null ? null : Number(shift.endCash),
        actualCash,
        totalSales: Number(shift.totalSales),
        totalExpenses: Number(shift.totalExpenses),
      },
      report: {
        shiftId: shift.id,
        status: shift.status,
        openedAt: shift.startTime,
        closedAt: shift.endTime,
        startCash: Number(shift.startCash),
        expectedCash,
        actualCash,
        variance,
        totalSales: stats.totalSales,
        totalExpenses: stats.totalExpenses,
        netSales: Number((stats.totalSales - stats.totalExpenses).toFixed(2)),
        paymentsByMethod: stats.paymentsByMethod,
        expensesByCategory: stats.expensesByCategory,
        recentPayments: stats.recentPayments,
        recentExpenses: stats.recentExpenses,
      },
    };
  }

  async listShifts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.shift.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shift.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }



  async getShiftsSummary(fromDate?: string, toDate?: string) {
    const dateFilter =
      fromDate || toDate
        ? {
            startTime: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {};

    const closedWhere = { status: 'closed', ...dateFilter };

    const [agg, closedShifts, openCount] = await Promise.all([
      this.prisma.shift.aggregate({
        where: closedWhere,
        _sum: { totalSales: true, totalExpenses: true },
        _count: true,
        _avg: { totalSales: true },
      }),
      this.prisma.shift.findMany({
        where: closedWhere,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          startCash: true,
          endCash: true,
          actualCash: true,
          totalSales: true,
          totalExpenses: true,
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startTime: 'desc' },
        take: 10,
      }),
      this.prisma.shift.count({ where: { status: 'open' } }),
    ]);

    const shiftsWithVariance = closedShifts.map((s) => {
      const expectedCash = Number(s.endCash || 0);
      const actualCash = s.actualCash != null ? Number(s.actualCash) : null;
      const variance = actualCash != null ? Number((actualCash - expectedCash).toFixed(2)) : null;
      return {
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        cashier: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown',
        totalSales: Number(s.totalSales),
        totalExpenses: Number(s.totalExpenses),
        netSales: Number(s.totalSales) - Number(s.totalExpenses),
        variance,
      };
    });

    const totalVariance = shiftsWithVariance.reduce((sum, s) => sum + (s.variance ?? 0), 0);

    return {
      closedCount: agg._count,
      openCount,
      totalSales: Number(agg._sum.totalSales ?? 0),
      totalExpenses: Number(agg._sum.totalExpenses ?? 0),
      netSales: Number(agg._sum.totalSales ?? 0) - Number(agg._sum.totalExpenses ?? 0),
      avgSalesPerShift: Number(agg._avg.totalSales ?? 0),
      totalVariance: Number(totalVariance.toFixed(2)),
      recentShifts: shiftsWithVariance,
    };
  }

}