import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../enums/verification-status.enum';

export class UpdateVerificationStatusDto {
    @ApiProperty({
        enum: VerificationStatus,
        description: 'New verification status for the enterprise',
        example: VerificationStatus.VERIFIED,
    })
    @IsEnum(VerificationStatus)
    verificationStatus: VerificationStatus;

    @ApiPropertyOptional({
        description: 'Reason for rejection (required when status is REJECTED)',
        example: 'Documentos incompletos o inválidos',
    })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
