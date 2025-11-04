import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRolesDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
