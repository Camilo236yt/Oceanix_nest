import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, IsUUID } from 'class-validator';

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

  @IsOptional()
  isActive?: boolean;

  @IsNotEmpty({ message: 'Los roles son obligatorios para usuarios del sistema' })
  @IsArray({ message: 'roleIds debe ser un array' })
  @IsUUID(4, { each: true, message: 'Cada roleId debe ser un UUID válido' })
  roleIds: string[];
}
