import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationPayload } from '../interfaces';

/**
 * Gateway para manejar conexiones WebSocket de notificaciones
 * Permite enviar notificaciones en tiempo real a los usuarios conectados
 */
@WebSocketGateway({
  cors: {
    origin: '*', // En producción configurar con dominios específicos
  },
  namespace: '/notifications', // Namespace específico para notificaciones
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  // Mapa para rastrear qué usuarios están conectados y sus sockets
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Maneja la conexión de un cliente
   */
  async handleConnection(client: Socket) {
    try {
      // Extraer token del handshake
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verificar token JWT
      const payload = await this.verifyToken(token);
      if (!payload || !payload.id) {
        this.logger.warn(`Client ${client.id} has invalid token`);
        client.disconnect();
        return;
      }

      const userId = payload.id;

      // Unir al cliente a una room específica del usuario
      client.join(`user:${userId}`);

      // Registrar socket del usuario
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Guardar userId en el socket para usarlo después
      client.data.userId = userId;

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Maneja la desconexión de un cliente
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Remover socket del registro
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }

      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  /**
   * Envía una notificación a un usuario específico
   * Si el usuario está conectado, recibe la notificación en tiempo real
   */
  sendToUser(userId: string, notification: NotificationPayload & { id: string }) {
    const room = `user:${userId}`;
    const socketsConnected = this.userSockets.get(userId)?.size || 0;

    if (socketsConnected > 0) {
      this.server.to(room).emit('notification:new', notification);
      this.logger.log(`Notification sent to user ${userId} (${socketsConnected} sockets)`);
    } else {
      this.logger.debug(`User ${userId} is not connected, notification will be stored only`);
    }
  }

  /**
   * Envía una notificación de actualización (ej: notificación marcada como leída)
   */
  sendUpdateToUser(userId: string, notificationId: string, update: Partial<NotificationPayload>) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification:update', { id: notificationId, ...update });
    this.logger.debug(`Notification update sent to user ${userId}`);
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Obtiene el número de sockets conectados de un usuario
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Extrae el token JWT del handshake
   */
  private extractToken(client: Socket): string | null {
    // Intentar extraer del query parameter
    const tokenFromQuery = client.handshake.query?.token;
    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    // Intentar extraer del header de autorización
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // Intentar extraer del auth object
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    return null;
  }

  /**
   * Verifica y decodifica el token JWT
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      this.logger.error('Invalid token:', error.message);
      return null;
    }
  }
}
