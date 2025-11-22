import { Controller, Get, Patch, Param, Delete, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Paginate, ApiPaginationQuery } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { Auth, GetUser } from '../auth/decorator';
import { ValidPermission } from '../auth/interfaces/valid-permission';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Auth(ValidPermission.viewUsers)
  @ApiBearerAuth()
  @ApiPaginationQuery({
    sortableColumns: ['createdAt', 'name', 'lastName', 'email'],
    searchableColumns: ['name', 'lastName', 'email'],
    defaultSortBy: [['createdAt', 'DESC']],
  })
  @ApiOperation({
    summary: 'Listar clientes con paginación',
    description: `Obtiene todos los clientes activos de la empresa con soporte para:

    **Paginación:** page, limit
    **Búsqueda:** search (busca en nombre, apellido, email)
    **Filtros:**
    - filter.isActive: $eq
    - filter.isEmailVerified: $eq
    - filter.createdAt: $gte, $lte, $btw
    **Ordenamiento:** sortBy (createdAt, name, lastName, email)`,
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(
    @Paginate() query: PaginateQuery,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.clientsService.findAllPaginated(query, enterpriseId);
  }

  @Get('stats')
  @Auth(ValidPermission.viewUsers)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Estadísticas de clientes',
    description: 'Obtiene estadísticas generales de clientes de la empresa',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de clientes' })
  getStats(@GetUser('enterpriseId') enterpriseId: string) {
    return this.clientsService.getStats(enterpriseId);
  }

  @Get(':id')
  @Auth(ValidPermission.viewUsers)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener cliente',
    description: 'Obtiene información de un cliente específico',
  })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.clientsService.findOne(id, enterpriseId);
  }

  @Patch(':id')
  @Auth(ValidPermission.editUsers)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar cliente',
    description: 'Actualiza información de un cliente',
  })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, enterpriseId, updateClientDto);
  }

  @Delete(':id')
  @Auth(ValidPermission.deleteUsers)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desactivar cliente',
    description: 'Desactiva un cliente (soft delete)',
  })
  @ApiResponse({ status: 200, description: 'Cliente desactivado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUser('enterpriseId') enterpriseId: string,
  ) {
    return this.clientsService.remove(id, enterpriseId);
  }
}
