import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ValidPermission } from '../auth/interfaces/valid-permission';
import { Conversation, ChatMessage } from './entities/conversation.entity';
import { GroqFunctionService } from './groq-function.service';
import { FunctionExecutorService } from './function-executor.service';
import type {
    ChatMessageDto,
    AuthenticatedChatResponseDto,
    FunctionDefinition
} from './dto/authenticated-chat.dto';

@Injectable()
export class AuthenticatedChatbotService {
    private readonly logger = new Logger(AuthenticatedChatbotService.name);

    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        private readonly groqFunctionService: GroqFunctionService,
        private readonly functionExecutor: FunctionExecutorService,
    ) { }

    /**
     * Procesa un mensaje del chatbot autenticado
     */
    async chat(
        messages: ChatMessageDto[],
        user: User,
        conversationId?: string
    ): Promise<AuthenticatedChatResponseDto> {
        // Verificar que GROQ esté configurado
        if (!this.groqFunctionService.isConfigured()) {
            throw new BadRequestException(
                'El chatbot no está configurado correctamente. Por favor, contacta al administrador.'
            );
        }
        // Obtener o crear conversación
        let conversation: Conversation;
        if (conversationId) {
            const existingConversation = await this.conversationRepository.findOne({
                where: { id: conversationId, userId: user.id }
            });

            if (!existingConversation) {
                throw new NotFoundException('Conversación no encontrada');
            }
            conversation = existingConversation;
        } else {
            conversation = this.conversationRepository.create({
                userId: user.id,
                enterpriseId: user.enterpriseId,
                messages: [],
                messageCount: 0,
                isActive: true
            });
        }

        // Obtener funciones disponibles según permisos
        const availableFunctions = this.getAvailableFunctions(user);

        // Obtener system prompt
        const systemPrompt = this.getSystemPrompt(user);

        try {
            // Llamar a GROQ con function calling
            const groqResponse = await this.groqFunctionService.chatWithFunctions(
                messages,
                availableFunctions,
                systemPrompt
            );

            let responseMessage: string;
            let functionCall: any = null;
            let structuredData: any = null;

            // Verificar si la IA quiere llamar a una función
            if (groqResponse.type === 'function_call' && groqResponse.functionCall) {
                const functionName = groqResponse.functionCall.name;
                const functionArgs = groqResponse.functionCall.arguments;

                this.logger.log(`AI requested function call: ${functionName}`);

                // Ejecutar la función
                const executionResult = await this.functionExecutor.execute(
                    functionName,
                    functionArgs,
                    user
                );

                if (executionResult.success) {
                    // Llamar a GROQ nuevamente con el resultado de la función para generar respuesta
                    responseMessage = await this.groqFunctionService.generateResponseWithFunctionResult(
                        messages,
                        functionName,
                        executionResult.data,
                        systemPrompt
                    );

                    functionCall = {
                        name: functionName,
                        arguments: functionArgs,
                        result: executionResult.data
                    };

                    structuredData = executionResult.structuredData;
                } else {
                    responseMessage = `Lo siento, hubo un error al procesar tu solicitud: ${executionResult.error}`;
                }
            } else {
                // Respuesta normal sin function call
                responseMessage = groqResponse.content ||
                    'Lo siento, no pude procesar tu pregunta.';
            }

            // Guardar mensajes en la conversación
            const userMessage: ChatMessage = {
                role: 'user',
                content: messages[messages.length - 1].content,
                timestamp: new Date()
            };

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: responseMessage,
                timestamp: new Date(),
                functionCall: functionCall || undefined
            };

            conversation.messages.push(userMessage, assistantMessage);
            conversation.messageCount = conversation.messages.length;

            // Auto-generar título si es la primera interacción
            if (!conversation.title && userMessage.content) {
                conversation.title = userMessage.content.substring(0, 50) +
                    (userMessage.content.length > 50 ? '...' : '');
            }

            // Guardar conversación
            await this.conversationRepository.save(conversation);

            return {
                message: responseMessage,
                conversationId: conversation.id,
                messageCount: conversation.messageCount,
                hasExecutedFunction: !!functionCall,
                functionCall: functionCall || undefined,
                structuredData: structuredData || undefined
            };

        } catch (error) {
            this.logger.error('Error al procesar chat:', error);
            throw new BadRequestException(
                'Hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.'
            );
        }
    }

    /**
     * Obtiene las conversaciones del usuario
     */
    async getUserConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
        return await this.conversationRepository.find({
            where: { userId, isActive: true },
            order: { updatedAt: 'DESC' },
            take: limit
        });
    }

    /**
     * Obtiene una conversación específica
     */
    async getConversation(conversationId: string, userId: string): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, userId }
        });

        if (!conversation) {
            throw new NotFoundException('Conversación no encontrada');
        }

        return conversation;
    }

    /**
     * Elimina una conversación
     */
    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.getConversation(conversationId, userId);
        conversation.isActive = false;
        await this.conversationRepository.save(conversation);
    }

    /**
     * Determina qué funciones están disponibles según los permisos del usuario
     */
    private getAvailableFunctions(user: User): FunctionDefinition[] {
        const functions: FunctionDefinition[] = [];

        // Get user permissions
        const permissions = this.getUserPermissions(user);

        // Always available
        functions.push({
            type: 'function',
            function: {
                name: 'get_my_profile',
                description: 'Obtiene la información del perfil del usuario actual',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }
        });

        // Incidents
        if (permissions.has(ValidPermission.viewIncidents)) {
            functions.push({
                type: 'function',
                function: {
                    name: 'get_incidents',
                    description: 'Obtiene una lista de incidencias con filtros opcionales',
                    parameters: {
                        type: 'object',
                        properties: {
                            limit: {
                                type: 'number',
                                description: 'Número máximo de incidencias a retornar (máximo 50)',
                                default: 10
                            },
                            page: {
                                type: 'number',
                                description: 'Número de página',
                                default: 1
                            },
                            status: {
                                type: 'string',
                                description: 'Filtrar por estado',
                                enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']
                            }
                        },
                        required: []
                    }
                }
            });

            functions.push({
                type: 'function',
                function: {
                    name: 'get_incident_details',
                    description: 'Obtiene los detalles completos de una incidencia específica por su ID',
                    parameters: {
                        type: 'object',
                        properties: {
                            incidentId: {
                                type: 'string',
                                description: 'ID único de la incidencia (UUID)'
                            }
                        },
                        required: ['incidentId']
                    }
                }
            });
        }

        // Users
        if (permissions.has(ValidPermission.viewUsers)) {
            functions.push({
                type: 'function',
                function: {
                    name: 'get_users',
                    description: 'Obtiene una lista de usuarios de la empresa',
                    parameters: {
                        type: 'object',
                        properties: {
                            limit: {
                                type: 'number',
                                description: 'Número máximo de usuarios a retornar',
                                default: 10
                            },
                            page: {
                                type: 'number',
                                description: 'Número de página',
                                default: 1
                            }
                        },
                        required: []
                    }
                }
            });

            functions.push({
                type: 'function',
                function: {
                    name: 'get_user_details',
                    description: 'Obtiene los detalles completos de un usuario específico',
                    parameters: {
                        type: 'object',
                        properties: {
                            userId: {
                                type: 'string',
                                description: 'ID del usuario (UUID)'
                            }
                        },
                        required: ['userId']
                    }
                }
            });
        }

        // Dashboard stats
        if (permissions.has(ValidPermission.readDashboard)) {
            functions.push({
                type: 'function',
                function: {
                    name: 'get_dashboard_stats',
                    description: 'Obtiene las estadísticas generales del dashboard',
                    parameters: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }
            });
        }

        // Roles
        if (permissions.has(ValidPermission.getRoles)) {
            functions.push({
                type: 'function',
                function: {
                    name: 'get_roles',
                    description: 'Obtiene la lista de roles configurados en la empresa',
                    parameters: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }
            });
        }

        this.logger.log(`User ${user.id} has ${functions.length} functions available`);
        return functions;
    }

    /**
   * Obtiene los permisos del usuario
   */
    private getUserPermissions(user: User): Set<ValidPermission> {
        const permissions = new Set<ValidPermission>();

        // SUPER_ADMIN has all permissions
        if (user.userType === 'SUPER_ADMIN') {
            Object.values(ValidPermission).forEach(p => permissions.add(p));
            return permissions;
        }

        // Collect permissions from roles
        if (user.roles && user.roles.length > 0) {
            for (const userRole of user.roles) {
                if (userRole.role && userRole.role.permissions) {
                    for (const rolePermission of userRole.role.permissions) {
                        if (rolePermission.permission && rolePermission.permission.name) {
                            permissions.add(rolePermission.permission.name as ValidPermission);
                        }
                    }
                }
            }
        }

        return permissions;
    }

    /**
     * Genera el system prompt personalizado para el usuario
     */
    private getSystemPrompt(user: User): string {
        return `Eres un asistente virtual de IA para Oceanix CRM, especializado en gestión de incidencias.

**Información del usuario:**
- Nombre: ${user.name} ${user.lastName}
- Tipo: ${user.userType}
- Empresa: ${user.enterpriseId}

**Tu rol:**
1. Ayudar al usuario a consultar información del CRM
2. Responder preguntas sobre incidencias, usuarios, estadísticas, etc.
3. Usar las funciones disponibles cuando sea necesario para obtener datos actuales
4. Presentar la información de manera clara y concisa
5. Respetar los permisos del usuario (solo puedes ejecutar funciones para las que tiene permisos)

**Instrucciones:**
- Sé profesional pero amigable
- Cuando muestres datos de tablas, describe lo más relevante
- Si el usuario pide información específica (ej: "últimas 10 incidencias"), usa la función correspondiente
- Si no tienes una función para algo, explícalo honestamente
- Responde siempre en español
- Sé conciso pero completo

**IMPORTANTE:** Cuando uses funciones para obtener datos, siempre explica qué encontraste de manera resumida y destaca lo más importante.`;
    }
}
