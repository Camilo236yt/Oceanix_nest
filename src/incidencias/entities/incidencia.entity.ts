import { 
  Column, 
  CreateDateColumn, 
  DeleteDateColumn, 
  Entity, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn 
} from "typeorm";

@Entity('incidencias')
export class Incidencia {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  status: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ unique: true })
  ProducReferenceId: string;

  @Column({ nullable: false })
  tenantId: string;

  // ✅ Marca lógica para activar/desactivar sin borrar el registro
  // Ideal para mostrar solo "activas" en la app sin consultar deletedAt
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // ✅ Soft delete nativo de TypeORM
  @DeleteDateColumn()
  deletedAt?: Date;
}

//TODO: SOFT DELETE COLUMNA IsActive ✅
// validar todas las propiedades y restricciones necesarias✅

