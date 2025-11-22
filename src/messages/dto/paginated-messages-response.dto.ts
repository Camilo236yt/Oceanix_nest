import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../entities/message.entity';

export class PaginatedMessagesResponseDto {
  @ApiProperty({
    description: 'Array of messages',
    type: [Message],
  })
  messages: Message[];

  @ApiProperty({
    description: 'Total count of messages in the chat',
    example: 245,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Whether there are more messages to load (older messages)',
    example: true,
  })
  hasMore: boolean;

  @ApiProperty({
    description: 'ID of the oldest message in this batch (use as cursor for next page)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  oldestMessageId: string | null;

  @ApiProperty({
    description: 'ID of the newest message in this batch',
    example: '660e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  newestMessageId: string | null;
}
