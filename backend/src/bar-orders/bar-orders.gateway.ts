import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/bar-orders',
})
export class BarOrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('BarOrdersGateway');

  constructor(private prisma: PrismaService) {}

  afterInit() {
    this.logger.log('🔌 Bar Orders WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit to all connected clients that a new order was created
   */
  emitNewOrder(order: any) {
    this.server.emit('order:new', order);
    this.logger.log(`Emitted order:new for order ${order.id}`);
  }

  /**
   * Emit to all connected clients that an order status was updated
   */
  emitOrderStatusUpdate(order: any) {
    this.server.emit('order:status-updated', order);
    this.logger.log(`Emitted order:status-updated for order ${order.id} → ${order.status}`);
  }

  /**
   * Emit a full dashboard refresh signal
   */
  emitDashboardRefresh() {
    this.server.emit('dashboard:refresh');
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
    if (payload?.orderId) {
      client.join(this.roomFor(payload.orderId));
    }
  }

  @SubscribeMessage('chat:history')
  async handleChatHistory(client: Socket, payload: { orderId: string }) {
    const key = payload?.orderId;
    if (!key) {
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
    const text = (payload?.text || '').trim();
    if (!key || !text) {
      return null;
    }

    this.logger.log(`[Chat] Message from ${payload.sender} for ${key}`);

    // حفظ في الداتابيز (مايضيعش عند إعادة تشغيل السيرفر)
    const saved = await this.prisma.chatMessage.create({
      data: {
        conversationKey: key,
        sender: payload.sender,
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
}
