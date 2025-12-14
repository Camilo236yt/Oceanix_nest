import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant', 'system'],
    example: 'user'
  })
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({
    description: 'Content of the message',
    example: '¿Qué es Oceanix?'
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'Array of chat messages (conversation history)',
    type: [ChatMessageDto],
    example: [
      { role: 'user', content: '¿Qué es Oceanix?' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @ApiProperty({
    description: 'Session identifier for tracking question limits',
    example: 'session_abc123',
    required: false
  })
  @IsString()
  sessionId?: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'AI response message'
  })
  message: string;

  @ApiProperty({
    description: 'Number of questions asked in this session'
  })
  questionCount: number;

  @ApiProperty({
    description: 'Number of remaining questions'
  })
  remainingQuestions: number;

  @ApiProperty({
    description: 'Whether the question limit has been reached'
  })
  limitReached: boolean;
}
