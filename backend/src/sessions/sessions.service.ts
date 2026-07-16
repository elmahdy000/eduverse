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
  // Trigger TS Re-validation
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
      // Check if customer already has active session
      const existingSession = await tx.session.findFirst({
        where: {
          customerId: createSessionDto.customerId,
          status: 'active',
        },
      });

      if (existingSession) {
        throw new ConflictException('Customer already has an active session');
      }

      // Check customer exists and status
      const customer = await tx.customer.findUnique({
        where: { id: createSessionDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('العميل غير موجود');
      }

      if (customer.status === 'blacklisted') {
        throw new BadRequestException('هذا العميل في القائمة السوداء، لا يمكن فتح جلسة له');
      }

      // Validate booking if bookingId is provided
      let linkedBooking: any = null;
      if (createSessionDto.bookingId) {
        linkedBooking = await tx.booking.findUnique({
          where: { id: createSessionDto.bookingId },
        });

        if (!linkedBooking) {
          throw new NotFoundException('الحجز المحدد غير موجود');
        }
        if (linkedBooking.status !== 'confirmed') {
          throw new BadRequestException('لا يمكن ربط جلسة بحجز غير مؤكد');
        }
        if (linkedBooking.customerId !== createSessionDto.customerId) {
          throw new BadRequestException('العميل لا يتطابق مع الحجز المحدد');
        }

        // Use booking's room if session doesn't specify one
        if (!createSessionDto.roomId && linkedBooking.roomId) {
          createSessionDto.roomId = linkedBooking.roomId;
        }
      }

      // Check room availability if roomId is provided
      if (createSessionDto.roomId) {
        const room = await tx.room.findUnique({
          where: { id: createSessionDto.roomId },
        });

        if (!room) {
          throw new NotFoundException('الغرفة غير موجودة');
        }

        if (room.status === 'out_of_service') {
          throw new BadRequestException('هذه الغرفة خارج الخدمة حالياً');
        }

        // Get all active sessions in this room
        const activeRoomSessions = await tx.session.findMany({
          where: { roomId: createSessionDto.roomId, status: 'active' },
          include: { customer: true },
        });

        const hasTrainerActive = activeRoomSessions.some(
          (s) => s.customer.customerType === 'trainer'
        );

        if (hasTrainerActive) {
          throw new ConflictException('الغرفة محجوزة بالكامل لمحاضر حالياً بجلسة أخرى ولا يمكن تسجيل عملاء آخرين فيها');
        }

        if (customer.customerType === 'trainer' && activeRoomSessions.length > 0) {
          throw new ConflictException('لا يمكن حجز الغرفة للمحاضر لوجود جلسات نشطة أخرى بها حالياً');
        }

        // تحذير: لو فيه حجز مؤكد على الغرفة خلال الساعتين الجايين
        if (!createSessionDto.bookingId) {
          const upcomingBooking = await tx.booking.findFirst({
            where: {
              roomId: createSessionDto.roomId,
              status: 'confirmed',
              startTime: {
                gt: new Date(),
                lte: new Date(Date.now() + 2 * 60 * 60 * 1000), // خلال ساعتين
              },
            },
            include: { customer: true },
          });

          if (upcomingBooking) {
            const bookingTime = new Date(upcomingBooking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            throw new ConflictException(
              `تنبيه: الغرفة عليها حجز مؤكد الساعة ${bookingTime} باسم ${upcomingBooking.customer?.fullName || 'عميل'}. لو عاوز تكمل، اختار غرفة تانية أو اربط بالحجز.`
            );
          }
        }
      }

      const guestCode = await this.generateUniqueGuestCode();

      const newSession = await tx.session.create({
        data: {
          customerId: createSessionDto.customerId,
          sessionType: createSessionDto.bookingId ? 'booking_linked' : createSessionDto.sessionType,
          roomId: createSessionDto.roomId,
          bookingId: createSessionDto.bookingId,
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
        },
      });

      // Update room status to occupied if it's a trainer/lecturer
      if (createSessionDto.roomId) {
        const isTrainer = customer.customerType === 'trainer';
        await tx.room.update({
          where: { id: createSessionDto.roomId },
          data: { status: isTrainer ? 'occupied' : 'available' },
        });
      }

      // Update customer's last visit
      await tx.customer.update({
        where: { id: createSessionDto.customerId },
        data: { lastVisitAt: new Date() },
      });

      // Update booking status to reflect check-in
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
    this.logger.log(`Attempting to close session ${sessionId} by user ${userId}`);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { room: true, booking: true },
    });

    if (!session) {
      this.logger.warn(`Failed to close session ${sessionId}: session not found`);
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'active') {
      this.logger.warn(`Failed to close session ${sessionId}: session status is not active (status is ${session.status})`);
      throw new BadRequestException('Only active sessions can be closed');
    }

    // Ensure user has an open shift to close session (financial event)
    const openShift = await this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
    });
    if (!openShift) {
      this.logger.warn(`Failed to close session ${sessionId}: user ${userId} does not have an active open shift`);
      throw new BadRequestException('يجب فتح شفت أولاً لتتمكن من إغلاق الجلسة وتحصيل الحساب');
    }

    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - session.startTime.getTime()) / 60000,
    );

    // نفرّق بين حالتين:
    // - chargeAmount = null  => لم يُحدَّد يدوياً، نحسبه تلقائياً من نوع الجلسة والغرفة
    // - chargeAmount = 0     => جلسة مجانية عمداً (owner/ضيف)، نحترمها ولا نعيد الحساب
    let chargeAmount: number;

    if (session.chargeAmount !== null && session.chargeAmount !== undefined) {
      // قيمة محدَّدة يدوياً (بما فيها الصفر المقصود) — نستخدمها كما هي
      chargeAmount = Number(session.chargeAmount);
    } else if (session.sessionType === 'hourly') {
      if (!session.room?.hourlyRate) {
        this.logger.warn(`Failed to close session ${sessionId}: Room has no hourly rate`);
        throw new BadRequestException(
          'لا يمكن حساب قيمة الجلسة تلقائياً: الغرفة ليس لها سعر بالساعة. يرجى تحديد قيمة الجلسة يدوياً.',
        );
      }
      const rate = Number(session.room.hourlyRate);
      const hours = Math.ceil(durationMinutes / 60);
      chargeAmount = hours * rate;
    } else if (session.sessionType === 'daily') {
      if (!session.room?.dailyRate) {
        this.logger.warn(`Failed to close session ${sessionId}: Room has no daily rate`);
        throw new BadRequestException(
          'لا يمكن حساب قيمة الجلسة تلقائياً: الغرفة ليس لها سعر يومي. يرجى تحديد قيمة الجلسة يدوياً.',
        );
      }
      chargeAmount = Number(session.room.dailyRate);
    } else {
      // أنواع أخرى (package/booking_linked) بدون قيمة محددة => صفر (تُحصَّل بطريقة أخرى)
      chargeAmount = 0;
    }

    try {
      const closedSession = await this.prisma.$transaction(async (tx) => {
        this.logger.log(`Starting transaction to close session ${sessionId}`);

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

        // Update room status to available if no other active sessions remain
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

        // Generate invoice within the same transaction
        const invoice = await this.invoicesService.generateInvoiceWithTx(
          {
            sessionId: updatedSession.id,
            notes: `نُشئت تلقائياً عند إغلاق الجلسة`,
          },
          userId,
          tx,
        );

        // Record audit log manually for detail
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

        // Auto-complete linked booking (Type-safe after prisma generate)
        if ((session as any).bookingId) {
          await tx.booking.update({
            where: { id: (session as any).bookingId },
            data: { status: 'completed' },
          });
        }

        this.logger.log(`Transaction successful: Session ${sessionId} closed and invoice ${invoice.id} created`);
        return {
          ...updatedSession,
          invoice,
        };
      });

      return closedSession;
    } catch (error) {
      this.logger.error(`Failed to close session ${sessionId} in database transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        customer: true,
        room: true,
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
        include: {
          customer: true,
          room: true,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.session.count({ where }),
    ]);

    const hasMore = skip + sessions.length < total;

    return {
      data: sessions,
      total,
      page,
      limit,
      hasMore,
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
      throw new BadRequestException('لا يمكن إلغاء جلسة غير نشطة');
    }

    const deliveredOrders = await this.prisma.barOrder.count({
      where: { sessionId, status: 'delivered' },
    });

    if (deliveredOrders > 0) {
      throw new BadRequestException('لا يمكن إلغاء الجلسة لأن هناك طلبات بار تم تسليمها بالفعل. يرجى إغلاق الجلسة وتحصيل الحساب بدلاً من الإلغاء.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.session.update({
        where: { id: sessionId },
        data: {
          status: 'cancelled',
          closedByUserId: userId,
          endTime: new Date(),
          guestCode: null,
        },
      });

      // Update room status to available if no other active sessions remain
      if (session.roomId) {
        const otherActiveSessionsCount = await tx.session.count({
          where: {
            roomId: session.roomId,
            status: 'active',
            id: { not: session.id }
          }
        });
        if (otherActiveSessionsCount === 0) {
          await tx.room.update({
            where: { id: session.roomId },
            data: { status: 'available' },
          });
        }
      }

      // Revert booking status if session is cancelled
      if ((session as any).bookingId) {
        await tx.booking.update({
          where: { id: (session as any).bookingId },
          data: { status: 'confirmed' },
        });
      }

      return updated;
    });
  }
}
