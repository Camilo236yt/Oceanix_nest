import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @ManyToOne(() => Incidencia, { onDelete: 'CASCADE' })
  incidencia: Incidencia;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
