import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtConfigService } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGINS?.split(',').map((value) => value.trim()) || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/bar-orders',
})
export class BarOrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('BarOrdersGateway');

  constructor(private prisma: PrismaService, private jwtConfig: JwtConfigService) {}

  afterInit() {
    this.logger.log('🔌 Bar Orders WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const token = String(client.handshake.auth?.token || '').replace(/^Bearer\s+/i, '');
    const guestCode = String(client.handshake.auth?.guestCode || '').trim();
    try {
      if (token) {
        const payload = this.jwtConfig.verifyAccessToken(token);
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
        if (!user || user.status !== 'active') throw new Error('Inactive user');
        client.data.identity = { type: 'staff', userId: user.id, roleName: user.role.name };
        await client.join('staff');
      } else if (guestCode) {
        const session = await this.prisma.session.findUnique({ where: { guestCode } });
        if (!session || session.status !== 'active') throw new Error('Invalid guest code');
        client.data.identity = { type: 'guest', guestCode };
        await client.join(this.roomFor(guestCode));
      } else {
        throw new Error('Missing credentials');
      }
      this.logger.log(`Authenticated socket connected: ${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit to all connected clients that a new order was created
   */
  emitNewOrder(order: any) {
    this.server.to('staff').emit('order:new', order);
    this.logger.log(`Emitted order:new for order ${order.id}`);
  }

  /**
   * Emit to all connected clients that an order status was updated
   */
  emitOrderStatusUpdate(order: any) {
    this.server.to('staff').emit('order:status-updated', order);
    if (order.guestCode) this.server.to(this.roomFor(order.guestCode)).emit('order:status-updated', order);
    this.logger.log(`Emitted order:status-updated for order ${order.id} → ${order.status}`);
  }

  /**
   * Emit a full dashboard refresh signal
   */
  emitDashboardRefresh() {
    this.server.to('staff').emit('dashboard:refresh');
    this.logger.log('Emitted dashboard:refresh');
  }

  // ══════════════════════════════════════════════
  //  الشات (chat) — بعزل لكل محادثة + حفظ في الداتابيز
  // ══════════════════════════════════════════════
  //  اسم الغرفة (room) = مفتاح المحادثة (كود العميل guestCode).
  //  العزل بيمنع تسريب رسائل طاولة لطاولة تانية.
  private roomFor(conversationKey: string) {
    return `chat:${conversationKey}`;
  }

  @SubscribeMessage('chat:ping')
  handlePing(client: Socket) {
    client.emit('chat:pong', { time: new Date().toISOString() });
  }

  /**
   * انضمام صريح لغرفة المحادثة (اختياري — يستخدمه العميل/الباريستا لفتح شات طاولة)
   */
  @SubscribeMessage('chat:join')
  handleJoin(client: Socket, payload: { orderId: string }) {
    const key = payload?.orderId;
    if (!key || !this.canAccessConversation(client, key)) throw new WsException('Unauthorized conversation');
    client.join(this.roomFor(key));
  }

  @SubscribeMessage('chat:history')
  async handleChatHistory(client: Socket, payload: { orderId: string }) {
    const key = payload?.orderId;
    if (!key || !this.canAccessConversation(client, key)) {
      client.emit('chat:history', []);
      return [];
    }

    // ضم العميل/الباريستا لغرفة المحادثة عشان يستقبل الرسائل الجديدة (عزل)
    client.join(this.roomFor(key));

    const rows = await this.prisma.chatMessage.findMany({
      where: { conversationKey: key },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    const history = rows.map((m) => ({
      id: m.id,
      orderId: m.conversationKey,
      sender: m.sender,
      text: m.text,
      timestamp: m.createdAt.toISOString(),
    }));

    client.emit('chat:history', history);
    return history;
  }

  @SubscribeMessage('chat:send')
  async handleChatMessage(
    client: Socket,
    payload: { orderId: string; sender: string; text: string },
  ) {
    const key = payload?.orderId;
    const text = (payload?.text || '').trim().slice(0, 1000);
    if (!key || !text || !this.canAccessConversation(client, key)) {
      return null;
    }

    const sender = client.data.identity?.type === 'guest' ? 'GUEST' : 'BARISTA';

    this.logger.log(`[Chat] Message from ${payload.sender} for ${key}`);

    // حفظ في الداتابيز (مايضيعش عند إعادة تشغيل السيرفر)
    const saved = await this.prisma.chatMessage.create({
      data: {
        conversationKey: key,
        sender,
        text,
      },
    });

    const message = {
      id: saved.id,
      orderId: saved.conversationKey,
      sender: saved.sender,
      text: saved.text,
      timestamp: saved.createdAt.toISOString(),
    };

    // نتأكد إن المُرسِل داخل الغرفة، ونبثّ للغرفة فقط (عزل الخصوصية)
    client.join(this.roomFor(key));
    this.server.to(this.roomFor(key)).emit('chat:message', message);

    this.logger.log(`[Chat] Broadcasted chat:message to room ${key}`);
    return message;
  }

  private canAccessConversation(client: Socket, key: string) {
    const identity = client.data.identity;
    return identity?.type === 'staff' || (identity?.type === 'guest' && identity.guestCode === key);
  }
}
