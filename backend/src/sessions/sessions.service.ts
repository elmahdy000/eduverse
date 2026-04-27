import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto, CloseSessionDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async openSession(createSessionDto: CreateSessionDto, userId: string) {
    // Check if customer already has active session
    const existingSession = await this.prisma.session.findFirst({
      where: {
        customerId: createSessionDto.customerId,
        status: 'active',
      },
    });

    if (existingSession) {
      throw new Error('Customer already has an active session');
    }

    // Check customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createSessionDto.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const session = await this.prisma.session.create({
      data: {
        ...createSessionDto,
        startTime: new Date(),
        openedByUserId: userId,
        status: 'active',
      },
      include: {
        customer: true,
        room: true,
      },
    });

    // Update customer's last visit
    await this.prisma.customer.update({
      where: { id: createSessionDto.customerId },
      data: { lastVisitAt: new Date() },
    });

    return session;
  }

  async closeSession(sessionId: string, closeSessionDto: CloseSessionDto, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
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

    const closedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime,
        durationMinutes,
        status: 'closed',
        closedByUserId: userId,
        notes: closeSessionDto.notes,
      },
      include: {
        customer: true,
        barOrders: true,
      },
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

    if (session.status !== 'active') {
      throw new Error('Only active sessions can be cancelled');
    }

    return await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled',
        closedByUserId: userId,
        endTime: new Date(),
      },
    });
  }
}
