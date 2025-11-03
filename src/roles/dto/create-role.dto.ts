import { IsArray, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateRoleDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @MinLength(5)
    description: string;

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    permissionIds?: string[];
}
