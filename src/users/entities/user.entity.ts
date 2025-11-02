import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "./user-role.entity";
import { UserProfile } from "./user-profile.entity";
import { Like } from '../../likes/entities/like.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../reviews/entities/review.entity';
@Entity()
export class User {

    @ApiProperty({
        description: 'Unique identifier of the user in UUID format',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @ApiProperty({
        description: 'Name of the user',
        example: 'Jhon'
    })
    @Column({type:'varchar'})
    name:string;
    
    @ApiProperty({
        description: 'Telephone number of the user',
        example: '+00 0000000000'
    })
    @Column({type: 'varchar'})
    phoneNumber:string;

    @ApiProperty({
        description: 'Last name of the user',
        example: 'Doe'
    })
    @Column({type:'varchar'})
    lastName:string;

    @ApiProperty({
        description: 'Email of the user',
        example: 'jhondoe@example.com'
    })
    @Column({type: 'varchar', length: 200 , unique: true})
    email:string;

     @ApiProperty({
        description: 'Password of the user',
        example: 'SecurePassword'
    })
    @Column({type: 'varchar'})
    password:string;

    @ApiProperty({
        description: 'Token jwt of the user',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA2NGEyMDgwLTlkN2MtNDRiNS1hYTQzLTg0NzVlZjM3OTA1ZiIsImlhdCI6MTc0ODE4MTY3MCwiZXhwIjoxNzQ4MTg4ODcwfQ.GNz6Hi_rFNfhjhYZjSmFVj_t5pBYXNLO2M8QnK0a2fU'
    })
    token?:string;

    @Column({type:'bool', default: false})
    isActive?:boolean;

    @ApiProperty({
        description: 'Email verification status',
        example: true
    })
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
