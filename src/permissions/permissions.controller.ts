import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Obtener todos los permisos' })
  @ApiResponse({ status: 200, description: 'Lista de permisos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findAll() {
    const cacheKey = this.redisService.generateKey('permissions', 'all');
    
    const cachedPermissions = await this.redisService.get(cacheKey);
    if (cachedPermissions) {
      return cachedPermissions;
    }

    const permissions = await this.permissionsService.findAll();
    await this.redisService.set(cacheKey, permissions, 600); // Cache por 10 minutos
    
    return permissions;
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
