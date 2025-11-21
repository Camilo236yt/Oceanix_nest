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
import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { User } from 'src/users/entities/user.entity';

@IncidenciasApiTags()
@Controller('incidencias')
@Throttle({ default: { limit: 20, ttl: 60 } })
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Post()
  @Auth(ValidPermission.createIncidents)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @UseInterceptors(FilesInterceptor('images', 5))
  @CreateIncidenciaDoc()
  create(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
    @GetUser('enterpriseId') tenantId: string,
    @GetUser('id') userId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.incidenciasService.create(
      createIncidenciaDto,
      tenantId,
      userId,
      images,
    );
  }

  @Get()
  @Auth(ValidPermission.viewIncidents)
  @FindAllIncidenciasDoc()
  findAll(@GetUser('enterpriseId') tenantId: string) {
    return this.incidenciasService.findAll(tenantId);
  }

  
  @Get(':id')
  @Auth(ValidPermission.viewIncidents)
  @FindOneIncidenciaDoc()
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') tenantId: string,
  ) {
    return this.incidenciasService.findOne(id, tenantId);
  }

  
  @Patch(':id')
  @Auth(ValidPermission.editIncidents)
  @UpdateIncidenciaDoc()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
    @GetUser('enterpriseId') tenantId: string,
  ) {
    return this.incidenciasService.update(
      id,
      updateIncidenciaDto,
      tenantId,
    );
  }

  @Delete(':id')
  @Auth(ValidPermission.deleteIncidents)
  @DeleteIncidenciaDoc()
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') tenantId: string,
  ) {
    return this.incidenciasService.remove(id, tenantId);
  }

  @Get(':incidenciaId/images')
  @Auth(ValidPermission.viewIncidents)
  @GetIncidenciaImagesDoc()
  async listImages(
    @Param('incidenciaId', new ParseUUIDPipe({ version: '4' })) incidenciaId: string,
    @GetUser('enterpriseId') tenantId: string,
  ) {
    return this.incidenciasService.listImages(incidenciaId, tenantId);
  }

  @Get(':incidenciaId/images/:imageId')
  @Auth(ValidPermission.viewIncidents)
  @GetIncidenciaImageDoc()
  async getImage(
    @Param('incidenciaId', new ParseUUIDPipe({ version: '4' })) incidenciaId: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @GetUser('enterpriseId') tenantId: string,
    @Res() res: Response,
  ) {
    const file = await this.incidenciasService.getImage(imageId, incidenciaId, tenantId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.send(file.data);
  }

  @Get('images/:imageId')
  @Auth(ValidPermission.viewIncidents)
  @GetImageByIdDoc()
  async getImageById(
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @GetUser('enterpriseId') tenantId: string,
    @Res() res: Response,
  ) {
    const file = await this.incidenciasService.getImageById(imageId, tenantId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.send(file.data);
  }
}
