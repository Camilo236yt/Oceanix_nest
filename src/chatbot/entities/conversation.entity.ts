import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    functionCall?: {
        name: string;
        arguments: any;
        result?: any;
    };
}

@Entity('chatbot_conversations')
@Index(['userId', 'enterpriseId'])
@Index(['userId', 'updatedAt'])
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    enterpriseId: string;

    @Column({ type: 'jsonb', default: [] })
    messages: ChatMessage[];

    @Column({ type: 'int', default: 0 })
    messageCount: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title: string; // Auto-generated from first message

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
