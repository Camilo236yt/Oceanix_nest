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
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageSenderType, MessageType } from './entities/message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  enterpriseId?: string;
  userType?: 'EMPLOYEE' | 'CLIENT';
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure according to your needs
  },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join a chat room for a specific incidencia
   * Room name format: "incidencia:{incidenciaId}"
   */
  @SubscribeMessage('joinIncidenciaChat')
  async handleJoinRoom(
    @MessageBody() data: { incidenciaId: string; userId: string; enterpriseId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `incidencia:${data.incidenciaId}`;

    // Store user info in socket
    client.userId = data.userId;
    client.enterpriseId = data.enterpriseId;

    await client.join(roomName);

    this.logger.log(`User ${data.userId} joined room ${roomName}`);

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
      senderId: string;
      senderType: MessageSenderType;
      content: string;
      attachments?: string[];
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Save message to database
      const message = await this.messagesService.create(
        data.incidenciaId,
        data.senderId,
        data.senderType,
        data.content,
        MessageType.TEXT,
        data.attachments,
      );

      const roomName = `incidencia:${data.incidenciaId}`;

      // Broadcast message to all users in the room
      this.server.to(roomName).emit('newMessage', {
        message,
      });

      this.logger.log(`Message sent to room ${roomName} by user ${data.senderId}`);

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
