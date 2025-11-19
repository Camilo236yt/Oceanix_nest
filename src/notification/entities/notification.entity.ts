import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Enterprise } from '../../enterprise/entities/enterprise.entity';
import { NotificationType, NotificationPriority } from '../enums';

/**
 * Entity que almacena las notificaciones de los usuarios
 * Cada notificación pertenece a un usuario y una empresa
 */
@Entity('notifications')
@Index(['userId', 'isRead']) // Índice para consultas frecuentes de notificaciones no leídas
@Index(['userId', 'createdAt']) // Índice para ordenar por fecha
@Index(['enterpriseId', 'createdAt']) // Índice para consultas por empresa
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Enterprise, { onDelete: 'CASCADE' })
  enterprise: Enterprise;

  @Column({ type: 'uuid' })
  enterpriseId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Título de la notificación',
  })
  title: string;

  @Column({
    type: 'text',
    comment: 'Mensaje o cuerpo de la notificación',
  })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: 'Tipo de notificación',
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    comment: 'Prioridad de la notificación',
  })
  priority: NotificationPriority;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si la notificación ha sido leída',
  })
  isRead: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora en que se leyó la notificación',
  })
  readAt: Date | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadata adicional de la notificación (ticketId, messageId, etc.)',
  })
  metadata: Record<string, any> | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL de acción (donde redirigir al hacer clic)',
  })
  actionUrl: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL de la imagen/icono de la notificación',
  })
  imageUrl: string | null;

  @CreateDateColumn({
    comment: 'Fecha de creación de la notificación',
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Fecha de última actualización',
  })
  updatedAt: Date;
}
