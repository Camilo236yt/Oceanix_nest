import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe  } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';

// agregar autenticación y autorización más adelante
// agregar decorador para obtener tenantId del contexto de multi-tenancy
//agregar decorador para obtener usuario autenticado
@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Post()
  create(@Body() createIncidenciaDto: CreateIncidenciaDto) {
    return this.incidenciasService.create(createIncidenciaDto);
  }

  @Get()
  findAll() {
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
  ) {
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.update(id, updateIncidenciaDto, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = 'empresa-demo'; // 🔹 temporal
    return this.incidenciasService.remove(id, tenantId);
  }
}
