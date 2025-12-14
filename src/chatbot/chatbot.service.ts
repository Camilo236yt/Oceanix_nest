import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GroqService } from './groq.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';

interface SessionData {
  questionCount: number;
  firstQuestionAt: Date;
  lastQuestionAt: Date;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly MAX_QUESTIONS = 100;
  private readonly sessionStore = new Map<string, SessionData>();

  // Limpiar sesiones antiguas cada hora (más de 24 horas de inactividad)
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora
  private readonly SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

  constructor(private readonly groqService: GroqService) {
    // Iniciar limpieza periódica de sesiones
    setInterval(() => this.cleanupOldSessions(), this.CLEANUP_INTERVAL);
  }

  /**
   * Procesa un mensaje del chatbot
   */
  async chat(
    messages: ChatMessageDto[],
    sessionId: string
  ): Promise<ChatResponseDto> {
    // Verificar que Groq esté configurado
    if (!this.groqService.isConfigured()) {
      throw new BadRequestException(
        'El chatbot no está configurado correctamente. Por favor, contacta al administrador.'
      );
    }

    // Obtener o crear datos de sesión
    const sessionData = this.getOrCreateSession(sessionId);

    // Verificar límite de preguntas
    if (sessionData.questionCount >= this.MAX_QUESTIONS) {
      this.logger.warn(`Session ${sessionId} ha alcanzado el límite de preguntas`);

      return {
        message: `Lo siento, has alcanzado el límite de ${this.MAX_QUESTIONS} preguntas. Si necesitas más ayuda, por favor regístrate en nuestra plataforma o contacta con nuestro equipo de soporte. 🙏`,
        questionCount: sessionData.questionCount,
        remainingQuestions: 0,
        limitReached: true,
      };
    }

    try {
      // Incrementar contador de preguntas
      sessionData.questionCount++;
      sessionData.lastQuestionAt = new Date();

      // Guardar sesión actualizada
      this.sessionStore.set(sessionId, sessionData);

      // Obtener respuesta de Groq
      const responseMessage = await this.groqService.chat(messages);

      const remainingQuestions = this.MAX_QUESTIONS - sessionData.questionCount;

      // Agregar advertencia si quedan pocas preguntas
      let finalMessage = responseMessage;
      if (remainingQuestions <= 10 && remainingQuestions > 0) {
        finalMessage += `\n\n_Te quedan ${remainingQuestions} preguntas._`;
      }

      this.logger.log(
        `Session ${sessionId}: ${sessionData.questionCount}/${this.MAX_QUESTIONS} preguntas`
      );

      return {
        message: finalMessage,
        questionCount: sessionData.questionCount,
        remainingQuestions,
        limitReached: sessionData.questionCount >= this.MAX_QUESTIONS,
      };
    } catch (error) {
      this.logger.error('Error al procesar chat:', error);

      // Revertir el incremento del contador si hubo error
      sessionData.questionCount--;
      this.sessionStore.set(sessionId, sessionData);

      throw new BadRequestException(
        'Hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.'
      );
    }
  }

  /**
   * Obtiene información de la sesión
   */
  getSessionInfo(sessionId: string): {
    questionCount: number;
    remainingQuestions: number;
    limitReached: boolean;
  } {
    const sessionData = this.sessionStore.get(sessionId);

    if (!sessionData) {
      return {
        questionCount: 0,
        remainingQuestions: this.MAX_QUESTIONS,
        limitReached: false,
      };
    }

    return {
      questionCount: sessionData.questionCount,
      remainingQuestions: this.MAX_QUESTIONS - sessionData.questionCount,
      limitReached: sessionData.questionCount >= this.MAX_QUESTIONS,
    };
  }

  /**
   * Resetea el contador de una sesión (útil para testing o admin)
   */
  resetSession(sessionId: string): void {
    this.sessionStore.delete(sessionId);
    this.logger.log(`Session ${sessionId} reseteada`);
  }

  /**
   * Obtiene o crea datos de sesión
   */
  private getOrCreateSession(sessionId: string): SessionData {
    let sessionData = this.sessionStore.get(sessionId);

    if (!sessionData) {
      sessionData = {
        questionCount: 0,
        firstQuestionAt: new Date(),
        lastQuestionAt: new Date(),
      };
      this.sessionStore.set(sessionId, sessionData);
      this.logger.log(`Nueva sesión creada: ${sessionId}`);
    }

    return sessionData;
  }

  /**
   * Limpia sesiones antiguas (más de 24 horas de inactividad)
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, data] of this.sessionStore.entries()) {
      const timeSinceLastQuestion = now - data.lastQuestionAt.getTime();

      if (timeSinceLastQuestion > this.SESSION_EXPIRY) {
        this.sessionStore.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Limpiadas ${cleanedCount} sesiones antiguas`);
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    totalQuestions: number;
  } {
    const now = Date.now();
    let activeSessions = 0;
    let totalQuestions = 0;

    for (const data of this.sessionStore.values()) {
      totalQuestions += data.questionCount;

      // Considerar activa si hubo actividad en la última hora
      const timeSinceLastQuestion = now - data.lastQuestionAt.getTime();
      if (timeSinceLastQuestion < 60 * 60 * 1000) {
        activeSessions++;
      }
    }

    return {
      totalSessions: this.sessionStore.size,
      activeSessions,
      totalQuestions,
    };
  }
}
