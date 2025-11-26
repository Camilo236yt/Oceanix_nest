import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

/**
 * Email service using Gmail SMTP
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        // Create SMTP transporter
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: parseInt(this.configService.get('SMTP_PORT') || '587'),
            secure: this.configService.get('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASSWORD'),
            },
        });

        // Verify connection on startup
        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.log('✅ SMTP connection verified successfully');
        } catch (error) {
            this.logger.error('❌ SMTP connection failed:', error.message);
            this.logger.warn('Email sending will fail. Check your SMTP credentials in .env');
        }
    }

    /**
     * Send verification code email
     */
    async sendVerificationEmail(email: string, code: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM') || 'Oceanix <noreply@oceanix.space>',
                to: email,
                subject: 'Código de Verificación - Oceanix',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Oceanix</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #333; margin-top: 0;">Código de Verificación</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          Hola,
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          Tu código de verificación es:
                        </p>
                        
                        <!-- Code Box -->
                        <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                          <div style="font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                            ${code}
                          </div>
                        </div>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          Este código expira en <strong>10 minutos</strong>.
                        </p>
                        <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                          Si no solicitaste este código, puedes ignorar este mensaje.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Oceanix. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
            });

            this.logger.log(`✅ Verification email sent to ${email}`);
        } catch (error) {
            this.logger.error(`❌ Failed to send verification email to ${email}:`, error);
            throw error;
        }
    }

    /**
     * Send welcome email after verification
     */
    async sendWelcomeEmail(email: string, enterpriseName: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM') || 'Oceanix <noreply@oceanix.space>',
                to: email,
                subject: '¡Bienvenido a Oceanix!',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ¡Bienvenido!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #333; margin-top: 0;">Email Verificado Exitosamente</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          Hola <strong>${enterpriseName}</strong>,
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          ¡Excelente! Tu correo electrónico ha sido verificado correctamente.
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          Ya tienes acceso completo a todas las funcionalidades de Oceanix.
                        </p>
                        
                        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                          <p style="color: #333; margin: 0; font-size: 14px;">
                            <strong>Próximos pasos:</strong><br>
                            • Personaliza tu marca<br>
                            • Configura dominios de email corporativo<br>
                            • Gestiona documentos legales
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Oceanix. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
            });

            this.logger.log(`✅ Welcome email sent to ${email}`);
        } catch (error) {
            this.logger.error(`❌ Failed to send welcome email to ${email}:`, error);
            // Don't throw here - welcome email is not critical
        }
    }
}
