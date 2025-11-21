import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class VerifyEnterpriseDto {
  @ApiProperty({
    description: 'Reason for verification approval (optional)',
    example: 'All documents verified successfully',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RejectEnterpriseDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Tax ID document is expired',
    required: true,
  })
  @IsString()
  @MaxLength(500)
  rejectionReason: string;
}
