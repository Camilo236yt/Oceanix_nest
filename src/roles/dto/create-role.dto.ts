import { IsArray, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";


export class CreateRoleDto {

    @ApiProperty({
        description: 'Nombre del rol',
        example: 'Administrador',
        minLength: 3
    })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({
        description: 'Descripción del rol',
        example: 'Usuario con permisos administrativos completos',
        minLength: 5
    })
    @IsString()
    @MinLength(5)
    description: string;

    @ApiProperty({
        description: 'Array de IDs de permisos a asignar al rol',
        example: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
        required: false,
        type: [String],
        isArray: true
    })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    permissionIds?: string[];

}
