import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { MessageSenderType, MessageType } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidencia } from '../incidencias/entities/incidencia.entity';
import { User, UserType } from '../users/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  enterpriseId?: string;
  userType?: UserType;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure according to your needs
    credentials: true,
  },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`New connection attempt: ${client.id}`);

      // Extraer token del handshake
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }
      this.logger.log(`Token extracted for client ${client.id}`);

      // Verificar token JWT
      const payload = await this.verifyToken(token);
      if (!payload || !payload.id) {
        this.logger.warn(`Client ${client.id} has invalid token`);
        client.disconnect();
        return;
      }
      this.logger.log(`Token verified for user ${payload.id}`);

      // Buscar usuario en la base de datos para obtener enterpriseId y userType
      const user = await this.userRepository.findOne({
        where: { id: payload.id },
        select: ['id', 'enterpriseId', 'userType'],
      });

      if (!user) {
        this.logger.warn(`User ${payload.id} not found in database`);
        client.disconnect();
        return;
      }
      this.logger.log(`User found in database: ${user.id}, type: ${user.userType}, enterprise: ${user.enterpriseId}`);

      // Almacenar datos del usuario en el socket
      client.userId = user.id;
      client.enterpriseId = user.enterpriseId;
      client.userType = user.userType;

      // Unir al usuario a su sala personal para notificaciones
      const personalRoom = `user:${user.id}`;
      client.join(personalRoom);
      this.logger.log(`👤 User ${user.id} joined personal room: ${personalRoom}`);

      this.logger.log(`✅ User ${user.id} (${client.userType}) successfully connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Error handling connection for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`❌ Client disconnected: ${client.id} (User: ${client.userId}, Type: ${client.userType}, Enterprise: ${client.enterpriseId})`);
  }

  /**
   * Extrae el token JWT del handshake
   */
  private extractToken(client: Socket): string | null {
    this.logger.debug(`Extracting token from handshake. Query: ${JSON.stringify(client.handshake.query)}`);
    this.logger.debug(`Auth object: ${JSON.stringify(client.handshake.auth)}`);
    this.logger.debug(`Authorization header: ${client.handshake.headers?.authorization}`);
    this.logger.debug(`Cookies: ${client.handshake.headers?.cookie}`);

    // 1. Intentar extraer del auth object (empleados/admin)
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      this.logger.debug(`Token found in auth object: ${authToken.substring(0, 20)}...`);
      return authToken;
    }

    // 2. Intentar extraer del query parameter
    const tokenFromQuery = client.handshake.query?.token;
    if (tokenFromQuery && typeof tokenFromQuery === 'string') {
      this.logger.debug(`Token found in query: ${tokenFromQuery.substring(0, 20)}...`);
      return tokenFromQuery;
    }

    // 3. Intentar extraer del header de autorización
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        this.logger.debug(`Token found in authorization header: ${token.substring(0, 20)}...`);
        return token;
      }
    }

    // 4. Intentar extraer de las cookies (clientes)
    const cookieHeader = client.handshake.headers?.cookie;
    if (cookieHeader && typeof cookieHeader === 'string') {
      this.logger.debug(`Parsing cookies: ${cookieHeader}`);
      const cookies = cookieHeader.split(';').map(c => c.trim());

      // Buscar la cookie 'authToken' (nombre de la cookie del sistema)
      for (const cookie of cookies) {
        if (cookie.startsWith('authToken=')) {
          const token = cookie.substring('authToken='.length);
          if (token) {
            this.logger.debug(`🍪 Token found in authToken cookie: ${token.substring(0, 20)}...`);
            return token;
          }
        }
      }

      this.logger.debug('Cookie authToken not found in:', cookies.map(c => c.split('=')[0]).join(', '));
    }

    this.logger.warn('No token found in any location (auth, query, header, cookies)');
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

  /**
   * Valida que el usuario tiene acceso a la incidencia
   */
  private async validateIncidenciaAccess(
    incidenciaId: string,
    userId: string,
    enterpriseId: string,
    userType: UserType,
  ): Promise<boolean> {
    // SUPER_ADMIN tiene acceso a todas las incidencias
    if (userType === UserType.SUPER_ADMIN) {
      const incidencia = await this.incidenciaRepository.findOne({
        where: { id: incidenciaId },
      });
      return !!incidencia;
    }

    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId, enterpriseId },
    });

    if (!incidencia) {
      return false;
    }

    // Si es cliente, debe ser el creador de la incidencia
    if (userType === UserType.CLIENT) {
      return incidencia.createdByUserId === userId;
    }

    // Si es empleado/admin/supervisor, debe pertenecer a la misma empresa
    // Los permisos específicos ya se validan en los guards HTTP
    return true;
  }

  /**
   * Join a chat room for a specific incidencia
   * Room name format: "incidencia:{incidenciaId}"
   */
  @SubscribeMessage('joinIncidenciaChat')
  async handleJoinRoom(
    @MessageBody() data: { incidenciaId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Validar que el usuario esté autenticado
    if (!client.userId || !client.userType) {
      return {
        event: 'error',
        data: { message: 'Usuario no autenticado' },
      };
    }

    if (client.userType !== UserType.SUPER_ADMIN && !client.enterpriseId) {
      return {
        event: 'error',
        data: { message: 'Usuario sin empresa asociada' },
      };
    }

    // Validar acceso a la incidencia
    const hasAccess = await this.validateIncidenciaAccess(
      data.incidenciaId,
      client.userId,
      client.enterpriseId || '', // SUPER_ADMIN no tiene enterprise
      client.userType,
    );

    if (!hasAccess) {
      this.logger.warn(`User ${client.userId} denied access to incidencia ${data.incidenciaId}`);
      return {
        event: 'error',
        data: { message: 'No tienes acceso a esta incidencia' },
      };
    }

    const roomName = `incidencia:${data.incidenciaId}`;
    await client.join(roomName);

    // Log de los sockets en la sala después de unirse
    const socketsInRoom = await this.server.in(roomName).fetchSockets();
    this.logger.log(`✅ User ${client.userId} (${client.userType}) joined room ${roomName}`);
    this.logger.log(`📊 Room ${roomName} now has ${socketsInRoom.length} socket(s):`);
    socketsInRoom.forEach((socket: any) => {
      this.logger.log(`  - Socket ${socket.id} (User: ${socket.userId}, Type: ${socket.userType})`);
    });

    return {
      event: 'joinedRoom',
      data: {
        roomName,
        incidenciaId: data.incidenciaId,
      },
    };
  }

  /**
   * Leave a chat room for a specific incidencia
   */
  @SubscribeMessage('leaveIncidenciaChat')
  async handleLeaveRoom(
    @MessageBody() data: { incidenciaId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `incidencia:${data.incidenciaId}`;
    await client.leave(roomName);

    this.logger.log(`User ${client.userId} left room ${roomName}`);

    return {
      event: 'leftRoom',
      data: {
        roomName,
        incidenciaId: data.incidenciaId,
      },
    };
  }

  /**
   * Send a message to an incidencia chat
   * Stores message in DB and broadcasts to all users in the room
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      incidenciaId: string;
      content: string;
      attachments?: string[];
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Validar que el usuario esté autenticado
    // SUPER_ADMIN no tiene enterpriseId, así que no lo validamos para ellos
    if (!client.userId || !client.userType) {
      return {
        event: 'error',
        data: { message: 'Usuario no autenticado' },
      };
    }

    if (client.userType !== UserType.SUPER_ADMIN && !client.enterpriseId) {
      return {
        event: 'error',
        data: { message: 'Usuario sin empresa asociada' },
      };
    }

    try {
      // Verificar que la incidencia no esté resuelta
      const incidencia = await this.incidenciaRepository.findOne({
        where: { id: data.incidenciaId },
        select: ['id', 'status'],
      });

      if (!incidencia) {
        return {
          event: 'error',
          data: { message: 'Incidencia no encontrada' },
        };
      }

      if (incidencia.status === 'RESOLVED') {
        return {
          event: 'error',
          data: { message: 'No se pueden enviar mensajes a una incidencia resuelta' },
        };
      }

      // Determinar el tipo de remitente basado en el tipo de usuario
      const senderType = client.userType === UserType.CLIENT
        ? MessageSenderType.CLIENT
        : MessageSenderType.EMPLOYEE;

      // Save message to database
      const message = await this.messagesService.create(
        data.incidenciaId,
        client.userId,
        senderType,
        data.content,
        MessageType.TEXT,
        data.attachments,
      );

      const roomName = `incidencia:${data.incidenciaId}`;

      // Log de los sockets en la sala
      const socketsInRoom = await this.server.in(roomName).fetchSockets();
      this.logger.log(`📊 Room ${roomName} has ${socketsInRoom.length} sockets connected`);
      socketsInRoom.forEach((socket: any) => {
        this.logger.log(`  - Socket ${socket.id} (User: ${socket.userId}, Type: ${socket.userType})`);
      });

      // Broadcast message to ALL users in the room (including sender)
      this.server.in(roomName).emit('newMessage', {
        message,
      });

      this.logger.log(`✅ Message sent to room ${roomName} by user ${client.userId} (${client.userType})`);

      return {
        event: 'messageSent',
        data: { message },
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return {
        event: 'error',
        data: {
          message: 'Failed to send message',
          error: error.message,
        },
      };
    }
  }

  /**
   * Notify users when employee requests image re-upload
   * This is called from the service when requestImageReupload is triggered
   */
  emitImageReuploadRequest(incidenciaId: string, message: any) {
    const roomName = `incidencia:${incidenciaId}`;

    this.server.to(roomName).emit('imageReuploadRequested', {
      message,
      incidenciaId,
    });

    this.logger.log(`Image reupload request sent to room ${roomName}`);
  }

  /**
   * Send notification to a specific user
   * Uses personal room pattern: user:{userId}
   */
  async emitNotificationToUser(
    userId: string,
    eventName: string,
    data: any,
  ) {
    const personalRoom = `user:${userId}`;

    // Verificar cuántos sockets están en la sala personal
    const socketsInRoom = await this.server.in(personalRoom).fetchSockets();
    this.logger.log(`🔔 [NOTIFICATION] Sending "${eventName}" to user ${userId}`);
    this.logger.log(`   Room: ${personalRoom}`);
    this.logger.log(`   Sockets in room: ${socketsInRoom.length}`);

    if (socketsInRoom.length === 0) {
      this.logger.warn(`⚠️  [NOTIFICATION] No sockets found in room ${personalRoom} - user may be offline`);
    } else {
      socketsInRoom.forEach((socket: any) => {
        this.logger.log(`   - Socket ${socket.id} (User: ${socket.userId})`);
      });
    }

    this.server.to(personalRoom).emit(eventName, data);
    this.logger.log(`✅ [NOTIFICATION] Event "${eventName}" emitted to room ${personalRoom}`);
  }

  /**
   * Notify users when typing indicator changes
   */
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { incidenciaId: string; userId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `incidencia:${data.incidenciaId}`;

    // Broadcast to everyone except sender
    client.to(roomName).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }
}
