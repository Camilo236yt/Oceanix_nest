import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoleDto {
    @ApiProperty({
        description: 'Name of the role',
        example: 'Support Agent',
        minLength: 3
    })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({
        description: 'Detailed description of the role and its responsibilities',
        example: 'Agent responsible for handling customer support tickets',
        minLength: 5
    })
    @IsString()
    @MinLength(5)
    description: string;

    @ApiProperty({
        description: 'Optional array of permission UUIDs to assign to the role',
        example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        required: false,
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    permissionIds?: string[];

    @ApiProperty({
        description: 'Whether users with this role can receive automatic incident assignments. When true, automatically grants viewOwnIncidents and editOwnIncidents permissions.',
        example: true,
        required: false,
        default: false
    })
    @IsOptional()
    @IsBoolean()
    canReceiveIncidents?: boolean;
}
