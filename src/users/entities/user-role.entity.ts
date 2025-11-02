import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Role } from "../../roles/entities/role.entity";


@Entity()
export class UserRole {

    @PrimaryGeneratedColumn('uuid')
    id:string;

    @ManyToOne(() => User, user => user.roles, { onDelete: 'CASCADE' })  
    user: User;

    @ManyToOne(() => Role, role => role.users, { onDelete: 'CASCADE' })
    role: Role;

}