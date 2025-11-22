import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Incidencia } from '../../incidencias/entities/incidencia.entity';
import { User } from '../../users/entities/user.entity';

export enum MessageSenderType {
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
  SYSTEM = 'SYSTEM',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE_REQUEST = 'IMAGE_REQUEST',
  SYSTEM = 'SYSTEM',
}

@Entity('messages')
@Index('idx_messages_incidencia', ['incidenciaId'])
@Index('idx_messages_created', ['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  incidenciaId: string;

  @ManyToOne(() => Incidencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenciaId' })
  incidencia: Incidencia;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({
    type: 'enum',
    enum: MessageSenderType,
    default: MessageSenderType.EMPLOYEE,
  })
  senderType: MessageSenderType;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    requestType?: 'RE_UPLOAD_IMAGES';
    allowedUntil?: Date;
    imageUploadEnabled?: boolean;
  } | null;

  @CreateDateColumn()
  createdAt: Date;
}
