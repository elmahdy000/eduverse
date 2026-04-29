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

  /**
   * Real-time Chat: Handle incoming messages and broadcast them
   */
  @SubscribeMessage('chat:ping')
  handlePing(client: Socket) {
    this.logger.log(`Ping from ${client.id}`);
    client.emit('chat:pong', { time: new Date().toISOString() });
  }

  @SubscribeMessage('chat:send')
  handleChatMessage(client: Socket, payload: { orderId: string, sender: string, text: string }) {
    this.logger.log(`[Chat] Message from ${payload.sender} for ${payload.orderId}: ${payload.text}`);
    
    const message = {
      ...payload,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    
    // In namespaced gateway, this.server is the namespace-specific server.
    // .emit() sends to everyone in this namespace.
    this.server.emit('chat:message', message);
    
    this.logger.log(`[Chat] Broadcasted chat:message to namespace`);
    return message;
  }
}
