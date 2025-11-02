import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "./user-role.entity";
import { UserProfile } from "./user-profile.entity";
import { Like } from '../../likes/entities/like.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../reviews/entities/review.entity';

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

    // Relación 1:1 con UserProfile
    @OneToOne(() => UserProfile, profile => profile.user, { cascade: true })
    profile?: UserProfile;

    @OneToMany(() => Like, (like) => like.user)
    likes: Like[];

    @OneToMany(() => UserRole, userRole => userRole.user, { cascade: true })
    roles: UserRole[];

    @OneToMany(() => Booking, booking => booking.user)
    bookings: Booking[];

    @OneToMany(() => Review, review => review.user)
    reviews: Review[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}
