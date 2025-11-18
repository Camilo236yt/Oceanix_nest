import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';

import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { User } from 'src/users/entities/user.entity';
import type { Express } from 'express';

// Cambios aplicados en este controlador:
// - Se agregó protección con @Auth() usando permisos del enum ValidPermission.
// - Se incorporó @GetUser() para obtener el usuario autenticado y su enterpriseId.
// - Se añadió soporte de subida de hasta 5 imágenes con FilesInterceptor y @UploadedFiles().
// - Se reemplazó el tenantId quemado por currentUser.enterpriseId en todas las operaciones.

@Controller('incidencias')
@Throttle({ default: { limit: 20, ttl: 60 } })
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  /**
   * Crea una incidencia.
   * - Permiso requerido: createIncidents
   * - Rate limit específico por endpoint
   * - Acepta hasta 5 imágenes mediante el campo 'images'
   * - Envía enterpriseId (tenant) al servicio para aislamiento multi-tenant
   */
  @Post()
  @Auth(ValidPermission.createIncidents)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @UseInterceptors(FilesInterceptor('images', 5))
  create(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
    @GetUser() currentUser: User,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.incidenciasService.create(
      createIncidenciaDto,
      currentUser.enterpriseId,
      images,
    );
  }

  /**
   * Lista todas las incidencias del tenant actual.
   * - Permiso requerido: viewIncidents
   * - Usa enterpriseId del usuario autenticado
   */
  @Get()
  @Auth(ValidPermission.viewIncidents)
  findAll(@GetUser() currentUser: User) {
    return this.incidenciasService.findAll(currentUser.enterpriseId);
  }

  /**
   * Obtiene una incidencia específica por ID, aislada por tenant.
   * - Permiso requerido: viewIncidents
   * - Valida UUID v4 en el parámetro 'id'
   */
  @Get(':id')
  @Auth(ValidPermission.viewIncidents)
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser() currentUser: User,
  ) {
    return this.incidenciasService.findOne(id, currentUser.enterpriseId);
  }

  /**
   * Actualiza una incidencia por ID.
   * - Permiso requerido: editIncidents
   * - Pasa enterpriseId para asegurar aislamiento por empresa
   */
  @Patch(':id')
  @Auth(ValidPermission.editIncidents)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
    @GetUser() currentUser: User,
  ) {
    return this.incidenciasService.update(
      id,
      updateIncidenciaDto,
      currentUser.enterpriseId,
    );
  }

  /**
   * Elimina (soft delete) una incidencia por ID.
   * - Permiso requerido: deleteIncidents
   * - Pasa enterpriseId para validar pertenencia al tenant
   */
  @Delete(':id')
  @Auth(ValidPermission.deleteIncidents)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser() currentUser: User,
  ) {
    return this.incidenciasService.remove(id, currentUser.enterpriseId);
  }
}
