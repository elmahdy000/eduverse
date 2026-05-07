import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

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
    const stats = await this.getShiftStats(shift.startTime, new Date());
    
    return {
      ...shift,
      stats,
    };
  }

  async closeShift(shiftId: string, actualCash: number, notes?: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift || shift.status === 'closed') {
      throw new BadRequestException('Shift not found or already closed');
    }

    const endTime = new Date();
    const stats = await this.getShiftStats(shift.startTime, endTime);

    const endCash = Number(shift.startCash) + stats.totalSales - stats.totalExpenses;

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime,
        endCash,
        actualCash,
        totalSales: stats.totalSales,
        totalExpenses: stats.totalExpenses,
        status: 'closed',
        notes: notes ? `${shift.notes || ''} | Close Notes: ${notes}` : shift.notes,
      },
    });
  }

  private async getShiftStats(startTime: Date, endTime: Date) {
    const [sales, expenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          paidAt: { gte: startTime, lte: endTime },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          date: { gte: startTime, lte: endTime },
          status: 'paid',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalSales: Number(sales._sum.amount || 0),
      totalExpenses: Number(expenses._sum.amount || 0),
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

    return { data, total, page, limit };
  }
}
