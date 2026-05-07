import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto, CloseSessionDto } from './dto/session.dto';

import { InvoicesService } from '../invoices/invoices.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SessionsService {
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
        throw new Error('Customer already has an active session');
      }

      // Check customer exists and status
      const customer = await tx.customer.findUnique({
        where: { id: createSessionDto.customerId },
      });

      if (!customer) {
        throw new Error('العميل غير موجود');
      }

      if (customer.status === 'blacklisted') {
        throw new Error('هذا العميل في القائمة السوداء، لا يمكن فتح جلسة له');
      }

      // Validate booking if bookingId is provided
      let linkedBooking: any = null;
      if (createSessionDto.bookingId) {
        linkedBooking = await tx.booking.findUnique({
          where: { id: createSessionDto.bookingId },
        });

        if (!linkedBooking) {
          throw new Error('الحجز المحدد غير موجود');
        }
        if (linkedBooking.status !== 'confirmed') {
          throw new Error('لا يمكن ربط جلسة بحجز غير مؤكد');
        }
        if (linkedBooking.customerId !== createSessionDto.customerId) {
          throw new Error('العميل لا يتطابق مع الحجز المحدد');
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
          throw new Error('الغرفة غير موجودة');
        }

        if (room.status === 'out_of_service') {
          throw new Error('هذه الغرفة خارج الخدمة حالياً');
        }

        if (room.status === 'occupied') {
          const activeRoomSession = await tx.session.findFirst({
            where: { roomId: createSessionDto.roomId, status: 'active' },
          });
          if (activeRoomSession) {
            throw new Error('الغرفة مشغولة حالياً بجلسة أخرى');
          }
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
            throw new Error(
              `تنبيه: الغرفة عليها حجز مؤكد الساعة ${bookingTime} باسم ${upcomingBooking.customer?.fullName || 'عميل'}. لو عاوز تكمل، اختار غرفة تانية أو اربط بالحجز.`
            );
          }
        }
      }

      const guestCode = await this.generateUniqueGuestCode();

      const newSession = await (tx.session as any).create({
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

      // Update room status to occupied
      if (createSessionDto.roomId) {
        await tx.room.update({
          where: { id: createSessionDto.roomId },
          data: { status: 'occupied' },
        });
      }

      // Update customer's last visit
      await tx.customer.update({
        where: { id: createSessionDto.customerId },
        data: { lastVisitAt: new Date() },
      });

      return newSession;
    }, { isolationLevel: 'Serializable' });

    return session;
  }

  async closeSession(sessionId: string, closeSessionDto: CloseSessionDto, userId: string) {
    const session: any = await (this.prisma.session as any).findUnique({
      where: { id: sessionId },
      include: { room: true, booking: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Only active sessions can be closed');
    }

    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - session.startTime.getTime()) / 60000,
    );

    // Calculate charge if not already set manually
    let chargeAmount = Number(session.chargeAmount || 0);

    if (chargeAmount === 0) {
      if (session.sessionType === 'hourly') {
        const rate = Number(session.room?.hourlyRate || 10); // Default to 10 EGP/hour
        const hours = Math.ceil(durationMinutes / 60);
        chargeAmount = hours * rate;
      } else if (session.sessionType === 'daily' && session.room?.dailyRate) {
        chargeAmount = Number(session.room.dailyRate);
      }
    }


    const closedSession = await this.prisma.$transaction(async (tx) => {
      const updatedSession: any = await (tx.session as any).update({
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

      // Update room status to available
      if (updatedSession.roomId) {
        await tx.room.update({
          where: { id: updatedSession.roomId },
          data: { status: 'available' },
        });
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

      // Auto-complete linked booking
      if (updatedSession.bookingId) {
        await tx.booking.update({
          where: { id: updatedSession.bookingId },
          data: { status: 'completed' },
        });
      }

      return {
        ...updatedSession,
        invoice,
      };
    });

    return closedSession;
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
      throw new Error('Session not found');
    }

    return session;
  }

  async listActiveSessions(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { status: 'active' },
        include: {
          customer: true,
          room: true,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.session.count({ where: { status: 'active' } }),
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
      throw new Error('Session not found');
    }

    const deliveredOrders = await this.prisma.barOrder.count({
      where: { sessionId, status: 'delivered' },
    });

    if (deliveredOrders > 0) {
      throw new Error('لا يمكن إلغاء الجلسة لأن هناك طلبات بار تم تسليمها بالفعل. يرجى إغلاق الجلسة وتحصيل الحساب بدلاً من الإلغاء.');
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

      // Update room status to available
      if (session.roomId) {
        await tx.room.update({
          where: { id: session.roomId },
          data: { status: 'available' },
        });
      }

      return updated;
    });
  }
}
