import { Entity, ManyToOne, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { User } from "./user.entity";
import { Role } from "../../roles/entities/role.entity";

@Entity('user_roles')
@Index('idx_user_roles_unique', { synchronize: false })
export class UserRole {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    userId: string;

    @Column({ type: 'uuid' })
    @Index()
    roleId: string;

    @Column({ type: 'uuid' })
    @Index()
    enterpriseId: string;

    @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
    role: Role;

}