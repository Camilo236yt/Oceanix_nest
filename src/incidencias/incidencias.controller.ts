import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
    return this.incidenciasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidenciasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidenciaDto: UpdateIncidenciaDto) {
    return this.incidenciasService.update(+id, updateIncidenciaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidenciasService.remove(+id);
  }
}
