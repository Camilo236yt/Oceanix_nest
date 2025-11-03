import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type:'varchar'})
    name: string;

    @Column({type: 'varchar'})
    phoneNumber: string;

    @Column({type:'varchar'})
    lastName: string;

    @Column({type: 'varchar', length: 200 , unique: true})
    email: string;

    @Column({type: 'varchar'})
    password: string;

    token?: string;

    @Column({type:'bool', default: false})
    isActive?: boolean;

    @Column({type:'bool', default: false})
    isEmailVerified?: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}
