import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProviderType } from '../enums';

/**
 * Entity que almacena las preferencias de notificación por provider de cada usuario
 * Permite configurar qué canales de notificación tiene activos cada usuario
 * y almacenar configuración específica de cada provider (ej: chatId de Telegram)
 */
@Entity('notification_provider_preferences')
@Unique(['userId', 'providerType']) // Un usuario solo puede tener una configuración por provider
@Index(['userId', 'isEnabled']) // Índice para consultas frecuentes
export class NotificationProviderPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ProviderType,
    comment: 'Tipo de provider de notificación (EMAIL, WEBSOCKET, TELEGRAM, WHATSAPP)',
  })
  providerType: ProviderType;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el usuario tiene activo este canal de notificación',
  })
  isEnabled: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuración específica del provider. Ejemplos: {chatId: "123"} para Telegram, {phoneNumber: "+57300..."} para WhatsApp',
  })
  config: {
    // Para Email: no necesita configuración, usa el email del usuario

    // Para WebSocket: no necesita configuración

    // Para Telegram:
    chatId?: string;
    username?: string;

    // Para WhatsApp:
    phoneNumber?: string;
    isVerified?: boolean;
    verificationCode?: string;
    verificationExpiry?: Date;
  } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
