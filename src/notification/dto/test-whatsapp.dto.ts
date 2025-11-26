import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TestWhatsappDto {
    @ApiProperty({
        description: 'Número de teléfono con código de país (ej: 573001234567)',
        example: '573001234567',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]+$/, { message: 'El número debe contener solo dígitos' })
    testNumber: string;

    @ApiProperty({
        description: 'Mensaje de prueba (opcional)',
        example: 'Hola desde Oceanix Bot 🤖',
        required: false,
    })
    @IsString()
    message?: string;
}
