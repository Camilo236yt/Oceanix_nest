import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { TipoIncidencia } from "../dto/enum/status-incidencias.enum"; // ✅ importar nuevo enum

// TODO: Crear archivo de entidad para IncidentImage (crear archivo separado en entities/)
// TODO: Agregar relación OneToMany con IncidentImage
// TODO: Cambiar tenantId por enterpriseId y agregar relación con Enterprise
// TODO: Agregar relación con User para empleado asignado


@Entity('incidencias')
export class Incidencia {

  @PrimaryGeneratedColumn('uuid')
  id: string;

 // ✅ Nuevo campo ENUM para el tipo de incidencia
  @Column({
    type: 'enum',
    enum: TipoIncidencia,
    default: TipoIncidencia.OTRO, // valor por defecto
  })
  tipo: TipoIncidencia;

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

