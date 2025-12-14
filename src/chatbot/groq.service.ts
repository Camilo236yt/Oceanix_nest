import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ChatMessageDto } from './dto/chat.dto';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly groq: Groq;
  private readonly model = 'llama-3.1-8b-instant';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY no está configurada en las variables de entorno');
    }

    this.groq = new Groq({
      apiKey: apiKey || 'dummy-key',
    });
  }

  /**
   * Envía mensajes a Groq y obtiene una respuesta
   */
  async chat(messages: ChatMessageDto[]): Promise<string> {
    try {
      // Prompt ULTRA optimizado (< 200 tokens)
      const systemMessage: ChatMessageDto = {
        role: 'system',
        content: `Eres el asistente de Oceanix, un sistema de Help Desk multi-tenant.

**Qué es Oceanix:**
Sistema de gestión de incidencias (tickets) para empresas. Permite crear, asignar y resolver tickets de soporte con chat en tiempo real.

**Módulos principales:**
- Incidencias: Estados (PENDING, IN_PROGRESS, RESOLVED, CLOSED), asignación a empleados, alertas por tiempo
- Chat en tiempo real entre clientes y empleados
- Roles y permisos personalizables
- Portal de clientes (/portal/login)
- Dashboard con estadísticas

**Stack:**
NestJS, PostgreSQL, Redis, MinIO, Socket.io, JWT

**Tu rol:**
Responde preguntas sobre funcionalidades, casos de uso y cómo empezar. Sé conciso y amigable. Si preguntan detalles técnicos profundos, sugiere ver la documentación en https://oceanix.space/api`
      };

      const allMessages = [systemMessage, ...messages];

      const completion = await this.groq.chat.completions.create({
        messages: allMessages as any,
        model: this.model,
        temperature: 0.7,
        max_tokens: 300, // Respuestas más cortas
        stream: false,
      });

      const responseMessage = completion.choices[0]?.message?.content ||
        'Lo siento, no pude procesar tu pregunta. Por favor, intenta de nuevo.';

      return responseMessage;
    } catch (error) {
      this.logger.error('Error al comunicarse con Groq API:', error);
      throw new Error('Error al procesar la solicitud del chatbot');
    }
  }

  /**
   * Verifica si Groq está configurado
   */
  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
}
