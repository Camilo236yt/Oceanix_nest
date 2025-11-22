import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express, Response } from 'express';

import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import {
  CreateIncidenciaDoc,
  DeleteIncidenciaDoc,
  FindAllIncidenciasDoc,
  FindOneIncidenciaDoc,
  GetIncidenciaImageDoc,
  GetIncidenciaImagesDoc,
  GetImageByIdDoc,
  IncidenciasApiTags,
  UpdateIncidenciaDoc,
} from './docs/incidencias.swagger';
import { Auth, ClientAuth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { User } from 'src/users/entities/user.entity';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { RequestImageReuploadDto } from '../messages/dto/request-image-reupload.dto';
import { MessageSenderType } from '../messages/entities/message.entity';

@IncidenciasApiTags()
@Controller('incidencias')
@Throttle({ default: { limit: 20, ttl: 60 } })
export class IncidenciasController {
  constructor(
    private readonly incidenciasService: IncidenciasService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  @Auth(ValidPermission.createIncidents)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @UseInterceptors(FilesInterceptor('images', 5))
  @CreateIncidenciaDoc()
  create(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
    @GetUser('enterpriseId') enterpriseId: string,
    @GetUser('id') userId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.incidenciasService.create(
      createIncidenciaDto,
      enterpriseId,
      userId,
      images,
    );
  }

  @Get()
  @Auth(ValidPermission.viewIncidents)
  @FindAllIncidenciasDoc()
  findAll(@GetUser('enterpriseId') enterpriseId: string) {
    return this.incidenciasService.findAll(enterpriseId);
  }

  
  @Get(':id')
  @Auth(ValidPermission.viewIncidents)
  @FindOneIncidenciaDoc()
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.incidenciasService.findOne(id, enterpriseId);
  }

  
  @Patch(':id')
  @Auth(ValidPermission.editIncidents)
  @UpdateIncidenciaDoc()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.incidenciasService.update(
      id,
      updateIncidenciaDto,
      enterpriseId,
    );
  }

  @Delete(':id')
  @Auth(ValidPermission.deleteIncidents)
  @DeleteIncidenciaDoc()
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.incidenciasService.remove(id, enterpriseId);
  }

  @Get(':incidenciaId/images')
  @Auth(ValidPermission.viewIncidents)
  @GetIncidenciaImagesDoc()
  async listImages(
    @Param('incidenciaId', new ParseUUIDPipe({ version: '4' })) incidenciaId: string,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.incidenciasService.listImages(incidenciaId, enterpriseId);
  }

  @Get(':incidenciaId/images/:imageId')
  @Auth(ValidPermission.viewIncidents)
  @GetIncidenciaImageDoc()
  async getImage(
    @Param('incidenciaId', new ParseUUIDPipe({ version: '4' })) incidenciaId: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @GetUser('enterpriseId') enterpriseId: string,
    @Res() res: Response,
  ) {
    const file = await this.incidenciasService.getImage(imageId, incidenciaId, enterpriseId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.send(file.data);
  }

  @Get('images/:imageId')
  @Auth(ValidPermission.viewIncidents)
  @GetImageByIdDoc()
  async getImageById(
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @GetUser('enterpriseId') enterpriseId: string,
    @Res() res: Response,
  ) {
    const file = await this.incidenciasService.getImageById(imageId, enterpriseId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.send(file.data);
  }

  // ==================== ENDPOINTS PARA CLIENTES ====================

  @Post('client')
  @ClientAuth()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({
    summary: 'Crear incidencia como cliente',
    description: 'Permite a los clientes crear una nueva incidencia. Solo requiere autenticación como cliente, no permisos específicos.',
  })
  @ApiResponse({ status: 201, description: 'Incidencia creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo para clientes' })
  createAsClient(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
    @GetUser('enterpriseId') enterpriseId: string,
    @GetUser('id') userId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.incidenciasService.create(
      createIncidenciaDto,
      enterpriseId,
      userId,
      images,
    );
  }

  @Get('client/me')
  @ClientAuth()
  @ApiOperation({
    summary: 'Obtener mis incidencias',
    description: 'Retorna todas las incidencias creadas por el cliente autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de incidencias del cliente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findMyIncidencias(
    @GetUser('enterpriseId') enterpriseId: string,
    @GetUser('id') userId: string,
  ) {
    return this.incidenciasService.findAllByClient(enterpriseId, userId);
  }

  @Get('client/me/:id')
  @ClientAuth()
  @ApiOperation({
    summary: 'Obtener detalle de mi incidencia',
    description: 'Retorna el detalle de una incidencia específica creada por el cliente.',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la incidencia' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findOneMyIncidencia(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
    @GetUser('id') userId: string,
  ) {
    return this.incidenciasService.findOneByClient(id, enterpriseId, userId);
  }

  // ==================== ENDPOINTS DE MENSAJES (EMPLEADOS) ====================

  @Get(':id/messages')
  @Auth(ValidPermission.viewIncidents)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener mensajes de una incidencia',
    description: 'Obtiene el historial de mensajes del chat de una incidencia',
  })
  @ApiResponse({ status: 200, description: 'Lista de mensajes' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  getMessages(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.messagesService.findAllByIncidencia(id, enterpriseId);
  }

  @Post(':id/messages')
  @Auth(ValidPermission.editIncidents)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje en una incidencia',
    description: 'Envía un mensaje al cliente en el chat de la incidencia',
  })
  @ApiResponse({ status: 201, description: 'Mensaje enviado' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  async sendMessage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('id') userId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return await this.messagesService.create(
      id,
      userId,
      MessageSenderType.EMPLOYEE,
      createMessageDto.content,
      undefined,
      createMessageDto.attachments,
    );
  }

  @Post(':id/request-images')
  @Auth(ValidPermission.editIncidents)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicitar re-subida de imágenes',
    description: 'Solicita al cliente que vuelva a subir las imágenes de la incidencia. Habilita temporalmente la subida de imágenes para el cliente.',
  })
  @ApiResponse({ status: 201, description: 'Solicitud enviada' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  async requestImageReupload(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('id') userId: string,
    @Body() requestDto: RequestImageReuploadDto,
  ) {
    return await this.messagesService.requestImageReupload(
      id,
      userId,
      requestDto.message,
      requestDto.hoursAllowed,
    );
  }

  // ==================== ENDPOINTS DE MENSAJES (CLIENTES) ====================

  @Get('client/me/:id/messages')
  @ClientAuth()
  @ApiOperation({
    summary: 'Obtener mensajes de mi incidencia',
    description: 'Obtiene el historial de mensajes del chat de una incidencia creada por el cliente',
  })
  @ApiResponse({ status: 200, description: 'Lista de mensajes' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta incidencia' })
  getMessagesAsClient(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
    @GetUser('id') userId: string,
  ) {
    return this.messagesService.findAllByIncidenciaForClient(id, userId, enterpriseId);
  }

  @Post('client/me/:id/messages')
  @ClientAuth()
  @ApiOperation({
    summary: 'Enviar mensaje en mi incidencia',
    description: 'Envía un mensaje al empleado asignado en el chat de la incidencia',
  })
  @ApiResponse({ status: 201, description: 'Mensaje enviado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta incidencia' })
  async sendMessageAsClient(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('id') userId: string,
    @GetUser('enterpriseId') enterpriseId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    // Verificar que el cliente tiene acceso a esta incidencia
    await this.incidenciasService.findOneByClient(id, enterpriseId, userId);

    return await this.messagesService.create(
      id,
      userId,
      MessageSenderType.CLIENT,
      createMessageDto.content,
      undefined,
      createMessageDto.attachments,
    );
  }
}
