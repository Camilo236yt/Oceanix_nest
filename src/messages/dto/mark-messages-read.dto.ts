import { IsArray, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkMessagesReadDto {
    @ApiProperty({
        description: 'IDs de los mensajes a marcar como leídos. Si no se especifica, marca todos los no leídos de la incidencia',
        required: false,
        type: [String],
        example: ['uuid1', 'uuid2', 'uuid3'],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    messageIds?: string[];
}
