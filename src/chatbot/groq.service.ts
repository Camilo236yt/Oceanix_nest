import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ChatMessageDto } from './dto/chat.dto';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly groq: Groq;
  private readonly model = 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY no está configurada en las variables de entorno');
    }

    this.groq = new Groq({
      apiKey: apiKey || 'dummy-key', // Usar dummy key si no está configurada
    });
  }

  /**
   * Envía mensajes a la API de Groq y obtiene una respuesta
   */
  async chat(messages: ChatMessageDto[]): Promise<string> {
    try {
      const systemMessage: ChatMessageDto = {
        role: 'system',
        content: `Eres un asistente virtual útil y amigable para Oceanix, una plataforma de gestión de incidencias empresariales.

Tu objetivo es ayudar a los visitantes de la página web a entender qué es Oceanix y cómo puede beneficiar a su empresa.

Información clave sobre Oceanix:
- Es un sistema de gestión de incidencias (tickets/helpdesk)
- Permite a las empresas gestionar y resolver problemas de clientes de manera eficiente
- Incluye chat en tiempo real, notificaciones, roles y permisos personalizables
- Tiene un portal para clientes donde pueden crear y seguir sus incidencias
- Ofrece diferentes roles: Super Admin, Admin Empresarial, Empleados y Clientes
- Sistema multi-tenant (cada empresa tiene sus propios datos aislados)

Características principales:
- Gestión completa de incidencias con estados, prioridades y asignaciones
- Chat en tiempo real entre clientes y equipo de soporte
- Sistema de notificaciones en tiempo real
- Roles y permisos personalizables
- Portal dedicado para clientes
- Dashboard con estadísticas y reportes

Sé conciso, profesional pero amigable. Usa emojis ocasionalmente para ser más cercano.
Si te preguntan sobre precios, características específicas que no conoces, o quieren hablar con ventas, sugiere que se registren o contacten con el equipo.`
      };

      const allMessages = [systemMessage, ...messages];

      const completion = await this.groq.chat.completions.create({
        messages: allMessages as any,
        model: this.model,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
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
   * Verifica si la API de Groq está configurada correctamente
   */
  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
}
