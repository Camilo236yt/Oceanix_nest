import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "../../permissions/entities/permission.entity";

@Entity()
export class RolePermission{

    @PrimaryGeneratedColumn('uuid')
    id:string;

    // 🎯 Relación con el rol
    @ManyToOne(() => Role, role => role.permissions, { onDelete: 'CASCADE' })
    role: Role;

  
    @ManyToOne(() => Permission, { onDelete: 'CASCADE', eager: true })
    permission: Permission;
    
    
}