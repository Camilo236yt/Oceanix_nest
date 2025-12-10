import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Incidencia } from './incidencia.entity';
import { User } from '../../users/entities/user.entity';

export enum ReopenRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Index('idx_reopen_requests_incidencia', ['incidenciaId'])
@Index('idx_reopen_requests_enterprise', ['enterpriseId'])
@Index('idx_reopen_requests_status', ['status'])
@Entity('incidencia_reopen_requests')
export class ReopenRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  incidenciaId: string;

  @ManyToOne(() => Incidencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenciaId' })
  incidencia: Incidencia;

  @Column({ type: 'uuid', nullable: false })
  requestedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedByUserId' })
  requestedBy: User;

  @Column({ type: 'text', nullable: false })
  clientReason: string;

  @Column({
    type: 'enum',
    enum: ReopenRequestStatus,
    default: ReopenRequestStatus.PENDING,
  })
  status: ReopenRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedByUserId' })
  reviewedBy?: User;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: false })
  enterpriseId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
