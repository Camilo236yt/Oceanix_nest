import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

// Omit sensitive fields that users shouldn't be able to update
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['userType', 'roleIds', 'password', 'confirmPassword'] as const)
) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmPassword?: string;
}
