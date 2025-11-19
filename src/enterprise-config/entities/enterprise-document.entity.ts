import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Enterprise } from '../../enterprise/entities/enterprise.entity';
import { DocumentType, DocumentStatus } from '../enums/verification-status.enum';

@Entity('enterprise_documents')
export class EnterpriseDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  enterpriseId: string;

  @ManyToOne(() => Enterprise, (enterprise) => enterprise.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise: Enterprise;

  // ========== Document Type ==========
  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  type: DocumentType;

  // ========== File Storage ==========
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500 })
  fileKey: string; // MinIO key for retrieval

  @Column({ type: 'varchar', length: 500 })
  fileUrl: string; // Public or signed URL

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  fileSize: number; // in bytes

  // ========== Metadata ==========
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  // ========== Approval Status ==========
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string; // SUPER_ADMIN user ID

  @Column({ type: 'timestamp', nullable: true })
  approvalDate?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // ========== Control ==========
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  expirationDate?: Date;

  // ========== Timestamps ==========
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
