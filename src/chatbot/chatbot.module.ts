import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GroqService } from './groq.service';
import { AuthenticatedChatbotController } from './authenticated-chatbot.controller';
import { AuthenticatedChatbotService } from './authenticated-chatbot.service';
import { GroqFunctionService } from './groq-function.service';
import { FunctionExecutorService } from './function-executor.service';
import { Conversation } from './entities/conversation.entity';
import { IncidenciasModule } from '../incidencias/incidencias.module';
import { UsersModule } from '../users/users.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    IncidenciasModule,
    UsersModule,
    DashboardModule,
    RolesModule,
  ],
  controllers: [ChatbotController, AuthenticatedChatbotController],
  providers: [
    ChatbotService,
    GroqService,
    AuthenticatedChatbotService,
    GroqFunctionService,
    FunctionExecutorService,
  ],
  exports: [ChatbotService, AuthenticatedChatbotService],
})
export class ChatbotModule { }
