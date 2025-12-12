import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { differenceInDays } from 'date-fns';

import { ReopenRequest, ReopenRequestStatus } from '../entities/reopen-request.entity';
import { Incidencia } from '../entities/incidencia.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { MessagesService } from '../../messages/messages.service';
import { MessagesGateway } from '../../messages/messages.gateway';
import { NotificationService } from '../../notification/notification.service';
import { ValidPermission } from '../../auth/interfaces/valid-permission';
import { NotificationType, NotificationPriority } from '../../notification/enums';
import { IncidenciaStatus } from '../enums/incidencia.enums';
import { INCIDENCIA_CONFIG, REOPEN_MESSAGES, INCIDENCIA_MESSAGES } from '../constants';
import { ReviewDecision } from '../dto/review-reopen-request.dto';
import { MessageSenderType, MessageType } from '../../messages/entities/message.entity';

@Injectable()
export class ReopenRequestsService {
  private readonly logger = new Logger(ReopenRequestsService.name);

  constructor(
    @InjectRepository(ReopenRequest)
    private readonly reopenRequestRepository: Repository<ReopenRequest>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Crear una nueva solicitud de reapertura de incidencia
   */
  async createReopenRequest(
    incidenciaId: string,
    clientId: string,
    enterpriseId: string,
    clientReason: string,
  ): Promise<ReopenRequest> {
    // 1. Buscar incidencia con relaciones
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId, enterpriseId },
      relations: ['createdBy', 'assignedEmployee'],
    });

    if (!incidencia) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.NOT_FOUND);
    }

    // 2. Validar que el cliente es el creador
    if (incidencia.createdByUserId !== clientId) {
      throw new ForbiddenException(REOPEN_MESSAGES.NOT_INCIDENT_OWNER);
    }

    // 3. Validar estado actual (debe ser CLOSED, CANCELLED o RESOLVED)
    const reopenableStatuses = [
      IncidenciaStatus.CLOSED,
      IncidenciaStatus.CANCELLED,
      IncidenciaStatus.RESOLVED,
    ];

    if (!reopenableStatuses.includes(incidencia.status as IncidenciaStatus)) {
      throw new BadRequestException(REOPEN_MESSAGES.CANNOT_REQUEST_INVALID_STATUS);
    }

    // 4. Validar límite de tiempo (10 días)
    if (incidencia.finalStateReachedAt) {
      const daysSinceClosure = differenceInDays(
        new Date(),
        new Date(incidencia.finalStateReachedAt),
      );

      if (daysSinceClosure > INCIDENCIA_CONFIG.REOPEN_DEADLINE_DAYS) {
        throw new BadRequestException(
          `${REOPEN_MESSAGES.CANNOT_REQUEST_TIME_EXPIRED} (${daysSinceClosure} días transcurridos)`,
        );
      }
    }

    // 5. Validar que no existe una solicitud PENDING duplicada
    const existingPendingRequest = await this.reopenRequestRepository.findOne({
      where: {
        incidenciaId,
        status: ReopenRequestStatus.PENDING,
      },
    });

    if (existingPendingRequest) {
      throw new BadRequestException(REOPEN_MESSAGES.ALREADY_HAS_PENDING_REQUEST);
    }

    // 6. Crear la solicitud
    const reopenRequest = this.reopenRequestRepository.create({
      incidenciaId,
      requestedByUserId: clientId,
      clientReason,
      status: ReopenRequestStatus.PENDING,
      enterpriseId,
    });

    const savedRequest = await this.reopenRequestRepository.save(reopenRequest);

    // 7. Crear mensaje en el chat como si lo enviara el cliente
    try {
      await this.messagesService.create(
        incidenciaId,
        clientId,
        MessageSenderType.CLIENT,
        `🔄 Solicito reapertura de esta incidencia.\n\nMotivo: ${clientReason}`,
        MessageType.TEXT,
      );
    } catch (error) {
      this.logger.error('Error al crear mensaje del cliente:', error);
    }

    // 8. Emitir evento WebSocket
    const roomName = `incidencia:${incidenciaId}`;
    this.messagesGateway.server.to(roomName).emit('reopenRequestCreated', {
      requestId: savedRequest.id,
      incidenciaId,
      clientReason,
      requestedBy: {
        id: clientId,
        name: incidencia.createdBy?.name || 'Cliente',
      },
      timestamp: new Date().toISOString(),
    });

    // 9. Enviar notificaciones (async, no bloqueante)
    this.sendRequestCreatedNotifications(incidencia, savedRequest, enterpriseId)
      .catch(error => {
        this.logger.error('Error al enviar notificaciones de solicitud creada:', error);
      });

    // 10. Retornar solicitud con relaciones
    const result = await this.reopenRequestRepository.findOne({
      where: { id: savedRequest.id },
      relations: ['incidencia', 'requestedBy'],
    });

    if (!result) {
      throw new NotFoundException('No se pudo recuperar la solicitud creada');
    }

    return result;
  }

  /**
   * Obtener solicitudes pendientes con paginación
   */
  async getPendingRequests(
    enterpriseId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ReopenRequest[]; meta: any }> {
    const skip = (page - 1) * limit;

    const [requests, total] = await this.reopenRequestRepository.findAndCount({
      where: {
        enterpriseId,
        status: ReopenRequestStatus.PENDING,
      },
      relations: ['incidencia', 'requestedBy'],
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener una solicitud por ID
   */
  async getRequestById(
    requestId: string,
    enterpriseId: string,
  ): Promise<ReopenRequest> {
    const request = await this.reopenRequestRepository.findOne({
      where: { id: requestId, enterpriseId },
      relations: [
        'incidencia',
        'incidencia.assignedEmployee',
        'requestedBy',
        'reviewedBy',
      ],
    });

    if (!request) {
      throw new NotFoundException(REOPEN_MESSAGES.REQUEST_NOT_FOUND);
    }

    return request;
  }

  /**
   * Revisar una solicitud (aprobar o rechazar)
   */
  async reviewRequest(
    requestId: string,
    employeeId: string,
    enterpriseId: string,
    decision: ReviewDecision,
    reviewNotes?: string,
  ): Promise<{ request: ReopenRequest; incidencia?: Incidencia }> {
    // 1. Buscar solicitud con relaciones
    const request = await this.reopenRequestRepository.findOne({
      where: { id: requestId, enterpriseId },
      relations: ['incidencia', 'incidencia.assignedEmployee', 'requestedBy'],
    });

    if (!request) {
      throw new NotFoundException(REOPEN_MESSAGES.REQUEST_NOT_FOUND);
    }

    // 2. Validar que está PENDING
    if (request.status !== ReopenRequestStatus.PENDING) {
      throw new BadRequestException(REOPEN_MESSAGES.REQUEST_ALREADY_REVIEWED);
    }

    // 3. Validar reviewNotes si es rechazo
    if (decision === ReviewDecision.REJECTED && (!reviewNotes || reviewNotes.trim().length < 10)) {
      throw new BadRequestException(REOPEN_MESSAGES.REJECTION_NOTES_REQUIRED);
    }

    // 4. Actualizar la solicitud
    request.status = decision === ReviewDecision.APPROVED
      ? ReopenRequestStatus.APPROVED
      : ReopenRequestStatus.REJECTED;
    request.reviewedByUserId = employeeId;
    request.reviewNotes = reviewNotes || null;
    request.reviewedAt = new Date();

    const savedRequest = await this.reopenRequestRepository.save(request);

    let reopenedIncidencia: Incidencia | undefined;

    // 5. Si fue aprobada, ejecutar reapertura
    if (decision === ReviewDecision.APPROVED) {
      reopenedIncidencia = await this.executeReopen(request.incidencia);

      // Crear mensaje de sistema
      try {
        const reviewer = await this.userRepository.findOne({ where: { id: employeeId } });
        await this.messagesService.create(
          request.incidenciaId,
          employeeId,
          MessageSenderType.SYSTEM,
          `✅ Solicitud de reapertura aprobada por ${reviewer?.name || 'empleado'}.\n\nNotas: ${reviewNotes || 'Sin notas adicionales'}`,
          MessageType.SYSTEM,
        );
      } catch (error) {
        this.logger.error('Error al crear mensaje de sistema (aprobación):', error);
      }

      // Emitir evento
      const roomName = `incidencia:${request.incidenciaId}`;
      this.messagesGateway.server.to(roomName).emit('reopenRequestApproved', {
        requestId: request.id,
        incidenciaId: request.incidenciaId,
        reviewedBy: {
          id: employeeId,
          name: 'Empleado',
        },
        timestamp: new Date().toISOString(),
      });

      // Enviar notificaciones
      this.sendRequestApprovedNotifications(reopenedIncidencia, request, enterpriseId)
        .catch(error => {
          this.logger.error('Error al enviar notificaciones de aprobación:', error);
        });
    } else {
      // 6. Si fue rechazada
      try {
        const reviewer = await this.userRepository.findOne({ where: { id: employeeId } });
        await this.messagesService.create(
          request.incidenciaId,
          employeeId,
          MessageSenderType.SYSTEM,
          `❌ Solicitud de reapertura rechazada por ${reviewer?.name || 'empleado'}.\n\nMotivo del rechazo: ${reviewNotes}`,
          MessageType.SYSTEM,
        );
      } catch (error) {
        this.logger.error('Error al crear mensaje de sistema (rechazo):', error);
      }

      // Emitir evento
      const roomName = `incidencia:${request.incidenciaId}`;
      this.messagesGateway.server.to(roomName).emit('reopenRequestRejected', {
        requestId: request.id,
        incidenciaId: request.incidenciaId,
        reviewNotes,
        reviewedBy: {
          id: employeeId,
          name: 'Empleado',
        },
        timestamp: new Date().toISOString(),
      });

      // Enviar notificación al cliente
      this.sendRequestRejectedNotifications(request, enterpriseId)
        .catch(error => {
          this.logger.error('Error al enviar notificaciones de rechazo:', error);
        });
    }

    return {
      request: savedRequest,
      incidencia: reopenedIncidencia,
    };
  }

  /**
   * Ejecutar la reapertura de una incidencia (método privado)
   */
  private async executeReopen(incidencia: Incidencia): Promise<Incidencia> {
    const previousStatus = incidencia.status;

    // Actualizar estado a IN_PROGRESS
    incidencia.status = IncidenciaStatus.IN_PROGRESS;
    incidencia.finalStateReachedAt = null;

    const saved = await this.incidenciaRepository.save(incidencia);

    // Emitir eventos WebSocket
    const roomName = `incidencia:${incidencia.id}`;
    this.messagesGateway.server.to(roomName).emit('incidenciaReopened', {
      incidenciaId: incidencia.id,
      status: IncidenciaStatus.IN_PROGRESS,
      previousStatus,
      timestamp: new Date().toISOString(),
    });

    this.messagesGateway.server.to(roomName).emit('chatUnlocked', {
      incidenciaId: incidencia.id,
      status: IncidenciaStatus.IN_PROGRESS,
    });

    return saved;
  }

  /**
   * Obtener usuarios con un permiso específico
   */
  private async getUsersWithPermission(
    enterpriseId: string,
    permission: ValidPermission,
  ): Promise<User[]> {
    const userRoles = await this.dataSource
      .getRepository(UserRole)
      .createQueryBuilder('userRole')
      .innerJoin('userRole.role', 'role')
      .innerJoin('role.permissions', 'rolePermission')
      .innerJoin('rolePermission.permission', 'permission')
      .innerJoin('userRole.user', 'user')
      .where('userRole.enterpriseId = :enterpriseId', { enterpriseId })
      .andWhere('permission.name = :permissionName', { permissionName: permission })
      .andWhere('user.isActive = true')
      .select(['userRole.id', 'user.id', 'user.email', 'user.name'])
      .getMany();

    // Extraer usuarios únicos
    const uniqueUsers = new Map<string, User>();
    for (const userRole of userRoles) {
      if (userRole.user && !uniqueUsers.has(userRole.user.id)) {
        uniqueUsers.set(userRole.user.id, userRole.user);
      }
    }

    return Array.from(uniqueUsers.values());
  }

  /**
   * Enviar notificaciones cuando se crea una solicitud
   */
  private async sendRequestCreatedNotifications(
    incidencia: Incidencia,
    request: ReopenRequest,
    enterpriseId: string,
  ): Promise<void> {
    const notificationPromises: Promise<void>[] = [];

    // Obtener empleados con permiso reopenIncidents
    const employeesWithPermission = await this.getUsersWithPermission(
      enterpriseId,
      ValidPermission.reopenIncidents,
    );

    for (const employee of employeesWithPermission) {
      notificationPromises.push(
        this.notificationService.sendToUser(
          employee.id,
          enterpriseId,
          {
            title: '🔄 Nueva solicitud de reapertura',
            message: `El cliente solicita reabrir la incidencia "${incidencia.name}". Motivo: ${request.clientReason}`,
            type: NotificationType.TICKET_STATUS_CHANGED,
            priority: NotificationPriority.HIGH,
            metadata: {
              incidenciaId: incidencia.id,
              requestId: request.id,
              incidenciaName: incidencia.name,
            },
            actionUrl: `/incidencias/${incidencia.id}`,
          },
        ).then(() => {}),
      );
    }

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Enviar notificaciones cuando se aprueba una solicitud
   */
  private async sendRequestApprovedNotifications(
    incidencia: Incidencia,
    request: ReopenRequest,
    enterpriseId: string,
  ): Promise<void> {
    const notificationPromises: Promise<void>[] = [];

    // 1. Notificar al cliente
    if (request.requestedByUserId) {
      notificationPromises.push(
        this.notificationService.sendToUser(
          request.requestedByUserId,
          enterpriseId,
          {
            title: '✅ Tu solicitud fue aprobada',
            message: `Tu incidencia "${incidencia.name}" ha sido reabierta. Nuestro equipo está trabajando en ella.`,
            type: NotificationType.TICKET_STATUS_CHANGED,
            priority: NotificationPriority.NORMAL,
            metadata: {
              incidenciaId: incidencia.id,
              requestId: request.id,
            },
            actionUrl: `/incidencias/${incidencia.id}`,
          },
        ).then(() => {}),
      );
    }

    // 2. Notificar al empleado asignado (si es diferente del revisor)
    if (incidencia.assignedEmployeeId && incidencia.assignedEmployeeId !== request.reviewedByUserId) {
      notificationPromises.push(
        this.notificationService.sendToUser(
          incidencia.assignedEmployeeId,
          enterpriseId,
          {
            title: '🔄 Incidencia reabierta',
            message: `La incidencia "${incidencia.name}" fue reabierta. Requiere tu atención.`,
            type: NotificationType.TICKET_STATUS_CHANGED,
            priority: NotificationPriority.NORMAL,
            metadata: {
              incidenciaId: incidencia.id,
              requestId: request.id,
            },
            actionUrl: `/incidencias/${incidencia.id}`,
          },
        ).then(() => {}),
      );
    }

    // 3. Notificar a gestores (excluir revisor y asignado)
    const employeesWithPermission = await this.getUsersWithPermission(
      enterpriseId,
      ValidPermission.reopenIncidents,
    );

    for (const employee of employeesWithPermission) {
      // Excluir al revisor y al asignado
      if (employee.id === request.reviewedByUserId || employee.id === incidencia.assignedEmployeeId) {
        continue;
      }

      notificationPromises.push(
        this.notificationService.sendToUser(
          employee.id,
          enterpriseId,
          {
            title: '🔄 Incidencia reabierta',
            message: `La incidencia "${incidencia.name}" fue reabierta.`,
            type: NotificationType.TICKET_STATUS_CHANGED,
            priority: NotificationPriority.LOW,
            metadata: {
              incidenciaId: incidencia.id,
              requestId: request.id,
            },
            actionUrl: `/incidencias/${incidencia.id}`,
          },
        ).then(() => {}),
      );
    }

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Enviar notificaciones cuando se rechaza una solicitud
   */
  private async sendRequestRejectedNotifications(
    request: ReopenRequest,
    enterpriseId: string,
  ): Promise<void> {
    // Notificar solo al cliente
    if (request.requestedByUserId) {
      try {
        await this.notificationService.sendToUser(
          request.requestedByUserId,
          enterpriseId,
          {
            title: '❌ Tu solicitud fue rechazada',
            message: `Tu solicitud de reapertura fue revisada y rechazada. Motivo: ${request.reviewNotes}`,
            type: NotificationType.TICKET_STATUS_CHANGED,
            priority: NotificationPriority.NORMAL,
            metadata: {
              incidenciaId: request.incidenciaId,
              requestId: request.id,
              reviewNotes: request.reviewNotes,
            },
          },
        );
      } catch (error) {
        this.logger.error('Error al notificar rechazo al cliente:', error);
      }
    }
  }
}
