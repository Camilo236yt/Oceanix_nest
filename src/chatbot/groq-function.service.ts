import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ChatMessageDto } from './dto/authenticated-chat.dto';
import type { FunctionDefinition } from './dto/authenticated-chat.dto';

interface GroqFunctionCallResponse {
    type: 'text' | 'function_call';
    content?: string;
    functionCall?: {
        name: string;
        arguments: any;
    };
}

@Injectable()
export class GroqFunctionService {
    private readonly logger = new Logger(GroqFunctionService.name);
    private readonly groq: Groq;
    private readonly model = 'llama-3.1-70b-versatile'; // Modelo con mejor límite de tokens

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
     * Chat con soporte para function calling mediante prompt engineering
     */
    async chatWithFunctions(
        messages: ChatMessageDto[],
        availableFunctions: FunctionDefinition[],
        systemPrompt: string
    ): Promise<GroqFunctionCallResponse> {
        try {
            // Crear system message con instrucciones de function calling
            const functionCallingInstructions = this.buildFunctionCallingPrompt(availableFunctions);
            const fullSystemPrompt = `${systemPrompt}

${functionCallingInstructions}`;

            const formattedMessages: any[] = [
                {
                    role: 'system',
                    content: fullSystemPrompt
                }
            ];

            // Agregar mensajes de la conversación
            for (const msg of messages) {
                formattedMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }

            this.logger.log(`Sending ${formattedMessages.length} messages to GROQ`);

            const completion = await this.groq.chat.completions.create({
                messages: formattedMessages,
                model: this.model,
                temperature: 0.7,
                max_tokens: 2000,
            });

            const responseContent = completion.choices[0]?.message?.content || '';

            // Intentar parsear si es un function call
            const functionCall = this.parseFunctionCall(responseContent);

            if (functionCall) {
                this.logger.log(`GROQ requested function: ${functionCall.name}`);
                return {
                    type: 'function_call',
                    functionCall: functionCall
                };
            }

            // Es una respuesta de texto normal
            return {
                type: 'text',
                content: responseContent
            };

        } catch (error) {
            this.logger.error('Error al comunicarse con GROQ API:', error);
            throw new Error('Error al procesar la solicitud del chatbot');
        }
    }

    /**
     * Construye el prompt que enseña a GROQ cómo hacer function calls
     */
    private buildFunctionCallingPrompt(functions: FunctionDefinition[]): string {
        if (functions.length === 0) {
            return '';
        }

        const functionsDescription = functions.map(f => {
            const func = f.function;
            const params = Object.entries(func.parameters.properties || {})
                .map(([name, schema]: [string, any]) => {
                    const required = func.parameters.required?.includes(name) ? ' (required)' : ' (optional)';
                    return `  - ${name}${required}: ${schema.description || schema.type}`;
                })
                .join('\n');

            return `**${func.name}**
Descripción: ${func.description}
Parámetros:
${params || '  Sin parámetros'}`;
        }).join('\n\n');

        return `
## 🔧 FUNCIONES DISPONIBLES

Tienes acceso a las siguientes funciones para obtener datos del sistema:

${functionsDescription}

## 📝 CÓMO USAR FUNCIONES

**IMPORTANTE:** Cuando el usuario pida información que requiera consultar datos del sistema, debes responder EXACTAMENTE en este formato JSON:

\`\`\`json
{
  "action": "function_call",
  "function": "nombre_de_la_funcion",
  "arguments": {
    "parametro1": "valor1",
    "parametro2": "valor2"
  }
}
\`\`\`

**Ejemplos:**

Usuario: "Muéstrame las últimas 10 incidencias"
Tu respuesta:
\`\`\`json
{
  "action": "function_call",
  "function": "get_incidents",
  "arguments": {
    "limit": 10
  }
}
\`\`\`

Usuario: "¿Cuántos usuarios tenemos?"
Tu respuesta:
\`\`\`json
{
  "action": "function_call",
  "function": "get_users",
  "arguments": {
    "limit": 100
  }
}
\`\`\`

**REGLAS:**
1. Si el usuario pide información que puedes obtener con una función, USA LA FUNCIÓN
2. Si necesitas información actualizada del sistema, USA LA FUNCIÓN
3. Si es una pregunta general que no requiere datos, responde normalmente (sin JSON)
4. NUNCA inventes datos, usa las funciones para obtenerlos
5. El JSON debe ser válido y estar dentro de un bloque de código markdown
`;
    }

    /**
     * Intenta parsear un function call del response de GROQ
     */
    private parseFunctionCall(content: string): { name: string; arguments: any } | null {
        try {
            // Buscar bloques de código JSON
            const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
            const match = content.match(jsonBlockRegex);

            if (!match) {
                return null;
            }

            const jsonStr = match[1].trim();
            const parsed = JSON.parse(jsonStr);

            // Verificar que sea un function call válido
            if (parsed.action === 'function_call' && parsed.function && parsed.arguments) {
                return {
                    name: parsed.function,
                    arguments: parsed.arguments
                };
            }

            return null;
        } catch (error) {
            // No es un function call válido
            return null;
        }
    }

    /**
     * Genera una respuesta final después de ejecutar una función
     */
    async generateResponseWithFunctionResult(
        messages: ChatMessageDto[],
        functionName: string,
        functionResult: any,
        systemPrompt: string
    ): Promise<string> {
        try {
            const resultMessage = `Resultado de la función ${functionName}:\n${JSON.stringify(functionResult, null, 2)}`;

            const formattedMessages: any[] = [
                {
                    role: 'system',
                    content: systemPrompt + '\n\nAhora presenta estos datos de manera clara y útil para el usuario. NO uses más funciones, solo presenta la información.'
                }
            ];

            for (const msg of messages) {
                formattedMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }

            formattedMessages.push({
                role: 'assistant',
                content: resultMessage
            });

            const completion = await this.groq.chat.completions.create({
                messages: formattedMessages,
                model: this.model,
                temperature: 0.7,
                max_tokens: 1500,
            });

            return completion.choices[0]?.message?.content || 'Procesado correctamente.';
        } catch (error) {
            this.logger.error('Error generating final response:', error);
            throw new Error('Error al generar respuesta');
        }
    }

    /**
     * Verifica si GROQ está configurado
     */
    isConfigured(): boolean {
        return !!process.env.GROQ_API_KEY;
    }
}
