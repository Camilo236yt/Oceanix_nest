import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe  } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { Throttle } from '@nestjs/throttler';

// TODO: Implementar autenticación con decorador @Auth y obtener usuario con @GetUser (ver ejemplo en módulo users)

@Controller('incidencias')
@Throttle({ default: { limit: 20, ttl: 60 } })
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  // TODO: Agregar decorador @Auth() con el permiso apropiado del enum ValidPermission
  // TODO: Agregar @GetUser() para obtener currentUser
  // TODO: Investigar MinIO y aceptar hasta 5 imágenes con @UploadedFiles()
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  create(@Body() createIncidenciaDto: CreateIncidenciaDto) {
    // TODO: Enviar currentUser.enterpriseId al servicio
    return this.incidenciasService.create(createIncidenciaDto);
  }

  // TODO: Implementar decorador @Auth() con permisos apropiados
  @Get()
  findAll() {
    // TODO: Usar currentUser.enterpriseId en lugar de tenantId quemado
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.findAll(tenantId);
  }

  // TODO: Implementar decorador @Auth()
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    // TODO: Usar currentUser.enterpriseId
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.findOne(id, tenantId);
  }

  // TODO: Implementar decorador @Auth()
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
  ) {
    // TODO: Usar currentUser.enterpriseId
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.update(id, updateIncidenciaDto, tenantId);
  }

  // TODO: Implementar decorador @Auth()
  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    // TODO: Usar currentUser.enterpriseId
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.remove(id, tenantId);
  }
  
}

