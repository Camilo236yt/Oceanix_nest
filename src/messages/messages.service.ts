import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageSenderType, MessageType } from './entities/message.entity';
import { Incidencia } from '../incidencias/entities/incidencia.entity';
import { UserType } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
  ) {}

  /**
   * Crea un nuevo mensaje en el chat de una incidencia
   */
  async create(
    incidenciaId: string,
    senderId: string,
    senderType: MessageSenderType,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    attachments?: string[],
  ) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    const message = this.messageRepository.create({
      incidenciaId,
      senderId,
      senderType,
      content,
      messageType,
      attachments: attachments || null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Cargar la relación sender para devolver el mensaje completo
    return await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
      select: {
        id: true,
        incidenciaId: true,
        senderId: true,
        senderType: true,
        messageType: true,
        content: true,
        attachments: true,
        createdAt: true,
        sender: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          userType: true,
        },
      },
    });
  }

  /**
   * Solicita que el cliente re-suba imágenes (solo empleados)
   */
  async requestImageReupload(
    incidenciaId: string,
    employeeId: string,
    message: string,
    hoursAllowed: number = 24,
  ) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    // Habilitar subida de imágenes para el cliente
    const allowedUntil = new Date();
    allowedUntil.setHours(allowedUntil.getHours() + hoursAllowed);

    incidencia.canClientUploadImages = true;
    incidencia.imagesUploadAllowedUntil = allowedUntil;
    incidencia.imageUploadRequestedBy = employeeId;

    await this.incidenciaRepository.save(incidencia);

    // Crear mensaje del sistema
    const systemMessage = await this.messageRepository.create({
      incidenciaId,
      senderId: employeeId,
      senderType: MessageSenderType.SYSTEM,
      messageType: MessageType.IMAGE_REQUEST,
      content: message,
      metadata: {
        requestType: 'RE_UPLOAD_IMAGES',
        allowedUntil,
        imageUploadEnabled: true,
      },
    });

    return await this.messageRepository.save(systemMessage);
  }

  /**
   * Deshabilita la capacidad del cliente de subir imágenes
   */
  async disableClientImageUpload(incidenciaId: string) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    incidencia.canClientUploadImages = false;
    incidencia.imagesUploadAllowedUntil = null;
    incidencia.imageUploadRequestedBy = null;

    await this.incidenciaRepository.save(incidencia);

    return { message: 'Subida de imágenes deshabilitada' };
  }

  /**
   * Obtiene mensajes de una incidencia con paginación optimizada para chat
   * Carga los últimos N mensajes, con soporte para scroll infinito hacia arriba
   *
   * @param incidenciaId - ID de la incidencia
   * @param enterpriseId - ID de la empresa (seguridad multi-tenant)
   * @param limit - Cantidad de mensajes a cargar (default: 50)
   * @param before - ID del mensaje más antiguo cargado (para cargar mensajes anteriores)
   */
  async findAllByIncidencia(
    incidenciaId: string,
    enterpriseId: string,
    limit: number = 50,
    before?: string,
  ) {
    // Verificar que la incidencia pertenece a la empresa
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId, enterpriseId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    // Construir query base
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.incidenciaId = :incidenciaId', { incidenciaId })
      .select([
        'message',
        'sender.id',
        'sender.name',
        'sender.lastName',
        'sender.email',
        'sender.userType',
      ])
      .orderBy('message.createdAt', 'DESC')
      .take(limit + 1); // +1 para detectar si hay más mensajes

    // Si hay cursor "before", cargar mensajes anteriores a ese mensaje
    if (before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: before },
      });

      if (beforeMessage) {
        queryBuilder.andWhere('message.createdAt < :beforeDate', {
          beforeDate: beforeMessage.createdAt,
        });
      }
    }

    const messages = await queryBuilder.getMany();

    // Detectar si hay más mensajes
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remover el mensaje extra
    }

    // Invertir orden para mostrar cronológicamente (más antiguo arriba)
    const orderedMessages = messages.reverse();

    // Obtener total count
    const totalCount = await this.messageRepository.count({
      where: { incidenciaId },
    });

    return {
      messages: orderedMessages,
      totalCount,
      hasMore,
      oldestMessageId: orderedMessages.length > 0 ? orderedMessages[0].id : null,
      newestMessageId: orderedMessages.length > 0 ? orderedMessages[orderedMessages.length - 1].id : null,
    };
  }

  /**
   * Obtiene mensajes de una incidencia para el cliente (solo si es su incidencia) con paginación
   *
   * @param incidenciaId - ID de la incidencia
   * @param clientUserId - ID del cliente (debe ser el creador de la incidencia)
   * @param enterpriseId - ID de la empresa
   * @param limit - Cantidad de mensajes a cargar (default: 50)
   * @param before - ID del mensaje más antiguo cargado (para cargar mensajes anteriores)
   */
  async findAllByIncidenciaForClient(
    incidenciaId: string,
    clientUserId: string,
    enterpriseId: string,
    limit: number = 50,
    before?: string,
  ) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: {
        id: incidenciaId,
        enterpriseId,
        createdByUserId: clientUserId,
      },
    });

    if (!incidencia) {
      throw new ForbiddenException('No tienes acceso a esta incidencia');
    }

    // Construir query base
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.incidenciaId = :incidenciaId', { incidenciaId })
      .select([
        'message',
        'sender.id',
        'sender.name',
        'sender.lastName',
        'sender.userType',
      ])
      .orderBy('message.createdAt', 'DESC')
      .take(limit + 1); // +1 para detectar si hay más mensajes

    // Si hay cursor "before", cargar mensajes anteriores a ese mensaje
    if (before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: before },
      });

      if (beforeMessage) {
        queryBuilder.andWhere('message.createdAt < :beforeDate', {
          beforeDate: beforeMessage.createdAt,
        });
      }
    }

    const messages = await queryBuilder.getMany();

    // Detectar si hay más mensajes
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remover el mensaje extra
    }

    // Invertir orden para mostrar cronológicamente (más antiguo arriba)
    const orderedMessages = messages.reverse();

    // Obtener total count
    const totalCount = await this.messageRepository.count({
      where: { incidenciaId },
    });

    return {
      messages: orderedMessages,
      totalCount,
      hasMore,
      oldestMessageId: orderedMessages.length > 0 ? orderedMessages[0].id : null,
      newestMessageId: orderedMessages.length > 0 ? orderedMessages[orderedMessages.length - 1].id : null,
    };
  }
}
