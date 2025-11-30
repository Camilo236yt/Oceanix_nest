import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Incidencia } from './incidencia.entity';

@Entity('images')
export class IncidentImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  url: string;

  @Column({ nullable: false })
  key: string;

  @Column({ nullable: false })
  mimeType: string;

  @Column({ nullable: false })
  originalName: string;

  @Column({ type: 'boolean', default: false })
  isNew: boolean;

  @Column({ type: 'uuid' })
  incidenciaId: string;

  @ManyToOne(() => Incidencia, (incidencia) => incidencia.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenciaId' })
  incidencia: Incidencia;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
