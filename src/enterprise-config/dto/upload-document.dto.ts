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
    example: 'Updated RUT document for 2025',
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

export class ApproveDocumentDto {
  @ApiProperty({
    description: 'Notes about the approval (optional)',
    example: 'Document verified and approved',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RejectDocumentDto {
  @ApiProperty({
    description: 'Reason for rejecting the document',
    example: 'Document is expired or illegible',
    required: true,
  })
  @IsString()
  @MaxLength(500)
  rejectionReason: string;
}
