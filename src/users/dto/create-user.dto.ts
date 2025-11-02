import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Jhon' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+00 0000000000' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'jhondoe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'SecurePassword' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000', '987e6543-e21b-45d3-a654-321098765432'],
    description: 'Array de IDs de roles a asignar al usuario (obligatorio para usuarios del sistema)',
    type: [String]
  })
  @IsNotEmpty({ message: 'Los roles son obligatorios para usuarios del sistema' })
  @IsArray({ message: 'roleIds debe ser un array' })
  @IsUUID(4, { each: true, message: 'Cada roleId debe ser un UUID válido' })
  roleIds: string[];
}
