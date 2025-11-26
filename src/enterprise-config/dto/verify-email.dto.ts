import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

// No DTO needed for sending - uses logged user's email automatically

export class VerifyEmailDto {
    @ApiProperty({
        description: 'Código de verificación de 6 dígitos',
        example: '123456',
    })
    @IsString()
    @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
    @Matches(/^\d{6}$/, { message: 'El código debe ser numérico' })
    code: string;
}
