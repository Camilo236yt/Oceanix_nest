import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { TestWhatsappDto } from './dto/test-whatsapp.dto';

@ApiTags('Test Endpoints')
@Controller('test-notifications')
export class TestNotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post('whatsapp')
    @ApiOperation({
        summary: 'Test WhatsApp Bot (Public)',
        description: 'Envía un mensaje de prueba a cualquier número de WhatsApp (sin autenticación)',
    })
    @ApiBody({ type: TestWhatsappDto })
    @ApiResponse({
        status: 200,
        description: 'Mensaje enviado',
        schema: {
            example: { message: 'Mensaje enviado a 573001234567' },
        },
    })
    async testWhatsapp(@Body() dto: TestWhatsappDto) {
        return await this.notificationService.sendTestWhatsapp(dto.testNumber, dto.message);
    }
}
