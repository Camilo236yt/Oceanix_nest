import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TipoIncidencia } from '../enums/incidencia.enums';
import { AlertLevel } from '../enums/alert-level.enum';
import { IncidentImage } from '../entities/incident-image.entity';
import { Enterprise } from '../../enterprise/entities/enterprise.entity';
import { User } from '../../users/entities/user.entity';

@Index('idx_incidencias_enterprise', ['enterpriseId'])

@Entity('incidencias')
export class Incidencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Tipo de incidencia (ENUM)
  @Column({
    type: 'enum',
    enum: TipoIncidencia,
    default: TipoIncidencia.OTRO,
  })
  tipo: TipoIncidencia;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  status: string;

  @Column({ unique: true })
  ProducReferenceId: string;

  @Column({ type: 'uuid', nullable: false })
  enterpriseId: string;

  @ManyToOne(() => Enterprise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise: Enterprise;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  // Empleado asignado (User)
  @Column({ type: 'uuid', nullable: true })
  assignedEmployeeId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedEmployeeId' })
  assignedEmployee?: User;

  // Marca lógica para activar/desactivar sin borrar el registro
  @Column({ default: true })
  isActive: boolean;

  // Nivel de alerta basado en días sin atender (semáforo)
  @Column({
    type: 'enum',
    enum: AlertLevel,
    default: AlertLevel.GREEN,
  })
  @Index()
  alertLevel: AlertLevel;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Soft delete nativo de TypeORM
  @DeleteDateColumn()
  deletedAt?: Date;

  // Imágenes asociadas a la incidencia
  @OneToMany(() => IncidentImage, (image) => image.incidencia, { cascade: true })
  images?: IncidentImage[];
}


