import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength, IsArray, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmPassword?: string;

  @ApiPropertyOptional({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'Array de IDs de roles para actualizar (opcional, pero si se envía debe tener al menos un rol)',
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'roleIds debe ser un array' })
  @IsUUID(4, { each: true, message: 'Cada roleId debe ser un UUID válido' })
  roleIds?: string[];
}
