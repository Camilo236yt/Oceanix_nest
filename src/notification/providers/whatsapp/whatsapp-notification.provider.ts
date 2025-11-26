import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import { INotificationProvider, NotificationPayload } from '../../interfaces';
import { NotificationProviderPreference } from '../../../user-preferences/entities';
import { ProviderType } from '../../../user-preferences/enums';
import { PostgresAuthStore } from './postgres-auth-store';

/**
 * Provider para enviar notificaciones por WhatsApp usando whatsapp-web.js
 * Escanea el QR en la terminal para iniciar sesión.
 * Usa RemoteAuth con PostgreSQL para mejor estabilidad en Docker.
 */
@Injectable()
export class WhatsAppNotificationProvider
  implements INotificationProvider, OnModuleInit {
  readonly name = 'WhatsAppProvider';
  private readonly logger = new Logger(WhatsAppNotificationProvider.name);
  public client: Client;
  public isReady = false;
  public isAuthenticated = false; // Se autentica rápido, pero no está ready hasta sincronizar chats
  public qrCode: string | null = null; // QR en formato base64 data URL

  constructor(
    @InjectRepository(NotificationProviderPreference)
    private readonly providerPreferenceRepository: Repository<NotificationProviderPreference>,
    private readonly postgresStore: PostgresAuthStore,
  ) {
    this.client = new Client({
      authStrategy: new RemoteAuth({
        clientId: 'oceanix-bot',
        dataPath: './.wwebjs_auth',
        store: this.postgresStore,
        backupSyncIntervalMs: 60000, // Backup cada 60 segundos
      }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        headless: true,
        timeout: 300000, // 5 minutos en lugar de 30 segundos por defecto
      },
      authTimeoutMs: 300000, // 5 minutos para autenticación
    });

    this.initializeClient();
  }

  onModuleInit() {
    this.logger.log('🔵 onModuleInit called - Starting WhatsApp client initialization...');
    this.client.initialize()
      .then(() => {
        this.logger.log('✅ WhatsApp client.initialize() completed successfully');
      })
      .catch((err) => {
        this.logger.error('❌ Failed to initialize WhatsApp client:', err);
        this.logger.error('Error stack:', err.stack);
      });
  }

  private initializeClient() {
    this.logger.log('🔧 Setting up WhatsApp client event handlers...');

    this.client.on('qr', (qr) => {
      this.logger.log('📱 [EVENT] QR code received, generating base64...');
      // Convertir QR a base64 data URL para mostrarlo en el navegador
      const QRCode = require('qrcode');
      QRCode.toDataURL(qr, (err, url) => {
        if (err) {
          this.logger.error('Error generando QR:', err);
          return;
        }
        this.qrCode = url;
        this.logger.log('✅ QR Code generado. Accede a /whatsapp/qr para escanearlo');
      });
    });

    this.client.on('ready', () => {
      this.logger.log('🎉 [EVENT] WhatsApp Bot is ready!');
      this.isReady = true;
      this.qrCode = null; // Limpiar QR cuando ya está autenticado
    });

    this.client.on('authenticated', () => {
      this.logger.log('🔐 [EVENT] WhatsApp Authenticated successfully');
      this.isAuthenticated = true;
      this.logger.warn('⏳ Sincronizando chats de WhatsApp... Esto puede tardar 30-90 segundos.');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error('❌ [EVENT] WhatsApp Authentication failure:', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn('🔌 [EVENT] WhatsApp Client was disconnected. Reason:', reason);
      this.isReady = false;
      this.isAuthenticated = false;
    });

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log(`⏳ [EVENT] Loading: ${percent}% - ${message}`);
    });

    this.logger.log('✅ All event handlers registered');
  }

  /**
   * Envía una notificación por WhatsApp
   */
  async send(userId: string, payload: NotificationPayload): Promise<void> {
    if (!this.isReady) {
      this.logger.warn('WhatsApp client is not ready yet. Cannot send message.');
      return;
    }

    try {
      const isActive = await this.isEnabled(userId);
      if (!isActive) {
        return;
      }

      // Obtener configuración del usuario
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.WHATSAPP,
          isEnabled: true,
        },
      });

      if (!preference?.config?.phoneNumber) {
        this.logger.warn(`User ${userId} has no WhatsApp number configured`);
        return;
      }

      // Formatear número: eliminar +, espacios y asegurar sufijo @c.us
      let phoneNumber = preference.config.phoneNumber.replace(/[^0-9]/g, '');

      // Ajustes comunes de formato (ej. agregar código de país si falta)
      // Nota: whatsapp-web.js espera formato: 573001234567@c.us
      if (!phoneNumber.endsWith('@c.us')) {
        phoneNumber = `${phoneNumber}@c.us`;
      }

      let message = `*${payload.title}*\n\n${payload.message}`;

      if (payload.actionUrl) {
        message += `\n\n🔗 Ver más: ${payload.actionUrl}`;
      }

      await this.client.sendMessage(phoneNumber, message);
      this.logger.log(`✅ WhatsApp sent to ${phoneNumber}`);

    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp notification to user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Verifica si el provider está habilitado para el usuario
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.WHATSAPP,
          isEnabled: true,
        },
      });

      return !!preference && !!preference.config?.phoneNumber;
    } catch (error) {
      return false;
    }
  }
}
