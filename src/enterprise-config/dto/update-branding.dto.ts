import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    Matches,
    MaxLength,
    IsObject,
} from 'class-validator';

export class UpdateBrandingDto {
    @ApiProperty({
        description: 'Color principal en formato HEX',
        example: '#9333EA',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'primaryColor debe ser un color HEX válido (ej: #9333EA)',
    })
    primaryColor?: string;

    @ApiProperty({
        description: 'Color secundario en formato HEX',
        example: '#424242',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'secondaryColor debe ser un color HEX válido (ej: #424242)',
    })
    secondaryColor?: string;

    @ApiProperty({
        description: 'Color de acento en formato HEX',
        example: '#FF4081',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'accentColor debe ser un color HEX válido (ej: #FF4081)',
    })
    accentColor?: string;

    @ApiProperty({
        description: 'Tema personalizado avanzado (JSON)',
        example: { darkMode: true, fontSize: '16px' },
        required: false,
    })
    @IsOptional()
    @IsObject()
    customTheme?: Record<string, any>;
}
