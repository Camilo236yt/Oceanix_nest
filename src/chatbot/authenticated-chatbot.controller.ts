import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Auth, GetUser } from '../auth/decorator';
import { User } from '../users/entities/user.entity';
import { AuthenticatedChatbotService } from './authenticated-chatbot.service';
import {
    AuthenticatedChatRequestDto,
    AuthenticatedChatResponseDto
} from './dto/authenticated-chat.dto';

@ApiTags('Chatbot Autenticado')
@Controller('chatbot/authenticated')
@ApiBearerAuth()
export class AuthenticatedChatbotController {
    constructor(
        private readonly authenticatedChatbotService: AuthenticatedChatbotService
    ) { }

    @Post('chat')
    @Auth() // Requiere autenticación, sin permisos específicos
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
    @ApiOperation({
        summary: 'Enviar mensaje al chatbot autenticado',
        description: `Envía un mensaje al chatbot con IA que puede ejecutar funciones según los permisos del usuario.
    
    **Características:**
    - Function calling: La IA puede consultar datos reales del CRM
    - Respeta permisos del usuario autenticado
    - Persistencia de conversaciones
    - Respuestas estructuradas (tablas, tarjetas, listas)
    
    **Funciones disponibles según permisos:**
    - get_my_profile: Siempre disponible
    - get_incidents: Requiere viewIncidents
    - get_users: Requiere viewUsers
    - get_dashboard_stats: Requiere readDashboard
    - get_roles: Requiere getRoles`
    })
    @ApiResponse({
        status: 200,
        description: 'Respuesta del chatbot',
        type: AuthenticatedChatResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Error en la solicitud'
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado'
    })
    @ApiResponse({
        status: 403,
        description: 'Sin permisos para ejecutar la función solicitada'
    })
    @ApiResponse({
        status: 429,
        description: 'Demasiadas solicitudes (rate limit)'
    })
    async chat(
        @Body() chatRequest: AuthenticatedChatRequestDto,
        @GetUser() user: User
    ): Promise<AuthenticatedChatResponseDto> {
        return await this.authenticatedChatbotService.chat(
            chatRequest.messages,
            user,
            chatRequest.conversationId
        );
    }

    @Get('conversations')
    @Auth()
    @ApiOperation({
        summary: 'Obtener conversaciones del usuario',
        description: 'Retorna las conversaciones recientes del usuario autenticado'
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de conversaciones'
    })
    async getConversations(
        @GetUser() user: User,
        @Query('limit') limit?: string
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        return await this.authenticatedChatbotService.getUserConversations(
            user.id,
            parsedLimit
        );
    }

    @Get('conversations/:id')
    @Auth()
    @ApiOperation({
        summary: 'Obtener conversación específica',
        description: 'Retorna los detalles de una conversación específica'
    })
    @ApiResponse({
        status: 200,
        description: 'Detalles de la conversación'
    })
    @ApiResponse({
        status: 404,
        description: 'Conversación no encontrada'
    })
    async getConversation(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @GetUser() user: User
    ) {
        return await this.authenticatedChatbotService.getConversation(id, user.id);
    }

    @Delete('conversations/:id')
    @Auth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Eliminar conversación',
        description: 'Elimina (marca como inactiva) una conversación'
    })
    @ApiResponse({
        status: 204,
        description: 'Conversación eliminada exitosamente'
    })
    @ApiResponse({
        status: 404,
        description: 'Conversación no encontrada'
    })
    async deleteConversation(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @GetUser() user: User
    ): Promise<void> {
        await this.authenticatedChatbotService.deleteConversation(id, user.id);
    }
}
