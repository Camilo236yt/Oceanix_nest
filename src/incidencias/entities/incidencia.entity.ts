import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
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

    
}
