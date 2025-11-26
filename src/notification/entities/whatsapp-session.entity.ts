import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('whatsapp_sessions')
export class WhatsAppSession {
    @PrimaryColumn()
    sessionId: string;

    @Column({ type: 'text' })
    data: string; // JSON stringificado de la sesión

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
