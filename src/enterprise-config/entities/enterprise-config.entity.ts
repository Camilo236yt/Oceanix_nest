import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Enterprise } from '../../enterprise/entities/enterprise.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

@Entity('enterprise_config')
export class EnterpriseConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  enterpriseId: string;

  @OneToOne(() => Enterprise, (enterprise) => enterprise.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise: Enterprise;

  // ========== Verification ==========
  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  verificationDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string; // SUPER_ADMIN user ID

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // ========== Personalization ==========
  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor?: string; // #HEX color

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string; // #HEX color

  @Column({ type: 'varchar', length: 7, nullable: true })
  accentColor?: string; // #HEX color

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string; // MinIO key or URL

  @Column({ type: 'varchar', length: 500, nullable: true })
  faviconUrl?: string; // MinIO key or URL

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerUrl?: string; // MinIO key or URL

  @Column({ type: 'jsonb', nullable: true })
  customTheme?: Record<string, any>; // JSON for advanced customization

  // ========== Corporate Email ==========
  @Column({ type: 'simple-array', nullable: true })
  emailDomains?: string[]; // Allowed email domains: ['company.com', 'subsidiary.com']

  @Column({ type: 'boolean', default: false })
  requireCorporateEmail: boolean;

  // ========== Timestamps ==========
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
