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
import { IncidentImage } from '../entities/incident-image.entity';
import { Enterprise } from '../../enterprise/entities/enterprise.entity';
import { User } from '../../users/entities/user.entity';

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

  @Column({ nullable: false })
  tenantId: string;

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


