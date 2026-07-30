import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtConfigService } from '../auth/auth.service';

/**
 * RealtimeGateway
 * -----------------------------------------------------------------------------
 * بوابة realtime عامة لكل السيستم (غير البار اللي ليه بوابته الخاصة).
 * بتبعت إشارات تغيير خفيفة للموظفين المصادَق عليهم عشان الواجهات تعمل
 * إعادة تحميل تلقائي للبيانات المتأثرة (invalidate) بدل ما المستخدم يعمل refresh.
 *
 * الأحداث المبثوثة (كلها لغرفة 'staff'):
 *   - session:changed   { action, sessionId?, customerId? }
 *   - invoice:changed   { action, invoiceId?, sessionId? }
 *   - booking:changed   { action, bookingId?, roomId? }
 *   - shift:changed     { action, shiftId?, userId? }
 *   - room:changed      { action, roomId? }
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGINS?.split(',').map((v) => v.trim()) || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');

  constructor(
    private prisma: PrismaService,
    private jwtConfig: JwtConfigService,
  ) {}

  afterInit() {
    this.logger.log('🔌 Realtime Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const token = String(client.handshake.auth?.token || '').replace(
      /^Bearer\s+/i,
      '',
    );
    try {
      if (!token) throw new Error('Missing credentials');
      const payload = this.jwtConfig.verifyAccessToken(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (!user || user.status !== 'active') throw new Error('Inactive user');
      client.data.identity = {
        type: 'staff',
        userId: user.id,
        roleName: user.role.name,
      };
      await client.join('staff');
      this.logger.log(`Realtime socket connected: ${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Realtime client disconnected: ${client.id}`);
  }

  private emit(event: string, payload: Record<string, any>) {
    this.server?.to('staff').emit(event, payload);
    this.logger.log(`Emitted ${event} ${JSON.stringify(payload)}`);
  }

  emitSessionChanged(payload: {
    action: 'opened' | 'closed' | 'cancelled' | 'updated';
    sessionId?: string;
    customerId?: string;
  }) {
    this.emit('session:changed', payload);
  }

  emitInvoiceChanged(payload: {
    action: 'created' | 'paid' | 'refunded' | 'updated';
    invoiceId?: string;
    sessionId?: string;
  }) {
    this.emit('invoice:changed', payload);
  }

  emitBookingChanged(payload: {
    action: 'created' | 'updated' | 'cancelled' | 'confirmed';
    bookingId?: string;
    roomId?: string;
  }) {
    this.emit('booking:changed', payload);
  }

  emitShiftChanged(payload: {
    action: 'opened' | 'closed';
    shiftId?: string;
    userId?: string;
  }) {
    this.emit('shift:changed', payload);
  }

  emitRoomChanged(payload: { action: 'updated'; roomId?: string }) {
    this.emit('room:changed', payload);
  }
}
