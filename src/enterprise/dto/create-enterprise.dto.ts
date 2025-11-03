import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateEnterpriseDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  name: string;

  @IsString()
  @MinLength(2, { message: 'Subdomain must be at least 2 characters long' })
  @MaxLength(100, { message: 'Subdomain must not exceed 100 characters' })
  subdomain: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  plan?: 'free' | 'pro' | 'enterprise';
}
