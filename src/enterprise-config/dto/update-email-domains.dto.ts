import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEmailDomainsDto {
    @ApiProperty({
        description: 'Dominios de email corporativo permitidos',
        example: ['empresa.com', 'subsidiary.com'],
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    emailDomains?: string[];

    @ApiProperty({
        description: 'Requiere que los usuarios usen email corporativo',
        example: false,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    requireCorporateEmail?: boolean;
}
