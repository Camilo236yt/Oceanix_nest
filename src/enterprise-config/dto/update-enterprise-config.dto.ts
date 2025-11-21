import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEmail,
  Matches,
  MaxLength,
  IsObject,
} from 'class-validator';

export class UpdateEnterpriseConfigDto {
  @ApiProperty({
    description: 'Primary brand color in HEX format',
    example: '#FF5733',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Primary color must be a valid HEX color (#RRGGBB or #RGB)',
  })
  @MaxLength(7)
  primaryColor?: string;

  @ApiProperty({
    description: 'Secondary brand color in HEX format',
    example: '#3498DB',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Secondary color must be a valid HEX color (#RRGGBB or #RGB)',
  })
  @MaxLength(7)
  secondaryColor?: string;

  @ApiProperty({
    description: 'Accent color in HEX format',
    example: '#F39C12',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Accent color must be a valid HEX color (#RRGGBB or #RGB)',
  })
  @MaxLength(7)
  accentColor?: string;

  @ApiProperty({
    description: 'Custom theme configuration (advanced)',
    example: { fontSize: '14px', fontFamily: 'Roboto' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customTheme?: Record<string, any>;

  @ApiProperty({
    description: 'Allowed email domains for corporate users',
    example: ['company.com', 'subsidiary.com'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailDomains?: string[];

  @ApiProperty({
    description: 'Require users to have corporate email to register',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requireCorporateEmail?: boolean;
}
