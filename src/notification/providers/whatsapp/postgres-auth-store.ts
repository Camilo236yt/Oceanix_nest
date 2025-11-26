import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppSession } from '../../entities/whatsapp-session.entity';

/**
 * Custom PostgreSQL store for whatsapp-web.js RemoteAuth
 * Implementa la interfaz necesaria para guardar/recuperar sesiones
 */
@Injectable()
export class PostgresAuthStore {
    private readonly logger = new Logger(PostgresAuthStore.name);

    constructor(
        @InjectRepository(WhatsAppSession)
        private readonly sessionRepository: Repository<WhatsAppSession>,
    ) { }

    async sessionExists(options: { session: string }): Promise<boolean> {
        try {
            const session = await this.sessionRepository.findOne({
                where: { sessionId: options.session },
            });
            return !!session;
        } catch (error) {
            this.logger.error('Error checking session existence:', error);
            return false;
        }
    }

    async save(options: { session: string }): Promise<void> {
        try {
            // Extract session data from options
            const sessionData = JSON.stringify(options);

            await this.sessionRepository.save({
                sessionId: options.session,
                data: sessionData,
            });

            this.logger.log(`Session saved: ${options.session}`);
        } catch (error) {
            this.logger.error('Error saving session:', error);
            throw error;
        }
    }

    async extract(options: { session: string }): Promise<any> {
        try {
            const session = await this.sessionRepository.findOne({
                where: { sessionId: options.session },
            });

            if (!session) {
                this.logger.warn(`Session not found: ${options.session}`);
                return null;
            }

            return JSON.parse(session.data);
        } catch (error) {
            this.logger.error('Error extracting session:', error);
            return null;
        }
    }

    async delete(options: { session: string }): Promise<void> {
        try {
            await this.sessionRepository.delete({ sessionId: options.session });
            this.logger.log(`Session deleted: ${options.session}`);
        } catch (error) {
            this.logger.error('Error deleting session:', error);
            throw error;
        }
    }
}
