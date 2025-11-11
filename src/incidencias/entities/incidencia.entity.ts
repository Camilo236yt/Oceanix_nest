import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
@Entity('incidencias')
export class Incidencia {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column()
    name: string;
    @Column()
    description: string;
    @Column()
    status: string;
    @Column()
    photoUrl?: string;
    @Column({unique: true})
    ProducReferenceId: string;  
    @Column()
    tenantId: string;
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
    @DeleteDateColumn()
     deletedAt?: Date;
//TODO: SOFT DELETE COLUMNA IsActive 
// validar todas las propiedades y restricciones necesarias

}
