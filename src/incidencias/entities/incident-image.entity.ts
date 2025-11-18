import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Incidencia } from './incidencia.entity';

@Entity('incident_images')
export class IncidentImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  url: string;

  @ManyToOne(() => Incidencia, { onDelete: 'CASCADE' })
  incidencia: Incidencia;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

