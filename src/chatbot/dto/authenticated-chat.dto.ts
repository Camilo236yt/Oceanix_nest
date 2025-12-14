import { IsArray, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
    @ApiProperty({
        description: 'Rol del mensaje',
        enum: ['user', 'assistant', 'system'],
        example: 'user'
    })
    @IsEnum(['user', 'assistant', 'system'])
    role: 'user' | 'assistant' | 'system';

    @ApiProperty({
        description: 'Contenido del mensaje',
        example: '¿Cuántas incidencias tenemos pendientes?'
    })
    @IsString()
    content: string;
}

export class AuthenticatedChatRequestDto {
    @ApiProperty({
        description: 'Array de mensajes de la conversación',
        type: [ChatMessageDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChatMessageDto)
    messages: ChatMessageDto[];

    @ApiPropertyOptional({
        description: 'ID de conversación existente para continuar',
        example: 'uuid-here'
    })
    @IsOptional()
    @IsString()
    conversationId?: string;
}

export class FunctionCallInfo {
    @ApiProperty({ description: 'Nombre de la función ejecutada' })
    name: string;

    @ApiProperty({ description: 'Argumentos usados' })
    arguments: any;

    @ApiProperty({ description: 'Resultado de la ejecución' })
    result?: any;
}

export class AuthenticatedChatResponseDto {
    @ApiProperty({
        description: 'Mensaje de respuesta del asistente',
        example: 'Aquí están las últimas 10 incidencias...'
    })
    message: string;

    @ApiProperty({
        description: 'ID de la conversación',
        example: 'uuid-here'
    })
    conversationId: string;

    @ApiProperty({
        description: 'Número total de mensajes en la conversación',
        example: 15
    })
    messageCount: number;

    @ApiPropertyOptional({
        description: 'Indica si se ejecutó alguna función',
        example: true
    })
    hasExecutedFunction?: boolean;

    @ApiPropertyOptional({
        description: 'Información de la función ejecutada',
        type: FunctionCallInfo
    })
    functionCall?: FunctionCallInfo;

    @ApiPropertyOptional({
        description: 'Datos estructurados de la función (tabla, lista, etc.)',
    })
    structuredData?: any;
}

export interface FunctionDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required?: string[];
        };
    };
}
