import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength, IsArray, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmPassword?: string;

  @IsOptional()
  @IsArray({ message: 'roleIds debe ser un array' })
  @IsUUID(4, { each: true, message: 'Cada roleId debe ser un UUID válido' })
  roleIds?: string[];
}
