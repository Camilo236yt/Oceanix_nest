import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum, IsUUID } from 'class-validator';
import { UserType } from '../entities/user.entity';
import { PersonalIdentificationType } from '../constants';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsEnum(PersonalIdentificationType)
  @IsOptional()
  identificationType?: PersonalIdentificationType;

  @IsString()
  @IsOptional()
  identificationNumber?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  isLegalRepresentative?: boolean;
}