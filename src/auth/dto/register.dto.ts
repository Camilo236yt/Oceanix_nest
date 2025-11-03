import { IsEmail, IsString, Matches, IsOptional, MinLength, IsEnum } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { PersonalIdentificationType } from '../../users/constants';

export class RegisterDto {
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'User email address'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description: 'Password must have uppercase, lowercase letter and a number',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
            message: 'The password must have a Uppercase, lowercase letter and a number'
        }
    )
    password: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description: 'Confirm password'
    })
    @IsString()
    confirmPassword: string;

    @ApiProperty({
        example: 'John',
        description: 'User first name'
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'Doe',
        description: 'User last name'
    })
    @IsString()
    lastName: string;

    @ApiProperty({
        example: '+573001234567',
        description: 'User phone number'
    })
    @IsString()
    phoneNumber: string;

    @ApiProperty({
        example: 'Carrera 7 #80-45',
        description: 'User address',
        required: false
    })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({
        example: PersonalIdentificationType.CC,
        description: 'Personal identification type',
        enum: PersonalIdentificationType,
        required: false
    })
    @IsEnum(PersonalIdentificationType)
    @IsOptional()
    identificationType?: PersonalIdentificationType;

    @ApiProperty({
        example: '1234567890',
        description: 'Identification number',
        required: false
    })
    @IsString()
    @IsOptional()
    identificationNumber?: string;
}