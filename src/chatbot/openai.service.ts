import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatMessageDto } from './dto/authenticated-chat.dto';
import type { FunctionDefinition } from './dto/authenticated-chat.dto';

@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private readonly openai: OpenAI;
    private readonly model = 'gpt-4-turbo-preview';

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY no está configurada en las variables de entorno');
        }

        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key',
        });
    }

    /**
     * Envía mensajes a OpenAI con soporte para function calling
     */
    async chatWithFunctions(
        messages: ChatMessageDto[],
        tools: FunctionDefinition[],
        systemPrompt?: string
    ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
        try {
            const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

            // Add system message if provided
            if (systemPrompt) {
                formattedMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Add conversation messages
            for (const msg of messages) {
                formattedMessages.push({
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.content
                });
            }

            this.logger.log(`Sending ${formattedMessages.length} messages to OpenAI with ${tools.length} tools`);

            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: formattedMessages,
                tools: tools as any,
                tool_choice: 'auto',
                temperature: 0.7,
                max_tokens: 1500,
            });

            this.logger.log(`OpenAI response received, finish_reason: ${completion.choices[0]?.finish_reason}`);

            return completion;
        } catch (error) {
            this.logger.error('Error al comunicarse con OpenAI API:', error);
            throw new Error('Error al procesar la solicitud del chatbot');
        }
    }

    /**
     * Verifica si OpenAI está configurado correctamente
     */
    isConfigured(): boolean {
        return !!process.env.OPENAI_API_KEY;
    }
}
