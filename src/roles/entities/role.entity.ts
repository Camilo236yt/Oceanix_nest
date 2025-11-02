import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RolePermission } from "./role-permission.entity";
import { UserRole } from "../../users/entities/user-role.entity";

@Entity('roles')
export class Role {

    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({unique: true, type: 'varchar', length:'100'})
    name:string;

    @Column({type: 'text'})
    description:string;

    @Column({type: 'bool', default: true})
    isActive?:boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @OneToMany(() => UserRole, userRole => userRole.role, { cascade: true })
    users: UserRole[];

    @OneToMany(
        () => RolePermission,
        (rolePermission) => rolePermission.role,
        { eager: true }
        )
        permissions: RolePermission[];


}
