import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
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
    createdAt: Date;
    @Column()
    updatedAt: Date;
    @Column()
    photoUrl?: string;
    @Column()
    tenantId: string;
}


