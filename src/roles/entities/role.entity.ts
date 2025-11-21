import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index, ManyToOne } from "typeorm";
import { RolePermission } from "./role-permission.entity";
import { UserRole } from "../../users/entities/user-role.entity";
import { Enterprise } from "../../enterprise/entities/enterprise.entity";

@Entity('roles')
@Index('idx_roles_enterprise_name_unique', ['enterpriseId', 'name'], { unique: true })
export class Role {

    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    enterpriseId: string;

    @Column({type: 'varchar', length:'100'})
    name:string;

    @Column({type: 'text'})
    description:string;

    @Column({ type: 'bool', default: false })
    isSystemRole: boolean;

    @Column({ type: 'bool', default: false })
    canReceiveIncidents: boolean;

    @Column({type: 'bool', default: true})
    isActive?:boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => Enterprise, (enterprise) => enterprise.roles, { nullable: true })
    enterprise: Enterprise;

    @OneToMany(() => UserRole, userRole => userRole.role, { cascade: true })
    users: UserRole[];

    @OneToMany(
        () => RolePermission,
        (rolePermission) => rolePermission.role,
        { cascade: true }
        )
        permissions: RolePermission[];


}
