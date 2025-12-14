import { Controller, Post, Body, Get, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Enviar mensaje al chatbot',
    description: 'Envía un mensaje al chatbot y recibe una respuesta. Incluye tracking de límite de 100 preguntas por sesión.'
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta del chatbot',
    type: ChatResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la solicitud o límite alcanzado'
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes (rate limit)'
  })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    const sessionId = chatRequest.sessionId || 'default-session';

    return await this.chatbotService.chat(
      chatRequest.messages,
      sessionId
    );
  }

  @Get('session/:sessionId')
  @ApiOperation({
    summary: 'Obtener información de sesión',
    description: 'Obtiene el contador de preguntas y preguntas restantes para una sesión'
  })
  @ApiResponse({
    status: 200,
    description: 'Información de la sesión'
  })
  getSessionInfo(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getSessionInfo(sessionId);
  }

  @Delete('session/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resetear sesión',
    description: 'Elimina el contador de preguntas de una sesión (útil para testing)'
  })
  @ApiResponse({
    status: 204,
    description: 'Sesión reseteada exitosamente'
  })
  resetSession(@Param('sessionId') sessionId: string): void {
    this.chatbotService.resetSession(sessionId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas del chatbot',
    description: 'Obtiene estadísticas generales del uso del chatbot'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del chatbot'
  })
  getStats() {
    return this.chatbotService.getStats();
  }
}
