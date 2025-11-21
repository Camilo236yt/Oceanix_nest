import { Entity, ManyToOne, PrimaryGeneratedColumn, Column, Index, Unique, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Role } from "../../roles/entities/role.entity";
import { Enterprise } from "../../enterprise/entities/enterprise.entity";

@Entity('user_roles')
@Unique('uq_user_role_enterprise', ['userId', 'roleId', 'enterpriseId'])
@Index('idx_user_id', ['userId'])
@Index('idx_role_id', ['roleId'])
@Index('idx_enterprise_id', ['enterpriseId'])
export class UserRole {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    roleId: string;

    @Column({ type: 'uuid' })
    enterpriseId: string;

    @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
    role: Role;

    @ManyToOne(() => Enterprise, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'enterpriseId' })
    enterprise: Enterprise;

}