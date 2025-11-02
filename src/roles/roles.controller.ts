import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Auth } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { Filterable, FilterParams, Cached } from 'src/common/decorators';
import { FilterParamsDto } from 'src/common/dto/filters';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
import { SwaggerGetRolesWithFilters } from './docs/roles-swagger.decorator';
import { RoleTransformer } from './transformers/role.transformer';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService
  ) {}
  
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o rol duplicado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Auth(ValidPermission.createRoles, ValidPermission.manageRoles)
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get()
  @SwaggerGetRolesWithFilters()
  @Filterable({
    sort: true,
    customFilters: ['search', 'isActive']
  })
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  async findAll(
    @FilterParams({
      sort: true,
      customFilters: ['search', 'isActive']
    }) params: FilterParamsDto
  ) {
    const roles = await this.rolesService.findWithFilters(params);
    return RoleTransformer.toPaginatedResponse(roles);
  }

  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiResponse({ status: 200, description: 'Rol encontrado' })
  @ApiResponse({ status: 400, description: 'Rol no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get(':id')
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  async findOne(@Param('id') id: string) {
    return await this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @Auth(ValidPermission.manageRoles, ValidPermission.editRoles)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: 'Eliminar un rol (soft delete)' })
  @ApiResponse({ status: 200, description: 'Rol eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'Rol no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Auth(ValidPermission.manageRoles, ValidPermission.deleteRoles)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.rolesService.remove(id);
  }
}
