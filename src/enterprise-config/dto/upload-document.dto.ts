import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { DocumentType } from '../enums/verification-status.enum';

export class UploadDocumentDto {
    @ApiProperty({
        description: 'Type of document being uploaded',
        enum: DocumentType,
        example: DocumentType.TAX_ID,
    })
    @IsEnum(DocumentType)
    type: DocumentType;

    @ApiProperty({
        description: 'Description or notes about the document',
        example: 'RUT actualizado enero 2025',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiProperty({
        description: 'Expiration date of the document (ISO format)',
        example: '2026-12-31',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    expirationDate?: string;
}
