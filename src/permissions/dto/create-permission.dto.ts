import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreatePermissionDto {

    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @MinLength(3)
    title: string;

    @IsOptional()
    @IsString()
    @MinLength(5)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsUUID()
    parentId?: string;

}
