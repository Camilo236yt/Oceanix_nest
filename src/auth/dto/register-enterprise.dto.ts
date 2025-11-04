import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PersonalIdentificationType, BusinessIdentificationType } from '../../users/constants';

export class RegisterEnterpriseDto {
  // Enterprise data
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Enterprise name',
    minLength: 2,
    maxLength: 200
  })
  @IsString()
  @MinLength(2, { message: 'Enterprise name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Enterprise name must not exceed 200 characters' })
  enterpriseName: string;

  @ApiProperty({
    example: 'acme-corp',
    description: 'Unique subdomain for the enterprise (only lowercase, numbers and hyphens)',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2, { message: 'Subdomain must be at least 2 characters long' })
  @MaxLength(100, { message: 'Subdomain must not exceed 100 characters' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain must contain only lowercase letters, numbers and hyphens' })
  subdomain: string;

  @ApiProperty({
    example: 'contact@acme.com',
    description: 'Enterprise contact email',
    required: false
  })
  @IsEmail()
  @IsOptional()
  enterpriseEmail?: string;

  @ApiProperty({
    example: '+573001234567',
    description: 'Enterprise phone number',
    required: false
  })
  @IsString()
  @IsOptional()
  enterprisePhone?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440003',
    description: 'Enterprise address ID (UUID from location/addresses)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  enterpriseAddressId?: string;

  @ApiProperty({
    example: BusinessIdentificationType.NIT,
    description: 'Enterprise tax identification type',
    enum: BusinessIdentificationType,
    required: false
  })
  @IsEnum(BusinessIdentificationType)
  @IsOptional()
  enterpriseTaxIdType?: BusinessIdentificationType;

  @ApiProperty({
    example: '900123456-7',
    description: 'Enterprise tax identification number',
    required: false
  })
  @IsString()
  @IsOptional()
  enterpriseTaxIdNumber?: string;

  // Admin user data
  @ApiProperty({
    example: 'John',
    description: 'Admin user first name',
    minLength: 2
  })
  @IsString()
  @MinLength(2)
  adminName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Admin user last name',
    minLength: 2
  })
  @IsString()
  @MinLength(2)
  adminLastName: string;

  @ApiProperty({
    example: 'john.doe@acme.com',
    description: 'Admin user email address'
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({
    example: '+573009876543',
    description: 'Admin user phone number'
  })
  @IsString()
  adminPhoneNumber: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Admin user password (min 8 characters, must have uppercase, lowercase and number)',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    { message: 'Password must have uppercase, lowercase letter and a number' }
  )
  adminPassword: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Confirm admin password'
  })
  @IsString()
  adminConfirmPassword: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440004',
    description: 'Admin user address ID (UUID from location/addresses)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  adminAddressId?: string;

  @ApiProperty({
    example: PersonalIdentificationType.CC,
    description: 'Admin user personal identification type',
    enum: PersonalIdentificationType,
    required: false
  })
  @IsEnum(PersonalIdentificationType)
  @IsOptional()
  adminIdentificationType?: PersonalIdentificationType;

  @ApiProperty({
    example: '1234567890',
    description: 'Admin user identification number',
    required: false
  })
  @IsString()
  @IsOptional()
  adminIdentificationNumber?: string;

  // Terms acceptance
  @ApiProperty({
    example: true,
    description: 'Accept terms and conditions',
    required: true
  })
  @IsBoolean()
  acceptTerms: boolean;
}
