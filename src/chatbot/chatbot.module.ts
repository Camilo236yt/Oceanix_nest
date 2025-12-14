import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GroqService } from './groq.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, GroqService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
