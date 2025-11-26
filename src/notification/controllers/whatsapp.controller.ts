import { Controller, Get, Res, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { WhatsAppNotificationProvider } from '../providers/whatsapp/whatsapp-notification.provider';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
    constructor(
        @Inject(WhatsAppNotificationProvider)
        private readonly whatsappProvider: WhatsAppNotificationProvider,
    ) { }

    @Get('qr')
    @ApiOperation({
        summary: 'Show WhatsApp QR Code',
        description: 'Displays the WhatsApp QR code for authentication (public endpoint)',
    })
    @ApiResponse({
        status: 200,
        description: 'QR code page',
        content: {
            'text/html': {},
        },
    })
    getQRPage(@Res() res: Response) {
        const qrCode = this.whatsappProvider.qrCode;
        const isReady = this.whatsappProvider.isReady;
        const isAuthenticated = this.whatsappProvider.isAuthenticated;

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp QR - Oceanix</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #25D366;
            margin-bottom: 10px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .qr-container {
            background: #f5f5f5;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .qr-container img {
            width: 100%;
            max-width: 300px;
            height: auto;
        }
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            font-weight: 500;
        }
        .status.ready {
            background: #d4edda;
            color: #155724;
        }
        .status.waiting {
            background: #fff3cd;
            color: #856404;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .refresh-btn {
            background: #25D366;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .refresh-btn:hover {
            background: #128C7E;
        }
        .instructions {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: left;
        }
        .instructions ol {
            margin-left: 20px;
            margin-top: 10px;
        }
        .instructions li {
            margin: 8px 0;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📱</div>
        <h1>WhatsApp QR Code</h1>
        <p>Conecta tu cuenta de WhatsApp con Oceanix</p>
        
        ${isReady
                ? `
            <div class="status ready">
                ✅ WhatsApp ya está conectado
            </div>
        `
                : qrCode
                    ? `
            <div class="qr-container">
                <img src="${qrCode}" alt="WhatsApp QR Code" />
            </div>
            <div class="status waiting">
                ⏳ Esperando escaneo del código QR
            </div>
            <div class="instructions">
                <strong>📖 Instrucciones:</strong>
                <ol>
                    <li>Abre WhatsApp en tu celular</li>
                    <li>Ve a <strong>Configuración → Dispositivos vinculados</strong></li>
                    <li>Toca <strong>Vincular un dispositivo</strong></li>
                    <li>Escanea este código QR</li>
                </ol>
            </div>
        `
                    : `
            <div class="status error">
                ⌛ Generando código QR... Por favor espera
            </div>
        `
            }
        
        <button class="refresh-btn" onclick="location.reload()">
            🔄 Actualizar
        </button>
    </div>
    
    <script>
        // Auto-refresh cada 5 segundos si no está listo
        ${!isReady ? "setTimeout(() => location.reload(), 5000);" : ""}
    </script>
</body>
</html>
    `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
}
