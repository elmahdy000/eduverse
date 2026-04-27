import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private async validateBookingTimeRange(startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new Error('startTime must be before endTime');
    }
  }

  async checkRoomConflicts(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ) {
    await this.validateBookingTimeRange(startTime, endTime);

    const bookingConflict = await this.prisma.booking.findFirst({
      where: {
        roomId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: ['draft', 'confirmed'] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: {
        customer: true,
      },
    });

    const activeSessionConflict = await this.prisma.session.findFirst({
      where: {
        roomId,
        status: 'active',
        startTime: { lt: endTime },
        OR: [{ endTime: null }, { endTime: { gt: startTime } }],
      },
      include: {
        customer: true,
      },
    });

    return {
      hasConflict: Boolean(bookingConflict || activeSessionConflict),
      bookingConflict,
      activeSessionConflict,
    };
  }

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(createBookingDto.endTime);
    await this.validateBookingTimeRange(startTime, endTime);

    const [customer, room] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: createBookingDto.customerId } }),
      this.prisma.room.findUnique({ where: { id: createBookingDto.roomId } }),
    ]);

    if (!customer) {
      throw new Error('Customer not found');
    }
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.status === 'out_of_service') {
      throw new Error('Room is out of service');
    }
    if (
      createBookingDto.participantCount &&
      createBookingDto.participantCount > room.capacity
    ) {
      throw new Error('Participant count exceeds room capacity');
    }

    const conflicts = await this.checkRoomConflicts(
      createBookingDto.roomId,
      startTime,
      endTime,
    );
    if (conflicts.hasConflict) {
      throw new Error('Room is not available for the selected time range');
    }

    return this.prisma.booking.create({
      data: {
        customerId: createBookingDto.customerId,
        roomId: createBookingDto.roomId,
        bookingType: createBookingDto.bookingType,
        startTime,
        endTime,
        participantCount: createBookingDto.participantCount,
        totalAmount: createBookingDto.totalAmount,
        depositAmount: createBookingDto.depositAmount,
        notes: createBookingDto.notes,
        createdByUserId: userId,
        status: 'confirmed',
      },
      include: {
        customer: true,
        room: true,
      },
    });
  }

  async getBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        room: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  async listBookings(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      roomId?: string;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.roomId) {
      where.roomId = filters.roomId;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.startTime = {};
      if (filters.fromDate) {
        where.startTime.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.startTime.lte = new Date(filters.toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: true,
          room: true,
        },
        skip,
        take: safeLimit,
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + bookings.length < total,
    };
  }

  async updateBooking(bookingId: string, updateBookingDto: UpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new Error('Cancelled or completed bookings cannot be edited');
    }

    const nextRoomId = updateBookingDto.roomId ?? booking.roomId;
    const nextStartTime = updateBookingDto.startTime
      ? new Date(updateBookingDto.startTime)
      : booking.startTime;
    const nextEndTime = updateBookingDto.endTime
      ? new Date(updateBookingDto.endTime)
      : booking.endTime;

    await this.validateBookingTimeRange(nextStartTime, nextEndTime);

    const room = await this.prisma.room.findUnique({
      where: { id: nextRoomId },
    });
    if (!room) {
      throw new Error('Room not found');
    }
    if (
      updateBookingDto.participantCount &&
      updateBookingDto.participantCount > room.capacity
    ) {
      throw new Error('Participant count exceeds room capacity');
    }

    const conflicts = await this.checkRoomConflicts(
      nextRoomId,
      nextStartTime,
      nextEndTime,
      bookingId,
    );
    if (conflicts.hasConflict) {
      throw new Error('Room is not available for the selected time range');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...updateBookingDto,
        roomId: nextRoomId,
        startTime: nextStartTime,
        endTime: nextEndTime,
      },
      include: {
        customer: true,
        room: true,
      },
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    await this.getBooking(bookingId);

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : undefined,
      },
      include: {
        customer: true,
        room: true,
      },
    });
  }

  async completeBooking(bookingId: string) {
    await this.getBooking(bookingId);

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'completed',
      },
      include: {
        customer: true,
        room: true,
      },
    });
  }
}
