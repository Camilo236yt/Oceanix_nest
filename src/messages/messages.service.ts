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

    return await this.messageRepository.save(message);
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
   * Obtiene todos los mensajes de una incidencia
   */
  async findAllByIncidencia(incidenciaId: string, enterpriseId: string) {
    // Verificar que la incidencia pertenece a la empresa
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId, enterpriseId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    return await this.messageRepository.find({
      where: { incidenciaId },
      relations: ['sender'],
      select: {
        sender: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          userType: true,
        },
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtiene mensajes de una incidencia para el cliente (solo si es su incidencia)
   */
  async findAllByIncidenciaForClient(
    incidenciaId: string,
    clientUserId: string,
    enterpriseId: string,
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

    return await this.messageRepository.find({
      where: { incidenciaId },
      relations: ['sender'],
      select: {
        sender: {
          id: true,
          name: true,
          lastName: true,
          userType: true,
        },
      },
      order: { createdAt: 'ASC' },
    });
  }
}
