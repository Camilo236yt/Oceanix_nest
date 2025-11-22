import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Paginate, ApiPaginationQuery } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { RedisService } from 'src/redis/redis.service';
import { Auth } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';

@ApiTags('Permisos')
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly redisService: RedisService
  ) {}

  @Post()
  @Auth(ValidPermission.managePermissions)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo permiso' })
  @ApiResponse({ status: 201, description: 'Permiso creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const result = await this.permissionsService.create(createPermissionDto);
    
    // Invalidate permissions cache when a new permission is created
    await this.invalidatePermissionsCache();
    
    return result;
  }

  @Get()
  @Auth(ValidPermission.managePermissions)
  @ApiBearerAuth()
  @ApiPaginationQuery({
    sortableColumns: ['name', 'title', 'resource', 'createdAt'],
    searchableColumns: ['name', 'title', 'description'],
    defaultSortBy: [['name', 'ASC']],
  })
  @ApiOperation({
    summary: 'Obtener permisos con paginación y filtros',
    description: `Lista todos los permisos del sistema con soporte para:

    **Sin parámetros:** Devuelve TODOS los permisos (para selectors/dropdowns)
    **Con parámetros:** Devuelve permisos paginados

    **Paginación:** page, limit
    **Búsqueda:** search (busca en name, title, description)
    **Filtros:**
    - filter.resource: $eq, $in (incidents, users, roles, etc.)
    - filter.isActive: $eq
    - filter.createdAt: $gte, $lte, $btw
    **Ordenamiento:** sortBy (name, title, resource, createdAt)

    **Ejemplos:**
    - Sin params: devuelve todos los permisos
    - ?filter.resource=$eq:incidents (permisos de incidencias)
    - ?filter.resource=$in:incidents,users
    - ?search=view (buscar "view" en nombre/título)`,
  })
  @ApiResponse({ status: 200, description: 'Lista de permisos (paginada o completa)' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findAll(@Paginate() query: PaginateQuery) {
    // Si no hay parámetros de paginación/filtros, devolver todos los registros
    const hasQueryParams = query.page || query.limit || query.filter || query.search || query.sortBy;

    if (!hasQueryParams) {
      return this.permissionsService.findAll();
    }

    return this.permissionsService.findAllPaginated(query);
  }

  @Get(':id')
  @Auth(ValidPermission.managePermissions)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un permiso por su ID' })
  @ApiResponse({ status: 200, description: 'Permiso encontrado' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findOne(@Param('id') id: string) {
    const cacheKey = this.redisService.generateKey('permissions', 'detail', id);
    
    const cachedPermission = await this.redisService.get(cacheKey);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = await this.permissionsService.findOne(id);
    await this.redisService.set(cacheKey, permission, 600); // Cache por 10 minutos
    
    return permission;
  }

  @Patch(':id')
  @Auth(ValidPermission.managePermissions)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un permiso por su ID' })
  @ApiResponse({ status: 200, description: 'Permiso actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    const result = await this.permissionsService.update(id, updatePermissionDto);
    
    // Invalidate cache for this specific permission and all permissions list
    await this.invalidatePermissionCache(id);
    await this.invalidatePermissionsCache();
    
    return result;
  }

  @Delete(':id')
  @Auth(ValidPermission.managePermissions)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un permiso por su ID' })
  @ApiResponse({ status: 200, description: 'Permiso eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async remove(@Param('id') id: string) {
    const result = await this.permissionsService.remove(id);
    
    // Invalidate cache for this specific permission and all permissions list
    await this.invalidatePermissionCache(id);
    await this.invalidatePermissionsCache();
    
    return result;
  }

  private async invalidatePermissionCache(permissionId: string): Promise<void> {
    const cacheKey = this.redisService.generateKey('permissions', 'detail', permissionId);
    await this.redisService.del(cacheKey);
  }

  private async invalidatePermissionsCache(): Promise<void> {
    const allPermissionsKey = this.redisService.generateKey('permissions', 'all');
    await this.redisService.del(allPermissionsKey);
  }
}
