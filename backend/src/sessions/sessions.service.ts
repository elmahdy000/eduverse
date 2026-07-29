import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto, CloseSessionDto } from './dto/session.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
    private auditLogsService: AuditLogsService,
  ) {}

  private async generateUniqueGuestCode(): Promise<string> {
    let code = '';
    let exists = true;
    while (exists) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await this.prisma.session.findUnique({
        where: { guestCode: code },
      });
      if (!existing) exists = false;
    }
    return code;
  }

  async openSession(createSessionDto: CreateSessionDto, userId: string) {
    const session = await this.prisma.$transaction(async (tx) => {
      const existingSession = await tx.session.findFirst({
        where: {
          customerId: createSessionDto.customerId,
          status: 'active',
        },
      });

      if (existingSession) {
        throw new ConflictException('Customer already has an active session');
      }

      const customer = await tx.customer.findUnique({
        where: { id: createSessionDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (customer.status === 'blacklisted') {
        throw new BadRequestException('Customer is blacklisted');
      }

      let linkedBooking: any = null;
      if (createSessionDto.bookingId) {
        linkedBooking = await tx.booking.findUnique({
          where: { id: createSessionDto.bookingId },
        });

        if (!linkedBooking) {
          throw new NotFoundException('Booking not found');
        }
        if (linkedBooking.status !== 'confirmed') {
          throw new BadRequestException('Booking is not confirmed');
        }
        if (linkedBooking.customerId !== createSessionDto.customerId) {
          throw new BadRequestException('Customer does not match booking');
        }

        if (!createSessionDto.roomId && linkedBooking.roomId) {
          createSessionDto.roomId = linkedBooking.roomId;
        }
      }

      if (createSessionDto.roomId) {
        const room = await tx.room.findUnique({
          where: { id: createSessionDto.roomId },
        });

        if (!room) {
          throw new NotFoundException('Room not found');
        }

        if (room.status === 'out_of_service') {
          throw new BadRequestException('Room is out of service');
        }

        const activeRoomSessions = await tx.session.findMany({
          where: { roomId: createSessionDto.roomId, status: 'active' },
          include: { customer: true },
        });

        const hasTrainerActive = activeRoomSessions.some(
          (s) => s.customer.customerType === 'trainer'
        );

        if (hasTrainerActive) {
          throw new ConflictException('Room is fully reserved by a trainer');
        }

        if (customer.customerType === 'trainer' && activeRoomSessions.length > 0) {
          throw new ConflictException('Cannot reserve room for trainer while other active sessions exist');
        }
      }

      let activeSubId = createSessionDto.subscriptionId;
      if (!activeSubId && (createSessionDto.sessionType === 'package' || createSessionDto.billingType === 'subscription_covered')) {
        const activeSub = await tx.customerSubscription.findFirst({
          where: {
            customerId: createSessionDto.customerId,
            status: 'active',
            endDate: { gte: new Date() },
          },
        });
        if (activeSub) {
          activeSubId = activeSub.id;
        }
      }

      const guestCode = await this.generateUniqueGuestCode();

      const newSession = await tx.session.create({
        data: {
          customerId: createSessionDto.customerId,
          sessionType: createSessionDto.bookingId ? 'booking_linked' : createSessionDto.sessionType,
          billingType: createSessionDto.billingType || (activeSubId ? 'subscription_covered' : 'hourly_individual'),
          roomId: createSessionDto.roomId,
          bookingId: createSessionDto.bookingId,
          subscriptionId: activeSubId,
          startTime: new Date(),
          openedByUserId: userId,
          status: 'active',
          guestCode,
          chargeAmount: createSessionDto.chargeAmount,
          notes: createSessionDto.notes,
        },
        include: {
          customer: true,
          room: true,
          booking: true,
          subscription: true,
        },
      });

      if (createSessionDto.roomId) {
        const isTrainer = customer.customerType === 'trainer';
        await tx.room.update({
          where: { id: createSessionDto.roomId },
          data: { status: isTrainer ? 'occupied' : 'available' },
        });
      }

      await tx.customer.update({
        where: { id: createSessionDto.customerId },
        data: { lastVisitAt: new Date() },
      });

      if (createSessionDto.bookingId) {
        await tx.booking.update({
          where: { id: createSessionDto.bookingId },
          data: { status: 'in_progress' },
        });
      }

      return newSession;
    }, { isolationLevel: 'Serializable' });

    return session;
  }

  async closeSession(sessionId: string, closeSessionDto: CloseSessionDto, userId: string) {
    this.logger.log('Attempting to close session ' + sessionId + ' by user ' + userId);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { room: true, booking: true, subscription: true },
    });

    if (!session) {
      this.logger.warn('Failed to close session ' + sessionId + ': session not found');
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'active') {
      this.logger.warn('Failed to close session ' + sessionId + ': session status is not active');
      throw new BadRequestException('Only active sessions can be closed');
    }

    const openShift = await this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
    });
    if (!openShift) {
      this.logger.warn('Failed to close session ' + sessionId + ': user does not have an active open shift');
      throw new BadRequestException('Open shift required');
    }

    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - session.startTime.getTime()) / 60000,
    );

    const fullHours = Math.floor(durationMinutes / 60);
    const extraMinutes = durationMinutes % 60;
    const hours = extraMinutes > 10 ? fullHours + 1 : Math.max(1, fullHours);

    let chargeAmount: number;

    if (session.chargeAmount !== null && session.chargeAmount !== undefined) {
      chargeAmount = Number(session.chargeAmount);
    } else if (session.subscriptionId || session.sessionType === 'package' || session.billingType === 'subscription_covered') {
      chargeAmount = 0;
    } else if (session.billingType === 'flat_event') {
      chargeAmount = Number(session.room?.fixedEventRate ?? 0);
    } else if (session.billingType === 'hourly_room') {
      const roomHourly = Number(session.room?.wholeRoomHourlyRate ?? session.room?.hourlyRate ?? 50);
      chargeAmount = hours * roomHourly;
    } else if (session.sessionType === 'hourly' || session.billingType === 'hourly_individual') {
      let rate: number;
      if (session.room) {
        // If room has an explicit individual rate or hourly rate, use it
        const defaultRate = session.room.name.toLowerCase().includes('outdoor') ? 10 : 20;
        rate = Number(session.room.individualHourlyRate ?? session.room.hourlyRate ?? defaultRate);
      } else {
        const coworkingRoom = await this.prisma.room.findFirst({
          where: { roomType: 'coworking', hourlyRate: { not: null } },
        });
        rate = coworkingRoom?.hourlyRate ? Number(coworkingRoom.hourlyRate) : 20;
      }
      chargeAmount = hours * rate;
    } else if (session.sessionType === 'daily') {
      if (session.room) {
        chargeAmount = Number(session.room.dailyRate ?? 150);
      } else {
        const coworkingRoom = await this.prisma.room.findFirst({
          where: { roomType: 'coworking', dailyRate: { not: null } },
        });
        chargeAmount = coworkingRoom?.dailyRate ? Number(coworkingRoom.dailyRate) : 150;
      }
    } else {
      chargeAmount = 0;
    }

    try {
      const closedSession = await this.prisma.$transaction(async (tx) => {
        this.logger.log('Starting transaction to close session ' + sessionId);

        const updatedSession = await tx.session.update({
          where: { id: sessionId },
          data: {
            endTime,
            durationMinutes,
            status: 'closed',
            closedByUserId: userId,
            chargeAmount,
            notes: closeSessionDto.notes,
            guestCode: null,
          },
          include: {
            customer: true,
            barOrders: {
              where: { status: { not: 'cancelled' } }
            },
            room: true,
          },
        });

        if (updatedSession.roomId) {
          const otherActiveSessionsCount = await tx.session.count({
            where: {
              roomId: updatedSession.roomId,
              status: 'active',
              id: { not: updatedSession.id }
            }
          });
          if (otherActiveSessionsCount === 0) {
            await tx.room.update({
              where: { id: updatedSession.roomId },
              data: { status: 'available' },
            });
          }
        }

        const invoice = await this.invoicesService.generateInvoiceWithTx(
          {
            sessionId: updatedSession.id,
            notes: 'Session close auto-invoice',
          },
          userId,
          tx,
        );

        await this.auditLogsService.createAuditLog({
          userId,
          action: 'CLOSE_SESSION',
          entityType: 'session',
          entityId: updatedSession.id,
          newValue: {
            chargeAmount,
            durationMinutes,
            invoiceId: invoice.id,
            totalBarOrders: updatedSession.barOrders.length,
          },
        });

        if (session.bookingId) {
          await tx.booking.update({
            where: { id: session.bookingId },
            data: { status: 'completed' },
          });
        }

        this.logger.log('Transaction successful: Session ' + sessionId + ' closed and invoice ' + invoice.id + ' created');
        return {
          ...updatedSession,
          invoice,
        };
      });

      return closedSession;
    } catch (error: any) {
      this.logger.error('Failed to close session ' + sessionId + ' in database transaction: ' + error.message, error.stack);
      throw error;
    }
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        customer: true,
        room: true,
        booking: true,
        subscription: true,
        openedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        closedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        barOrders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async listActiveSessions(page: number = 1, limit: number = 20, customerName?: string) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'active' };
    if (customerName) {
      where.customer = {
        fullName: { contains: customerName, mode: 'insensitive' },
      };
    }

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          customer: true,
          room: true,
          subscription: true,
          barOrders: {
            where: { status: { not: 'cancelled' } },
          },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + sessions.length < total,
    };
  }

  async cancelSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Only active sessions can be cancelled');
    }

    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - session.startTime.getTime()) / 60000);

    const cancelledSession = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.session.update({
        where: { id: sessionId },
        data: {
          status: 'cancelled',
          closedByUserId: userId,
          guestCode: null,
          endTime: now,
          durationMinutes,
        },
        include: { customer: true, room: true, booking: true, subscription: true, openedByUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      if (session.roomId) {
        const otherActiveSessionsCount = await tx.session.count({
          where: {
            roomId: session.roomId,
            status: 'active',
            id: { not: session.id },
          },
        });
        if (otherActiveSessionsCount === 0) {
          await tx.room.update({
            where: { id: session.roomId },
            data: { status: 'available' },
          });
        }
      }

      if (session.bookingId) {
        await tx.booking.update({
          where: { id: session.bookingId },
          data: { status: 'cancelled' },
        });
      }

      return updated;
    });

    return cancelledSession;
  }
}
