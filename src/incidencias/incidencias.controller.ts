import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import {
  CreateIncidenciaDoc,
  DeleteIncidenciaDoc,
  FindAllIncidenciasDoc,
  FindOneIncidenciaDoc,
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
    @GetUser('tenantId') tenantId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.incidenciasService.create(
      createIncidenciaDto,
      tenantId,
      images,
    );
  }

  @Get()
  @Auth(ValidPermission.viewIncidents)
  @FindAllIncidenciasDoc()
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.incidenciasService.findAll(tenantId);
  }

  @Get(':id')
  @Auth(ValidPermission.viewIncidents)
  @FindOneIncidenciaDoc()
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.incidenciasService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Auth(ValidPermission.editIncidents)
  @UpdateIncidenciaDoc()
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
    @GetUser('tenantId') tenantId: string,
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
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.incidenciasService.remove(id, tenantId);
  }
}
