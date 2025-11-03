import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterEnterpriseDto {
  // Enterprise data
  @IsString()
  @MinLength(2, { message: 'Enterprise name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Enterprise name must not exceed 200 characters' })
  enterpriseName: string;

  @IsString()
  @MinLength(2, { message: 'Subdomain must be at least 2 characters long' })
  @MaxLength(100, { message: 'Subdomain must not exceed 100 characters' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain must contain only lowercase letters, numbers and hyphens' })
  subdomain: string;

  @IsEmail()
  @IsOptional()
  enterpriseEmail?: string;

  @IsString()
  @IsOptional()
  enterprisePhone?: string;

  @IsString()
  @IsOptional()
  enterpriseAddress?: string;

  // Admin user data
  @IsString()
  @MinLength(2)
  adminName: string;

  @IsString()
  @MinLength(2)
  adminLastName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  adminPhoneNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    { message: 'Password must have uppercase, lowercase letter and a number' }
  )
  adminPassword: string;

  @IsString()
  adminConfirmPassword: string;

  @IsString()
  @IsOptional()
  adminAddress?: string;

  @IsString()
  @IsOptional()
  adminIdentificationType?: string;

  @IsString()
  @IsOptional()
  adminIdentificationNumber?: string;
}
