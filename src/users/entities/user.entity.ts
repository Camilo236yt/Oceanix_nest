import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index, ManyToOne, OneToMany } from "typeorm";
import { Enterprise } from "../../enterprise/entities/enterprise.entity";
import { UserRole } from "./user-role.entity";
import { PersonalIdentificationType } from "../constants";

export enum UserType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ENTERPRISE_ADMIN = 'ENTERPRISE_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

@Entity('users')
@Index('idx_users_enterprise_email_unique', ['enterpriseId', 'email'], { unique: true })
@Index('idx_users_enterprise_active', ['enterpriseId', 'isActive'])
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    enterpriseId: string;

    @Column({ type: 'enum', enum: UserType, default: UserType.EMPLOYEE })
    userType: UserType;

    @Column({type:'varchar'})
    name: string;

    @Column({type: 'varchar'})
    phoneNumber: string;

    @Column({type:'varchar'})
    lastName: string;

    @Column({type: 'varchar', length: 200})
    email: string;

    @Column({type: 'varchar'})
    password: string;

    @Column({type: 'varchar', nullable: true})
    address: string;

    @Column({type: 'enum', enum: PersonalIdentificationType, nullable: true})
    identificationType: PersonalIdentificationType;

    @Column({type: 'varchar', nullable: true})
    identificationNumber: string;

    @Column({type:'bool', default: false})
    isActive?: boolean;

    @Column({type:'bool', default: false})
    isEmailVerified?: boolean;

    @Column({type: 'bool', default: false})
    isLegalRepresentative: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Enterprise, (enterprise) => enterprise.users, { nullable: true })
    enterprise: Enterprise;

    @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
    roles: UserRole[];

}
